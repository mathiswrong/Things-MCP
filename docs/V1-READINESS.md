# Version 1.0 acceptance record

This record distinguishes automatic checks, native fixture checks and environment limits. The release contains twenty tools. A URL dispatch receipt never certifies the result of a Things edit.

## Scope and acceptance

- Supported Things AppleScript and documented Things URLs only. No private interfaces, database writes, replacement repeat scheduler, Apple Shortcuts or companion app.
- Shared permission checks, locking, request receipts and stale-revision rejection apply across clients. Native edits verify exposed results. URL-only fields produce an explicit unverified dispatch receipt.
- Native operations and targeted container deletion were exercised on labeled fixtures. Closed-item Trash/restoration, direct Logbook movement, project Anytime membership and global maintenance remain gated where verification did not pass.
- Automated calendar conversion checks cover leap days and DST boundaries in three timezones. They do not certify live writes in every timezone.
- First-time macOS consent, physical sleep/wake, logout/login and a fresh-account installation remain unverified. Existing-account installation and process restart are separate evidence.

## Safe live testing

Targeted checks used explicitly authorized labeled fixtures in a nonempty library, one operation at a time with read-back or UI inspection before continuing. No unrelated item belonged to a deletion preview. Global Empty Trash and Log Completed were not exercised against the owner's contents and remain disabled. A temporary server state directory is not a separate Things library.

## Native acceptance evidence

- Native Things 3.23.4 checks passed tag replacement/add/remove/clear, parent-tag changes and detachment, keyboard shortcut set/clear, area collapse/expand, text increments and public timestamps.
- Creation passed with project/area placement, tags, deadline and scheduled date. A create with every possible initial status/timestamp combination is not claimed.
- Populated-project completion, cancellation and reopening passed with one initially closed child and one open child. Open children close with their parent; reopening the parent leaves them closed. Calendar scheduling and a deletion preview including the two children passed. Moving both an open populated project and a completed populated project to an area passed with descendant preservation.
- An open project's regular child collection can omit logged children. The adapter now includes the supported Logbook property-filter query; synthetic regression checks cover collection changes and duplicate membership.
- Show/edit navigation, selected-item reads, existence, counts, sorting, deadline and tag filters passed native checks. Quick Entry opened in the native UI and was dismissed without saving. It can display a retained draft; an empty form is not promised.
- One open to-do passed Trash and restoration to Inbox through the public move command, followed by a second cycle through the new restore service. The completed-task Trash check returned -1728 through both public reference forms tested. Read-only inspection confirmed the fixture remained completed and outside Trash; no successful deletion is claimed. Closed-task deletion is now rejected before writing. Open-project restoration to Today passed with both completed children recovered unchanged. Closed-item restoration remains under investigation.
- The automatic suite passed 67 tests, typecheck, lint and runtime build. Calendar-date conversion checks also passed in America/Vancouver, Europe/Berlin and Pacific/Auckland subprocesses across leap-day and DST boundary dates. These are adapter tests, not live writes in every timezone.
- Runtime/extension builds, stdio discovery, sixteen-tool extracted-package discovery, write rejection, restart and native health passed. The dependency audit reported zero vulnerabilities. The current source tree and reachable history passed redacted secret scans. Required client compatibility/configuration names remain; no provenance signatures were found in the source/comment/documentation scan.

The full service passed open-project deletion and restoration, including explicit checks for retained tags and public timestamps, after correcting inherited Trash membership. Trashed project enumeration is explicitly unavailable instead of reporting zero children. URL dispatch and client upgrade evidence is recorded separately below.

Tag-hierarchy deletion passed against two labeled tags and their assignments on a labeled area, project and completed child task. The preview included all five objects. The tags disappeared and assignments were cleared while the other exposed content, dates and status remained unchanged. No unrelated object was in the scope.

Completed-project Logbook queries now use typed ID lookup instead of the active project ID list. A labeled completed project was found through the corrected native query. Slow scans yield continuations after a bounded processing interval; this bounds per-item work without misreporting a partial count as a full count.

The native duplicate command returned -1717 on an open fixture. Inspection found its original unchanged and no additional matching active item. The unused prototype was removed. The documented URL route was subsequently implemented and verified below.

Area deletion passed against an area containing an open project with two completed children and a completed project with one completed child. The preview distinguished Trash movement from retained Logbook contents. All six exposed objects matched their predicted effects. The open project and both children then restored with exposed content, tags and timestamps unchanged. Closed project child reads use their retained child collection without an unnecessary Logbook scan.

Current public-command rechecks retained the movement gates. Direct Logbook movement failed and left the labeled to-do unchanged. Project Anytime movement cleared the scheduled date, but the native list collection did not expose the project as a member. The project was returned to Today and both child revisions matched. Neither failed verification was retried under its original request ID.


## URL acceptance evidence

On Things 3.23.4, a labeled project template created two headings and a child with open and completed checklist rows and a scheduled 09:30 reminder. The task and date were read through native automation; the headings, rows and reminder were inspected in Things.

Sequential URL checks passed checklist append, prepend, replacement with completed/open states, clearing, Evening with a 20:30 reminder, clearing When, and moving the child to the other heading. To-do duplication produced one new matching task. Project duplication preserved both headings and two child tasks, checked through the UI and exposed child collection. Search navigation opened the expected fixture search.

The documented JSON append form was rejected by Things on this version. Inspection confirmed unchanged rows. The implementation now uses the documented plain update URL for append/prepend; replacement remains structured JSON. The rejected request was not replayed. Each corrected check used a new explicit action after inspection.

These observations establish native behavior on this Mac. The API still cannot provide full checklist, heading or reminder read-back to callers. Receipts therefore retain `url_dispatched`, even for operations observed to work during release testing. Stable-ID editing of individual existing rows, in-place heading editing and native repeat-rule editing are not provided.

## Package and client acceptance

The release suite passed 75 tests, typecheck, lint, build, stdio smoke, extracted-package discovery/rejection/restart and dependency audit. No dependency vulnerabilities were reported. Redacted secret scans passed for source, reachable history and the extracted archive.

The native extension installer upgraded the existing account to 1.0.0 and displayed twenty tools and six permission switches. The tunnel update passed healthy/ready status and an actual browser create/read/edit/read sequence. Work and the installed desktop plugin passed health calls. A stale desktop chat catalogue required an extension restart and a new conversation; verification details are maintained in [Verification](../VERIFICATION.md).
