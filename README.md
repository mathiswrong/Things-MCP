# Things MCP

Use Things 3 through local MCP tools backed by its supported macOS automation interfaces.

This is an early feasibility build. Read access and single-to-do creation, editing, scheduling, and status changes have been checked against Things 3.23.3 on macOS. Project, area, and tag mutations remain unverified. Writes are off by default. Headings, checklists, deletion, recurrence, and remote HTTP are not implemented. The complete target scope is in [PLAN.md](PLAN.md).

## Local setup

The commands below are developer setup. User installation must use supported client interfaces without configuration editing, Terminal commands, or a companion app; see [the setup plan](SETUP-PLAN.md). That packaging and the browser connection are not complete yet.

Requires macOS, an installed and running copy of Things 3, and Node.js 24 or later. The ordinary test suite also runs without Things or a Mac.

```sh
npm ci
npm run check
npm start -- doctor
```

The build command prints the executable path. Its default output is `~/Downloads/Things-MCP-builds/0.1.0/cli.mjs`, outside the source tree. Install that verified build into the local application-support directory with:

```sh
npm run install:local
```

The installer prints a standard MCP configuration entry. Add it to a client's `mcpServers` configuration. Use the absolute Node executable and installed entry path it prints; MCP clients do not necessarily inherit the interactive shell environment. Start the bundled entry directly, not through `npm start`, because npm writes extra text to stdout.

Claude Desktop accepts a local stdio server configuration. ChatGPT requires a separate supported connection such as Secure MCP Tunnel; that connection has not been provisioned or verified in this build. The SDK smoke test is not a substitute for testing either application's actual UI. See the [client connection plan](PLAN.md).

The Mac must be awake and Things must be running. macOS may request Automation permission for the process running the bridge. `doctor` reports app version, timezone, and write permission without listing task contents.

## Tools

| Tool | Current behavior |
|---|---|
| `things_capabilities` | Reports implemented, unverified, and unavailable operations |
| `things_health` | Checks the Things connection and local write permission |
| `things_find_items` | Finds to-dos, projects, areas, or tags; notes omitted by default |
| `things_get_item` | Reads one item and its revision |
| `things_create_item` | Experimental ordinary creation behind local permission |
| `things_update_item` | Experimental title, notes, status, and deadline editing |
| `things_schedule_item` | Experimental calendar-date scheduling |
| `things_request_status` | Reports the durable receipt for a request ID |

Search scans at most 5000 objects and returns at most 100 items per page. `scanComplete: false` means the scan stopped early, either after filling a page or at the scan limit. Follow `nextOffset` only when present; otherwise narrow the query. Pagination is not a snapshot, so concurrent edits can move results between pages. Dates use the Mac timezone. Search revisions are computed before optional note omission; fetch an item before editing it.

To keep access read-only:

```sh
npm start -- setup --read-only
```

Enable ordinary writes locally with `setup --allow-writes` when ready to grant connected clients write access. Check the capability report for tested operations and remaining limitations first. No MCP tool can grant this permission. The setting applies to every local client using the same state directory; per-client grants are future work. Do not isolate each client into a different state directory, because that defeats coordination.

## Safety and privacy

All input is validated. A fixed script receives JSON on stdin; task contents never become executable source or process arguments. There is no shell tool, direct database access, or Things Cloud credential collection.

Mutations share a filesystem lease and durable local request receipts. Reusing a request ID with changed arguments fails. Interrupted or uncertain requests are not automatically replayed. Updates require the current revision, and successful writes require read-back verification. Lock loss stops subsequent work and aborts the native subprocess. Already-delivered Apple Events cannot be rolled back; the public interface provides no transaction or absolute exactly-once guarantee.

State lives under `~/Library/Application Support/Things MCP` with owner-only permissions. Receipts contain request fingerprints, item IDs and field names, not titles or notes. The journal stops accepting new writes at 10000 receipts instead of silently discarding retry protection. Use `THINGS_MCP_STATE_DIR` only for isolated test libraries or deliberate independent installations. Local same-user processes are trusted; this is not an operating-system security sandbox.

Task content returned to a connected assistant is shared with that client and its provider. Sentry support is included but sends nothing without `THINGS_MCP_SENTRY_DSN`. Events are reduced to an error code and generic message; task data, filesystem paths, requests, users, breadcrumbs, and exception details are dropped. No production telemetry destination is bundled.

## Verification and contribution

```sh
npm run check
npm run smoke
npm audit
```

`npm run smoke` launches the built stdio executable and proves discovery, capability reporting, and write rejection without accessing Things. `npm run smoke -- --live-read` additionally checks real health and bounded reads, without printing task contents or making native changes. Temporary test directories are created in Downloads and removed by the tests. Build artifacts stay outside the repository.

The [live verification record](VERIFICATION.md) describes the authorized single-item checks and their limits. Real writes are never part of the automatic test suite.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md). Source is private and unlicensed pending the owner's public-release and license decisions. Do not redistribute Things or vendor assets. The project is intended to become independently buildable and suitable for a free, open-source release.
