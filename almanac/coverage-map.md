---
title: Coverage Map
summary: Frozen page inventory for this first wiki build.
topics: [build, wiki, reference]
sources: []
---

# Coverage Map

## Page Inventory

### Root

- path: `almanac/getting-started.md`
  - slug: `getting-started`
  - purpose: Front door for future agents, explaining that this repository contains an initial Things-MCP TypeScript scaffold plus broader planned product work and routing readers to the main wiki clusters.
  - planned links: [Product Scope](concepts/product-scope), [Local Mac Service](architecture/local-mac-service), [Capability Inventory](reference/capability-inventory), [Feasibility Audit](guides/feasibility-audit)
  - key evidence files: `README.md`, `PLAN.md`, `AGENTS.md`

### `concepts/`

- path: `almanac/concepts/product-scope.md`
  - slug: `concepts/product-scope`
  - purpose: Define the repository's intended product scope, personal-first direction, future open-source constraints, and current planning-only status.
  - planned links: [Personal Use Before Public Release](decisions/personal-use-before-public-release), [Supported Automation Boundary](concepts/supported-automation-boundary), [Setup And Diagnostics](guides/setup-and-diagnostics)
  - key evidence files: `README.md`, `PLAN.md`, `AGENTS.md`

- path: `almanac/concepts/supported-automation-boundary.md`
  - slug: `concepts/supported-automation-boundary`
  - purpose: Explain the boundary that Things-MCP may use only supported Things automation interfaces and must exclude database writes, private APIs, and stable UI-click fallbacks.
  - planned links: [Things Automation Surfaces](concepts/things-automation-surfaces), [Use Supported Things Interfaces Only](decisions/use-supported-things-interfaces-only), [Known Capability Limits](reference/known-capability-limits)
  - key evidence files: `PLAN.md`, `AGENTS.md`

- path: `almanac/concepts/things-automation-surfaces.md`
  - slug: `concepts/things-automation-surfaces`
  - purpose: Define AppleScript, Shortcuts, and Things URL commands as the planned adapter surfaces and summarize the intended responsibility of each.
  - planned links: [Supported Automation Boundary](concepts/supported-automation-boundary), [Things Adapters](architecture/things-adapters), [Capability Audit](concepts/capability-audit)
  - key evidence files: `PLAN.md`, `AGENTS.md`

- path: `almanac/concepts/capability-audit.md`
  - slug: `concepts/capability-audit`
  - purpose: Define the capability audit as the planned completeness contract for verified, limited, unavailable, and unverified Things operations.
  - planned links: [Capability Inventory](reference/capability-inventory), [Known Capability Limits](reference/known-capability-limits), [Feasibility Audit](guides/feasibility-audit)
  - key evidence files: `PLAN.md`

- path: `almanac/concepts/task-data-boundary.md`
  - slug: `concepts/task-data-boundary`
  - purpose: Explain privacy and data-handling boundaries for Things task contents, credentials, diagnostics, fixtures, logs, and cloud-connected clients.
  - planned links: [Permissions And Authorization](architecture/permissions-and-authorization), [Release Readiness](guides/release-readiness), [Local Core With Replaceable Remote Access](decisions/local-core-with-replaceable-remote-access)
  - key evidence files: `PLAN.md`, `AGENTS.md`

### `architecture/`

- path: `almanac/architecture/local-mac-service.md`
  - slug: `architecture/local-mac-service`
  - purpose: Describe the proposed local Mac service, stdio adapter, user-owned socket, shared mutation queue, and host-availability behavior.
  - planned links: [Client Connections](architecture/client-connections), [Mutation Reconciliation](architecture/mutation-reconciliation), [Local Core With Replaceable Remote Access](decisions/local-core-with-replaceable-remote-access)
  - key evidence files: `PLAN.md`

- path: `almanac/architecture/client-connections.md`
  - slug: `architecture/client-connections`
  - purpose: Explain the planned connection routes for local MCP clients, Secure MCP Tunnel, public HTTPS/OAuth, and other MCP hosts.
  - planned links: [Local Mac Service](architecture/local-mac-service), [Permissions And Authorization](architecture/permissions-and-authorization), [Setup And Diagnostics](guides/setup-and-diagnostics)
  - key evidence files: `PLAN.md`

- path: `almanac/architecture/things-adapters.md`
  - slug: `architecture/things-adapters`
  - purpose: Explain the planned adapter split across AppleScript, Shortcuts, and typed Things URL commands, including the URL token boundary.
  - planned links: [Things Automation Surfaces](concepts/things-automation-surfaces), [Supported Automation Boundary](concepts/supported-automation-boundary), [Planned Tool Contract](reference/planned-tool-contract)
  - key evidence files: `PLAN.md`, `AGENTS.md`

- path: `almanac/architecture/permissions-and-authorization.md`
  - slug: `architecture/permissions-and-authorization`
  - purpose: Document the planned permission layers, remote read-only default, trusted approvals, OAuth requirements, and project or area allowlists.
  - planned links: [Task Data Boundary](concepts/task-data-boundary), [Mutation Reconciliation](architecture/mutation-reconciliation), [No Generic Execution Tools](decisions/no-generic-execution-tools)
  - key evidence files: `PLAN.md`, `AGENTS.md`

- path: `almanac/architecture/mutation-reconciliation.md`
  - slug: `architecture/mutation-reconciliation`
  - purpose: Explain the proposed request-id, preview/apply, serialized write, operation journal, unknown-outcome, and read-apply-read verification model.
  - planned links: [Permissions And Authorization](architecture/permissions-and-authorization), [Planned Tool Contract](reference/planned-tool-contract), [Known Capability Limits](reference/known-capability-limits)
  - key evidence files: `PLAN.md`

### `guides/`

- path: `almanac/guides/feasibility-audit.md`
  - slug: `guides/feasibility-audit`
  - purpose: Give future agents the first milestone procedure for auditing public Things APIs, proving key operations, testing target clients, and writing a gap list.
  - planned links: [Capability Audit](concepts/capability-audit), [Things Automation Surfaces](concepts/things-automation-surfaces), [Capability Inventory](reference/capability-inventory)
  - key evidence files: `PLAN.md`, `AGENTS.md`

- path: `almanac/guides/setup-and-diagnostics.md`
  - slug: `guides/setup-and-diagnostics`
  - purpose: Describe the intended installation, permissions, Shortcut import, client connection, harmless verification, and diagnostic command flow.
  - planned links: [Product Scope](concepts/product-scope), [Client Connections](architecture/client-connections), [Planned Tool Contract](reference/planned-tool-contract)
  - key evidence files: `PLAN.md`

- path: `almanac/guides/release-readiness.md`
  - slug: `guides/release-readiness`
  - purpose: Capture the public-release gates for license choice, notices, contributor docs, reproducible builds, signing, security reporting, and history scans.
  - planned links: [Personal Use Before Public Release](decisions/personal-use-before-public-release), [Task Data Boundary](concepts/task-data-boundary), [Capability Audit](concepts/capability-audit)
  - key evidence files: `PLAN.md`, `AGENTS.md`

### `decisions/`

- path: `almanac/decisions/use-supported-things-interfaces-only.md`
  - slug: `decisions/use-supported-things-interfaces-only`
  - purpose: Record the decision to use supported Things automation routes only and reject direct database access, private APIs, hidden experimental members, and stable UI-click fallbacks.
  - planned links: [Supported Automation Boundary](concepts/supported-automation-boundary), [Things Adapters](architecture/things-adapters), [Known Capability Limits](reference/known-capability-limits)
  - key evidence files: `PLAN.md`, `AGENTS.md`

- path: `almanac/decisions/personal-use-before-public-release.md`
  - slug: `decisions/personal-use-before-public-release`
  - purpose: Record the direction to prove the owner's daily workflow first while keeping the codebase suitable for a later authorized free open-source release.
  - planned links: [Product Scope](concepts/product-scope), [Release Readiness](guides/release-readiness), [Local Core With Replaceable Remote Access](decisions/local-core-with-replaceable-remote-access)
  - key evidence files: `PLAN.md`, `AGENTS.md`

- path: `almanac/decisions/local-core-with-replaceable-remote-access.md`
  - slug: `decisions/local-core-with-replaceable-remote-access`
  - purpose: Record the decision to keep the core local and account-free while allowing replaceable remote tunnel or OAuth connection options.
  - planned links: [Local Mac Service](architecture/local-mac-service), [Client Connections](architecture/client-connections), [Task Data Boundary](concepts/task-data-boundary)
  - key evidence files: `PLAN.md`, `AGENTS.md`

- path: `almanac/decisions/no-generic-execution-tools.md`
  - slug: `decisions/no-generic-execution-tools`
  - purpose: Record the boundary against exposing generic script, SQL, Apple Event, shell, or arbitrary URL execution through MCP tools.
  - planned links: [Planned Tool Contract](reference/planned-tool-contract), [Permissions And Authorization](architecture/permissions-and-authorization), [Supported Automation Boundary](concepts/supported-automation-boundary)
  - key evidence files: `PLAN.md`

### `reference/`

- path: `almanac/reference/capability-inventory.md`
  - slug: `reference/capability-inventory`
  - purpose: Provide a lookup reference for the planned capability inventory table while clearly labeling it as planned audit scope rather than verified implementation.
  - planned links: [Capability Audit](concepts/capability-audit), [Known Capability Limits](reference/known-capability-limits), [Feasibility Audit](guides/feasibility-audit)
  - key evidence files: `PLAN.md`

- path: `almanac/reference/planned-tool-contract.md`
  - slug: `reference/planned-tool-contract`
  - purpose: List the planned MCP tool surface and mutation-result contract, including IDs, changed fields, warnings, verification status, and preview/apply behavior.
  - planned links: [Mutation Reconciliation](architecture/mutation-reconciliation), [Things Adapters](architecture/things-adapters), [No Generic Execution Tools](decisions/no-generic-execution-tools)
  - key evidence files: `PLAN.md`

- path: `almanac/reference/known-capability-limits.md`
  - slug: `reference/known-capability-limits`
  - purpose: Record known planned limits from the current design, including Shortcuts item caps, destructive cascades, checklist limitations, no general undo, recurrence gaps, and ordering uncertainty.
  - planned links: [Supported Automation Boundary](concepts/supported-automation-boundary), [Capability Inventory](reference/capability-inventory), [Use Supported Things Interfaces Only](decisions/use-supported-things-interfaces-only)
  - key evidence files: `PLAN.md`
