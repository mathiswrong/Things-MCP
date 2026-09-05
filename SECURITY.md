# Security

Things MCP is intended for the current user's local Mac. Writes are disabled by default. Do not expose its stdio stream through an unauthenticated public relay.

Report suspected vulnerabilities through the repository's **Security > Report a vulnerability** control when private reporting is available. The direct report page is https://github.com/mathiswrong/Things-MCP/security/advisories/new. Before publication, the maintainer must enable and verify that route. If it is unavailable, contact the maintainer through their GitHub profile to arrange a private channel; do not post exploit details in a public issue.

Include affected versions and synthetic reproduction steps. Do not send task contents, credentials, database files, request journals, or personal configuration. There is no guaranteed response time or paid support service. Only the latest released version receives security fixes.

The supported boundary is Things' public automation interface. The bridge does not access Things' database or request Things Cloud credentials. Local state and permissions are shared by clients using the same state directory. Malicious software already running as the same macOS user is outside this boundary.

Unknown write outcomes require inspection before further action. Deleting a journal or changing its directory removes retry protection. Do not use a new request ID as an automatic workaround for an unknown or pending request.

Native extension settings grant local and browser writes separately. Every mutation rechecks its grant. Global revocation disables all grants and survives restarting an unchanged client configuration. A new grant requires switching that client's control off and saving, then on and saving. MCP tools cannot grant access.

The optional browser connection uses the provider's secure tunnel, workspace association, and a runtime credential restricted to tunnel Read and Use permissions. The credential stays in the macOS login Keychain. The background launcher supplies it only to the provider transport and removes it from the child MCP environment. No public listening port is opened. Disconnect the plugin to revoke account access; stop the background service and revoke its provider key to retire the transport. Same-user processes and workspace administrators are trusted boundaries.

Destructive operations and a general undo mechanism are unavailable. Review `things_capabilities` before granting an application access.
