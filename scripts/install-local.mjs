import { chmod, copyFile, mkdir, realpath } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import metadata from "../package.json" with { type: "json" };

if (process.platform !== "darwin")
  throw new Error("Local installation requires macOS.");
const build =
  process.env.THINGS_MCP_BUILD_DIR ??
  join(homedir(), "Downloads", "Things-MCP-builds", metadata.version);
const root = join(homedir(), "Library", "Application Support", "Things MCP");
await mkdir(root, { recursive: true, mode: 0o700 });
const destination = join(root, "runtime", metadata.version);
await mkdir(join(destination, "native"), { recursive: true, mode: 0o700 });
for (const filename of [
  "cli.mjs",
  "native/things.jxa.js",
  "native/move-list.applescript",
  "THIRD-PARTY-NOTICES.txt",
]) {
  await copyFile(join(build, filename), join(destination, filename));
  await chmod(join(destination, filename), 0o600);
}
process.stdout.write(
  `${JSON.stringify(
    {
      mcpServers: {
        things: {
          command: await realpath(process.execPath),
          args: [join(destination, "cli.mjs"), "stdio"],
        },
      },
    },
    null,
    2,
  )}\n`,
);
