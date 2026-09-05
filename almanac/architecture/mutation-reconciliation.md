---
title: "Mutation Reconciliation"
summary: "Mutation reconciliation is the planned safety model for applying Things writes through request IDs, serialized execution, an operation journal, and read-back verification."
topics: [mutation-safety, local-service, planned-tools]
sources:
  - id: plan
    type: file
    path: PLAN.md
  - id: service
    type: file
    path: src/service.ts
  - id: state
    type: file
    path: src/state.ts
  - id: domain
    type: file
    path: src/domain.ts
---

# Mutation Reconciliation

Mutation reconciliation is the repository's safety model for Things writes. The plan rejects blind retries and impossible exactly-once guarantees, so every mutation is expected to carry a request ID, run through one serialized write path, record its progress locally, and verify the resulting Things state with a read after the write [@plan]. The current TypeScript scaffold implements an initial subset of that model for direct create, update, and schedule calls, while the broader preview/apply workflow remains part of the planned MCP tool contract rather than a complete server surface [@service].

## Boundary

The reconciliation layer belongs between MCP tool calls and Things automation adapters. The plan places all clients behind one Mac service so local stdio clients, tunnelled clients, and future HTTPS clients share the same mutation queue, permission policy, and retry journal [@plan]. That placement matters because a request ID only prevents duplicate or conflicting writes if every write path reaches the same journal and lock before touching Things.

This architecture also depends on [Permissions And Authorization](permissions-and-authorization). Reconciliation reduces accidental duplicate work, but it is not the permission system. The plan requires permissions to be enforced on the Mac for every request, including direct calls and batches, before task data is read or changed [@plan].

## Request Identity

Every mutation takes a caller-supplied `requestId`. The domain schema requires UUID request IDs for create, update, and schedule inputs [@domain]. The state layer stores each request under `request-<id>.json`, validates that the ID is a UUID before reading or writing the record, and rejects malformed IDs as invalid input [@state].

The service fingerprints the operation name and parsed input before executing a mutation [@service]. If the same request ID appears again with the same fingerprint and the earlier write completed, the service returns the stored receipt with `replayed: true`; if the fingerprint differs, it raises `REQUEST_CONFLICT` [@service]. This gives callers a safe retry shape for duplicate delivery while preventing them from reusing an old ID for a different write.

## Serialized Writes And The Journal

The plan requires writes to be serialized across all connected clients and recorded in a small local operation journal containing request fingerprints, status, and resulting IDs [@plan]. The current `State.exclusive` method creates the state directory with mode `0700`, rejects unsafe ownership or permissions, and wraps mutations in a `proper-lockfile` lock [@state]. If another write already holds the lock, the state layer reports `BUSY` rather than running a concurrent mutation [@state].

Journal records have three states: `pending`, `completed`, and `unknown` [@state]. The service writes `pending` before the adapter call, writes a completed receipt after read-back verification, and marks the request `unknown` when a native or unexpected failure leaves the outcome unclear [@service]. The plan names this exact failure mode: a timed-out create may already have committed in Things, so the server must return `OUTCOME_UNKNOWN` and reconcile instead of blindly retrying [@plan].

## Read-Apply-Read Verification

The planned write pattern is read current values, compare them with expected values, apply the change, and read back the result [@plan]. The implemented update and schedule inputs include `expectedRevision`, and the service compares it with a fingerprint of the current adapter result before writing; a mismatch raises `STALE_ITEM` [@service]. Revisions are deterministic SHA-256 fingerprints over canonicalized item data, so callers compare against the item shape returned by the service rather than relying on a Things database revision field [@domain].

After adapter execution, the service reads the target item again and compares the fields that should have changed [@service]. Completed receipts include the target, changed fields, request ID, and `verification: read_back` [@state]. This verifies the postcondition the service can observe, but it does not turn Things automation into a database transaction. The plan explicitly keeps the external app and sync race visible by detecting discrepancies and returning them instead of promising atomic compare-and-swap [@plan].

## Preview And Apply

The broader design adds `things_preview_changes` and `things_apply_changes` for larger edits. A preview is planned to capture affected IDs, expected current values, intended changes, and cascading effects; apply rejects stale previews [@plan]. That workflow belongs in the [Planned Tool Contract](../reference/planned-tool-contract) because it changes how clients present bulk or destructive operations.

The current scaffold does not yet expose preview/apply methods on `ThingsService`; it implements direct `create`, `update`, and `schedule` mutation methods plus `requestStatus` for checking a request ID after the fact [@service]. Future work should preserve the same journal semantics for preview/apply: stale previews must not apply, request IDs must not be reusable with different arguments, and completed receipts should describe the affected Things IDs.

## Failure Modes

The reconciliation model turns ambiguous failures into explicit states. `OUTCOME_UNKNOWN` means the write may have happened and the caller must read affected items before trying another action [@plan]. The state layer also treats a compromised lock as `OUTCOME_UNKNOWN`, which keeps lock failure from being mistaken for a clean non-write [@state].

Some failures are deliberately terminal for that request. Invalid input is rejected before journaling, disabled writes produce `READ_ONLY`, stale revisions produce `STALE_ITEM`, and a reused request ID with different arguments produces `REQUEST_CONFLICT` [@service]. Adapter denial and read-back mismatch are surfaced as `AUTOMATION_DENIED` and `VERIFICATION_FAILED`, while other adapter failures are converted to `OUTCOME_UNKNOWN` after the journal is marked unknown [@service].

Known Things automation limits still constrain reconciliation. Shortcuts result caps, checklist text limitations, unsupported recurrence routes, and uncertain exact ordering can make a postcondition incomplete or unavailable; those limits belong in [Known Capability Limits](../reference/known-capability-limits) rather than being hidden by retry logic [@plan].
