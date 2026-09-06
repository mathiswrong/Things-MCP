---
title: "Things Adapters"
summary: "Things adapters are the proposed AppleScript, Shortcuts, and typed URL layers that isolate Things-MCP from raw or unsupported automation."
topics: [architecture, adapters, things]
sources:
  - id: plan
    type: file
    path: PLAN.md
  - id: agents
    type: file
    path: AGENTS.md
---

# Things Adapters

Things adapters are the planned boundary between the MCP service and Things 3 automation. The repository has no application source yet, and the plan explicitly says the server is proposed rather than implemented or tested [@plan]. The intended architecture uses three supported automation routes: AppleScript for public object access, Shortcuts for coverage gaps through reviewed workflows, and typed Things URL commands for documented URL capabilities [@plan]. This adapter split exists to keep the core service inside the [Supported Automation Boundary](../concepts/supported-automation-boundary) while still covering as much of Things as the public interfaces can safely express [@plan] [@agents].

## Adapter Responsibilities

AppleScript is planned for public object access and operations it represents faithfully [@plan]. The installed public scripting dictionary was inspected during planning, and the plan treats dictionary declarations as evidence to investigate rather than proof that an operation passes runtime tests [@plan]. Hidden or private experimental members are excluded even if they appear in the dictionary [@plan].

Shortcuts is planned to fill capability gaps with a small versioned set of reviewed workflows and defined JSON input/output [@plan]. The plan also records important Shortcuts limits: queries return at most 500 items, deleting a heading or project also deletes its contents, some area operations are unsupported by those actions, checklist data is text rather than a stable-ID collection, and editing does not provide general undo [@plan].

Typed Things URL commands are planned for documented capabilities such as project construction and heading placement [@plan]. The Things URL authorization token stays in Keychain, is injected inside the adapter, and is redacted from diagnostics [@plan].

## URL Token Boundary

The URL adapter has a sharper security boundary than a generic URL launcher. The plan says the service must never accept arbitrary URLs or caller-selected callback destinations, and model data must never become executable script source [@plan]. That rule prevents an MCP caller from smuggling execution behavior through a field that should only describe a task or project.

The project rules reinforce the same principle at the repository level. Future implementation must use only supported Things automation interfaces, must not write directly to the Things database, must not use private experimental APIs, and must not collect Things Cloud credentials [@agents]. Those rules make [Things Automation Surfaces](../concepts/things-automation-surfaces) a product boundary rather than a convenience layer.

## Capability Selection

The adapter for an operation is chosen through the planned capability registry, not by exposing automation primitives directly. Each registry entry is expected to declare inputs, output schema, supported object types, implementation adapter, required permission, side effects, version requirements, verification method, and test coverage [@plan]. Tool clients should see task-oriented MCP tools, while the adapter choice remains inside the service [@plan].

Unsupported operations are meant to fail with precise limitations instead of falling back to unstable UI clicking. The plan states that there is no automatic UI-clicking fallback in the stable server; where public automation cannot express an operation, the tool should return a limitation and a Things deep link for manual completion [@plan]. The exact caller-facing tool contract is tracked in [Planned Tool Contract](../reference/planned-tool-contract).
