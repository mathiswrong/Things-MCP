# Things MCP documentation

Things MCP connects a conversation to Things 3 on your Mac. Version 1.0 provides twenty tools. Local extension installation uses the client's own installer. Initial browser setup requires developer tools and an eligible account.

## Start here

1. [Install the local extension](../packaging/INSTALL.md), including [Cowork on a Mac](../packaging/INSTALL.md#cowork-on-a-mac).
2. [Connect ChatGPT through a private tunnel](CHATGPT.md), if needed.
3. [Use the installed connection](DAILY-USE.md) to find, create, edit, schedule, and move tasks.
4. [Configure optional URL operations](URL-OPERATIONS.md) for checklists, templates, reminders and duplication.
5. [Review available tools and their fields](CAPABILITIES.md) before enabling writes or Trash.

[Other MCP clients](OTHER-CLIENTS.md) describes the standard local transport. Browser and local clients have different installation requirements; an MCP-compatible model alone is not an installation target.

## Understand the limits

- [Full operation scope](FULL-SCOPE.md): what is missing and whether Things exposes a supported mechanism.
- [Verification](../VERIFICATION.md): automatic tests, native checks, client checks, and remaining gaps.
- [Troubleshooting](TROUBLESHOOTING.md): connection failures, permissions, stale tool catalogs, and uncertain writes.
- [Privacy](PRIVACY.md): where task data goes, what stays on your Mac, and how to disconnect.
- [Security policy](../SECURITY.md): trust boundaries and private vulnerability reporting.

## Contribute

[Contributing](../CONTRIBUTING.md) includes reproducible build and test commands. [Architecture](../SETUP-PLAN.md) describes the local server and optional transport. [Maintaining the repository](MAINTAINING.md) covers GitHub protections. [Releasing](RELEASING.md) covers package validation and publication. [Changelog](../CHANGELOG.md) records user-facing changes.

The `almanac/` tree contains historical planning notes. Some describe routes that were later excluded. Use these guides and the current runtime capability response for installation and supported behavior.

Maintainers can start with the [architecture wiki](../almanac/README.md) and [release procedure](RELEASING.md).
