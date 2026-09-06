---
title: "Feasibility Audit"
topics: [capability-audit, things-automation, verification]
sources:
  - id: contributing
    type: file
    path: CONTRIBUTING.md
  - id: rules
    type: file
    path: AGENTS.md
  - id: verification
    type: file
    path: VERIFICATION.md
---

# Feasibility Audit

Use this procedure when adding or broadening a Things operation. The goal is a supported command with an honest result contract, not a successful launch alone [@contributing].

1. Identify the public scripting or documented URL mechanism and the fields available for read-back. Private APIs, database writes and Apple Shortcuts are excluded [@rules].
2. Add strict inputs, permission enforcement, current revisions, request receipts and meaningful failure-path tests. Preserve unknown-outcome handling [@contributing].
3. Verify native behavior with disposable fixtures under the library owner's authorization. Keep ordinary automated tests independent of Things and personal credentials [@contributing].
4. Compare results with the intended postcondition. Record dispatch-only fields and failed native cases explicitly, then update capability metadata and user documentation [@verification].

A dictionary declaration is not live evidence. Inspect uncertain results before any further mutation, and never repeat an uncertain write automatically. See [Capability Audit](../concepts/capability-audit.md) and [Mutation Reconciliation](../architecture/mutation-reconciliation.md).
