import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { test } from "node:test";
import { nativeExecutor } from "../src/adapter.js";
import { BridgeError } from "../src/errors.js";
import { scrubEvent } from "../src/telemetry.js";

function executor(code: string, timeoutMs = 2000) {
  return nativeExecutor("/fixed-reviewed-script.js", {
    platform: "darwin",
    timeoutMs,
    launch(scriptPath) {
      assert.equal(scriptPath, "/fixed-reviewed-script.js");
      return spawn(process.execPath, ["-e", code], {
        stdio: ["pipe", "pipe", "pipe"],
        shell: false,
      });
    },
  });
}
test("subprocess output preserves UTF-8 characters split between pipe chunks", async () => {
  const execute = executor(`
    process.stdin.resume();
    process.stdin.on('end', () => {
      const value = Buffer.from(JSON.stringify({ok:true,result:{title:'Café 🌿'}}));
      let offset = 0;
      const timer = setInterval(() => {
        if (offset === value.length) { clearInterval(timer); return; }
        process.stdout.write(value.subarray(offset, ++offset));
      }, 1);
    });
  `);
  assert.deepEqual(await execute("get", {}, false), { title: "Café 🌿" });
});
test("task text goes through stdin as data and is never evaluated", async () => {
  const execute = executor(`
    let value = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => value += chunk);
    process.stdin.on('end', () => process.stdout.write(JSON.stringify({ok:true,result:JSON.parse(value).input})));
  `);
  const input = {
    title: '"; throw new Error("injected") //\n$(touch nope)\n🌿',
  };
  assert.deepEqual(await execute("get", input, false), input);
});
test("malformed and oversized subprocess output fails without reflecting content", async () => {
  for (const code of [
    `process.stdout.write('private broken output');`,
    `process.stdout.write('x'.repeat(2097153));`,
  ]) {
    await assert.rejects(
      executor(code)("get", {}, false),
      (error) =>
        error instanceof BridgeError &&
        error.code === "NATIVE_FAILURE" &&
        !error.message.includes("private"),
    );
  }
});
test("timeout and external cancellation leave mutation outcomes uncertain", async () => {
  const waiting = "process.stdin.resume(); setInterval(() => {}, 1000);";
  await assert.rejects(
    executor(waiting, 30)("create", {}, true),
    (error) => error instanceof BridgeError && error.code === "OUTCOME_UNKNOWN",
  );
  const controller = new AbortController();
  const pending = executor(waiting)("create", {}, true, controller.signal);
  controller.abort();
  await assert.rejects(
    pending,
    (error) => error instanceof BridgeError && error.code === "OUTCOME_UNKNOWN",
  );
});
test("already cancelled requests never launch a subprocess", async () => {
  let launched = false;
  const execute = nativeExecutor("/fixed.js", {
    platform: "darwin",
    launch() {
      launched = true;
      throw new Error("Unexpected process");
    },
  });
  await assert.rejects(
    execute("create", {}, true, AbortSignal.abort()),
    (error) => error instanceof BridgeError && error.code === "OUTCOME_UNKNOWN",
  );
  assert.equal(launched, false);
});
test("telemetry drops task contents, paths, requests, users, exceptions and breadcrumbs", () => {
  const result = scrubEvent({
    type: undefined,
    message: "private task text",
    user: { email: "private@example.invalid" },
    request: {
      url: "https://example.invalid/private",
      headers: { Authorization: "secret" },
    },
    exception: { values: [{ value: "private notes" }] },
    breadcrumbs: [{ message: "secret" }],
    extra: { file: "/Users/private/path" },
    tags: { code: "NATIVE_FAILURE", task: "private task" },
  });
  const serialized = JSON.stringify(result);
  assert.ok(!serialized.includes("private"));
  assert.ok(!serialized.includes("secret"));
  assert.equal(result.tags?.code, "NATIVE_FAILURE");
});

test("argument-based list commands receive no unused stdin payload", async () => {
  const execute = executor(`
    let bytes = 0;
    process.stdin.on('data', chunk => bytes += chunk.length);
    process.stdin.on('end', () => process.stdout.write(JSON.stringify({ok:true,result:bytes})));
  `);
  assert.equal(
    await execute(
      "moveList",
      {
        target: { kind: "todo", id: "fixture-task" },
        destination: { kind: "list", list: "today" },
      },
      true,
    ),
    0,
  );
});
