# ChatGPT setup

ChatGPT browser conversations cannot start a process on your Mac directly. Things MCP uses OpenAI's Secure MCP Tunnel to reach the local server. Your own account owns the tunnel and credential; this project does not operate a relay or need access to your account.

This is an advanced installation. The account setup uses existing provider screens, but installing the background transport currently needs developer commands. It is not a one-click installer for another Mac. Once configured, ordinary use needs no open Terminal or companion app.

The Mac must remain awake, online, signed in, and running Things. Account features and workspace policy determine whether plugin creation and tunnels are available. Check the current [Secure MCP Tunnel guide](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels) and [developer-mode guide](https://developers.openai.com/api/docs/guides/developer-mode) before proceeding.

## 1. Install the local extension and runtime

Install the MCPB extension using [the installation guide](../packaging/INSTALL.md). Its native settings control write access for both connections.

An operator also needs Node.js 24 or later and the official tunnel client. Build from a clean checkout:

```sh
npm ci
npm run check
npm run smoke
npm run install:local
brew install openai/tools/tunnel-client
```

The tunnel client is a separate upstream dependency. Its official macOS installation currently uses Homebrew; upstream warns that directly downloaded release archives are not notarized. This guide does not use security bypasses or claim a command-free installation on a new Mac. Review its [installation and configuration documentation](https://github.com/openai/tunnel-client). No provider binaries or credentials are included in the source repository.

## 2. Create your tunnel and restricted credential

In OpenAI Platform settings, use the organization associated with your ChatGPT workspace. Link the intended workspace if it is not already associated. Create a tunnel named **Things MCP** and copy its tunnel ID for the installer. A tunnel ID identifies the connection; it is not the runtime secret.

Create a runtime API key in that organization's project. Use **Restricted** permissions and enable only **Tunnels: Read and Use**. Leave unrelated permissions disabled. Do not use an admin key. Keep the one-time secret out of chat, shell commands, screenshots, and source files.

Store that secret in the Mac's **login Keychain** using Keychain Access's new password item dialog:

| Field | Value |
|---|---|
| Keychain item name / service | `Things MCP Tunnel` |
| Account name | `runtime` |
| Password | Your restricted runtime key |

The background launcher retrieves this exact item when it starts. Allow the macOS Keychain access request when needed. Do not select unrestricted access for all applications.

## 3. Install the background connection

From the source checkout, run the installer with your tunnel ID in place of `<tunnel-id>`:

```sh
npm run tunnel -- install <tunnel-id>
npm run tunnel -- status
```

The installer creates a user LaunchAgent, a provider profile, and an executable named **Things MCP**. Configuration and credentials stay outside the repository. The expected status is `{"healthy":true,"ready":true}`. This checks the transport; the next step verifies an actual client call.

macOS may notify you that **Things MCP** can run in the background. The service starts when you sign in, gets its credential from Keychain, and runs the official transport. It removes that credential from the child MCP process's environment and exposes no public listening port.

## 4. Connect the plugin

In ChatGPT's plugin settings, create a custom plugin named **Things MCP**. Choose the **Tunnel** connection type and select the tunnel you created. The local stdio server does not implement a second authentication layer; the secure tunnel and its workspace association provide access control. Follow the provider's current form labels if they differ.

Create the plugin, verify that its ten tools are listed, and select **Connect**. An existing connection may retain an older tool catalog. Reload the Plugins page, choose **Personal**, then **Things MCP > Manage**. Select **Refresh** near the bottom of the action list. Verify that `things_move_item` and `things_trash_item` appear before starting a new conversation. A stale page can hide Refresh even when the account has permission to use it. In a new conversation, select Things MCP and ask:

> Use Things MCP to check the connection without reading or changing tasks.

A successful call reports the Things version and running state. If the Mac is unavailable, fix the connection before requesting writes.

## 5. Enable ordinary changes

On the Mac, open **Claude Desktop > Settings > Extensions > Things MCP > Configure**. Turn on **Allow changes from ChatGPT** and **Save**. That native setting manages the remote grant; no tool can enable its own access. Request a new health check and confirm `writesEnabled: true`.

For individual to-do deletion, also enable **Allow moving to Trash from ChatGPT** and save. This separate permission defaults to off and never allows permanent deletion or container deletion.

Test one labeled Inbox task, then read it back. You may still see ChatGPT tool approval prompts. Do not bypass them or change unrelated plugin permissions.

## Desktop plugin packaging

The registered account connector can also be referenced by a desktop plugin. Generate its local package with your registered app ID:

```sh
npm run package:plugin -- <registered-app-id>
```

The result contains `.codex-plugin/plugin.json` and `.app.json` outside the repository. Install it using the host's supported personal plugin workflow, as described in [the plugin documentation](https://developers.openai.com/plugins/build/plugins). It references the same tunnel, state, and remote grant; it does not install a second server. Ordinary browser Chat and the desktop plugin host have both completed health and capability calls through the same account connection. A running conversation can retain its earlier tool definitions; start a new conversation after a catalog refresh.

## Diagnose, update, and disconnect

`npm run tunnel -- status` reports transport health without reading task content. If it is unavailable, check the Mac's network, login Keychain, provider key, and Login Items permission. Check the plugin's workspace and tunnel association too. Do not post raw provider logs; they can contain task data.

For an update, build the new source, run `npm run install:local`, and repeat the tunnel install command. Then check status. If tools changed, reload ChatGPT Plugins, choose **Personal**, open **Things MCP > Manage**, and select **Refresh** near the bottom. Review the new tool list and start a new conversation for the health check. See the [connection update guide](https://developers.openai.com/plugins/deploy/connect-chatgpt). Updating the local `.mcpb` alone does not update the tunnel's installed runtime.

To stop the connection and disable future automatic startup:

```sh
npm run tunnel -- stop
```

This preserves Things data, receipts, and the remote tunnel. Repeat the install command to reconnect. To retire it completely, turn off the remote write switch and save, disconnect the ChatGPT plugin, stop the service, revoke its restricted API key in Platform settings, and remove the corresponding Keychain item. You can then delete the stopped `local.things-mcp.tunnel.plist` from your user LaunchAgents folder. Do not delete the shared state directory while another client is using it.

The helper retries failed starts under macOS service management. Actual logout/login and sleep/wake recovery have not yet been verified. If the connection does not recover, check status and reconnect before making changes.
