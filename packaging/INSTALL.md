# Things MCP

## Local connection

1. Open Things 3 and leave it running.
2. Open the `.mcpb` file with Claude Desktop and select **Install**. If opening the file does not show the installer, use **Settings > Extensions > Advanced settings > Install extension**.
3. Keep both permission switches off for the first connection check.
4. In a new conversation, ask: **Use Things MCP to check the connection without reading or changing tasks.**
5. If macOS asks whether to allow control of Things, approve it to use the connection.

The extension uses the client's built-in runtime. There are no configuration files to edit or commands to enter.

## Write access

Open **Settings > Extensions > Things MCP > Configure**. The native settings contain two independent switches:

- **Allow changes** enables ordinary creation, editing, scheduling, completion, cancellation, and reopening through the local connection.
- **Allow changes from ChatGPT** enables the same operations through the connected private tunnel.

Save the settings. Turning a switch off revokes that connection's access on its next request after the host applies the settings. An operation already delivered to Things cannot be undone automatically. ChatGPT also has its own tool approval controls.

Writes start disabled. No tool can grant its own permission. A global developer revocation survives restart; turn the relevant native switch off, save, then turn it back on to make a fresh grant.

## ChatGPT

After the Mac's private tunnel has been provisioned, install or open **Things MCP** in the plugin list and select **Connect**. The connection is shared by the account's supported desktop and browser surfaces. Start a new chat and ask the same connection-check question. You do not need to keep Terminal or the local desktop client open; the background connection runs while you are signed in to your Mac.

The local extension's settings control the Mac-side write grants for both connections. The ChatGPT desktop plugin references the same registered connector, so it does not launch a separate server or maintain separate task state.

First-time tunnel provisioning requires OpenAI Platform sign-in, a tunnel linked to the correct workspace, and a restricted runtime credential. The owner's installation has been provisioned and tested. A self-service installer for a different Mac is not yet distributed; the contributor setup is in `SETUP-PLAN.md`.

## Privacy and disconnect

The Mac must be awake, online, and running Things. The tunnel credential stays in the login Keychain. The background service opens no inbound public port. Task information you request is shared with the connected client and provider. No telemetry destination is bundled.

In macOS background-item notifications and Login Items settings, this connection is named **Things MCP**. It is the helper that keeps the private tunnel available.

Disconnect Things MCP through ChatGPT's plugin settings to revoke that client connection. Remove the local extension through its extension settings. These actions preserve Things data. The background helper and its local receipt journal can be retained for reconnecting; its developer stop command also disables automatic start at login.

This is a private development build. No public license has been granted for project code. Bundled third-party notices apply only to their named dependencies. Headings, checklists, deletion, moves, and recurrence remain outside the implemented tool set.
