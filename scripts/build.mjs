import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";
import metadata from "../package.json" with { type: "json" };

const root = dirname(dirname(fileURLToPath(import.meta.url)));
export const defaultBuildDirectory = join(
  homedir(),
  "Downloads",
  "Things-MCP-builds",
  metadata.version,
);

export async function externalDirectory(directory) {
  const requested = resolve(directory);
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
  return output;
}

export async function buildRuntime(directory) {
  const output = await externalDirectory(directory);
  const result = await build({
    absWorkingDir: root,
    entryPoints: [join(root, "src/cli.ts")],
    outfile: join(output, "cli.mjs"),
    bundle: true,
    platform: "node",
    target: "node24",
    format: "esm",
    sourcemap: false,
    metafile: true,
    banner: {
      js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
    },
  });
  await mkdir(join(output, "native"), { recursive: true });
  await copyFile(
    join(root, "src/native/things.jxa.js"),
    join(output, "native/things.jxa.js"),
  );
  await copyFile(
    join(root, "src/native/move-list.applescript"),
    join(output, "native/move-list.applescript"),
  );
  const packages = new Set();
  for (const input of Object.keys(result.metafile.inputs)) {
    const match = input.match(/^(.*node_modules\/((?:@[^/]+\/)?[^/]+))\//);
    if (match) packages.add(match[1]);
  }
  const notices = [
    "Third-party software included in this runtime. Each notice applies only to its named dependency.",
  ];
  for (const directory of [...packages].sort()) {
    const packageRoot = resolve(root, directory);
    const metadata = JSON.parse(
      await readFile(join(packageRoot, "package.json"), "utf8"),
    );
    const files = (await readdir(packageRoot))
      .filter((name) => /^(licen[sc]e|copying|notice)(\..*)?$/i.test(name))
      .sort();
    if (
      metadata.name === "@sentry/server-utils" &&
      !files.length &&
      metadata.version === "10.73.0" &&
      metadata.license === "MIT"
    ) {
      notices.push(
        `${metadata.name}@${metadata.version} (${metadata.license})`,
      );
      notices.push(
        await readFile(
          join(root, "packaging/notices/sentry-10.73.0.txt"),
          "utf8",
        ),
      );
      continue;
    }
    if (!files.length)
      throw new Error(`Missing third-party notice: ${metadata.name}`);
    notices.push(`${metadata.name}@${metadata.version} (${metadata.license})`);
    for (const file of files)
      notices.push(await readFile(join(packageRoot, file), "utf8"));
  }
  await writeFile(
    join(output, "THIRD-PARTY-NOTICES.txt"),
    notices.join("\n\n"),
  );
  return output;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const output = await buildRuntime(
    process.env.THINGS_MCP_BUILD_DIR ?? defaultBuildDirectory,
  );
  process.stdout.write(`${join(output, "cli.mjs")}\n`);
}
