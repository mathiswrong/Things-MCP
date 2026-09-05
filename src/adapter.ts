import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import {
  type Adapter,
  type Create,
  healthSchema,
  itemSchema,
  type Query,
  queryResultSchema,
  type Reference,
  referenceSchema,
  type Schedule,
  type Update,
} from "./domain.js";
import { BridgeError } from "./errors.js";

const responseSchema = z.discriminatedUnion("ok", [
  z.strictObject({ ok: z.literal(true), result: z.unknown() }),
  z.strictObject({
    ok: z.literal(false),
    code: z.enum([
      "APP_UNAVAILABLE",
      "NOT_FOUND",
      "INVALID_INPUT",
      "AUTOMATION_DENIED",
      "NATIVE_FAILURE",
    ]),
  }),
]);
export type Executor = (
  operation: string,
  input: unknown,
  mutation: boolean,
  signal?: AbortSignal,
) => Promise<unknown>;
export function nativeExecutor(
  script = fileURLToPath(new URL("./native/things.jxa.js", import.meta.url)),
  runtime: {
    launch?: (scriptPath: string) => ChildProcessWithoutNullStreams;
    platform?: NodeJS.Platform;
    timeoutMs?: number;
  } = {},
): Executor {
  return async (operation, input, mutation, signal) => {
    if (signal?.aborted) throw new BridgeError("OUTCOME_UNKNOWN");
    if ((runtime.platform ?? process.platform) !== "darwin")
      throw new BridgeError("PLATFORM_UNSUPPORTED");
    const payload = JSON.stringify({ operation, input });
    if (Buffer.byteLength(payload) > 262144)
      throw new BridgeError("INVALID_INPUT");
    return new Promise((resolve, reject) => {
      const child = runtime.launch
        ? runtime.launch(script)
        : spawn("/usr/bin/osascript", ["-l", "JavaScript", script], {
            shell: false,
            stdio: ["pipe", "pipe", "pipe"],
            env: { PATH: "/usr/bin:/bin", LANG: "en_US.UTF-8" },
          });
      const chunks: Buffer[] = [];
      let outputBytes = 0;
      let settled = false;
      const finish = (error?: BridgeError, value?: unknown) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        signal?.removeEventListener("abort", abort);
        if (error) reject(error);
        else resolve(value);
      };
      const timeout = setTimeout(() => {
        child.kill("SIGKILL");
        finish(
          new BridgeError(mutation ? "OUTCOME_UNKNOWN" : "NATIVE_FAILURE"),
        );
      }, runtime.timeoutMs ?? 20000);
      const abort = () => {
        child.kill("SIGKILL");
        finish(new BridgeError("OUTCOME_UNKNOWN"));
      };
      signal?.addEventListener("abort", abort, { once: true });
      if (signal?.aborted) abort();
      child.stdout.on("data", (chunk: Buffer) => {
        outputBytes += chunk.length;
        if (outputBytes > 2097152) {
          child.kill("SIGKILL");
          finish(
            new BridgeError(mutation ? "OUTCOME_UNKNOWN" : "NATIVE_FAILURE"),
          );
        } else chunks.push(chunk);
      });
      child.stderr.resume();
      child.stdin.on("error", () =>
        finish(
          new BridgeError(mutation ? "OUTCOME_UNKNOWN" : "NATIVE_FAILURE"),
        ),
      );
      child.on("error", () => finish(new BridgeError("APP_UNAVAILABLE")));
      child.on("close", (code) => {
        if (code !== 0)
          return finish(
            new BridgeError(mutation ? "OUTCOME_UNKNOWN" : "NATIVE_FAILURE"),
          );
        try {
          const parsed = responseSchema.parse(
            JSON.parse(Buffer.concat(chunks).toString("utf8")),
          );
          if (!parsed.ok) finish(new BridgeError(parsed.code));
          else finish(undefined, parsed.result);
        } catch {
          finish(
            new BridgeError(mutation ? "OUTCOME_UNKNOWN" : "NATIVE_FAILURE"),
          );
        }
      });
      child.stdin.end(payload);
    });
  };
}
export class NativeAdapter implements Adapter {
  constructor(private readonly execute: Executor = nativeExecutor()) {}
  private async call<T>(
    operation: string,
    input: unknown,
    schema: z.ZodType<T>,
    mutation = false,
    signal?: AbortSignal,
  ): Promise<T> {
    const result = schema.safeParse(
      await this.execute(operation, input, mutation, signal),
    );
    if (!result.success)
      throw new BridgeError(mutation ? "OUTCOME_UNKNOWN" : "NATIVE_FAILURE");
    return result.data;
  }
  health() {
    return this.call("health", {}, healthSchema);
  }
  get(input: Reference, signal?: AbortSignal) {
    return this.call("get", input, itemSchema, false, signal);
  }
  find(input: Query) {
    return this.call("find", input, queryResultSchema);
  }
  create(input: Create, signal?: AbortSignal) {
    return this.call("create", input, referenceSchema, true, signal);
  }
  update(input: Update, signal?: AbortSignal) {
    return this.call("update", input, referenceSchema, true, signal);
  }
  schedule(input: Schedule, signal?: AbortSignal) {
    return this.call("schedule", input, referenceSchema, true, signal);
  }
}
