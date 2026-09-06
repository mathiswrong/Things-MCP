# Changelog

## 1.0.2

- Updated the maintained wiki and public documentation to describe the shipped twenty-tool server and project descendant receipts.
- Clarified populated-project move verification, restoration versus permanent deletion, and optional remote access in capability metadata.
- Made remote permission labels client-neutral while preserving setting keys and grants.
- Refreshed release and repository descriptions. Mutation behavior is unchanged from 1.0.1.

## 1.0.1

- Project move receipts now include descendant task counts, observed changed/unchanged counts, and up to 20 changed task IDs with field names. Version 1.0.0 returned only the project move receipt.
- Summaries use the existing child verification reads and survive request replay and process restart. They contain no task titles, notes or field values.
- Added coverage for large projects, unchanged array values, empty projects, failed reads, membership changes and delivery through the MCP client.
- Clarified that unchanged exposed child fields do not mean the project move had no inherited effect.

## 1.0.0

- Twenty tools covering native task and project edits, tags, counts, filters, navigation, restoration and container deletion.
- Structured project templates with headings and checklist rows, checklist edits, reminders, Evening scheduling, heading placement and duplication through documented Things URLs. These return an explicit unverified dispatch receipt.
- Shared Keychain storage for the Things URL token. Credentials never enter tool arguments, receipts or telemetry.
- Project revisions include exposed child contents, including logged children. Area deletion previews distinguish contents going to Trash from archived projects staying in Logbook.
- Resumable searches beyond 5,000 objects and bounded processing for slow scans.
- Corrected background launcher updates so the installed runner does not depend on a source checkout.
- Updated installation, permission, capability and verification guides. Native repeat-rule editing, full checklist/heading reads and whole-library maintenance remain unavailable; see the capability reference for the reasons.

## 0.83

Published as package version `0.83.0`.

- Simplified the capability table and explained task Trash permissions in plain language.
- Numbered the installation steps and made support and contribution links easier to scan.
- Highlighted optional support through Buy Me a Coffee.
- Updated runtime and package version metadata. Supported operations and permission defaults are unchanged.

## 0.1.0

First public preview of the Things MCP server for macOS, released under the MIT License.

- Ten tools for health, capabilities, bounded search, item lookup, creation, editing, calendar scheduling, placement, individual to-do Trash, and request receipts.
- A local desktop extension with a host-provided runtime and native permission switches. New installations start read-only; Trash requires a separate grant.
- An optional account-owned private tunnel for browser and desktop plugin access. First-time tunnel setup requires developer tools.
- Shared client permissions, a write lock, revision checks, durable request IDs, and read-back verification. Uncertain operations are not automatically repeated.
- Installation, daily-use, capability, privacy, security, troubleshooting, contribution, and release guides. Optional support through the GitHub Sponsor button and Buy Me a Coffee.

Project Anytime moves and queries are rejected because native destination membership could not be verified. Direct Logbook moves also failed native checks and are excluded. Logbook reads have a longer bounded timeout for large histories. Search pagination accepts every valid offset within its 5,000-object scan limit.

See [Capabilities](docs/CAPABILITIES.md), [Full scope](docs/FULL-SCOPE.md), and [Verification](VERIFICATION.md) for field limits, native coverage, and unimplemented operations. Full checklists, headings, recurrence editing, container deletion, and universal remote-host installation are not included.
