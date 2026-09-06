# Changelog

## 0.1.0

First public preview of the Things MCP server for macOS.

- Ten tools for health, capabilities, bounded search, item lookup, creation, editing, calendar scheduling, placement, individual to-do Trash, and request receipts.
- A local desktop extension with a host-provided runtime and native permission switches. New installations start read-only; Trash requires a separate grant.
- An optional account-owned private tunnel for browser and desktop plugin access. First-time tunnel setup requires developer tools.
- Shared client permissions, a write lock, revision checks, durable request IDs, and read-back verification. Uncertain operations are not automatically repeated.
- Installation, daily-use, capability, privacy, security, troubleshooting, contribution, and release guides. Optional support through the GitHub Sponsor button and Buy Me a Coffee.

Project Anytime moves and queries are rejected because native destination membership could not be verified. Direct Logbook moves also failed native checks and are excluded. Logbook reads have a longer bounded timeout for large histories. Search pagination accepts every valid offset within its 5,000-object scan limit.

See [Capabilities](docs/CAPABILITIES.md), [Full scope](docs/FULL-SCOPE.md), and [Verification](VERIFICATION.md) for field limits, native coverage, and unimplemented operations. Full checklists, headings, recurrence editing, container deletion, and universal remote-host installation are not included.
