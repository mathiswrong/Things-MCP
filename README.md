<h1 align="center">Things MCP</h1>

<p align="center">Find and manage Things 3 tasks from a conversation.</p>

<p align="center">
  <strong>macOS</strong> · Things 3 · 20 tools · Read-only by default
</p>

<p align="center">
  <a href="https://github.com/mathiswrong/Things-MCP/releases/latest"><strong>Download the extension</strong></a> ·
  <a href="docs/README.md">Documentation</a> ·
  <a href="docs/DAILY-USE.md">Daily use</a> ·
  <a href="docs/TROUBLESHOOTING.md">Get help</a>
</p>

---

Things MCP connects compatible MCP clients to the Things app on your Mac through its supported automation interfaces. Manage tasks, projects, areas and tags. Create checklists and project templates, set reminders, duplicate items and move projects with descendant summaries. The bridge runs on your Mac without a companion app or project-operated service.

> [!IMPORTANT]
> **Open Things 3 before launching your LLM client.**
>
> Things must already be running on the Mac hosting Things MCP before you open your AI app or browser conversation. Otherwise, you may see **“unable to connect to server”**. Keep Things running while you use the connection.
>
> **Already seeing the error?** Open Things, fully quit and reopen your desktop client (or reload your browser client), then start a new conversation and check the connection.

## Install

| Your client | Setup route |
| --- | --- |
| **Claude Desktop on macOS** | [Download the `.mcpb` extension](https://github.com/mathiswrong/Things-MCP/releases/latest). No Terminal or separate runtime installation. |
| **ChatGPT in a browser** | [Set up a private tunnel](docs/CHATGPT.md). First-time setup requires developer commands. |
| **Other MCP clients** | [Configure the local transport](docs/OTHER-CLIENTS.md). Setup and compatibility depend on the host. |

### Claude Desktop

1. Download the `.mcpb` package from [Releases](https://github.com/mathiswrong/Things-MCP/releases).
2. **Open Things 3 first, then launch Claude Desktop.** If the client is already open and cannot connect, fully quit and reopen it after Things is running. Open the downloaded package and select **Install**. The desktop client supplies the runtime; no configuration editing or Terminal commands are needed.
3. Open **Settings > Extensions > Things MCP > Configure**. Enable **Allow changes** if you want to manage tasks, then select **Save**. New installations start read-only.
4. Start a new conversation and ask: **Use Things MCP to check the connection without reading or changing tasks.** Allow macOS Automation access to Things if prompted.
5. With **Allow changes** enabled, try: **Use Things MCP to create an Inbox task called “Try Things MCP”, then read it back.**

### ChatGPT browser chats

1. **Open Things 3 on your Mac before opening ChatGPT.** Follow [ChatGPT setup](docs/CHATGPT.md) to connect a private tunnel on your Mac to your own account. First-time setup is currently an advanced installation.
2. Enable **Allow changes from remote connections** in the extension settings and select **Save** if you want to manage tasks through the tunnel.
3. Start a new conversation with the connection enabled and ask it to check the Things MCP connection. After setup, the background connection starts at login and does not need an open Terminal.

Other clients can use the standard local MCP transport. See [other MCP clients](docs/OTHER-CLIENTS.md). A model needs a client that supports tools; support for MCP alone does not guarantee compatibility with every host.

## What works

| Workflow | What you can do |
| --- | --- |
| **Find and review** | Search tasks, projects, areas and tags; query built-in lists and date filters. |
| **Plan your day** | Create tasks, edit notes, schedule dates, set deadlines, complete and reopen tasks. |
| **Organize your work** | Manage projects, areas and tags; move projects with task counts and descendant summaries. |
| **Checklists and templates** | Create checklists and project templates, duplicate items, set reminders and Evening through Things URLs. |
| **Clean up deliberately** | Move items to recoverable Trash with separate permission; restore open tasks and projects. |

<details>
<summary><strong>See the full operation list for version 1.0.2</strong></summary>

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

</details>

Project moves return task counts and observed descendant changes in the same receipt. See [project move results](docs/CAPABILITIES.md#project-move-results) for the counts, changed-task details and read-back limits.

URL operations require [one-time local setup](docs/URL-OPERATIONS.md) for edits and duplication. Their receipts say **“Sent to Things; result not verified”** because Things does not expose complete read-back for those fields.

Native repeat-rule editing, full checklist/heading reads, arbitrary ordering and verified whole-library maintenance are unavailable. [The capability reference](docs/CAPABILITIES.md) explains field limits, search behavior, and unavailable features. Tools return their current implementation status through `things_capabilities`.

## Try it in a conversation

Start with a connection check:

> Use Things MCP to check the connection without reading or changing tasks.

Then try a read:

> Show up to ten open Inbox tasks, without notes.

With **Allow changes** enabled:

> Create one Inbox task called “Try Things MCP”, then read it back.

[More everyday examples →](docs/DAILY-USE.md)

## Requirements

- A Mac with Things 3 installed and **running before you launch your LLM client**. Native checks used Things 3.23.3 and 3.23.4.
- A client that supports the chosen connection. The packaged local route uses Claude Desktop; remote use depends on your ChatGPT account's available plugin and tunnel features.
- macOS Automation permission to control Things when requested.
- For remote access, the Mac must remain awake, online, and signed in.

Things and client subscriptions are separate products. This repository does not include Things, a subscription, or a vendor runtime license grant.

## Your data and permissions

Task content requested in a conversation is shared with that client and its provider. The bridge does not collect Things Cloud credentials, write to the Things database, or provide a shell tool. No telemetry destination is bundled.

Writes require your local grant. Moving a task to Things’ recoverable Trash requires an additional permission so you can allow editing without allowing deletion. Every mutation checks permission and uses a durable request ID. Native task edits verify the exposed result in Things. URL tools report dispatch separately and do not claim a verified result. Edits also require the current item revision. Uncertain writes are never automatically repeated with a new request ID. These checks reduce duplicate and stale edits; Things automation is not transactional and cannot promise automatic rollback.

Local and remote connections share the same permission store, write lock, and request journal. See [Security](SECURITY.md) for the trust boundary and private vulnerability reporting.

## Explore the project

| Guide | What you will find |
| --- | --- |
| [Installation](packaging/INSTALL.md) | Step-by-step setup, permissions, updates and removal |
| [Capabilities](docs/CAPABILITIES.md) · [Full scope](docs/FULL-SCOPE.md) | Available fields, read-back limits and unsupported operations |
| [Privacy](docs/PRIVACY.md) · [Security](SECURITY.md) | Data handling, trust boundaries and private vulnerability reporting |
| [Verification](VERIFICATION.md) · [Changelog](CHANGELOG.md) | Tested environments, remaining checks and release history |
| [Contributing](CONTRIBUTING.md) · [Maintainer wiki](almanac/README.md) | Development setup and architecture |

## Support and contribution

- For a bug or feature request, [open an issue](https://github.com/mathiswrong/Things-MCP/issues) with versions and a synthetic example. Keep task contents and credentials out of reports.
- To contribute, follow [Contributing](CONTRIBUTING.md). Developers can run the tests without Things, provider accounts, or personal configuration.
- Financial support is optional and does not unlock features.

> **If Things MCP is useful to you, [buy me a coffee](https://buymeacoffee.com/paul2d).**

Things MCP is an independent project. Product names identify compatibility; the project is not affiliated with or endorsed by the named vendors. Released under the [MIT License](LICENSE). You may use, modify, and redistribute the code, including commercially, provided you retain its copyright and license notice. The software is provided without warranty. Third-party notices apply to their respective dependencies.
