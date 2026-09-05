---
title: "Product Scope"
summary: "Things-MCP is scoped as a personal-first local Mac MCP bridge for Things 3, with an initial TypeScript scaffold and broader product work still planned."
topics: [product-scope, release-boundary, local-first]
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
---

# Product Scope

Things-MCP is a local MCP bridge that lets compatible clients operate Things 3 through supported automation interfaces. The README gives that product identity directly [@readme], and the current package is a private TypeScript project with MCP SDK dependencies and local scripts for start, test, typecheck, lint, build, and check [@package]. The product scope remains personal use first, with the repository kept ready for a possible free, open-source release only after explicit owner authorization and additional release work [@agents].

## Personal Use First

The settled direction is to prove the owner's daily workflow before investing in broad distribution [@agents]. The plan names Claude Desktop and ChatGPT as initial acceptance targets and treats general remote access as optional after those paths work [@plan]. That means early engineering should favor a usable local Mac workflow, harmless verification scenarios, and a written gap list over public packaging polish.

This scope is recorded as a product direction, not as a release commitment. The plan estimates that a maintained release would require feasibility, core implementation, coverage, remote and packaging, and hardening milestones [@plan]. The current scaffold advances core implementation, but it does not complete the remote, packaging, coverage, or hardening milestones [@capabilities]. Read [Personal Use Before Public Release](../decisions/personal-use-before-public-release) with this page when judging whether public-release work is in scope.

## Local Bridge, Not Hosted Task Management

The proposed system is one Mac service that exposes Things operations through MCP tools and delegates actual task operations to supported Things automation routes [@plan]. It is not a hosted task database, does not embed an LLM, and does not require model API keys for the core server [@plan]. The project rules also require the core to remain usable without an account or hosted service operated by this project [@agents].

Remote connection options are allowed only as replaceable additions. The plan discusses a Secure MCP Tunnel or authenticated public HTTPS for remote clients, but it keeps local operation independent of any project-operated backend [@plan]. This keeps the product aligned with a local-first ownership model while leaving room for later client compatibility work.

## Current Implementation Status

The original plan was written before application source existed and describes a proposed design rather than an implemented or tested server [@plan]. The current worktree now contains an initial TypeScript scaffold that registers local MCP tools for capabilities, health, find, get, create, update, schedule, and request status [@server]. The capability registry marks health, find, get, and request status as implemented; marks create, update, and schedule as unverified; and keeps remote HTTP, Shortcuts-backed headings and checklists, repeat rules, exact ordering, and several other operation families unavailable [@capabilities].

The practical next read is [Setup And Diagnostics](../guides/setup-and-diagnostics), the planned home for installation and verification workflow. Its guidance should now be read against the current capability metadata, while any workflow that depends on packaging, imported Shortcuts, remote OAuth, or preview/apply remains planned until code proves it [@plan] [@capabilities].

## Release Constraints

The scope includes open-source readiness from the beginning, but not public distribution by default. The project rules require portable configuration, synthetic fixtures, reproducible build instructions, capability documentation, and a self-contained contributor guide before public release [@agents]. They also require a license choice with the owner and prohibit publishing the repository or applying a license grant without explicit authorization [@agents].

These constraints shape product design. Task data, credentials, machine-specific configuration, screenshots, disposable builds, proprietary vendor assets, and the owner's signing or telemetry setup must stay out of source control [@agents]. The [Supported Automation Boundary](supported-automation-boundary) is part of the same scope: the product is valuable only if it operates Things safely through supported interfaces.
