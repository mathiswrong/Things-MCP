# Privacy

Things MCP runs on your Mac. The project operates no account service, relay, analytics service, or telemetry destination. It does not read the Things database, collect Things Cloud credentials, or upload your whole library as a database file.

## Task content

A read sends the requested task fields to the connected client. That client and its provider process the results under their own policies and account settings. Search omits notes from results by default, but can match note text; an item lookup returns notes. Repeated searches can retrieve a substantial portion of your library. There are no project or area access allowlists in this version.

Treat task titles and notes as untrusted content. They may contain instructions written by someone else. The tools accept bounded task operations and expose no shell, arbitrary script, or database command.

## Local records

Settings and request receipts live in `~/Library/Application Support/Things MCP`, with owner-only permissions. Receipts contain request IDs, target IDs, changed field names, and verification state. The journal also stores a hash of the operation input. It does not store task titles or notes. IDs and hashes are still private metadata; do not post these files publicly.

Receipts remain until removed by the owner. The server stops accepting new writes when the journal reaches 10,000 request files. Do not clear it while a client might retry an earlier request: deleting records removes duplicate-write protection. There is no automatic archival or journal migration tool in this release.

An optional diagnostic destination can be supplied by a developer. Its filter permits only short operation error codes and removes task content, paths, requests, user fields, exception details, and breadcrumbs. No destination is included in the distributed package.

## Things URL token

Optional URL editing and duplication use the local token in the login Keychain, separate from the tunnel credential. It is never accepted as a tool input or stored in the journal. URL dispatch receipts contain no checklist text, template contents or credential. The native helper sends the typed URL only to Things on this Mac.

## Remote connection

The optional provider tunnel carries tool traffic to your Mac through your own account. Its runtime credential stays in the login Keychain and is passed only to the official transport process. The MCP child does not receive it. The tunnel provider and authorized workspace administrators are part of this trust boundary.

The local extension and tunnel have separate write and Trash grants. Read-only access still permits reading your library. Disable or disconnect a client to stop its reads. Turning off writes does not stop reads or undo an operation already delivered to Things.

## Removal and reports

Follow [installation removal](../packaging/INSTALL.md#updates-and-removal) and [tunnel retirement](CHATGPT.md#diagnose-update-and-disconnect). Uninstalling the local extension does not stop a separately installed tunnel. Removing the bridge does not delete Things tasks.

Use synthetic examples in [public bug reports](https://github.com/mathiswrong/Things-MCP/issues/new/choose). Send vulnerabilities through [private reporting](https://github.com/mathiswrong/Things-MCP/security/advisories/new). Never attach personal task exports, raw logs, keys, or local state files.
