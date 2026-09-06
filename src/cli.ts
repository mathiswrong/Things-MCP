import { homedir } from "node:os";
import { isAbsolute, join } from "node:path";
import { parseArgs } from "node:util";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { NativeAdapter } from "./adapter.js";
import { publicError } from "./errors.js";
import { createServer } from "./server.js";
import { ThingsService } from "./service.js";
import { clientIdSchema, State } from "./state.js";
import { closeTelemetry, reportFailure, startTelemetry } from "./telemetry.js";

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    strict: true,
    options: {
      "allow-writes": { type: "boolean" },
      "read-only": { type: "boolean" },
      "allow-trash": { type: "boolean" },
      client: { type: "string" },
      "managed-client": { type: "string" },
      help: { type: "boolean" },
    },
  });
  const command = positionals[0] ?? "stdio";
  if (values.help) {
    process.stdout.write(
      "things-mcp [stdio|doctor|setup]\nstdio --read-only prevents writes for this connection.\nsetup --allow-writes enables ordinary writes; add --allow-trash for individual to-do Trash. setup --read-only revokes both.\n",
    );
    return;
  }
  if (
    positionals.length > 1 ||
    !["stdio", "doctor", "setup"].includes(command) ||
    (command !== "setup" && values["allow-writes"]) ||
    (command !== "setup" && values["allow-trash"]) ||
    (values["allow-trash"] && !values["allow-writes"]) ||
    (command !== "stdio" && values.client !== undefined) ||
    (command !== "stdio" && values["managed-client"] !== undefined) ||
    (values.client !== undefined && values["managed-client"] !== undefined) ||
    (values["allow-writes"] && values["read-only"])
  )
    throw new Error("Invalid command");
  const directory =
    process.env.THINGS_MCP_STATE_DIR ??
    join(homedir(), "Library", "Application Support", "Things MCP");
  if (!isAbsolute(directory)) throw new Error("State path must be absolute");
  const requestedClient = values.client ?? values["managed-client"];
  const clientId =
    requestedClient === undefined
      ? undefined
      : clientIdSchema.parse(requestedClient);
  const clientWrites = process.env.THINGS_MCP_ALLOW_WRITES ?? "false";
  if (clientId && !["true", "false"].includes(clientWrites))
    throw new Error("Invalid write setting");
  const browserWrites = process.env.THINGS_MCP_BROWSER_ALLOW_WRITES ?? "false";
  const clientTrash = process.env.THINGS_MCP_ALLOW_TRASH ?? "false";
  const browserTrash = process.env.THINGS_MCP_BROWSER_ALLOW_TRASH ?? "false";
  if (
    (clientId && !["true", "false"].includes(clientTrash)) ||
    (values.client === "desktop-extension" &&
      !["true", "false"].includes(browserTrash))
  )
    throw new Error("Invalid Trash setting");
  if (
    values.client === "desktop-extension" &&
    !["true", "false"].includes(browserWrites)
  )
    throw new Error("Invalid browser write setting");
  const state = new State(
    directory,
    !values["read-only"] &&
      (!clientId ||
        values["managed-client"] !== undefined ||
        clientWrites === "true"),
    clientId,
  );
  if (values.client)
    await state.configureClient(
      !values["read-only"] && clientWrites === "true",
      clientTrash === "true",
    );
  if (values.client === "desktop-extension") {
    await new State(directory, true, "browser").configureClient(
      !values["read-only"] && browserWrites === "true",
      browserTrash === "true",
    );
  }
  const service = new ThingsService(new NativeAdapter(), state);
  if (command === "setup") {
    if (!values["allow-writes"] && !values["read-only"]) {
      process.stdout.write(
        "Run setup --read-only for safe initial use, or setup --allow-writes to authorize experimental ordinary writes. Add --allow-trash with --allow-writes only to enable individual to-do Trash for this local operator connection.\n",
      );
      return;
    }
    await state.setWrites(Boolean(values["allow-writes"]));
    if (values["allow-writes"])
      await state.setTrash(Boolean(values["allow-trash"]));
    process.stdout.write(
      values["allow-writes"]
        ? "Ordinary writes enabled locally. To-do mutations verified; other item types remain experimental.\n"
        : "Read-only access enabled.\n",
    );
    return;
  }
  if (command === "doctor") {
    process.stdout.write(
      `${JSON.stringify(await service.health(), null, 2)}\n`,
    );
    return;
  }
  startTelemetry(process.env.THINGS_MCP_SENTRY_DSN);
  const handle = await serveStdio(() => createServer(service), {
    onerror: reportFailure,
  });
  let closing = false;
  const close = async () => {
    if (closing) return;
    closing = true;
    await handle.close();
    await closeTelemetry();
  };
  process.once("SIGINT", () => {
    void close();
  });
  process.once("SIGTERM", () => {
    void close();
  });
  process.stdin.once("end", () => {
    void close();
  });
}

main().catch(async (error) => {
  process.stderr.write(`${JSON.stringify(publicError(error))}\n`);
  await closeTelemetry();
  process.exitCode = 1;
});
