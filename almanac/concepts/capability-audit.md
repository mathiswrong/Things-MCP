---
title: "Capability Audit"
topics: [capability-audit, coverage, verification]
sources:
  - id: registry
    type: file
    path: src/capabilities.ts
  - id: scope
    type: file
    path: docs/FULL-SCOPE.md
  - id: verification
    type: file
    path: VERIFICATION.md
---

# Capability Audit

The capability registry tells callers which operation families are implemented, limited or unavailable. An implemented URL operation can still provide only a dispatch receipt; availability and verified read-back are separate claims [@registry].

## Three kinds of limit

A missing public mechanism, a native command that failed verification, and an environment not tested are different constraints. Repeat-rule editing is excluded at the interface boundary. Direct Logbook moves failed live checks. Fresh-account consent and physical sleep/wake remain environment gaps [@scope] [@verification].

Update the registry, user reference and verification record together when behavior changes. Do not infer API absence merely because a tool is absent, or successful native behavior from a dictionary declaration [@scope]. See [Capability Inventory](../reference/capability-inventory.md), [Known Capability Limits](../reference/known-capability-limits.md) and [Feasibility Audit](../guides/feasibility-audit.md).
