---
title: "Things Automation Surfaces"
summary: "Things automation surfaces are the planned AppleScript, Shortcuts, and Things URL command adapters used to reach supported Things 3 capabilities."
topics: [things-integration, adapters, automation-boundary]
sources:
  - id: plan
    type: file
    path: PLAN.md
  - id: agents
    type: file
    path: AGENTS.md
---

# Things Automation Surfaces

Things automation surfaces are the supported integration routes that the planned Things-MCP service may use to operate Things 3. The plan names AppleScript, Shortcuts, and Things URL commands as the three surfaces to use and explicitly leaves Mail to Things out because it does not add needed bridge capability [@plan]. These surfaces define the planned adapter split and sit inside the [Supported Automation Boundary](supported-automation-boundary) required by the project rules [@agents].

## AppleScript

AppleScript is planned for public object access and operations that the scripting dictionary represents faithfully [@plan]. The plan ties AppleScript evidence to Things' installed public scripting dictionary, including areas such as tags, areas, timestamps, logging, trash, windows, and some legacy candidates [@plan]. A public dictionary declaration is not enough by itself; the plan says dictionary members must still be investigated and runtime-verified before being treated as supported behavior [@plan].

AppleScript is therefore a direct but audited surface. It can expose structured Things data where the public dictionary supports it, but it must not become a generic raw Apple Event or arbitrary script execution endpoint. [No Generic Execution Tools](../decisions/no-generic-execution-tools) is the related decision page for that separation.

## Shortcuts

Shortcuts is planned to fill coverage gaps through a small versioned set of reviewed workflows with defined JSON input and output [@plan]. The plan expects onboarding to include shortcut import and permission prompts rather than claiming invisible installation [@plan]. It also requires the tool contract and bundled Shortcuts versions to move together so changed or missing workflows can disable affected capabilities instead of failing unpredictably [@plan].

Shortcuts has known limits that affect capability design. The plan records documented constraints such as query results capped at 500 items, destructive cascades when deleting headings or projects, unsupported area duplication and deletion through certain actions, checklist data represented as text, and no general undo [@plan]. These limits belong in [Known Capability Limits](../reference/known-capability-limits) and must shape both tests and user-facing tool results.

## Things URL Commands

Things URL commands are planned for documented typed operations, especially project construction and heading placement [@plan]. The plan requires the URL authorization token to live in Keychain, be injected inside the adapter, and be redacted from diagnostics [@plan]. It also forbids arbitrary URLs and caller-selected callback destinations, which prevents model-provided data from becoming executable automation input [@plan].

URL commands are useful because they cover structured creation and placement cases, but they are not a success signal on their own. The plan says mutations must verify their result after execution and must not report success merely because a URL was launched [@plan]. That verification requirement connects this concept to [Capability Audit](capability-audit) and the planned mutation reconciliation architecture.
