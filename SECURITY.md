# Security

Things MCP is intended for the current user's local Mac. Writes are disabled by default. Do not expose its stdio stream through an unauthenticated public relay.

Report suspected vulnerabilities through [Security > Report a vulnerability](https://github.com/mathiswrong/Things-MCP/security/advisories/new). Reports go privately to the maintainer. If that route is unavailable, do not post exploit details in a public issue. Open a nonsensitive issue asking the maintainer to restore private reporting.

Include affected versions and synthetic reproduction steps. Do not send task contents, credentials, database files, request journals, or personal configuration. There is no guaranteed response time or paid support service. Only the latest released version receives security fixes.

The supported boundary is Things' public automation interface. The bridge does not access Things' database or request Things Cloud credentials. Local state and permissions are shared by clients using the same state directory. Malicious software already running as the same macOS user is outside this boundary.

Unknown write outcomes require inspection before further action. Deleting a journal or changing its directory removes retry protection. Do not use a new request ID as an automatic workaround for an unknown or pending request.

Native extension settings grant local and browser writes separately. Every mutation rechecks its grant. Global revocation disables all grants and survives restarting an unchanged client configuration. A new grant requires switching that client's control off and saving, then on and saving. MCP tools cannot grant access.

The optional browser connection uses the provider's secure tunnel, workspace association, and a runtime credential restricted to tunnel Read and Use permissions. The credential stays in the macOS login Keychain. The background launcher supplies it only to the provider transport and removes it from the child MCP environment. No public listening port is opened. Disconnect the plugin to revoke account access; stop the background service and revoke its provider key to retire the transport. Same-user processes and workspace administrators are trusted boundaries.

Individual to-do Trash requires its separate grant. Container deletion has another independent grant and requires a current scope preview. Open-item restoration is available. Global Empty Trash and Log Completed are disabled. Project revisions cover exposed child snapshots; hidden checklist, heading and reminder fields remain outside that check. Native project status and container effects passed labeled-fixture checks.

URL edits use a separate Things authentication token stored in the login Keychain as `Things MCP URLs`, account `default`. The adapter reads it only when needed and passes it to the fixed native helper through stdin, never shell arguments, tool fields, logs or receipts. Only typed documented commands are accepted; callers cannot select a URL, callback or script. Creating templates requires no Things token but still requires ordinary write permission.

URL receipts report `url_dispatched`, not verified success. The journal records `dispatched` separately from `completed`, and duplicate delivery does not send the URL again. URL processing is asynchronous and cannot lock Things' UI or sync. Checklist replacement affects every row; inspect the result in Things before proceeding. Read `things_capabilities` before granting access.

Read access covers the library; project and area allowlists are not implemented. A read-only grant limits mutations, not data disclosure. Disconnect a client to revoke reading. See [Privacy](docs/PRIVACY.md) for local metadata, retention, and provider boundaries.
