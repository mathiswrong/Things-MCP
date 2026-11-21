# Install Things MCP

> [!IMPORTANT]
> **Open Things 3 before launching your LLM client.**
>
> Things must already be running on the Mac hosting Things MCP before you open your AI app or browser conversation. Otherwise, you may see **“unable to connect to server”**. Keep Things running while you use the connection.
>
> **Already seeing the error?** Open Things, fully quit and reopen your desktop client (or reload your browser client), then start a new conversation and check the connection.

These instructions describe version 1.0. The package exposes twenty tools. New connections start read-only.

## Before you start

You need a Mac with Things 3 installed, signed in, and running. The local package also needs a current Claude Desktop version that supports MCPB extensions and Node.js 24 or later in its bundled runtime. You do not need to install Node separately for that route.

Things MCP is independent of Things and the client vendors. Their apps, accounts, and subscriptions are separate from this project.

## Claude Desktop

1. Download the versioned `things-mcp-<version>.mcpb` from the repository's [Releases page](https://github.com/mathiswrong/Things-MCP/releases). Choose the `.mcpb` asset, not GitHub's source ZIP. If no release has been published, developers can build it using CONTRIBUTING.md.
2. **Open Things 3 first, then launch Claude Desktop.** If Claude Desktop is already open and cannot connect, fully quit and reopen it while Things stays running.
3. Open the downloaded package with Claude Desktop and choose **Install**. If the file opens elsewhere, use **Settings > Extensions > Advanced settings > Install extension** and select it there.
4. Open **Settings > Extensions > Things MCP > Configure**. Keep write access off for the first health check, or turn on **Allow changes** if you want to manage tasks immediately. Select **Save** after changing a setting.
5. Start a new conversation and ask: **Use Things MCP to check the connection without reading or changing tasks.** Approve that tool call if prompted.
6. If macOS requests permission to control Things, allow it. A successful result reports the Things version, running status, timezone, and whether writes are enabled.

The local connection needs no API key, configuration editing, Terminal window, or separate background service. The client starts its packaged server when needed.

## Use Things from claude.ai

A browser chat can use the Things server that Claude Desktop runs on your Mac. Keep the Mac awake and online, with Things 3 and Claude Desktop running. You can leave an existing **Local dev** connector in place.

1. In Claude Desktop, open **Settings > Desktop app > Extensions > Manage** and find **Local MCP servers**. Some versions put this list under **Settings > Developer**. Select your Things server and check for **Running**. If it is already running, skip installation. If Things appears only in the website's Connectors list, [register the local server](#register-the-local-server-manually).
2. Start a **new chat** at [claude.ai](https://claude.ai/new). Open **+ > Devices** and select the Mac running Things. If it is already selected, leave it selected. The chat should show the Mac as **Connected**. If the Mac is missing, open **Devices > Manage computers** and check its connection before continuing.
3. Send this read-only check, using the server name from step 1:

   > On the linked Mac, use the local Things server from Claude Desktop to call `things_health` once. Skip the Local dev connector. If the local server is unavailable, say so. Do not read or change any tasks.

4. Expand the tool activity in the reply. On the **Things health** call, open **Which computer** (the computer icon). **Linked to** should name the Mac you selected. Expand the response and check **Running: Yes** and the Things version. The device label on that specific call tells you which connection handled it.

### Register the local server manually

Use this route if Claude Desktop has no running Things entry. It requires Node.js 24 or later. The server speaks stdio directly. Claude Desktop starts it, and the health check needs no Things URL token.

1. Follow [Build and install locally](../docs/OTHER-CLIENTS.md#build-and-install-locally). Keep the JSON printed by `npm run install:local`. It contains the absolute Node and server paths for your Mac.
2. Open **Edit config** in **Local MCP servers**. Before editing `~/Library/Application Support/Claude/claude_desktop_config.json`, make a backup copy. Inside the existing `mcpServers` object, add the installer's `things` entry under the name `Things`. Keep every existing entry and all other settings. If `mcpServers` is missing, add it at the top level.
3. Keep the printed `command` and the first two `args` values. Append `"--client", "desktop-plugin"` to `args`. This gives the connection its own write setting and starts it read-only by default. The finished entry has this shape (replace the first two paths with the installer output):

   ```json
   {
     "Things": {
       "command": "/absolute/path/to/node",
       "args": ["/absolute/path/to/cli.mjs", "stdio", "--client", "desktop-plugin"]
     }
   }
   ```

4. Save and validate the file with `python3 -m json.tool "$HOME/Library/Application Support/Claude/claude_desktop_config.json" > /dev/null`. A successful check exits silently. With Things 3 open, fully quit and reopen Claude Desktop. If **Things** fails to start, open **View logs** or check `~/Library/Logs/Claude/mcp-server-Things.log` for the startup error.
5. Run the browser health check above. If you later want the desktop server and its linked chats to create or edit tasks, add `"env": {"THINGS_MCP_ALLOW_WRITES": "true"}` alongside `args` in the `Things` entry. Restart Claude Desktop and run the check again. **Writes enabled** should now say **Yes**. Individual to-do Trash has a separate grant and stays off by default.

## Cowork on a Mac

Use the same desktop extension in Cowork. If Things MCP is already installed in Claude Desktop, keep Things running and start at step 3.

1. Open Things 3 and leave it running.
2. Download the `.mcpb` file from [Releases](https://github.com/mathiswrong/Things-MCP/releases). Open it with Claude Desktop and choose **Install**. If needed, use **Settings > Extensions > Advanced settings > Install extension** to select the file.
3. In Claude Desktop, start a new task and select **Cowork**.
4. Send this connection-check prompt:

   > Use Things MCP to check the connection. Call things_capabilities and things_health without reading or changing tasks. If the connector is unavailable, say so without using another integration.

5. To create or edit tasks, open **Settings > Extensions > Things MCP > Configure**, enable **Allow changes**, and select **Save**. Then try:

   > Create one Inbox task called “Try Things MCP in Cowork,” then read it back to confirm it was created.

For this local Cowork connection, use **Allow changes**. The **Allow changes from remote connections** switch controls the separately configured tunnel. See [Try a task](#try-a-task) for completing your test task and handling uncertain results.

If the tools do not appear, check that Things MCP is enabled in extension settings and start a fresh Cowork task. If health reports `AUTOMATION_DENIED`, allow the requesting application or runtime to control Things under **macOS System Settings > Privacy & Security > Automation**. If a write reports `READ_ONLY`, save the **Allow changes** setting and request another health check.

If it still fails, report your Claude Desktop, Things MCP, macOS, and Things versions, the installation method, and the failing tool's error. Do not include personal task contents. See [Troubleshooting](../docs/TROUBLESHOOTING.md) for other error codes.

Desktop Cowork discovery, connection checks, and a create/read/edit/complete flow were verified with Things MCP **1.0.1**, Claude Desktop **1.46388.4**, and Things **3.23.4** on macOS **26.6.2**. This used an existing installation and did not cover web or mobile Cowork. See the [Cowork verification record](../VERIFICATION.md#cowork-desktop-check).

## Optional checklist, reminder and duplication setup

Follow [Things URL setup](../docs/URL-OPERATIONS.md). Create templates without a token; editing existing tasks or duplicating them requires your local Things URL token in Keychain. URL receipts report dispatch without claiming complete read-back.

## Try a task

With **Allow changes** on, ask:

> Create one Inbox task titled “Try Things MCP” with the note “My first connection test”, then read it back.

You should see that task in Things and receive its verified title and Things link. Then try:

> Read the task we just created, mark it complete, and verify the result. Do not change any other tasks.

Do not retry a create if the tool reports an uncertain result. Inspect the task and request receipt first; it may already exist.

## Write permissions

The native extension settings separate ordinary writes from moving to Trash:

| Switch | Connection it controls |
|---|---|
| **Delete projects, areas, and tags** | Container deletion by this Mac's extension; also requires Allow changes and a fresh scope preview |
| **Delete projects, areas, and tags from remote connections** | Container deletion through the tunnel; also requires its Allow changes switch and a fresh scope preview |
| **Allow changes** | This Mac's local extension |
| **Allow changes from remote connections** | Your separately configured private tunnel, including clients using its account plugin |
| **Allow moving to Trash** | Individual to-do removal from this Mac's local extension; also requires Allow changes |
| **Allow moving to Trash from remote connections** | Individual to-do removal through the private tunnel; also requires its Allow changes switch |

Changes apply after **Save** and the host's server restart. Turning a switch off denies subsequent mutations. An operation already delivered to Things cannot be rolled back by switching access off. Client tool approval prompts are an additional control; they do not replace the Mac-side grant.

New installations start read-only. Both Trash switches and both container-deletion switches also default to off. They allow recoverable to-do deletion, including its checklist, but not permanent deletion or deleting whole projects or areas. Installing the extension does not create tasks. If a maintainer globally revoked access, regrant by switching the relevant control off, saving, switching it on, and saving again.

## ChatGPT and other clients

The `.mcpb` package alone does not connect ChatGPT browser chats. That route requires a tunnel associated with your own account and workspace. Follow [ChatGPT setup](../docs/CHATGPT.md). It currently requires an operator for initial provisioning; there is no one-click cross-client installer in this release.

Other MCP hosts can launch the standard local transport. Follow [other client setup](../docs/OTHER-CLIENTS.md). These clients may require their own configuration steps.

## Updates and removal

Install a newer `.mcpb` through the same extension installer, review its permissions, and run a health check. If your host requests removing the previous extension first, use its **Uninstall** button, then install the new package. Keep the shared Things MCP state directory so retry protection remains intact.

Disable or uninstall the local extension in **Settings > Extensions**. Disconnect the remote plugin in that client's settings. These actions do not delete your Things tasks. Removing the local extension does not revoke the separate tunnel's grant or stop its service; turn **Allow changes from remote connections** off and save before uninstalling if you also want to revoke remote writes.

The remote helper appears as **Things MCP** in macOS background-item notifications and Login Items. Its full retirement procedure is in the ChatGPT guide. Local receipts remain in `~/Library/Application Support/Things MCP`; they contain operation metadata, not task titles or notes.

## Privacy and help

Task content you ask a client to retrieve is shared with that client and its provider. The bridge does not upload a database or collect Things Cloud credentials. The remote tunnel credential stays in the Mac's login Keychain. No telemetry destination is bundled.

See [Troubleshooting](../docs/TROUBLESHOOTING.md), [Capabilities](../docs/CAPABILITIES.md), and [Security](../SECURITY.md). Release packages include the MIT License and required third-party notices.
