---
title: "Getting Started"
summary: "Entry point for the Things-MCP wiki, with routes into the product scope, current TypeScript scaffold, capability status, and feasibility work."
topics: [orientation, product-scope, capability-audit]
sources:
  - id: readme
    type: file
    path: README.md
  - id: plan
    type: file
    path: PLAN.md
  - id: agents
    type: file
    path: AGENTS.md
  - id: package
    type: file
    path: package.json
  - id: server
    type: file
    path: src/server.ts
  - id: capabilities
    type: file
    path: src/capabilities.ts
  - id: tests
    type: file
    path: tests/core.test.ts
---

# Getting Started

Things-MCP is a local MCP bridge for Things 3 that is moving from design into an initial TypeScript scaffold. The README gives the product identity as a local bridge using supported Things automation interfaces [@readme], and the current package declares a private TypeScript/Node project with MCP SDK dependencies and scripts for start, test, typecheck, lint, build, and check [@package]. The original 5 September 2026 plan remains important because it defines the intended product and safety constraints, but current code and tests now provide the authority for implemented scaffold behavior [@plan] [@server] [@tests].

## Where To Start

Begin with [Product Scope](concepts/product-scope) to understand the intended shape: a personal-first Mac service that may later become a free, open-source release if the owner explicitly authorizes public release [@agents]. That page also separates implemented scaffold status from broader planned client packaging, remote access, and release work.

The architectural center is [Local Mac Service](architecture/local-mac-service). The plan proposes one Mac service started as the current macOS user, plus client-facing transports that share one mutation queue, permission policy, and retry journal [@plan]. The current scaffold exposes a local stdio MCP server and does not start a public HTTP listener [@server] [@capabilities].

Use [Capability Inventory](reference/capability-inventory) and [Capability Audit](concepts/capability-audit) when evaluating feature coverage. The current scaffold publishes a `things_capabilities` tool, with health/find/get and request status marked implemented, create/update/schedule marked unverified, and headings, checklists, remote HTTP, repeat rules, exact ordering, and several other operation families marked unavailable [@server] [@capabilities].

Use [Feasibility Audit](guides/feasibility-audit) for the first implementation milestone. The plan makes the feasibility milestone responsible for auditing public APIs, proving core operations, testing the first local and ChatGPT connection paths, and producing a written gap list [@plan].

## Current Repository State

The current worktree contains an initial TypeScript scaffold under `src/` and a core test suite under `tests/` [@package] [@tests]. The scaffold registers MCP tools for capabilities, health, find, get, create, update, schedule, and request status [@server]. Its tests cover strict input validation, read-only write blocking, request ID replay and conflict handling, stale revision rejection, read-back verification, bounded note exposure in search, and local state safety checks [@tests].

This is still not the full product described in the plan. The current scaffold does not include broad client packaging, remote HTTP or OAuth, a bundled Shortcuts bridge, preview/apply, destructive-operation approval, or the full capability inventory [@plan] [@capabilities]. Future changes should distinguish planned behavior from scaffold behavior and should cite code and tests for present-tense runtime claims.

## Durable Boundaries

The project rules require personal use before public use, neutral attribution-free repository hygiene, portable configuration, synthetic fixtures, and a core that remains usable without an account or hosted service run by this project [@agents]. They also require supported Things automation interfaces only and forbid direct Things database writes, private experimental APIs, Things Cloud credentials, and UI publication before explicit authorization [@agents].

Those boundaries connect the first wiki clusters. [Supported Automation Boundary](concepts/supported-automation-boundary) explains which Things automation routes are allowed. [Things Automation Surfaces](concepts/things-automation-surfaces) explains the planned AppleScript, Shortcuts, and Things URL adapters. [Known Capability Limits](reference/known-capability-limits) records limitations that must be surfaced instead of hidden behind unsafe fallbacks.
