# Install Things MCP

## Before you start

You need a Mac with Things 3 installed, signed in, and running. The local package also needs a current Claude Desktop version that supports MCPB extensions and Node.js 24 or later in its bundled runtime. You do not need to install Node separately for that route.

Things MCP is independent of Things and the client vendors. Their apps, accounts, and subscriptions are separate from this project.

## Claude Desktop

1. Download `things-mcp-0.1.0.mcpb` from the repository's [Releases page](https://github.com/mathiswrong/Things-MCP/releases). Choose the `.mcpb` asset, not GitHub's source ZIP. If no release has been published, developers can build it using CONTRIBUTING.md.
2. Open Things 3.
3. Open the downloaded package with Claude Desktop and choose **Install**. If the file opens elsewhere, use **Settings > Extensions > Advanced settings > Install extension** and select it there.
4. Open **Settings > Extensions > Things MCP > Configure**. Keep write access off for the first health check, or turn on **Allow changes** if you want to manage tasks immediately. Select **Save** after changing a setting.
5. Start a new conversation and ask: **Use Things MCP to check the connection without reading or changing tasks.** Approve that tool call if prompted.
6. If macOS requests permission to control Things, allow it. A successful result reports the Things version, running status, timezone, and whether writes are enabled.

The local connection needs no API key, configuration editing, Terminal window, or separate background service. The client starts its packaged server when needed.

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
| **Allow changes** | This Mac's local extension |
| **Allow changes from ChatGPT** | Your separately configured private tunnel, including clients using its account plugin |
| **Allow moving to Trash** | Individual to-do removal from this Mac's local extension; also requires Allow changes |
| **Allow moving to Trash from ChatGPT** | Individual to-do removal through the private tunnel; also requires its Allow changes switch |

Changes apply after **Save** and the host's server restart. Turning a switch off denies subsequent mutations. An operation already delivered to Things cannot be rolled back by switching access off. Client tool approval prompts are an additional control; they do not replace the Mac-side grant.

New installations start read-only. Both Trash switches also default to off. They allow recoverable to-do deletion, including its checklist, but not permanent deletion or deleting whole projects or areas. Installing the extension does not create tasks. If a maintainer globally revoked access, regrant by switching the relevant control off, saving, switching it on, and saving again.

## ChatGPT and other clients

The `.mcpb` package alone does not connect ChatGPT browser chats. That route requires a tunnel associated with your own account and workspace. Follow [ChatGPT setup](../docs/CHATGPT.md). It currently requires an operator for initial provisioning; there is no one-click cross-client installer in this release.

Other MCP hosts can launch the standard local transport. Follow [other client setup](../docs/OTHER-CLIENTS.md). These clients may require their own configuration steps.

## Updates and removal

Install a newer `.mcpb` through the same extension installer, review its permissions, and run a health check. If your host requests removing the previous extension first, use its **Uninstall** button, then install the new package. Keep the shared Things MCP state directory so retry protection remains intact.

Disable or uninstall the local extension in **Settings > Extensions**. Disconnect the remote plugin in that client's settings. These actions do not delete your Things tasks. Removing the local extension does not revoke the separate tunnel's grant or stop its service; turn **Allow changes from ChatGPT** off and save before uninstalling if you also want to revoke remote writes.

The remote helper appears as **Things MCP** in macOS background-item notifications and Login Items. Its full retirement procedure is in the ChatGPT guide. Local receipts remain in `~/Library/Application Support/Things MCP`; they contain operation metadata, not task titles or notes.

## Privacy and help

Task content you ask a client to retrieve is shared with that client and its provider. The bridge does not upload a database or collect Things Cloud credentials. The remote tunnel credential stays in the Mac's login Keychain. No telemetry destination is bundled.

See [Troubleshooting](../docs/TROUBLESHOOTING.md), [Capabilities](../docs/CAPABILITIES.md), and [Security](../SECURITY.md). Release packages include the MIT License and required third-party notices.
