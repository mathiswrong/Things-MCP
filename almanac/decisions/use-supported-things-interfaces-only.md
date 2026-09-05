---
title: "Use Supported Things Interfaces Only"
summary: "Things-MCP will control Things 3 only through supported automation interfaces and will treat unsupported app features as explicit limits."
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

# Use Supported Things Interfaces Only

Things-MCP uses supported Things automation routes as the only allowed path for reading or changing Things 3 data. The product direction allows AppleScript, Shortcuts, and typed Things URL commands, but it forbids direct database writes, private APIs, hidden experimental dictionary members, Things Cloud credentials, and stable UI-click fallbacks for operations public automation cannot express [@plan] [@agents]. The current TypeScript scaffold implements the first slice of this decision with a fixed AppleScript/JXA adapter and named MCP tools rather than a generic execution surface [@adapter] [@server].

## Context

The implementation plan defines the achievable promise as every verified operation exposed by Things' supported automation interfaces, with explicit accounting for app features that remain limited or unavailable [@plan]. It also says universal control of every Things UI feature cannot responsibly be promised [@plan]. The current worktree now contains a partial TypeScript implementation, so this page records both the durable design rule and the scaffolded enforcement that exists today [@adapter] [@server].

The project rules make the same boundary mandatory. They say to use only supported Things automation interfaces, never write directly to the Things database, never use private experimental APIs, and never collect Things Cloud credentials [@agents]. Those rules are stricter than a convenience-driven adapter design because they constrain how future features may be added.

## Decision

Things-MCP treats AppleScript, Shortcuts, and documented Things URL commands as the allowed Things integration surfaces [@plan]. Each operation must be routed through one of those supported mechanisms and represented in the capability audit as supported, limited, unavailable, or unverified with reasons [@plan]. The current registry applies that model by marking AppleScript-backed health, find, get, and request status as implemented; AppleScript-backed create, update, and schedule as unverified; and Shortcuts-backed or unaudited areas such as headings, checklists, repeat rules, exact ordering, and remote HTTP as unavailable [@capabilities].

The project will not expose or depend on direct database access, private Things APIs, hidden experimental AppleScript members, private reorder commands, arbitrary URL launching, or automatic UI automation as part of the stable server [@plan] [@agents]. When public automation cannot express an operation, the server should return a precise limitation and, where useful, a Things deep link for manual completion [@plan].

## Consequences

This decision keeps the adapter layer aligned with Things' supported integration model. Future work on [Things Adapters](../architecture/things-adapters) must prove that an operation is available through the allowed surfaces before advertising it as supported. A public dictionary declaration is evidence to investigate, not a passing runtime test, and hidden or private experimental members stay excluded even when visible during inspection [@plan]. The current adapter executes one fixed native script path and validates the response shape before returning data to the service [@adapter].

The decision also means some visible Things UI features may remain outside the stable MCP tool surface. Recurrence settings, exact ordering, type conversions, settings, sync controls, and other areas with no established supported route must be documented as limits instead of being simulated through unsafe replacements [@plan]. The current inventory of those constraints belongs in [Known Capability Limits](../reference/known-capability-limits).

The tradeoff is reduced apparent coverage in exchange for safer behavior and more honest tool results. The plan requires mutation tools to validate inputs, use stable Things IDs, report affected IDs and verification status, and never report success just because a URL or workflow launched [@plan]. That makes capability claims slower to earn, but it gives future users and maintainers a clear reason to trust the supported subset.
