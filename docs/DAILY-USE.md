# Use your installed Things connection

These examples describe the published 0.83 release. For additions under development, see [1.0 readiness](V1-READINESS.md).

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

## More examples

| Ask | Tool behavior |
|---|---|
| “Show up to ten open Inbox tasks, without notes.” | Bounded search with kind, list, and status filters. |
| “Read the task named Try Things MCP and replace its note with Bring the receipt.” | Find the exact target, fetch its revision, update notes, and verify. |
| “Give that task a deadline of October 8, 2026.” | Set a deadline. This does not set the task's start date or a reminder. |
| “Schedule that task for October 7, 2026.” | Set its calendar start date in the Mac's timezone. |
| “Move that task into my Weekend project.” | Resolve both items by ID, check the revision, and verify the parent. |
| “Move that task to Trash.” | Requires ordinary writes and the separate Trash grant. The task can be restored manually in Things. |
| “Create an area named Learning.” | Create one area and verify its name. |
| “Create a tag named Errands.” | Create a shared library tag. Assigning it to tasks is not implemented. |

Prompts are examples, not exact commands. Clients may ask you to clarify a target or approve a tool call. The bridge receives structured fields and does not interpret natural language itself. Start with one task when trying a new workflow.

Do not request repeating rules, checklist edits, or multi-item deletion through this version. Read [why actions are unavailable](CAPABILITIES.md#why-these-actions-are-available) to distinguish vendor limits from unimplemented server features.
