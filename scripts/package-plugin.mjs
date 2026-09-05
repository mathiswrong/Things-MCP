import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { defaultBuildDirectory, externalDirectory } from "./build.mjs";

const id = process.argv[2]?.replace(/^plugin_/, "");
if (!/^asdk_app_[a-zA-Z0-9_-]+$/.test(id ?? ""))
  throw new Error(
    "Provide the registered connector ID. It will remain outside source control.",
  );
const metadata = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const output = await externalDirectory(
  process.env.THINGS_MCP_PLUGIN_DIR ??
    join(defaultBuildDirectory, "things-mcp"),
);
const manifest = {
  name: "things-mcp",
  version: metadata.version,
  description:
    "Find and manage Things 3 tasks on your Mac through a private connection.",
  author: { name: "Things MCP contributors" },
  apps: "./.app.json",
  interface: {
    displayName: "Things MCP",
    shortDescription: "Find and manage Things 3 tasks",
    longDescription:
      "Connect to Things on your Mac. Read-only by default. Ordinary changes require a local grant. The Mac must be awake and online.",
    developerName: "Things MCP contributors",
    category: "Productivity",
    capabilities: ["Read", "Write"],
    defaultPrompt: [
      "Check my Things connection without reading or changing tasks.",
    ],
  },
};
await mkdir(join(output, ".codex-plugin"), { recursive: true });
await writeFile(
  join(output, ".codex-plugin/plugin.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
await writeFile(
  join(output, ".app.json"),
  `${JSON.stringify({ apps: { things: { id, category: "Productivity" } } }, null, 2)}\n`,
);
process.stdout.write(`${output}\n`);
