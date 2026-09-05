import { copyFile, mkdir, realpath } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const requested = resolve(
  process.env.THINGS_MCP_BUILD_DIR ??
    join(homedir(), "Downloads", "Things-MCP-builds", "0.1.0"),
);
const resolvedRoot = await realpath(root);
const inside = (path) => {
  const difference = relative(resolvedRoot, path);
  return (
    difference === "" ||
    (!difference.startsWith("..") && !difference.startsWith("/"))
  );
};
if (inside(requested))
  throw new Error("Build output must be outside the repository.");
let ancestor = requested;
while (true) {
  try {
    if (inside(await realpath(ancestor)))
      throw new Error("Build output must be outside the repository.");
    break;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    ancestor = dirname(ancestor);
  }
}
await mkdir(requested, { recursive: true });
const output = await realpath(requested);
const pathFromRoot = relative(resolvedRoot, output);
if (
  pathFromRoot === "" ||
  (!pathFromRoot.startsWith("..") && !pathFromRoot.startsWith("/"))
) {
  throw new Error("Build output must be outside the repository.");
}
await build({
  entryPoints: [join(root, "src/cli.ts")],
  outfile: join(output, "cli.mjs"),
  bundle: true,
  platform: "node",
  target: "node24",
  format: "esm",
  sourcemap: false,
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
});
await mkdir(join(output, "native"), { recursive: true });
await copyFile(
  join(root, "src/native/things.jxa.js"),
  join(output, "native/things.jxa.js"),
);
process.stdout.write(`${join(output, "cli.mjs")}\n`);
