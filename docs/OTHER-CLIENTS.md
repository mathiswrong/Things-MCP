# Other MCP clients

> [!IMPORTANT]
> **Open Things 3 before launching your LLM client.**
>
> Things must already be running on the Mac hosting Things MCP before you open your AI app or browser conversation. Otherwise, you may see **“unable to connect to server”**. Keep Things running while you use the connection.
>
> **Already seeing the error?** Open Things, fully quit and reopen your desktop client (or reload your browser client), then start a new conversation and check the connection.

Things MCP exposes standard MCP over stdio. A compatible desktop client starts the process locally and exchanges protocol messages through its input and output. This route needs a Mac with Things; running the server on an ordinary Linux cloud host cannot access your Mac's app.

The MCPB package is the easiest supported local installation. The instructions below are for developers and hosts that require a manual MCP server entry. They do not establish compatibility with every client.

## Build and install locally

Install Node.js 24 or later, clone the repository, and run from its root:

```sh
npm ci
npm run check
npm run smoke
npm run install:local
```

The installer prints a JSON object containing `mcpServers.things.command` and `args`. Add that entry using your client's supported MCP setup interface. Use the absolute executable paths from the output; clients may not inherit your shell's PATH. Launch the installed entry directly, not through `npm start`, which adds non-protocol text to stdout.

Keep the default state directory for every connection to the same Things library. Separate state directories break shared locking and duplicate-request protection.

## Permission

The unscoped developer connection starts read-only. To authorize its ordinary writes, run from the repository:

```sh
npm start -- setup --allow-writes
```

This enables legacy unscoped stdio clients. It does not grant writes to the packaged extension or browser tunnel. Their native settings are independent.

To force one manual connection to stay read-only, append `--read-only` after `stdio` in its arguments. To revoke all local grants, including packaged and remote clients:

```sh
npm start -- setup --read-only
```

Then request a fresh health check from each client. Revoking a grant does not cancel an Apple Event already delivered to Things.

## Connection check

Open Things 3 before launching the client. Ask the client to call `things_capabilities`, then `things_health`. Verify the running state and intended write permission. Start with a single synthetic item when testing mutations. A connection that only exposes read tools or does not support tool approval may behave differently from the verified clients.
