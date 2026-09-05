---
title: "Capability Audit"
summary: "The capability audit is the planned completeness contract that classifies each Things operation as supported, limited, unavailable, or unverified."
topics: [capability-audit, coverage, verification]
sources:
  - id: plan
    type: file
    path: PLAN.md
---

# Capability Audit

The capability audit is the planned contract for saying what Things-MCP can and cannot do. The plan defines the achievable promise as every verified operation exposed by Things' supported automation interfaces, with explicit accounting for remaining app features rather than a claim of universal UI control [@plan]. The audit turns completeness into evidence: each operation must be verified, limited, unavailable, or unverified with a reason.

## Completeness Means Accounted For

The plan says the capability table is an implementation inventory and that "target" means implement and verify, not that the operation works today [@plan]. A release must account for every public action and writable property, including unsupported combinations [@plan]. That framing prevents future agents from treating planned coverage as delivered runtime behavior.

The detailed lookup version belongs in [Capability Inventory](../reference/capability-inventory). The planned inventory covers discovery, retrieval, navigation lists, to-dos, dates, planning, projects, areas, headings, placement, checklists, tags, history, deletion, recovery, UI helpers, templates, repetition, ordering, type conversions, application controls, legacy surfaces, and settings or sync [@plan].

## Status Values

Each planned registry entry reports capability status through `things_capabilities` as `supported`, `limited`, `unavailable`, or `unverified`, with reasons [@plan]. The plan also requires entries to declare inputs, output schema, supported object types, implementation adapter, required permission, side effects, version requirements, verification method, and test coverage [@plan].

Those statuses are user-facing safety data, not internal labels. If Shortcuts truncates a query, if recurrence has no documented route, or if exact ordering cannot be safely expressed, the audit must expose that state instead of substituting a hidden workaround. [Known Capability Limits](../reference/known-capability-limits) is the related reference page for limits found during the audit.

## Verification Role

The audit depends on runtime proof. The plan says a public dictionary declaration is evidence to investigate, not a passing runtime test, and it excludes hidden or private experimental members even if they are present in the dictionary [@plan]. It also requires mutations to read current values, apply changes, read back results, and report discrepancies because Things and sync can race outside the server [@plan].

The first implementation milestone is therefore [Feasibility Audit](../guides/feasibility-audit). The plan makes that milestone responsible for proving read, create, update, checklist, heading, and trash behavior, testing the named clients, and producing the gap list that will seed the initial capability inventory [@plan].
