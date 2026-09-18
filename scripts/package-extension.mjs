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
    ...(metadata.license !== "UNLICENSED" ? { license: metadata.license } : {}),
    description: metadata.description,
    long_description:
      "IMPORTANT: Open Things 3 on this Mac before launching your LLM client, or you may see “unable to connect to server”. Keep Things running. If the client cannot connect, open Things, restart the client and start a new conversation. Twenty tools for tasks, projects, tags, checklists, reminders and templates, including project move summaries. Starts read-only; enable changes in extension settings. URL-only fields report dispatch rather than complete read-back. No account or separate runtime installation is needed for this local connection. Requested task information is shared with the connected client.",
    author: { name: "Things MCP contributors" },
    server: {
      type: "node",
      entry_point: "server/cli.mjs",
      mcp_config: {
        command: "node",
        args: [
          // biome-ignore lint/suspicious/noTemplateCurlyInString: The installation host resolves this standard bundle variable.
          "${__dirname}/server/cli.mjs",
          "stdio",
          "--client",
          "desktop-extension",
        ],
        env: {
          // biome-ignore lint/suspicious/noTemplateCurlyInString: The host reads the user's native extension setting.
          THINGS_MCP_ALLOW_WRITES: "${user_config.allow_changes}",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: The host owns the separate Trash grant.
          THINGS_MCP_ALLOW_TRASH: "${user_config.allow_trash}",
          // biome-ignore lint/suspicious/noTemplateCurlyInString: The host owns the remote Trash grant.
          THINGS_MCP_BROWSER_ALLOW_TRASH: "${user_config.allow_browser_trash}",
          THINGS_MCP_BROWSER_ALLOW_WRITES:
            // biome-ignore lint/suspicious/noTemplateCurlyInString: The host owns the remote connection grant.
            "${user_config.allow_browser_changes}",
        },
      },
    },
    tools_generated: true,
    user_config: {
      allow_trash: {
        type: "boolean",
        title: "Allow moving to Trash",
        description:
          "Allow this connection to move individual to-dos and their checklists to Things Trash. Also requires Allow changes. Does not allow permanent deletion.",
        default: false,
        required: false,
      },
      allow_browser_trash: {
        type: "boolean",
        title: "Allow moving to Trash from remote connections",
        description:
          "Allow the connected tunnel to move individual to-dos and their checklists to Things Trash. Also requires Allow changes from remote connections. Does not allow permanent deletion.",
        default: false,
        required: false,
      },
      allow_browser_changes: {
        type: "boolean",
        title: "Allow changes from remote connections",
        description:
          "Allow the connected tunnel to create, edit, and schedule items. Turn off to revoke this access on the next request. The Mac must remain awake and online.",
        default: false,
        required: false,
      },
      allow_changes: {
        type: "boolean",
        title: "Allow changes",
        description:
          "Allow creating, editing, and scheduling items. Turn off to return this connection to read-only access.",
        default: false,
        required: false,
      },
    },
    compatibility: { platforms: ["darwin"], runtimes: { node: ">=24" } },
  };
  for (const [key, suffix, title, description] of [
    [
      "container_delete",
      "CONTAINER_DELETE",
      "Delete projects, areas, and tags",
      "Allows deletion of entire containers, including their children or shared tag assignments. Requires ordinary changes and a fresh scope preview.",
    ],
  ]) {
    for (const browser of [false, true]) {
      const name = `allow_${browser ? "browser_" : ""}${key}`;
      manifest.user_config[name] = {
        type: "boolean",
        title: `${title}${browser ? " from remote connections" : ""}`,
        description,
        default: false,
        required: false,
      };
      manifest.server.mcp_config.env[
        `THINGS_MCP_${browser ? "BROWSER_" : ""}ALLOW_${suffix}`
      ] = `\${user_config.${name}}`;
    }
  }
  await writeFile(
    join(payload, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  const guide = await readFile(new URL("packaging/INSTALL.md", root), "utf8");
  await writeFile(
    join(payload, "README.md"),
    guide.replace(
      /\]\(\.\.\/([^)]+)\)/g,
      "](https://github.com/mathiswrong/Things-MCP/blob/main/$1)",
    ),
  );
  if (metadata.license !== "UNLICENSED")
    await copyFile(new URL("LICENSE", root), join(payload, "LICENSE"));
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
    "server/native/move-list.applescript",
    "server/THIRD-PARTY-NOTICES.txt",
    ...(metadata.license !== "UNLICENSED" ? ["LICENSE"] : []),
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
