# Security

This feasibility build is intended for the current user's local Mac. Writes are disabled by default. Do not expose its stdio stream through an unauthenticated public relay.

Report suspected vulnerabilities privately to the repository owner. Do not post task contents, secrets, database files, request journals, or personal configuration in an issue. A dedicated public reporting channel must be established before a public release.

The supported boundary is Things' public automation interface. The bridge does not access Things' database or request Things Cloud credentials. Local state and permissions are shared by clients using the same state directory. Malicious software already running as the same macOS user is outside this boundary.

Unknown write outcomes require inspection before further action. Deleting a journal or changing its directory removes retry protection. Do not use a new request ID as an automatic workaround for an unknown or pending request.

The project does not currently implement remote authentication, per-client grants, destructive operations, or a general undo mechanism. These are capability limits, not security promises. Review `things_capabilities` before granting an application access.
