# Things MCP

Find and manage Things 3 tasks from a conversation. Things MCP connects compatible MCP clients to the Things app on your Mac through its supported automation interfaces.

Create Inbox tasks, edit titles and notes, set deadlines, schedule dates, move tasks, and complete or reopen them. A separate permission enables moving individual to-dos to Trash. Your Mac runs the bridge. The local connection needs no companion app or project-operated account or server.

[Documentation](docs/README.md) · [Installation](packaging/INSTALL.md) · [Daily use](docs/DAILY-USE.md) · [Capabilities](docs/CAPABILITIES.md) · [Full scope](docs/FULL-SCOPE.md) · [Troubleshooting](docs/TROUBLESHOOTING.md) · [Buy me a coffee](https://buymeacoffee.com/paul2d)

Version 0.1 is an early release. The local extension installs through its host. First-time browser setup is an advanced installation, and fresh-Mac consent and sleep/wake recovery still need wider testing. See [verification coverage](VERIFICATION.md).

## Install

For **Claude Desktop on macOS**, download the `.mcpb` package from [Releases](https://github.com/mathiswrong/Things-MCP/releases), open it, and select **Install**. The desktop client supplies the runtime. No configuration editing or Terminal commands are needed for this route. Release assets become available when a release is published; developers can [build the package from source](CONTRIBUTING.md).

Open **Settings > Extensions > Things MCP > Configure**, enable **Allow changes** if you want to manage tasks, and **Save**. New installations start read-only so you choose when to grant access.

In a new conversation, try:

> Use Things MCP to create an Inbox task called “Try Things MCP”, then read it back.

For **ChatGPT browser chats**, the Mac also needs a private tunnel connected to your own account. This route works, but first-time setup is currently an advanced installation. Follow [ChatGPT setup](docs/CHATGPT.md). After setup, the background connection starts at login and does not need an open Terminal. The **Allow changes from ChatGPT** switch grants writes through that tunnel.

Other clients can use the standard local MCP transport. See [other MCP clients](docs/OTHER-CLIENTS.md). A model needs a client that supports tools; support for MCP alone does not guarantee compatibility with every host.

## What works

| Operation | Version 0.1 |
|---|---|
| Search and read to-dos, projects, areas, and tags | Available |
| Create an Inbox to-do | Available |
| Edit a to-do's title and notes | Available |
| Set or clear a deadline | Available |
| Schedule a to-do on a calendar date | Available |
| Complete, cancel, or reopen a to-do | Available |
| Create and edit projects, areas, and tags | Available; project lifecycle checks used an empty project |
| Built-in list queries and project/area filters | Available |
| Moves between supported lists, projects, and areas | Available; project Anytime and direct Logbook moves are excluded after failed native verification |
| Move an individual to-do to Trash | Separate permission required |
| Container/permanent deletion, restoration, duplication, tag assignment, reminders | Not included |
| Full checklists and headings | Not included; full access uses Shortcuts, which this server does not use |
| Native repeating rules | No supported public rule-editing interface identified |

This release does not cover every Things operation. Some missing actions have public Things APIs and remain implementation work; others have no supported interface. [The capability reference](docs/CAPABILITIES.md) explains field limits, search behavior, and unavailable features. Tools return their current implementation status through `things_capabilities`.

## Requirements

- A Mac with Things 3 installed and running. Native checks used Things 3.23.3 and 3.23.4.
- A client that supports the chosen connection. The packaged local route uses Claude Desktop; remote use depends on your ChatGPT account's available plugin and tunnel features.
- macOS Automation permission to control Things when requested.
- For remote access, the Mac must remain awake, online, and signed in.

Things and client subscriptions are separate products. This repository does not include Things, a subscription, or a vendor runtime license grant.

## Your data and permissions

Task content requested in a conversation is shared with that client and its provider. The bridge does not collect Things Cloud credentials, write to the Things database, or provide a shell tool. No telemetry destination is bundled.

Writes require your local grant. Every mutation checks permission, uses a durable request ID, and verifies the result in Things. Edits also require the current item revision. Uncertain writes are never automatically repeated with a new request ID. These checks reduce duplicate and stale edits; Things automation is not transactional and cannot promise automatic rollback.

Local and remote connections share the same permission store, write lock, and request journal. See [Security](SECURITY.md) for the trust boundary and private vulnerability reporting.

## Support and contribution

For a bug or feature request, [open an issue](https://github.com/mathiswrong/Things-MCP/issues) with versions and a synthetic example. Keep task contents and credentials out of reports. Developers can run the tests without Things, provider accounts, or personal configuration; see [Contributing](CONTRIBUTING.md).

If Things MCP is useful to you, [buy me a coffee](https://buymeacoffee.com/paul2d). Support is optional and does not unlock features.

Things MCP is an independent project. Product names identify compatibility; the project is not affiliated with or endorsed by the named vendors. License selection is pending; third-party notices apply to their respective dependencies.
