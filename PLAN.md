# Product roadmap

Things MCP connects compatible clients to Things 3 using supported automation. The core runs on the user's Mac, works without a project-operated service, and keeps remote providers replaceable.

## Version 0.1

The current implementation provides eight tools for health, capability discovery, bounded search, ID lookup, durable mutation receipts, creation, editing, and scheduling. It includes a native MCPB extension, separate local and remote grants, and an optional private tunnel. Read access and ordinary to-do mutations have been checked against Things 3.23.3. See [Capabilities](docs/CAPABILITIES.md) and [Verification](VERIFICATION.md) for the exact boundary.

The local extension can be installed through the host's existing UI. Initial browser setup remains an advanced operator workflow. The first public release must explain that distinction and make supported task workflows usable without promising unimplemented features.

## Further coverage

Work in this order, verifying the supported public interface and read-back behavior before adding each tool:

1. Verify existing project, area, and tag mutation paths with isolated fixtures.
2. Add supported moves, tag assignment, duplication, and history/navigation operations with type-specific tests.
3. Establish lossless heading and checklist read/write round trips through supported Things Shortcuts actions before enabling mutation tools.
4. Add reminders, Evening, and schedule clearing only when their supported interfaces and calendar semantics are verified.
5. Add destructive operations only with previewed scope, trusted approval, cascade checks, and tests in a disposable library.
6. Broaden the remote setup experience without a companion app, hand-edited configuration, or project-owned account requirement.

Supported repeat-rule editing and arbitrary ordering have not been established. Private experimental commands and delete-and-recreate approximations are excluded. A supported dictionary entry is a lead for verification, not proof that an operation is safe or complete.

## Invariants

Every mutation uses stable IDs and an explicit request ID. Edits require the latest revision. All connections to one library share locking and durable receipts. The service checks permission and input, applies one supported action, reads back, and reports a verified result or uncertainty. Unknown writes must not be retried blindly. Public automation does not provide transactions or an absolute exactly-once guarantee.

Task content is untrusted data. It cannot grant permissions or become executable source. Search and returned fields remain bounded. Credentials belong in platform storage; logs and telemetry must omit task content and secrets. A local process already running as the same macOS user is part of the trusted boundary.

## Release gates

Document the actual capabilities and installation routes. Include a chosen license, required notices, self-contained contributor instructions, synthetic tests, and a private security-reporting route. Scan reachable history and artifacts for credentials, personal data, and attribution signatures. Verify the installable package and a real client workflow. Public visibility and release publication require an explicit maintainer decision.

Historical architecture discussions remain in the read-only `almanac/` tree. Current code and verification determine release behavior.
