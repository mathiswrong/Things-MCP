import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const entry = resolve(
  process.env.THINGS_MCP_BUILD_DIR ??
    join(homedir(), "Downloads", "Things-MCP-builds", "0.1.0"),
  "cli.mjs",
);
const parent = join(homedir(), "Downloads", "Things-MCP-tests");
await mkdir(parent, { recursive: true });
const directory = await mkdtemp(join(parent, "stdio-"));
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [entry, "stdio"],
  stderr: "pipe",
  env: { PATH: "/usr/bin:/bin", THINGS_MCP_STATE_DIR: directory },
});
const client = new Client({ name: "local-smoke-test", version: "1.0.0" });
try {
  await client.connect(transport);
  const tools = await client.listTools();
  assert.equal(tools.tools.length, 8);
  const capabilities = await client.callTool({
    name: "things_capabilities",
    arguments: {},
  });
  assert.ok(!capabilities.isError);
  const denied = await client.callTool({
    name: "things_create_item",
    arguments: {
      kind: "todo",
      title: "Must never be created",
      requestId: "a550e840-e29b-41d4-a716-446655440001",
    },
  });
  assert.equal(denied.isError, true);
  assert.ok(JSON.stringify(denied).includes("READ_ONLY"));
  if (process.argv.includes("--live-read")) {
    const health = await client.callTool({
      name: "things_health",
      arguments: {},
    });
    assert.ok(!health.isError, JSON.stringify(health));
    process.stdout.write(
      "Live connection and read-only permission verified.\n",
    );
    for (const kind of ["todo", "project", "area", "tag"]) {
      const found = await client.callTool({
        name: "things_find_items",
        arguments: { kind, limit: 1 },
      });
      assert.ok(!found.isError, JSON.stringify(found));
      const result = found.structuredContent?.result;
      assert.ok(result && Array.isArray(result.items));
      if (result.items.length) {
        const fetched = await client.callTool({
          name: "things_get_item",
          arguments: { kind, id: result.items[0].id },
        });
        assert.ok(!fetched.isError);
      }
      process.stdout.write(
        `Read and lookup checked for ${kind}; contents omitted.\n`,
      );
    }
  }
  process.stdout.write(
    "Stdio discovery, capabilities, and write rejection passed.\n",
  );
} finally {
  await client.close();
  await rm(directory, { recursive: true, force: true });
}
