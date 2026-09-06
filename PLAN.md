# Product roadmap

Things MCP is publicly released under MIT. Version 1.0.1 added descendant summaries to project moves; the current release and exact supported actions are recorded in [Capabilities](docs/CAPABILITIES.md) and [Verification](VERIFICATION.md).

## Delivered scope

The server provides twenty tools for native reads and edits, supported moves, project descendant observations, tag management, navigation, restoration, scoped container deletion and typed URL operations. URL-only fields report dispatch rather than complete read-back. Local installation uses the client's native extension installer; optional browser access uses an account-owned private tunnel.

There is no companion app, Apple Shortcuts dependency, direct Things Cloud account API or project-operated relay. The installed Things app owns synchronization. Native repeat-rule editing remains excluded without a substitute scheduler or handoff feature.

## Remaining boundaries

[The scope inventory](docs/FULL-SCOPE.md) separates missing public mechanisms from commands that failed verification. Whole-library maintenance remains disabled; targeted fixtures cannot establish its safety in a nonempty library. Fresh-account consent, physical sleep/wake, actual logout/login and every client/runtime version are not certified. Initial browser provisioning still requires developer commands.

Future work should address supported interfaces and evidence-backed installation improvements. A public dictionary entry is a lead for testing, not proof of a working operation. Private commands, arbitrary ordering approximations and delete-and-recreate substitutes remain excluded.

## Invariants

All clients for one library share permission state, locking and durable request IDs. Native edits require current revisions and read-back; URL-only operations retain explicit dispatch receipts. Unknown mutations must never be retried automatically. Public automation provides neither transactions nor general undo.

Task content stays data, credentials stay local and diagnostics omit private content. New installations start read-only. Public releases require explicit maintainer authorization, verified source and assets, security scans, accurate documentation and required notices. The maintained [wiki](almanac/README.md) records architecture and operating procedures; current code remains authoritative.
