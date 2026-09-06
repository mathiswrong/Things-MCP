import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { nativeExecutor } from "./adapter.js";
import { BridgeError } from "./errors.js";
import type { UrlCommand } from "./url-domain.js";

export interface UrlTransport {
  token(signal: AbortSignal): Promise<string>;
  send(command: UrlCommand, signal: AbortSignal): Promise<void>;
}
export class NativeUrlTransport implements UrlTransport {
  async token(signal: AbortSignal) {
    if (process.platform !== "darwin")
      throw new BridgeError("PLATFORM_UNSUPPORTED");
    try {
      const { stdout } = await promisify(execFile)(
        "/usr/bin/security",
        [
          "find-generic-password",
          "-s",
          "Things MCP URLs",
          "-a",
          "default",
          "-w",
        ],
        {
          signal,
          timeout: 20000,
          maxBuffer: 4096,
          env: { PATH: "/usr/bin:/bin" },
        },
      );
      const token = stdout.trim();
      if (!token || token.length > 200 || /[\s\0]/.test(token))
        throw new Error("Invalid token");
      return token;
    } catch {
      throw new BridgeError("URL_AUTH_REQUIRED");
    }
  }
  async send(command: UrlCommand, signal: AbortSignal) {
    await nativeExecutor()("url", command, true, signal);
  }
}
