import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import {
  packExtension,
  unpackExtension,
  validateManifest,
} from "@anthropic-ai/mcpb";
import {
  buildRuntime,
  defaultBuildDirectory,
  externalDirectory,
} from "./build.mjs";

const root = new URL("../", import.meta.url);
const metadata = JSON.parse(
  await readFile(new URL("package.json", root), "utf8"),
);
const output = await externalDirectory(
  process.env.THINGS_MCP_BUILD_DIR ?? defaultBuildDirectory,
);
const staging = await mkdtemp(join(output, ".extension-"));
const destination = join(output, `things-mcp-${metadata.version}.mcpb`);
try {
  const payload = join(staging, "payload");
  await buildRuntime(join(payload, "server"));
  const manifest = {
    manifest_version: "0.3",
    name: "things-mcp",
    display_name: "Things MCP",
    version: metadata.version,
    description: "Find and read your Things 3 tasks on this Mac.",
    long_description:
      "Read-only installation preview. Requires Things 3 to be running on your Mac. No account, API key, or separate runtime installation is needed. This build cannot change tasks. Task information you request is shared with the connected client. Browser connections are not included.",
    author: { name: "Things MCP contributors" },
    server: {
      type: "node",
      entry_point: "server/cli.mjs",
      mcp_config: {
        command: "node",
        // biome-ignore lint/suspicious/noTemplateCurlyInString: The installation host resolves this standard bundle variable.
        args: ["${__dirname}/server/cli.mjs", "stdio", "--read-only"],
      },
    },
    tools_generated: true,
    compatibility: { platforms: ["darwin"], runtimes: { node: ">=24" } },
  };
  await writeFile(
    join(payload, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  await copyFile(
    new URL("packaging/INSTALL.md", root),
    join(payload, "README.md"),
  );
  if (!validateManifest(join(payload, "manifest.json")))
    throw new Error("Invalid extension manifest");
  if (
    !(await packExtension({
      extensionPath: payload,
      outputPath: destination,
      silent: true,
    }))
  ) {
    throw new Error("Extension packaging failed");
  }
  const extracted = join(staging, "extracted");
  await mkdir(extracted);
  if (
    !(await unpackExtension({
      mcpbPath: destination,
      outputDir: extracted,
      silent: true,
    }))
  ) {
    throw new Error("Extension extraction failed");
  }
  for (const file of [
    "manifest.json",
    "README.md",
    "server/cli.mjs",
    "server/native/things.jxa.js",
    "server/THIRD-PARTY-NOTICES.txt",
  ]) {
    const original = await readFile(join(payload, file));
    if (!original.equals(await readFile(join(extracted, file))))
      throw new Error(`Archive mismatch: ${file}`);
  }
  const digest = createHash("sha256")
    .update(await readFile(destination))
    .digest("hex");
  await writeFile(
    `${destination}.sha256`,
    `${digest}  things-mcp-${metadata.version}.mcpb\n`,
  );
  process.stdout.write(`${destination}\n`);
} finally {
  await rm(staging, { recursive: true, force: true });
}
