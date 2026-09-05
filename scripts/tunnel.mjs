import { execFile, spawn } from "node:child_process";
import { constants } from "node:fs";
import {
  access,
  chmod,
  copyFile,
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execute = promisify(execFile);
const root = join(homedir(), "Library", "Application Support", "Things MCP");
const configFile = join(root, "tunnel.json");
const alias = "things-mcp";
const label = "local.things-mcp.tunnel";
const launchFile = join(homedir(), "Library", "LaunchAgents", `${label}.plist`);
const domain = `gui/${process.getuid()}`;
const command = process.argv[2] ?? "status";
const minimalEnv = {
  HOME: homedir(),
  PATH: "/usr/bin:/bin:/opt/homebrew/bin:/usr/local/bin",
  LANG: "en_US.UTF-8",
};
const xml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const quoted = (value) => `'${value.replaceAll("'", "'\\''")}'`;

async function binary() {
  for (const candidate of [
    "/opt/homebrew/bin/tunnel-client",
    "/usr/local/bin/tunnel-client",
  ]) {
    try {
      await access(candidate, constants.X_OK);
      return candidate;
    } catch {}
  }
  throw new Error(
    "Install the official tunnel-client package before connecting.",
  );
}
async function configuration() {
  const config = JSON.parse(await readFile(configFile, "utf8"));
  if (
    !/^tunnel_[a-f0-9]{32}$/.test(config.tunnelId) ||
    !isAbsolute(config.node) ||
    !isAbsolute(config.entry)
  )
    throw new Error("Invalid tunnel configuration.");
  return config;
}
async function nodeBinary() {
  for (const candidate of [
    "/opt/homebrew/bin/node",
    "/usr/local/bin/node",
    process.execPath,
  ]) {
    try {
      await access(candidate, constants.X_OK);
      const { stdout } = await execute(candidate, ["--version"], {
        env: minimalEnv,
      });
      if (Number(/^v(\d+)/.exec(stdout)?.[1]) >= 24) return candidate;
    } catch {}
  }
  throw new Error("A supported Node.js runtime is required.");
}
async function key() {
  try {
    const { stdout } = await execute(
      "/usr/bin/security",
      [
        "find-generic-password",
        "-s",
        "Things MCP Tunnel",
        "-a",
        "runtime",
        "-w",
      ],
      { env: minimalEnv, timeout: 30000, maxBuffer: 16384 },
    );
    const value = stdout.trim();
    if (!/^sk-[A-Za-z0-9_-]+$/.test(value)) throw new Error();
    return value;
  } catch {
    throw new Error(
      "Unlock the login keychain and allow access to the Things MCP Tunnel credential.",
    );
  }
}
async function stop() {
  await execute("/bin/launchctl", ["disable", `${domain}/${label}`], {
    env: minimalEnv,
  }).catch(() => {});
  await execute("/bin/launchctl", ["bootout", `${domain}/${label}`], {
    env: minimalEnv,
  }).catch(() => {});
  await execute(await binary(), ["runtimes", "stop", alias, "--json"], {
    env: minimalEnv,
  }).catch(() => {});
}

async function main() {
  if (process.platform !== "darwin")
    throw new Error("Tunnel installation requires macOS.");
  if (command === "install") {
    const tunnelId = process.argv[3];
    if (!/^tunnel_[a-f0-9]{32}$/.test(tunnelId ?? ""))
      throw new Error("A valid tunnel ID is required.");
    const cli = await binary();
    const config = {
      tunnelId,
      node: await nodeBinary(),
      entry: join(root, "runtime", "0.1.0", "cli.mjs"),
    };
    await access(config.entry);
    await key();
    await mkdir(root, { recursive: true, mode: 0o700 });
    await writeFile(configFile, JSON.stringify(config), { mode: 0o600 });
    await chmod(configFile, 0o600);
    const runner = join(root, "tunnel.mjs");
    if (fileURLToPath(import.meta.url) !== runner)
      await copyFile(fileURLToPath(import.meta.url), runner);
    await chmod(runner, 0o600);
    const profileDir = join(root, "tunnel-profile");
    await mkdir(profileDir, { recursive: true, mode: 0o700 });
    const mcpCommand = [
      "/usr/bin/env",
      "-u",
      "CONTROL_PLANE_API_KEY",
      config.node,
      config.entry,
      "stdio",
      "--managed-client",
      "browser",
    ]
      .map(quoted)
      .join(" ");
    await execute(
      cli,
      [
        "init",
        "--force",
        "--sample",
        "sample_mcp_stdio_local",
        "--profile",
        alias,
        "--profile-dir",
        profileDir,
        "--tunnel-id",
        tunnelId,
        "--mcp-command",
        mcpCommand,
        "--health-listen-addr",
        "127.0.0.1:0",
      ],
      { env: minimalEnv },
    );
    await stop();
    await mkdir(dirname(launchFile), { recursive: true });
    const launcher = join(root, "Things MCP");
    await writeFile(
      launcher,
      `#!/bin/sh\nexec ${[config.node, runner, "run"].map(quoted).join(" ")}\n`,
      { mode: 0o700 },
    );
    await chmod(launcher, 0o700);
    const args = [launcher]
      .map((arg) => `<string>${xml(arg)}</string>`)
      .join("");
    await writeFile(
      launchFile,
      `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>Label</key><string>${label}</string><key>ProgramArguments</key><array>${args}</array><key>RunAtLoad</key><true/><key>KeepAlive</key><dict><key>SuccessfulExit</key><false/></dict><key>ThrottleInterval</key><integer>30</integer><key>LimitLoadToSessionType</key><string>Aqua</string><key>ProcessType</key><string>Background</string></dict></plist>`,
      { mode: 0o600 },
    );
    await execute("/bin/launchctl", ["enable", `${domain}/${label}`], {
      env: minimalEnv,
    });
    await execute("/bin/launchctl", ["bootstrap", domain, launchFile], {
      env: minimalEnv,
    });
    process.stdout.write(
      "Background connection installed. Check status before reporting connected.\n",
    );
    return;
  }
  if (command === "stop") {
    await stop();
    process.stdout.write(
      "Background connection stopped. Things data and the remote tunnel are preserved.\n",
    );
    return;
  }
  if (command === "run") {
    await configuration();
    const child = spawn(
      await binary(),
      [
        "run",
        "--profile-dir",
        join(root, "tunnel-profile"),
        "--profile",
        alias,
        "--health.url-file",
        join(root, "tunnel-health.url"),
        "--log.level",
        "warn",
      ],
      {
        env: { ...minimalEnv, CONTROL_PLANE_API_KEY: await key() },
        stdio: "ignore",
        shell: false,
      },
    );
    let stopping = false;
    for (const signal of ["SIGINT", "SIGTERM"])
      process.once(signal, () => {
        stopping = true;
        child.kill(signal);
      });
    child.once("error", () => {
      process.exitCode = 1;
    });
    child.once("exit", (code) => {
      process.exitCode = stopping ? 0 : code || 1;
    });
    return;
  }
  if (command === "status") {
    let ready = false;
    let healthy = false;
    try {
      const base = new URL(
        (await readFile(join(root, "tunnel-health.url"), "utf8")).trim(),
      );
      if (base.hostname !== "127.0.0.1" || base.protocol !== "http:")
        throw new Error();
      healthy = (
        await fetch(new URL("/healthz", base), {
          signal: AbortSignal.timeout(3000),
        })
      ).ok;
      ready = (
        await fetch(new URL("/readyz", base), {
          signal: AbortSignal.timeout(3000),
        })
      ).ok;
    } catch {}
    process.stdout.write(`${JSON.stringify({ healthy, ready })}\n`);
    return;
  }
  throw new Error("Use install, run, status, or stop.");
}
main().catch(() => {
  process.stderr.write(
    "Tunnel operation failed. Check installation, login keychain access, and provider availability. No credentials were logged.\n",
  );
  process.exitCode = 1;
});
