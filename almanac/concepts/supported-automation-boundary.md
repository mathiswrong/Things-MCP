---
title: "Supported Automation Boundary"
summary: "The supported automation boundary limits Things-MCP to public Things integration routes and rejects database, private API, and stable UI-click fallbacks."
topics: [automation-boundary, things-integration, safety]
sources:
  - id: plan
    type: file
    path: PLAN.md
  - id: agents
    type: file
    path: AGENTS.md
  - id: adapter
    type: file
    path: src/adapter.ts
  - id: server
    type: file
    path: src/server.ts
  - id: capabilities
    type: file
    path: src/capabilities.ts
---

# Supported Automation Boundary

The supported automation boundary is the rule that Things-MCP may control Things 3 only through supported automation interfaces. The implementation plan identifies AppleScript, Shortcuts, and Things URL commands as the automation routes to use, while excluding Mail to Things because it adds no necessary capability for this bridge [@plan]. The current scaffold has begun inside that boundary: its native adapter runs a fixed JXA script through `/usr/bin/osascript`, the MCP server exposes typed task tools instead of generic automation launchers, and the capability registry keeps Shortcuts-backed and remote features unavailable until they are built and verified [@adapter] [@server] [@capabilities].

## What The Boundary Allows

The bridge may use AppleScript for public object access and operations it represents faithfully, Shortcuts for reviewed workflows with defined JSON input and output, and typed Things URL commands for documented capabilities such as project construction and heading placement [@plan]. The current adapter evidence covers only the AppleScript/JXA route; the capability registry says a reviewed Shortcuts bridge is not included yet and remote HTTP is unavailable in this build [@adapter] [@capabilities]. These routes are the subject of [Things Automation Surfaces](things-automation-surfaces), which explains why the adapters are split instead of collapsed into one execution path.

The boundary also allows honest limits. The plan says the achievable promise is every verified operation exposed by supported automation interfaces, with an explicit accounting of remaining app features [@plan]. That accounting appears in [Capability Audit](capability-audit) and [Known Capability Limits](../reference/known-capability-limits), where an operation can be supported, limited, unavailable, or unverified.

## What The Boundary Excludes

The stable server must not write directly to the Things database, use private experimental APIs, collect Things Cloud credentials, or fall back to automatic UI clicking for operations public automation cannot express [@agents]. The plan separately excludes hidden or private experimental dictionary members even when they appear in the installed scripting dictionary [@plan]. The current MCP server follows the no-generic-execution side of this boundary by registering named Things tools rather than `run_script`, raw Apple Events, SQL, shell execution, arbitrary URL launchers, or caller-selected callbacks [@server].

The same boundary rejects generic execution tools. The plan says the MCP surface must not expose `run_script`, SQL, raw Apple Events, generic shell execution, arbitrary URLs, or caller-selected callback destinations [@plan]. Read [No Generic Execution Tools](../decisions/no-generic-execution-tools) for the decision-level treatment of that constraint.

## Why It Matters

Things-MCP is meant to give clients predictable task tools, not unchecked control over a user's Mac or private task store. The plan requires every mutation to use stable Things IDs, explicit changed fields, request IDs, validation, permission checks, and post-change verification rather than reporting success when an automation command was merely launched [@plan].

The boundary also keeps limitations visible to callers. If public automation cannot express an operation, the plan requires the server to return a precise limitation and a Things deep link for manual completion instead of pretending full UI parity exists [@plan]. [Use Supported Things Interfaces Only](../decisions/use-supported-things-interfaces-only) is the decision page tied to this boundary.
