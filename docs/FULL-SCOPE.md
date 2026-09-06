# Complete operation scope

Version 0.83 uses supported Things interfaces and documents its remaining installation and feature limits. Apple Shortcuts dependencies and replacement workflows are excluded. Features with no supported mechanism are omitted. This inventory separates missing implementation from missing vendor interfaces. Current runtime support is listed in [Capabilities](CAPABILITIES.md).

Things does not offer a public cloud account API. The existing server talks to the local Mac app through its supported AppleScript interface. Things itself handles cloud synchronization. A direct cloud connection would require an unofficial protocol and is outside the supported-interface boundary.

## Requested additions

| Operation | Supported route and remaining work |
|---|---|
| Read and edit checklists | Full checklist access is excluded under the no-Shortcuts constraint. The URL scheme can create, replace, append and prepend checklist text, but provides no checklist query. Do not claim checked-row editing or verified lossless round trips. URL write-only support remains a separate possible addition requiring secure token handling and an honest unverified outcome. |
| Move items | Implemented: AppleScript supports moving to-dos into projects/areas, projects into areas, detaching parents, and moving to built-in lists. The URL scheme can place to-dos under headings, but heading queries are unavailable without Shortcuts. Verify destination and preserve unrelated properties. |
| Delete items | Individual to-do Trash is implemented with a separate grant. Project deletion, which cascades to its children, is not implemented. Immediate per-item deletion through Shortcuts is excluded. Area deletion permanently removes the area and trashes its children. Tag deletion removes a shared library object. These require distinct permissions, exact scope previews, stale-preview rejection, and cascade verification. |
| Native recurrence | Excluded. No repeat-rule creation/editing action is present in the documented public interfaces reviewed on September 6, 2026. Do not use private APIs, database changes, simulated copies, a manual handoff feature, or a separate scheduler to claim support. |

## Every other known gap

| Family | Operations still requiring implementation or verification |
|---|---|
| Retrieval | Built-in lists and project/area contents are implemented. Remaining: heading contents; tag, date, start-state and logged-state filters; counts; existence; selected items; sorting; full-library traversal beyond the 5,000-object search cap. |
| To-dos | Duplication; creation with initial placement, tags, checklist, status and dates in one request; append/prepend title or notes. |
| Projects | Creation, title/notes/status/deadline edits, scheduling, and area placement of an empty project are verified. Remaining: populated-project cascade accounting; verified Anytime placement; duplication including headings and children; structured project templates. Completing or canceling a project needs explicit cascade accounting too. |
| Areas | Creation and rename verified. Remaining: tags; collapsed state; deletion semantics. Area duplication is not exposed by Things Shortcuts. |
| Headings | Read/find/create/rename; completion/cancellation; duplication; deletion with child scope. Movement between projects needs a separately verified route. |
| Scheduling | Today, Anytime and Someday are supported through moves. Remaining: This Evening, explicit start-date clearing, reminders and clearing reminders; creation, modification, completion and cancellation timestamps where publicly writable. |
| Tags | Creation and rename verified. Remaining: assignment add/remove/replace/clear; direct versus inherited tags; hierarchy changes; keyboard shortcuts; deletion and hierarchy effects. |
| History | Logbook queries are implemented. Direct Logbook moves failed native verification and are rejected. Completion and cancellation work; Things controls logging according to its settings. Global log-completed must disclose its whole-library effect. |
| Recovery | Trash queries and individual to-do Trash are implemented. Remaining: explicit restore behavior; permanent delete; whole-library empty Trash; field restoration. There is no established general-purpose undo API. |
| Ordering | Read order where the public collection preserves it; checklists need round-trip verification. Arbitrary task/sidebar reordering has no established supported public route; private experimental reorder commands are excluded. |
| Conversions | To-do to project, project to to-do, checklist row to to-do. No supported lossless automation route established; delete/recreate is not equivalent. |
| Navigation | Reveal an item or list, in-app search, Quick Entry, and opening an item for editing. Navigation on the Mac does not display the item on a remote device. |
| Bulk and templates | Bounded multi-item previews, per-item outcomes, interrupted-operation reconciliation, and nested project creation. No promise of transactions or atomic rollback. |
| Application controls | Window state, close, print, and quit where in the public dictionary. These are outside task management and remain separately opt-in scope. |
| Legacy interfaces | Contacts/assignment and Quicksilver parsing appear in the dictionary but need current support verification. They do not establish collaborative task sharing. |
| Settings and sync | App settings, accounts, Things Cloud, sync controls, and attachments have no established supported automation route. Never collect Things Cloud credentials. |

## Connection and safety gaps

The core and native extension work locally. The optional private tunnel works for ordinary browser Chat and the desktop plugin, but its initial installation requires an operator. A command-free browser installation on a new Mac is not delivered in version 0.83. General compatible remote clients need a supported transport and authentication route, not a promise that all clients accept the same installer.

Separate individual to-do Trash permission is implemented. Bulk and container/permanent-deletion permissions, optional project/area allowlists, descendant-aware scope enforcement, and trusted approval for destructive previews remain implementation work. A model-supplied confirmation flag is not a trusted permission grant. Read and ordinary write permission must be independently revocable for each connection.

## Funding

`.github/FUNDING.yml` already uses GitHub's built-in `buy_me_a_coffee` provider. This adds the Buy Me a Coffee destination to the repository Sponsor button once the file is on the default branch and sponsorship display is enabled. The README link remains a convenient second entry point.

GitHub Sponsors is a separate service with GitHub-hosted sponsorship tiers and one-time or monthly payments. It requires enrollment and payout setup. Both destinations can coexist in the Sponsor button. Do not add an unconfigured GitHub Sponsors profile or enroll the maintainer without authorization.

## Source references

- [Things API availability](https://culturedcode.com/things/support/articles/2967034/)
- [Things AppleScript commands](https://culturedcode.com/things/support/articles/4562654/)
- [Things Shortcuts actions](https://culturedcode.com/things/support/articles/9596775/)
- [Things URL scheme](https://culturedcode.com/things/support/articles/2803573/)
- [GitHub Sponsor button configuration](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/displaying-a-sponsor-button-in-your-repository)
- [GitHub Sponsors for contributors](https://docs.github.com/en/sponsors/receiving-sponsorships-through-github-sponsors/about-github-sponsors-for-open-source-contributors)
