Things MCP implementation plan: 5 September 2026

Build one Mac service that exposes Things 3 through standard MCP tools. Claude, ChatGPT, and other compatible clients use the same operations and permissions. The agreed direction is personal use first, then a possible free, open-source release. Design for that future from the first commit while keeping the repository private until explicitly authorized otherwise. The long-term design below is only partly implemented; current status follows.

Setup revision: the owner rejected manual configuration, Terminal instructions, and a companion app. Installation and settings must use supported client interfaces, as specified in [SETUP-PLAN.md](SETUP-PLAN.md). Both ChatGPT desktop and ordinary browser access are required from the start. The custom-window proposal is withdrawn and no artboard approval is pending. Packaging and simple browser setup remain unfinished.

The initial local stdio foundation now includes eight tools, a supported AppleScript adapter, strict schemas, default read-only permission, revision checks, read-back verification, a shared filesystem lease, durable request receipts, and scrubbed optional Sentry reporting. Synthetic tests cover ordinary mutation behavior and failure handling. Real read-only health, search, and ID lookup were verified against Things 3.23.3 through the bundled executable and official MCP client. Ten sequential native writes on one synthetic to-do were then verified in the owner's library with explicit authorization. Creation, title and notes editing, deadline set/clear, scheduling, completion, reopening, and cancellation passed through the service with read-back verification. The fixture was left completed. Existing user items were not edited. Client write permission remains disabled. Project, area, and tag mutations and actual use in assistant applications remain unverified. See VERIFICATION.md.

For the first CLI release, one stdio process runs per client. A maintained filesystem-lock library and shared state directory coordinate all mutations. Ownership checks and cancellation protect against continuing after a lost lease. This replaces the initially proposed background daemon for the feasibility milestone and avoids adding a service lifecycle before it is needed. All clients must use the same state directory. Background lifecycle, per-client grants, Shortcuts bridge, and remote connectivity remain later work. Settings belong in supported client interfaces; there is no companion app.

The feasibility milestone is not complete until the remaining item-type mutations, heading/checklist round trips, and actual use in both initial assistant clients are demonstrated. The owner explicitly authorized small sequential writes in the real library for this session instead of an isolated test library. Refer to README.md and the runtime capability registry for current behavior.

The governing project rules are in `AGENTS.md`, with the shared coding and design rulebooks in the parent Projects directory. No assistant or model attribution belongs in commits, PR text, source comments, or docstrings, even during private development. Branch names must be neutral. Functional integration references in compatibility documentation and required configuration describe supported clients only.

At planning kickoff the project directory was empty. Things 3.23.3 is installed, and its public scripting dictionary was inspected at `/Applications/Things3.app/Contents/Resources/Things.sdef`. The private repository and initial Almanac have since been initialized. Initial live checks were read-only; subsequent authorized mutation checks are recorded above. Reports omit personal task contents.

The achievable promise is **every verified operation exposed by Things’ supported automation interfaces**, with an explicit accounting of remaining app features. Universal control of every UI feature cannot responsibly be promised. Cultured Code identifies AppleScript, Shortcuts, the Things URL scheme, and Mail to Things as supported integration routes, and warns against direct database writes and sharing Things Cloud credentials. Use the first three; email adds no necessary capability here. [Things integration guidance](https://culturedcode.com/things/support/articles/5510170/)

1. **Connect the clients through one Mac service.**

   Use a small local service, started at login as the current macOS user, plus a thin command that exposes its tools over stdio. All clients share one mutation queue, permission policy, and retry journal. Protect the local service with a user-owned Unix socket and restrictive directory/socket permissions. Do not run as root.

   ```mermaid
   flowchart LR
     C[Claude Desktop / other local MCP clients] --> S[stdio adapter]
     G[ChatGPT] --> T[Secure MCP Tunnel]
     R[Claude web / other remote MCP clients] --> H[HTTPS + OAuth]
     S --> M[Mac service: permissions, validation, execution]
     T --> S
     H --> M
     M --> A[AppleScript]
     M --> B[Bundled Shortcuts]
     M --> U[Things URL commands]
     A --> X[Things 3]
     B --> X
     U --> X
   ```

   | Client | Planned connection | Qualification |
   |---|---|---|
   | Claude Desktop | Local stdio; package as a desktop extension | First local acceptance target |
   | ChatGPT | Secure MCP Tunnel to the local stdio adapter, or authenticated public HTTPS | Verify developer-mode access and actual read/write behavior on the user's account |
   | Claude web/mobile | Public HTTPS with OAuth | The remote connector originates from Anthropic's infrastructure |
   | Other MCP hosts | stdio or Streamable HTTP | Test each host; protocol support does not guarantee every tool or UI feature |
   | Models used through an API | An MCP-capable application/agent | A model alone does not connect to the Mac |

   Claude supports local desktop extensions and remote connectors. Its cloud connector path requires an internet-reachable server. [Claude desktop extensions](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop), [Claude remote connectivity](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp)

   OpenAI documents both public HTTPS and Secure MCP Tunnel for testing MCP connections in ChatGPT. Prefer the tunnel for a personal ChatGPT installation; account and workspace policies still apply. This OpenAI-specific connection is optional, so other clients remain independent of it. [ChatGPT connection guide](https://developers.openai.com/plugins/deploy/connect-chatgpt)

   Tunnel setup involves an OpenAI-hosted endpoint and a local `tunnel-client` that forwards requests to the private server. Verify tunnel provisioning, credentials, revocation, and account availability in the first milestone. [Secure MCP Tunnel](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels)

   For cross-provider remote access, use a maintained HTTPS tunnel/reverse proxy and established OAuth implementation. Forward only the MCP route and necessary authorization metadata; keep local administration private. No router port forwarding, custom relay protocol, or publicly accessible unauthenticated MCP endpoint. Provider selection remains an implementation decision after a connection proof.

   The Mac must be awake, online for remote use, and running a usable signed-in macOS session. Test screen lock, sleep/wake, and restart explicitly. Return `HOST_UNAVAILABLE` when unavailable; do not silently queue writes to run hours later. A dedicated always-on Mac is an optional deployment choice. This design does not turn an iPhone into an always-on MCP host.

2. **Implement a small core with replaceable Things adapters.**

   Use TypeScript and the official MCP SDK, with a pinned supported Node runtime. Use runtime schema validation, one test framework, and a lockfile. Do not embed an LLM, require model API keys for the core server, or build a second task-management database. The MCP project maintains official SDKs; choose and pin the stable release at implementation time. [MCP SDKs](https://modelcontextprotocol.io/docs/sdk)

   Proposed modules: `domain/` for types and validation; `capabilities/` for the operation registry; `adapters/` for Things access; `service/` for authorization and execution; `mcp/` for transport wrappers; `cli/` for setup and diagnostics; `shortcuts/` for reviewed workflows; `tests/` for fixtures and compatibility scenarios.

   AppleScript handles public object access and operations that it represents faithfully. Prefer fixed reviewed scripts with structured arguments. Shortcuts fills coverage gaps; distribute a small versioned set with defined JSON input/output. Apple supports command-line execution with input and output files, and signing exported shortcuts. Include their import and permission prompts in onboarding rather than claiming invisible installation. [Apple Shortcuts CLI](https://support.apple.com/en-euro/guide/shortcuts-mac/apd455c82f02/mac)

   Use typed URL commands for documented capabilities such as project construction and heading placement. Keep the Things URL authorization token in Keychain, inject it inside the adapter, redact it from diagnostics, and never accept arbitrary URLs or caller-selected callback destinations. Model data must never become executable script source. [Things URL scheme](https://culturedcode.com/things/support/articles/2803573/)

   Each registry entry declares inputs, output schema, supported object types, implementation adapter, required permission, side effects, version requirements, verification method, and test coverage. Return `supported`, `limited`, `unavailable`, or `unverified` with reasons through `things_capabilities`. A public dictionary declaration is evidence to investigate, not a passing runtime test. Exclude hidden/private experimental members even if present in the dictionary.

3. **Make the capability audit the definition of completeness.**

   The table is an implementation inventory. “Target” means implement and verify; it does not claim that every cell works today. A release must account for every public action and writable property, including unsupported combinations.

   | Area | Operations to account for | Proposed route / disposition |
   |---|---|---|
   | Discovery | Versions, health, capability details, object types | Core + public AppleScript |
   | Retrieval | Get by ID, existence, counts, search title/notes, filters, bounded lists | AppleScript + Shortcuts |
   | Navigation lists | Inbox, Today, Upcoming, Anytime, Someday, Logbook; other built-in views | Verify retrieval separately from opening a view |
   | To-dos | Create; edit title/notes; complete, cancel, reopen; duplicate | AppleScript + Shortcuts |
   | Dates | Schedule, unschedule, deadline, completion/cancellation dates | AppleScript + URL commands; verify clear semantics |
   | Planning | Today, Evening, future start, reminder time, Anytime, Someday | URL commands + Shortcuts |
   | Projects | Create, update, move into area, status, duplicate, nested project templates | AppleScript + URL JSON |
   | Areas | List, create, rename, tags, collapsed state; deletion behavior | Public AppleScript; destructive semantics require proof |
   | Headings | Find, create, rename, duplicate, status, delete | Shortcuts; verify each permitted property |
   | Placement | Move tasks between containers; assign a heading | AppleScript + documented URL placement |
   | Checklists | Read, set, append/prepend, check/uncheck, remove/reorder rows | Shortcuts + URL support; require lossless round trips |
   | Tags | List, create, rename, delete, parent hierarchy, keyboard shortcut | Public AppleScript |
   | Tag assignment | Add/remove/replace direct tags; distinguish inherited tags | AppleScript + Shortcuts |
   | History | Read logged items, log completed items, exposed timestamps | Public AppleScript; mark global operations clearly |
   | Deletion | Trash items, permanent delete, empty Trash, cascades | Shortcuts + AppleScript; elevated permission |
   | Recovery | Restore from Trash; restore previous field values | Verify supported route; no universal undo promise |
   | UI helpers | Reveal item/list, search in app, selected items, Quick Entry, edit item | Supported interfaces; report foreground/UI effects |
   | Templates/bulk | Create structured projects; bounded multi-item edits | Core orchestration + supported adapters |
   | Repetition | Read/edit repeat rules, create repeat templates, skip occurrence | No documented route established; manual handoff unless proven |
   | Exact ordering | Arbitrary task, heading, project, area, tag and Today ordering | Audit each; do not use private reorder commands |
   | Type conversions | To-do ↔ project, checklist ↔ task, other UI conversions | Unverified; no delete/recreate substitution without explicit disclosure |
   | Application controls | Public window properties, close/print/quit | Optional local advanced tools after verification |
   | Legacy dictionary surface | Contacts/assignment; Quicksilver input parser | Audit runtime support; never imply modern collaboration support |
   | Settings and sync | Recurrence settings, account/sync controls, general preferences | No supported automation established; manual |

   Important documented Shortcuts boundaries: queries return at most 500 items; deleting a heading or project also deletes its contents; area duplication/deletion is not supported by those Shortcuts actions. Checklist data is text rather than a documented stable-ID collection. Editing does not provide general undo. These constraints must shape tests and tool outputs. [Things Shortcuts reference](https://culturedcode.com/things/support/articles/9596775/)

   The installed public AppleScript dictionary supplies the tag hierarchy, keyboard shortcuts, areas, timestamps, logging, trash, window, and legacy candidates above. Its hidden experimental JSON and ordering commands are specifically excluded. Consult the application dictionary for the installed version as Cultured Code recommends. [AppleScript documentation](https://culturedcode.com/things/support/articles/2803572/)

   There is no automatic UI-clicking fallback in the stable server. Where public automation cannot express an operation, return a precise limitation and a Things deep link for manual completion. Full UI parity would require a separately evaluated, less stable product scope.

4. **Give models precise tools and users predictable results.**

   Expose task-oriented names such as `things_find_items`, `things_get_items`, `things_create_todo`, `things_update_todo`, `things_create_project`, `things_move_items`, `things_set_status`, `things_update_checklist`, and `things_manage_tags`. Keep read operations separate from mutation tools. Use additional typed tools for the remaining registry entries, with small enums where appropriate. Do not expose `run_script`, SQL, raw Apple Events, or generic shell execution.

   Every mutation takes stable Things IDs, explicit changed fields, and a request ID. Resolve ambiguous names before writing. Missing fields mean leave unchanged; explicit clear operations mean remove the value. Reject invalid field/type combinations. Return affected IDs, Things links, changed fields, warnings, and verification status. Never report success just because a URL was launched.

   Provide a bounded `things_preview_changes` / `things_apply_changes` workflow for larger edits. A preview records the exact affected IDs, expected current values, intended changes, and cascading effects. Apply rejects stale previews. Normal authorized single-item changes should take one tool call; the server does not need its own conversational approval loop for every edit.

   Use separate permissions for read, ordinary write, destructive operations, and local UI. Default remote grants to read-only during setup, then let the user enable ordinary writes once. Require explicit trusted approval for permanent deletion, emptying Trash, and large cascades. Approval must be bound to an operation and issued through trusted client-owned settings or an authorization flow; an LLM-provided `confirm: true` is not sufficient.

   Return structured results plus concise text for clients with basic rendering. Annotate read-only and destructive tools accurately; annotations assist clients but do not enforce security. The current ChatGPT developer guide supports read and write tools and documents confirmation behavior. Actual account eligibility and client behavior remain acceptance checks. [ChatGPT developer mode](https://developers.openai.com/api/docs/guides/developer-mode)

5. **Prevent damage, leakage, and confusing retries.**

   Enforce permissions on the Mac for every request, including direct calls and batches. Authentication must precede reading task data. Use Keychain for secrets, restrictive local files for settings, and redacted diagnostics. Treat task titles and notes as untrusted content, never as instructions or permission grants. Provide optional project/area allowlists; apply them to reads, writes, move destinations, and all descendants touched by cascades. Global operations are unavailable to restricted grants.

   For public HTTP use MCP-compatible OAuth: protected-resource and authorization-server discovery, PKCE, exact redirect checks, short-lived tokens, audience validation, revocation, and compatible client registration. Reuse a maintained authorization component rather than implementing cryptography or token issuance from scratch. Verify client compatibility early. [MCP authorization specification](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization)

   Validate Origin and Host where applicable, restrict forwarded headers to the configured proxy, cap payloads and batch sizes, and rate-limit requests. Stdio should emit protocol messages only; send diagnostics to stderr. [MCP transport specification](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)

   Serialize writes across all connected clients. Persist a small local operation journal containing request fingerprints, status, and resulting IDs. Reject reuse of a request ID with different arguments. Do not blindly retry a timed-out create: the Things action may already have committed. Return `OUTCOME_UNKNOWN` and reconcile. This provides controlled retries, not an impossible exactly-once guarantee across app crashes.

   Read current values before a change, compare against expected values, apply, and read back. The external app and Things sync can still race; public automation offers no database transaction or universal atomic compare-and-swap. Detect discrepancies and return them. Batch results distinguish completed, failed, and unattempted operations; do not imply automatic rollback.

   Use server-side search and field selection to avoid sending the whole task library to an LLM. For Shortcuts limits, narrow query partitions or use verified AppleScript enumeration; if completeness cannot be established, mark results incomplete. Stable pagination must be designed and tested rather than wrapping a truncated 500-item result.

   Use calendar dates for start/deadline and timezone-aware values for reminders. Default to the Mac timezone, display the resolved date, and test DST and midnight. A checklist rewrite must preserve checked state and ordering; refuse operations if a lossless read is unavailable.

   Keep a metadata-only audit log by default. Optional local before-images can help recover supported field edits, but contain private data and need protection, expiry, and a clear user setting. They are not a full Things backup. Task content returned to a cloud LLM leaves the Mac even when the MCP server is local.

6. **Make setup and maintenance part of the product.**

   Target a guided installation with a handful of steps: install the package; grant Things automation access; import the bundled Shortcuts; connect a client; run a harmless verification scenario. macOS permissions and shortcut import remain real user steps. Provide `things-mcp setup`, `doctor`, `status`, `connect`, and `uninstall`, with readable errors and generated client configuration.

   Deliver the developer CLI and client-installable packages, starting with a Claude `.mcpb` package. Bundle runtime dependencies for nontechnical users. There is no companion app or status/settings menu. Any necessary background helper must use supported lifecycle mechanisms and client-owned setup; prove that need before adding another language and build system.

   Version the tool contract and Shortcuts together. Detect missing/changed workflows, document repair steps, and disable affected capabilities on incompatible versions. Keep verified fixtures and a minimum-supported-macOS policy. Use automated dependency update proposals, release notes, signed release artifacts, and rollback to the previous package. Avoid automatic breaking tool-schema changes.

   Local operation requires no hosted application backend. Remote mode introduces tunnel/identity-provider operations and possible fees; select a provider and verify current pricing before quoting a recurring cost. The service itself does not need an LLM subscription or model API key, but its client or tunnel provider may require an account.

   Prepare for open source without building a hosted business: portable configuration, synthetic fixtures, documented interfaces, reproducible builds, and replaceable remote providers. The core must work without an account or service operated by this project. Development tests must not depend on the owner's secrets, signing identity, or paid infrastructure. Production signing and real-client integration checks are separate from the ordinary contributor test suite.

   Apply the house Sentry requirement to applicable components, with task content and secrets scrubbed before events leave the process. Keep deployment-specific telemetry configuration external to source control; contributors must be able to build and test without the owner's Sentry project.

   Before public release, choose a license with the owner, audit dependency licenses and required notices, supply a self-contained contributor guide and security-reporting instructions, and scan the full repository history for secrets, personal data, and prohibited attribution. Do not redistribute Things binaries or proprietary vendor assets. Public release and repository visibility changes remain separate decisions requiring explicit authorization. Free project software does not imply that Things, an assistant subscription, or an optional connection provider is free.

7. **Build in milestones with clear exit criteria.**

   | Milestone | Work | Exit criterion | Planning estimate |
   |---|---|---|---|
   | Feasibility | Audit public APIs; prove read, create, update, checklist, heading, trash; test local Claude and ChatGPT connection | Small end-to-end flow in both named clients; written gap list | 2–3 engineering days |
   | Core | Service, schemas, adapters, authorization, queue, reconciliation, diagnostics | Ordinary daily task/project workflow works safely | 4–6 days |
   | Coverage | Every public capability mapped; bulk, hierarchy, history, UI helpers, errors | Each registry entry verified or explicitly limited/unavailable | 4–7 days |
   | Remote and packaging | Tunnel/OAuth integration, installer, onboarding, upgrades | Clean-account install; remote auth/revocation tests; additional-client smoke test | 4–7 days |
   | Hardening | Recovery, large libraries, concurrency, sleep/wake, client behavior | Acceptance suite passes on supported versions | 3–5 days |

   These are estimates for one experienced developer, not delivery commitments. Expect roughly 3–6 weeks for a maintained release; the feasibility milestone provides the first usable demonstration and exposes risks before polishing packaging. A personal local build can be useful sooner.

   Test domain logic with fake adapters on ordinary CI. Run real integration tests in a dedicated macOS user with a disposable Things library, using synthetic tasks. Never use the personal task library for destructive tests. Public CI may not supply the interactive session, licensed app, and permission state required for full integration coverage.

   Acceptance scenarios include: completing a real conversational workflow in Claude and ChatGPT; two clients updating the same item; timeout after creation; Unicode and script-looking titles; tag hierarchy; checklist round trips; descendant deletion previews; more than 500 items; permission revocation; DST; Mac sleep/wake; and partial batch failure. Unsupported recurrence or ordering requests must return a limitation without silently changing unrelated fields.

   Release only when every advertised operation has a verified postcondition or an explicit accepted limitation, unauthorized writes fail at the service boundary, retries do not blindly duplicate tasks, and a new user can install and diagnose the connection without editing scripts.

Personal use first and readiness for a possible free, open-source release are settled directions. Remaining setup choices are the user's ChatGPT account capabilities and whether Claude web/mobile access is needed immediately. The initial acceptance targets remain Claude Desktop plus ChatGPT, with optional general remote access after those two work. Public packaging follows demonstrated personal usefulness, reliable behavior, and a straightforward fresh installation.
