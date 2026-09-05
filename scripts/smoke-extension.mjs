import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { getMcpConfigForManifest, unpackExtension } from "@anthropic-ai/mcpb";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { defaultBuildDirectory } from "./build.mjs";

const metadata = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const archive = join(
  process.env.THINGS_MCP_BUILD_DIR ?? defaultBuildDirectory,
  `things-mcp-${metadata.version}.mcpb`,
);
const parent = join(homedir(), "Downloads", "Things-MCP-tests");
await mkdir(parent, { recursive: true });
const directory = await mkdtemp(join(parent, "extension-"));
let client;
try {
  const digest = createHash("sha256")
    .update(await readFile(archive))
    .digest("hex");
  assert.ok(
    (await readFile(`${archive}.sha256`, "utf8")).startsWith(`${digest}  `),
  );
  const extracted = join(directory, "Installed extension with spaces");
  await mkdir(extracted);
  assert.equal(
    await unpackExtension({
      mcpbPath: archive,
      outputDir: extracted,
      silent: true,
    }),
    true,
  );
  const entries = await readdir(extracted, {
    recursive: true,
    withFileTypes: true,
  });
  assert.equal(
    entries.filter((entry) => entry.isFile()).length,
    metadata.license === "UNLICENSED" ? 5 : 6,
  );
  assert.ok(entries.every((entry) => !entry.isSymbolicLink()));
  const manifest = JSON.parse(
    await readFile(join(extracted, "manifest.json"), "utf8"),
  );
  if (metadata.license !== "UNLICENSED") {
    assert.equal(manifest.license, metadata.license);
    assert.equal(
      await readFile(join(extracted, "LICENSE"), "utf8"),
      await readFile(new URL("../LICENSE", import.meta.url), "utf8"),
    );
  }
  const guide = await readFile(join(extracted, "README.md"), "utf8");
  assert.ok(!guide.includes("](../"));
  assert.ok(
    !(await readFile(join(extracted, "server/cli.mjs"), "utf8")).includes(
      homedir(),
    ),
  );
  const config = await getMcpConfigForManifest({
    manifest,
    extensionPath: extracted,
    systemDirs: {},
    userConfig: { allow_changes: false, allow_browser_changes: false },
    pathSeparator: "/",
  });
  assert.ok(config);
  assert.equal(config.command, "node");
  assert.deepEqual(config.args, [
    join(extracted, "server/cli.mjs"),
    "stdio",
    "--client",
    "desktop-extension",
  ]);
  const state = join(directory, "state");
  const runtime = process.env.THINGS_MCP_TEST_NODE ?? process.execPath;
  assert.equal(config.env.THINGS_MCP_ALLOW_WRITES, "false");
  const invalidState = join(directory, "invalid-settings");
  await assert.rejects(
    promisify(execFile)(runtime, config.args, {
      env: {
        PATH: "/usr/bin:/bin",
        THINGS_MCP_STATE_DIR: invalidState,
        THINGS_MCP_ALLOW_WRITES: "true",
        THINGS_MCP_BROWSER_ALLOW_WRITES: "invalid",
      },
      timeout: 10000,
    }),
  );
  await assert.rejects(readFile(join(invalidState, "settings.json")), {
    code: "ENOENT",
  });
  const env = {
    PATH: "/usr/bin:/bin",
    THINGS_MCP_STATE_DIR: state,
    ...config.env,
  };
  await promisify(execFile)(
    runtime,
    [
      resolve(extracted, manifest.server.entry_point),
      "setup",
      "--allow-writes",
    ],
    { env },
  );
  const originalSettings = await readFile(join(state, "settings.json"), "utf8");
  assert.deepEqual(JSON.parse(originalSettings), { allowWrites: true });
  for (let pass = 0; pass < 2; pass++) {
    client = new Client({ name: "extension-smoke-test", version: "1.0.0" });
    await client.connect(
      new StdioClientTransport({
        command: runtime,
        args: config.args,
        env,
        cwd: directory,
        stderr: "pipe",
      }),
    );
    assert.equal((await client.listTools()).tools.length, 8);
    assert.ok(
      !(await client.callTool({ name: "things_capabilities", arguments: {} }))
        .isError,
    );
    const denied = await client.callTool({
      name: "things_create_item",
      arguments: {
        kind: "todo",
        title: "Must never be created",
        requestId: "a550e840-e29b-41d4-a716-446655440003",
      },
    });
    assert.equal(denied.isError, true);
    assert.ok(JSON.stringify(denied).includes("READ_ONLY"));
    if (process.argv.includes("--live-health")) {
      const health = await client.callTool({
        name: "things_health",
        arguments: {},
      });
      assert.ok(!health.isError, JSON.stringify(health));
      assert.equal(health.structuredContent?.result?.writesEnabled, false);
    }
    await client.close();
    client = undefined;
  }
  assert.deepEqual(
    JSON.parse(await readFile(join(state, "settings.json"), "utf8")),
    {
      allowWrites: true,
      clients: {
        "desktop-extension": { configured: false, enabled: false },
        browser: { configured: false, enabled: false },
      },
    },
  );
  assert.deepEqual(await readdir(state), ["settings.json"]);
  process.stdout.write(
    "Packaged extension: checksum, extraction, portable launch, eight tools, write rejection, and restart passed.\n",
  );
  if (process.argv.includes("--live-health"))
    process.stdout.write("Live health passed without reading task contents.\n");
} finally {
  await client?.close();
  await rm(directory, { recursive: true, force: true });
}
