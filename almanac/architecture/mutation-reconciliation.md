---
title: "Mutation Reconciliation"
topics: [architecture, mutations, mutation-safety]
sources:
  - id: service
    type: file
    path: src/service.ts
  - id: state
    type: file
    path: src/state.ts
  - id: adapter
    type: file
    path: src/adapter.ts
  - id: tests
    type: file
    path: tests/core.test.ts
  - id: protocol
    type: file
    path: tests/protocol.test.ts
---

# Mutation Reconciliation

Mutation safety combines current revisions, a shared filesystem lease, durable request IDs and explicit verification. Native edits produce `read_back` receipts; URL-only operations produce `url_dispatched`. Neither provides a database transaction or general undo [@service] [@state].

## Request lifecycle

The service fingerprints the operation and input. A matching completed request returns its stored receipt without another native mutation. Reusing an ID for different input fails. Pending or unknown prior requests do not execute again automatically. Permission and precondition checks occur before the pending record and action; uncertain post-action results remain protected from replay [@service] [@state].

Native mutations read back the target. Project revisions include child snapshots, and project mutations compare child membership and preserve exposed content. A failed child read or unexpected membership change cannot yield a successful move receipt [@adapter] [@service].

## Project move descendants

Since 1.0.1, successful project moves include `descendantImpact`. It compares every returned child by stable ID, including logged children, using the reads already required for verification. Counts are complete for those successful reads; changed-task details stop at twenty IDs. Tag ordering alone is not an assignment change. No title, note or field value enters the summary [@service] [@state].

A zero changed count only means exposed child fields were unchanged. Inherited placement, checklists, headings and repeat templates are not fully observable. Concurrent external edits can contribute to differences because snapshots are not atomic [@service].

The summary survives journal reload and replay. Tests cover 1,205 children, detail truncation, empty projects, failures, protected content, old receipts and agreement between structured and text MCP responses [@tests] [@protocol]. See [Tool Contract](../reference/planned-tool-contract.md).
