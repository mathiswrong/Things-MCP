# Things MCP

Find and manage Things 3 tasks from a conversation. Things MCP connects compatible MCP clients to the Things app on your Mac through its supported automation interfaces.

Manage tasks, projects, areas and tags. Create checklists and project templates, set reminders, duplicate items and move projects with descendant summaries. Native edits verify exposed fields; URL-only operations report dispatch. Deletion requires separate permission. The bridge runs on your Mac without a companion app or project-operated service.

[Documentation](docs/README.md) · [Maintainer wiki](almanac/README.md) · [Installation](packaging/INSTALL.md) · [Daily use](docs/DAILY-USE.md) · [Capabilities](docs/CAPABILITIES.md) · [Full scope](docs/FULL-SCOPE.md) · [Troubleshooting](docs/TROUBLESHOOTING.md) · [Buy me a coffee](https://buymeacoffee.com/paul2d)

Version **1.0.2** provides twenty tools. The local extension uses the client's installer. Browser setup uses a private tunnel and currently requires developer commands. See [verification coverage](VERIFICATION.md) for the tested environments and remaining platform checks.

## Install

For **Claude Desktop on macOS**:

1. Download the `.mcpb` package from [Releases](https://github.com/mathiswrong/Things-MCP/releases).
2. Open Things 3, then open the downloaded package and select **Install**. The desktop client supplies the runtime; no configuration editing or Terminal commands are needed.
3. Open **Settings > Extensions > Things MCP > Configure**. Enable **Allow changes** if you want to manage tasks, then select **Save**. New installations start read-only.
4. Start a new conversation and ask: **Use Things MCP to check the connection without reading or changing tasks.** Allow macOS Automation access to Things if prompted.
5. With **Allow changes** enabled, try: **Use Things MCP to create an Inbox task called “Try Things MCP”, then read it back.**

For **Cowork on a Mac**, use the same extension, start a new task, and select **Cowork**. Follow the [Cowork installation and connection check](packaging/INSTALL.md#cowork-on-a-mac) for the steps, permission setting, and tested versions.

For **ChatGPT browser chats**:

1. Follow [ChatGPT setup](docs/CHATGPT.md) to connect a private tunnel on your Mac to your own account. First-time setup is currently an advanced installation.
2. Enable **Allow changes from remote connections** in the extension settings and select **Save** if you want to manage tasks through the tunnel.
3. Start a new conversation with the connection enabled and ask it to check the Things MCP connection. After setup, the background connection starts at login and does not need an open Terminal.

Other clients can use the standard local MCP transport. See [other MCP clients](docs/OTHER-CLIENTS.md). A model needs a client that supports tools; support for MCP alone does not guarantee compatibility with every host.

## What works

| Operation | Version 1.0.2 |
|---|---|
| Search and read to-dos, projects, areas, and tags | Available |
| Create an Inbox to-do | Available |
| Edit a to-do's title and notes | Available |
| Set or clear a deadline | Available |
| Schedule a to-do on a calendar date | Available |
| Complete, cancel, or reopen a to-do | Available |
| Create and edit projects, areas, and tags | Available |
| Built-in list queries and project/area filters | Available |
| Moves between supported lists, projects, and areas | Available |
| Delete an individual task to Trash | Available with Trash permission |
| Create, replace, append or prepend checklist rows | Available through Things URLs |
| Create project templates with headings | Available through Things URLs |
| Move a task to an existing heading | Available through Things URLs |
| Duplicate a task or project | Available through Things URLs |
| Set Evening or a reminder time | Available through Things URLs |
| Restore open tasks and projects from Trash | Available |
| Delete projects, areas and tags | Available with container permission |
| Tag assignment, hierarchy and keyboard shortcuts | Available |
| Counts, selection, date filters and resumable searches | Available |
| Edit section headings inside a project | Not available |
| Create or change repeating schedules | Not available |

Project moves return task counts and observed descendant changes in the same receipt. See [project move results](docs/CAPABILITIES.md#project-move-results) for the counts, changed-task details and read-back limits.

URL operations require [one-time local setup](docs/URL-OPERATIONS.md) for edits and duplication. Their receipts say **“Sent to Things; result not verified”** because Things does not expose complete read-back for those fields.

Native repeat-rule editing, full checklist/heading reads, arbitrary ordering and verified whole-library maintenance are unavailable. [The capability reference](docs/CAPABILITIES.md) explains field limits, search behavior, and unavailable features. Tools return their current implementation status through `things_capabilities`.

## Requirements

- A Mac with Things 3 installed and running. Native checks used Things 3.23.3 and 3.23.4.
- A client that supports the chosen connection. The packaged local route uses Claude Desktop; remote use depends on your ChatGPT account's available plugin and tunnel features.
- macOS Automation permission to control Things when requested.
- For remote access, the Mac must remain awake, online, and signed in.

Things and client subscriptions are separate products. This repository does not include Things, a subscription, or a vendor runtime license grant.

## Your data and permissions

Task content requested in a conversation is shared with that client and its provider. The bridge does not collect Things Cloud credentials, write to the Things database, or provide a shell tool. No telemetry destination is bundled.

Writes require your local grant. Moving a task to Things’ recoverable Trash requires an additional permission so you can allow editing without allowing deletion. Every mutation checks permission and uses a durable request ID. Native task edits verify the exposed result in Things. URL tools report dispatch separately and do not claim a verified result. Edits also require the current item revision. Uncertain writes are never automatically repeated with a new request ID. These checks reduce duplicate and stale edits; Things automation is not transactional and cannot promise automatic rollback.

Local and remote connections share the same permission store, write lock, and request journal. See [Security](SECURITY.md) for the trust boundary and private vulnerability reporting.

## Support and contribution

- For a bug or feature request, [open an issue](https://github.com/mathiswrong/Things-MCP/issues) with versions and a synthetic example. Keep task contents and credentials out of reports.
- To contribute, follow [Contributing](CONTRIBUTING.md). Developers can run the tests without Things, provider accounts, or personal configuration.
- Financial support is optional and does not unlock features.

> **If Things MCP is useful to you, [buy me a coffee](https://buymeacoffee.com/paul2d).**

Things MCP is an independent project. Product names identify compatibility; the project is not affiliated with or endorsed by the named vendors. Released under the [MIT License](LICENSE). You may use, modify, and redistribute the code, including commercially, provided you retain its copyright and license notice. The software is provided without warranty. Third-party notices apply to their respective dependencies.
