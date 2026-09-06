# Version 1.0 acceptance record

Version 1.0 is in development. The published version remains 0.83. No unchecked operation below is advertised as verified.

## Scope

Use supported Things AppleScript and documented Things URLs. No Apple Shortcuts, private interfaces, direct database access, replacement repeat scheduler, companion app, or custom setup window. Every mutation retains shared permission checks, locking, request receipts, and verification. A vendor interface that cannot report the relevant result is a verification limit, not proof of success.

## Implementation and verification gates

- [x] Tag assignment, removal, replacement, clearing, hierarchy, and keyboard shortcuts.
- [ ] Creation with initial placement, tags, status, deadline, and supported dates.
- [x] Append/prepend title and notes, area collapsed state, and public timestamp fields.
- [x] Search by tags and dates, selected items, counts/existence, and resumable traversal beyond 5,000 objects.
- [ ] Project Anytime and direct Logbook movement investigation against the current public commands.
- [ ] Populated-project completion, cancellation, reopening, movement, and descendant verification.
- [ ] Duplication, Trash restoration, and supported navigation.
- [ ] Project/area/tag deletion and global Trash/logging actions with distinct owner grants, complete scope previews, stale-scope rejection, and explicitly authorized synthetic-fixture verification. Whole-library commands still require an empty test library.
- [ ] Supported URL scheduling, reminders, checklist and structured-project operations audited for secure authorization and observable results. Report read-back limits explicitly.
- [ ] Native extension installation and update on a clean Mac account.
- [ ] Browser transport installation, update, credential revocation, restart, sleep/wake, logout/login, and uninstall.
- [ ] Permission and uncertain-write checks across concurrent clients and interrupted connections.
- [ ] Timezone and DST checks.
- [ ] Documentation, package contents, dependency audit, security scanning, and public download verification for the exact release candidate.

## Environment requirements

Single-item, reversible checks may use clearly labeled synthetic fixtures in the owner's library under the existing authorization. Targeted destructive checks use explicitly authorized labeled synthetic fixtures in a nonempty library. These checks must exclude every unrelated item. Global Empty Trash and Log Completed cannot be isolated this way and are not exercised against unrelated contents. A new temporary server state directory does not create a separate Things library. Real fresh-account consent, logout/login, and sleep/wake checks require the corresponding Mac environment and user coordination; process restart tests are not substitutes.

## Baseline

The unmodified 0.83 source passed typecheck, lint, all 42 tests, runtime build, and stdio smoke on September 6, 2026. Historical native evidence remains in VERIFICATION.md.

## September 6 development evidence

- Native Things 3.23.4 checks passed tag replacement/add/remove/clear, parent-tag changes and detachment, keyboard shortcut set/clear, area collapse/expand, text increments and public timestamps.
- Creation passed with project/area placement, tags, deadline and scheduled date. A create with every possible initial status/timestamp combination is not claimed.
- Populated-project completion, cancellation and reopening passed with one initially closed child and one open child. Open children close with their parent; reopening the parent leaves them closed. Calendar scheduling and a deletion preview including the two children passed. Moving both an open populated project and a completed populated project to an area passed with descendant preservation.
- An open project's regular child collection can omit logged children. The adapter now includes the supported Logbook property-filter query; synthetic regression checks cover collection changes and duplicate membership.
- Show/edit navigation, selected-item reads, existence, counts, sorting, deadline and tag filters passed native checks. Quick Entry opened in the native UI and was dismissed without saving. It can display a retained draft; an empty form is not promised.
- One open to-do passed Trash and restoration to Inbox through the public move command, followed by a second cycle through the new restore service. The completed-task Trash check returned -1728 through both public reference forms tested. Read-only inspection confirmed the fixture remained completed and outside Trash; no successful deletion is claimed. Closed-task deletion is now rejected before writing. Open-project restoration to Today passed with both completed children recovered unchanged. Closed-item restoration remains under investigation.
- The automatic suite passed 67 tests, typecheck, lint and runtime build. Calendar-date conversion checks also passed in America/Vancouver, Europe/Berlin and Pacific/Auckland subprocesses across leap-day and DST boundary dates. These are adapter tests, not live writes in every timezone.
- Runtime/extension builds, stdio discovery, sixteen-tool extracted-package discovery, write rejection, restart and native health passed. The dependency audit reported zero vulnerabilities. The current source tree and reachable history passed redacted secret scans. Required client compatibility/configuration names remain; no provenance signatures were found in the source/comment/documentation scan.

The full service passed open-project deletion and restoration, including explicit checks for retained tags and public timestamps, after correcting inherited Trash membership. Trashed project enumeration is explicitly unavailable instead of reporting zero children. URL write verification design, client upgrade checks and final release packaging remain open. The published version is unchanged.

Tag-hierarchy deletion passed against two labeled tags and their assignments on a labeled area, project and completed child task. The preview included all five objects. The tags disappeared and assignments were cleared while the other exposed content, dates and status remained unchanged. No unrelated object was in the scope.

Completed-project Logbook queries now use typed ID lookup instead of the active project ID list. A labeled completed project was found through the corrected native query. Slow scans yield continuations after a bounded processing interval; this bounds per-item work without misreporting a partial count as a full count.

The native duplicate command returned -1717 on an open fixture. Inspection found its original unchanged and no additional matching active item. The unused prototype was removed. URL duplication remains a separate supported route requiring implementation.

Area deletion passed against an area containing an open project with two completed children and a completed project with one completed child. The preview distinguished Trash movement from retained Logbook contents. All six exposed objects matched their predicted effects. The open project and both children then restored with exposed content, tags and timestamps unchanged. Closed project child reads use their retained child collection without an unnecessary Logbook scan.

Current public-command rechecks retained the movement gates. Direct Logbook movement failed and left the labeled to-do unchanged. Project Anytime movement cleared the scheduled date, but the native list collection did not expose the project as a member. The project was returned to Today and both child revisions matched. Neither failed verification was retried under its original request ID.
