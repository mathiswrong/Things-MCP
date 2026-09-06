---
title: "Feasibility Audit"
summary: "The feasibility audit is the first planned milestone for proving which Things operations and MCP client connections can work before building product polish."
topics: [capability-audit, things-automation, milestones]
sources:
  - id: plan
    type: file
    path: PLAN.md
  - id: agents
    type: file
    path: AGENTS.md
---

# Feasibility Audit

The feasibility audit is the first planned milestone for this repository. Its outcome is a small end-to-end flow in the initial target clients, evidence for core Things operations, and a written gap list for everything the supported automation surfaces cannot prove [@plan]. Use this guide before expanding the service, packaging, or public-release work, because the plan makes audited capability coverage the definition of completeness rather than a marketing claim [@plan].

## Preconditions

Work only through supported Things automation interfaces. The repository rules forbid direct database writes, private experimental APIs, unsupported Things interfaces, and collection of Things Cloud credentials [@agents]. The plan identifies AppleScript, Shortcuts, and typed Things URL commands as the useful supported surfaces, while Mail to Things adds no necessary capability for this server [@plan].

Use synthetic task data in a disposable Things library or dedicated macOS user. The release plan requires real integration tests to avoid the owner's personal task library, especially for destructive behavior [@plan]. This also protects the [Task Data Boundary](../concepts/task-data-boundary) that later release work must preserve.

## Audit The Public Surfaces

Start from [Things Automation Surfaces](../concepts/things-automation-surfaces), then inspect the installed Things AppleScript dictionary, the Things Shortcuts actions, and documented Things URL commands. Treat a public declaration as a lead to test, not proof that an operation works correctly through the server [@plan]. Exclude hidden or private dictionary members even if they appear locally, because the product direction is the [Supported Automation Boundary](../concepts/supported-automation-boundary), not maximum possible reach.

Record each tested operation against the [Capability Inventory](../reference/capability-inventory). The plan says every public action and writable property needs an accounting, including unsupported combinations [@plan]. Mark the status as `supported`, `limited`, `unavailable`, or `unverified` with a reason; do not collapse a failure into silence or imply support from documentation alone [@plan].

## Prove The Core Operations

The feasibility milestone must prove read, create, update, checklist, heading, and trash behavior before the repository invests in full coverage or packaging [@plan]. For each operation, perform the smallest useful test that demonstrates the full path through the relevant automation surface:

1. Create synthetic Things data with titles that make the test easy to identify and safe to delete.
2. Read the item back through the same public route the server intends to use.
3. Apply one change and verify the postcondition by reading the item again.
4. Test the failure or limit that could mislead a caller, such as a destructive cascade, checklist round trip, or query truncation.
5. Record the route used, the result, the unsupported cases, and the exact user-visible limitation.

The audit should pay special attention to known Shortcuts boundaries. The plan calls out 500-item query limits, destructive deletion cascades for headings and projects, unsupported area duplication or deletion through Shortcuts actions, checklist data as text rather than stable row objects, and no general undo [@plan]. Those details affect both [Capability Audit](../concepts/capability-audit) status and the mutation safeguards that later appear in [Mutation Reconciliation](../architecture/mutation-reconciliation).

## Test Target Clients

The first acceptance targets are Claude Desktop and ChatGPT [@plan]. For local clients, test stdio configuration and a harmless tool flow. For ChatGPT, verify the account and workspace can actually use the selected MCP connection route before assuming tunnel or HTTPS behavior [@plan]. Other MCP hosts can be added later, but protocol support alone is not enough; the plan says each host still needs client-specific testing [@plan].

The feasibility test should include at least one read flow and one ordinary write flow in each initial client. Confirm that the client displays structured results clearly enough for a user to understand affected IDs, warnings, and verification status. Keep destructive operations out of the first client proof unless a trusted local approval path already exists.

## Write The Gap List

The gap list is the main artifact of the feasibility audit. It should name operations that worked, operations that worked with limits, operations that could not be expressed through supported automation, and operations that remain unverified. The plan already identifies recurrence settings, exact ordering, some type conversions, and sync or account settings as areas without established supported automation routes [@plan].

Write each gap so a future maintainer can act on it. A useful entry names the Things feature, the surface tested, the observed behavior, the planned disposition, and whether the limitation changes a tool contract, permission, warning, or manual handoff. This keeps the inventory factual and prevents future pages or release notes from claiming universal UI parity.

## Completion Check

The audit is complete when the milestone exit criterion is met: a small end-to-end flow works in both initial target clients, and the repository has a written gap list [@plan]. It is not complete just because the server can start, the AppleScript dictionary contains a property, or one client can list a task.

Do not proceed to release-readiness claims from this guide alone. The feasibility result feeds later core, coverage, remote packaging, and hardening milestones, each with separate exit criteria [@plan].
