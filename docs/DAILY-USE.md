# Use your installed Things connection

These steps are for a Mac where the extension and optional private tunnel are already installed. For a new Mac, start with [Installation](../packaging/INSTALL.md).

## Start a conversation

In Claude Desktop, start a new chat with the Things MCP extension enabled. In ChatGPT browser Chat, open **+**, type **Things MCP**, and select the result. The desktop plugin uses the same account connection.

Ask:

> Check my Things connection and tell me which operations are available. Do not read or change tasks.

Things must be running. For remote access, your Mac must also be awake, online, and signed in. Ordinary use requires no Terminal window or companion app.

## Manage a task

With ordinary changes enabled, try these prompts one at a time:

1. **Create one Inbox task named “Try Things MCP”, then read it back.**
2. **Read that task, move it to Today, and verify the move.**
3. **Read that task, mark it complete, and verify the result.**

Always identify the intended task if more than one result matches. If a tool reports an uncertain result, inspect the item before retrying. Do not ask it to create a replacement automatically.

## Choose write access

Open **Claude Desktop > Settings > Extensions > Things MCP > Configure**. **Allow changes** controls the local connection. **Allow changes from ChatGPT** controls the private tunnel. Save after changing a switch.

The two **Allow moving to Trash** switches are separate and default to off. Turn on the switch for the desired connection only when you want it to remove individual to-dos. It also needs ordinary changes enabled. This does not permit permanent deletion or deleting whole projects or areas. Client approval prompts remain separate.

## After an update

Start a new conversation. For ChatGPT, reload **Plugins**, select **Personal**, open **Things MCP > Manage**, and use **Refresh** near the bottom. The action list should contain ten tools, including `things_move_item` and `things_trash_item`. Reloading the page can restore a missing Refresh control.

See [Capabilities](CAPABILITIES.md) for exact fields and [Full scope](FULL-SCOPE.md) for omissions. Native repeating rules and full checklist/headings access are outside this build's supported interface boundary.
