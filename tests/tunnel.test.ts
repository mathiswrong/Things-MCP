import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("installed tunnel launcher can start without the source checkout or package.json", async () => {
  await mkdir(join(homedir(), "Downloads"), { recursive: true });
  const directory = await mkdtemp(
    join(homedir(), "Downloads", "Things-MCP-launcher-test-"),
  );
  try {
    const script = join(directory, "tunnel.mjs");
    await copyFile(new URL("../scripts/tunnel.mjs", import.meta.url), script);
    const result = spawnSync(process.execPath, [script, "status"], {
      encoding: "utf8",
      timeout: 10000,
    });
    assert.ok(!result.stderr.includes("ERR_MODULE_NOT_FOUND"));
    if (process.platform === "darwin") {
      assert.equal(result.status, 0);
      assert.equal(typeof JSON.parse(result.stdout).ready, "boolean");
    } else assert.match(result.stderr, /Tunnel operation failed/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
