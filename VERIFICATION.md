# Verification record

The 1.0 development work is tracked separately in [the acceptance record](docs/V1-READINESS.md). The following sections preserve the evidence for published releases; they do not certify the development branch.

Version 0.83 (package `0.83.0`) passed typechecking, lint, all 42 synthetic tests, runtime and extension builds, stdio and packaged-extension smoke checks, and extracted-package native health on September 6, 2026. The dependency audit reported zero vulnerabilities. This release changes documentation and version metadata; supported operations and permission defaults are unchanged. Native mutation evidence below comes from the preceding 0.1.0 checks, not a new mutation run.

Version 0.1.0 was checked on September 5 and 6, 2026. That source exposes ten tools. Automatic checks and native checks establish different kinds of evidence; neither proves every Things operation or every client environment works.

## Automated checks

The September 6 run passed typechecking, lint, 42 synthetic tests, and the runtime build. The tests cover independent client grants, read-only enforcement, global and per-client revocation, separate Trash authorization, stale revisions, duplicate requests, uncertain results, crash recovery, shared locks and lost leases, invalid inputs, unsafe state files, subprocess injection and output limits, cancellation, UTF-8, and telemetry filtering.

Regression coverage also checks bounded pagination's last valid offset, mixed project/to-do list entries, rejection of unverified project Anytime and Logbook operations, and the argument-based list helper's empty stdin. Tests use synthetic adapters, virtual scripting objects, or harmless subprocesses. They do not mutate a real Things library.

The standard stdio and packaged-extension smoke procedures verify discovery, capabilities, permission rejection, extraction, manifest validation, checksum, launch from a path containing spaces, and restart. They use the official MCP client and manifest tooling. The September 6 package passed all of these checks and an extracted-package native health call. The dependency audit reported zero vulnerabilities. Run the full commands in [Contributing](CONTRIBUTING.md) to reproduce these checks.

## Native Things checks

Things 3.23.3 passed single-item task creation, Unicode title and notes edits, deadline set/clear, calendar scheduling, completion, cancellation, reopening, Inbox/Today/Anytime/Someday moves, project placement and detachment, individual to-do Trash, project creation, and empty-project completion.

On September 6, Things 3.23.4 on macOS in America/Vancouver passed 41 sequential mutations to four newly created, clearly labeled synthetic objects. Each successful operation had its own request ID, shared write lease, durable receipt, revision check where applicable, and individual read-back before the next mutation. Normal client write grants were revoked during verification and restored afterward. The trusted verification process used the shared state directory. No production permission bypass was added.

| Object or operation | Native verified coverage |
|---|---|
| To-do | Create, rename, multiline Unicode notes, deadline set/clear, schedule, complete, cancel, reopen |
| Empty project | Create, rename, notes, deadline set/clear, schedule, complete, cancel, reopen |
| Area and tag | Create and rename |
| To-do list movement | Inbox, Today, Anytime, Someday |
| Empty-project list movement | Today, Someday |
| Parent movement | To-do into/out of a project; to-do and empty project into/out of an area |
| Trash | Individual synthetic to-do moved to recoverable Trash |
| Retrieval | Exact IDs, synthetic text queries, project/area contents, unscoped Trash exclusion and explicit Trash query |

The final to-do is in Trash, the empty project is completed, and the empty synthetic area and tag remain available for manual removal. Their IDs and local records are excluded from source control. No permanent or container deletion was used.

## Failures found and release boundaries

A project-to-Anytime command did not pass destination verification. The public Anytime collection did not return the project, and the installed scripting dictionary does not expose a project collection on built-in lists. Project Anytime moves and queries now reject before a mutation or misleading empty result. This is a server verification limitation, not a claim that the Things UI lacks Anytime projects.

Direct Logbook moves did not complete the required verified receipt flow. Read-back was inspected after each uncertain outcome; the request was not replayed. Direct Logbook moves are excluded from the release. Task completion/cancellation remains available. A large Logbook required a longer read allowance, now bounded at 60 seconds. Other native calls retain a 20-second limit. No claim is made that every library fits these bounds.

The pagination schema previously rejected some valid final-page offsets below the 5,000-object cap. The accepted range now includes them. List commands pass their arguments through argv and no longer receive an unused JSON stdin payload.

## Client and package checks

The local native extension installed through its host's extension installer. The host discovered all ten tools and displayed four permission switches. Actual client health calls succeeded. Browser Chat created and completed one labeled task with separate reads confirming both results on September 5.

The account connector refreshed to ten tools. A new ordinary browser conversation called health and capabilities, then invoked move with a nonexistent target and Trash with permission disabled. Both were rejected without a mutation record. The desktop plugin also completed health and capability calls through the same account connection. The installed connection passed a new health call on September 6 and reported Things 3.23.4.

The optional transport passed stop, reinstall, readiness, and reconnect checks. macOS registered its background executable as Things MCP. The launcher retrieves the restricted runtime credential from Keychain and does not pass it into the child server. Package validation and extracted-package checks are distinct from a fresh Mac's consent flow.

## Not verified

- Fresh-Mac installation and Automation consent, including different host-bundled runtime versions.
- Sleep/wake, logout/login, account disconnect/reconnect after writes are enabled, and every uninstall/upgrade combination.
- Populated-project completion and movement effects on descendants, hidden checklists, repeating templates, and dates across every timezone or DST transition.
- Every MCP host, workspace policy, account tier, macOS version, or Things version.
- A command-free first-time browser installer. Initial tunnel installation still requires developer tools.

No unsupported capability is advertised as tested. See [Capabilities](docs/CAPABILITIES.md) for exact inputs and [Full scope](docs/FULL-SCOPE.md) for omitted operations and their reasons.
