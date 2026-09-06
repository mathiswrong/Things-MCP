import { z } from "zod";
import {
  type Adapter,
  createSchema,
  type DestructiveAction,
  type DestructiveScope,
  destructiveSchema,
  destructiveScopeSchema,
  fingerprint,
  type Item,
  moveSchema,
  navigateSchema,
  present,
  querySchema,
  type Reference,
  referenceSchema,
  restoreSchema,
  type ScopeItem,
  scheduleSchema,
  trashSchema,
  type Update,
  updateSchema,
} from "./domain.js";
import { BridgeError } from "./errors.js";
import type { Lease, Receipt, State, UrlReceipt } from "./state.js";
import { urlActionSchema, urlCommand } from "./url-domain.js";
import { NativeUrlTransport, type UrlTransport } from "./url-transport.js";

export class ThingsService {
  constructor(
    private readonly adapter: Adapter,
    private readonly state: State,
    private readonly urls: UrlTransport = new NativeUrlTransport(),
  ) {}
  async url(input: unknown) {
    const value = this.parse(urlActionSchema, input);
    const command = urlCommand(value);
    if (Buffer.byteLength(JSON.stringify(command)) > 240000)
      throw new BridgeError("INVALID_INPUT");
    return this.state.exclusive(async (lease) => {
      if (!(await this.state.writesEnabled()))
        throw new BridgeError("READ_ONLY");
      const hash = fingerprint({ operation: "url", input: value });
      const previous = await this.state.operation(value.requestId);
      if (previous) {
        if (previous.fingerprint !== hash)
          throw new BridgeError("REQUEST_CONFLICT");
        if (
          previous.state === "dispatched" &&
          previous.receipt?.verification === "url_dispatched"
        )
          return { ...previous.receipt, replayed: true };
        throw new BridgeError("OUTCOME_UNKNOWN");
      }
      if ("target" in value) {
        const current = await this.adapter.get(value.target, lease.signal);
        if (current.inTrash) throw new BridgeError("INVALID_INPUT");
        if (fingerprint(current) !== value.expectedRevision)
          throw new BridgeError("STALE_ITEM");
        if (value.action === "edit" && value.changes.heading) {
          const projectId = value.changes.projectId ?? current.projectId;
          if (!projectId) throw new BridgeError("INVALID_INPUT");
          if (
            (
              await this.adapter.get(
                { kind: "project", id: projectId },
                lease.signal,
              )
            ).inTrash
          )
            throw new BridgeError("INVALID_INPUT");
        }
      }
      if (value.action === "template") {
        const item = value.item;
        await this.validateReferences(
          item.kind === "project"
            ? { areaId: item.areaId }
            : item.list?.kind === "project"
              ? { projectId: item.list.id }
              : { areaId: item.list?.id },
        );
      }
      if (value.action === "edit" || value.action === "duplicate") {
        command.parameters["auth-token"] = await this.urls.token(lease.signal);
        const current = await this.adapter.get(value.target, lease.signal);
        if (fingerprint(current) !== value.expectedRevision)
          throw new BridgeError("STALE_ITEM");
      }
      await this.state.checkCapacity();
      await this.state.record(
        value.requestId,
        { fingerprint: hash, state: "pending" },
        lease,
      );
      try {
        await lease.assertOwned();
        await this.urls.send(command, lease.signal);
        const receipt: UrlReceipt = {
          requestId: value.requestId,
          operation: value.action,
          ...("target" in value ? { target: value.target } : {}),
          verification: "url_dispatched",
          message:
            "Sent to Things; result not verified. Inspect Things before making another change. Do not repeat this request with a new ID.",
        };
        await lease.assertOwned();
        await this.state.record(
          value.requestId,
          { fingerprint: hash, state: "dispatched", receipt },
          lease,
        );
        return { ...receipt, replayed: false };
      } catch {
        await this.state
          .record(
            value.requestId,
            { fingerprint: hash, state: "unknown" },
            lease,
          )
          .catch(() => undefined);
        throw new BridgeError("OUTCOME_UNKNOWN");
      } finally {
        delete command.parameters["auth-token"];
      }
    });
  }
  async health() {
    await this.state.initialize();
    return {
      ...(await this.adapter.health()),
      writesEnabled: await this.state.writesEnabled(),
      trashEnabled: await this.state.trashEnabled(),
      advancedPermissions: {
        deleteContainer: await this.state.advancedEnabled("delete_container"),
        emptyTrash: await this.state.advancedEnabled("empty_trash"),
        logCompleted: await this.state.advancedEnabled("log_completed"),
        nativeVerification: this.adapter.destructiveVerified,
      },
    };
  }
  async get(input: unknown) {
    return present(await this.adapter.get(this.parse(referenceSchema, input)));
  }
  async find(input: unknown) {
    const query = this.parse(querySchema, input);
    const result = await this.adapter.find(query);
    return {
      ...result,
      items: result.items.map((item) => {
        const value = present(item);
        return query.includeNotes ? value : { ...value, notes: undefined };
      }),
    };
  }
  async create(input: unknown) {
    const value = this.parse(createSchema, input);
    return this.mutate(
      "create",
      value,
      async (lease) => {
        await lease.assertOwned();
        const target = await this.adapter.create(value, lease.signal);
        await lease.assertOwned();
        const current = await this.adapter.get(target, lease.signal);
        const { requestId: _requestId, kind: _kind, ...expected } = value;
        this.verify(current, expected);
        return {
          target,
          changedFields: [
            "title",
            ...(value.notes !== undefined ? ["notes"] : []),
          ],
        };
      },
      undefined,
      false,
      async () => this.validateReferences(value),
    );
  }
  async update(input: unknown) {
    const value = this.parse(updateSchema, input);
    let resolved: Update = value;
    return this.mutate(
      "update",
      value,
      async (lease) => {
        await lease.assertOwned();
        const target = await this.adapter.update(resolved, lease.signal);
        await lease.assertOwned();
        this.verify(
          await this.adapter.get(target, lease.signal),
          resolved.changes,
        );
        return { target, changedFields: Object.keys(resolved.changes) };
      },
      value,
      false,
      async (lease) => {
        const current = await this.adapter.get(value.target, lease.signal);
        if (fingerprint(current) !== value.expectedRevision)
          throw new BridgeError("STALE_ITEM");
        const {
          appendTitle,
          prependTitle,
          appendNotes,
          prependNotes,
          addTagIds,
          removeTagIds,
          ...changes
        } = value.changes;
        if (appendTitle !== undefined || prependTitle !== undefined)
          changes.title = `${prependTitle ?? ""}${current.title}${appendTitle ?? ""}`;
        if (appendNotes !== undefined || prependNotes !== undefined)
          changes.notes = `${prependNotes ?? ""}${current.notes ?? ""}${appendNotes ?? ""}`;
        if (addTagIds !== undefined || removeTagIds !== undefined) {
          if (!current.tagIds) throw new BridgeError("NATIVE_FAILURE");
          changes.tagIds = [
            ...new Set([...current.tagIds, ...(addTagIds ?? [])]),
          ]
            .filter((id) => !removeTagIds?.includes(id))
            .sort();
        }
        resolved = this.parse(updateSchema, { ...value, changes });
        await this.validateReferences(changes, value.target);
      },
    );
  }
  private async validateReferences(
    fields: {
      tagIds?: string[];
      projectId?: string;
      areaId?: string;
      parentTagId?: string | null;
    },
    target?: Reference,
  ) {
    for (const id of fields.tagIds ?? [])
      await this.adapter.get({ kind: "tag", id });
    for (const kind of ["project", "area"] as const) {
      const id = fields[kind === "project" ? "projectId" : "areaId"];
      if (id && (await this.adapter.get({ kind, id })).inTrash)
        throw new BridgeError("INVALID_INPUT");
    }
    let parentId = fields.parentTagId;
    const seen = new Set(target ? [target.id] : []);
    while (parentId) {
      if (seen.has(parentId) || seen.size > 100)
        throw new BridgeError("INVALID_INPUT");
      seen.add(parentId);
      parentId = (await this.adapter.get({ kind: "tag", id: parentId }))
        .parentTagId;
    }
  }
  async schedule(input: unknown) {
    const value = this.parse(scheduleSchema, input);
    return this.mutate(
      "schedule",
      value,
      async (lease) => {
        await lease.assertOwned();
        const target = await this.adapter.schedule(value, lease.signal);
        await lease.assertOwned();
        this.verify(await this.adapter.get(target, lease.signal), {
          scheduledDate: value.date,
        });
        return { target, changedFields: ["scheduledDate"] };
      },
      value,
    );
  }
  private async readScope(input: DestructiveScope, signal?: AbortSignal) {
    const items = await this.adapter.scope(input, signal);
    if (input.target) {
      const target = items.find(
        (item) =>
          item.kind === input.target?.kind && item.id === input.target.id,
      );
      if (!target) throw new BridgeError("NOT_FOUND");
      if (target.inTrash) throw new BridgeError("INVALID_INPUT");
      if (target.kind === "project" && target.status !== "open")
        throw new BridgeError("VERIFICATION_UNAVAILABLE");
    }
    return items.sort((a, b) =>
      `${a.kind}:${a.id}`.localeCompare(`${b.kind}:${b.id}`),
    );
  }
  async previewDestructive(input: unknown) {
    const value = this.parse(destructiveScopeSchema, input);
    const items = await this.readScope(value);
    return {
      action: value.action,
      target: value.target,
      scopeRevision: fingerprint({ value, items }),
      count: items.length,
      items: items.map((item) => ({
        kind: item.kind,
        id: item.id,
        title: item.title,
        status: item.status,
        inTrash: item.inTrash,
        effect: this.destructiveEffect(value, item, items),
      })),
      unobservableContents: ["checklists", "headings", "repeat templates"],
      atomic: false,
    };
  }
  private destructiveEffect(
    input: DestructiveScope,
    item: ScopeItem,
    items: ScopeItem[],
  ) {
    if (input.action === "empty_trash") return "permanent_delete";
    if (input.action === "log_completed") return "move_to_logbook";
    if (input.target?.kind === "tag")
      return item.kind === "tag" ? "delete_tag" : "remove_tag_assignments";
    if (input.target?.kind === "area") {
      if (item.kind === "area") return "permanent_delete";
      const parent = item.projectId
        ? items.find(
            (candidate) =>
              candidate.kind === "project" && candidate.id === item.projectId,
          )
        : undefined;
      if ((parent ?? item).inLogbook) return "detach_from_area";
    }
    return "move_to_trash";
  }
  async destructive(input: unknown) {
    const value = this.parse(destructiveSchema, input);
    const key =
      value.action === "delete_container" ? value.target?.kind : value.action;
    if (!key || !this.adapter.destructiveVerified[key])
      throw new BridgeError("VERIFICATION_UNAVAILABLE");
    const scopeInput = this.parse(destructiveScopeSchema, {
      action: value.action,
      ...(value.target ? { target: value.target } : {}),
    });
    let before: ScopeItem[] = [];
    return this.mutate(
      value.action,
      value,
      async (lease) => {
        await lease.assertOwned();
        await this.adapter.destructive(value, lease.signal);
        if (value.action === "empty_trash") {
          if ((await this.adapter.scope(scopeInput, lease.signal)).length)
            throw new BridgeError("VERIFICATION_FAILED");
        } else if (value.action === "log_completed") {
          for (const item of before)
            if (!(await this.adapter.inList(item, "logbook", lease.signal)))
              throw new BridgeError("VERIFICATION_FAILED");
        } else {
          const deletedTags = before
            .filter((item) => item.kind === "tag")
            .map((item) => item.id);
          for (const item of before) {
            const shouldDisappear =
              item.kind === "tag" ||
              (item.kind === "area" && value.target?.kind === "area");
            if (shouldDisappear) {
              try {
                await this.adapter.get(item, lease.signal);
              } catch (error) {
                if (error instanceof BridgeError && error.code === "NOT_FOUND")
                  continue;
                throw error;
              }
              throw new BridgeError("VERIFICATION_FAILED");
            }
            const actual = await this.adapter.get(item, lease.signal);
            this.verify(actual, {
              title: item.title,
              notes: item.notes,
              status: item.status,
              deadline: item.deadline,
              scheduledDate: item.scheduledDate,
              creationDate: item.creationDate,
              completionDate: item.completionDate,
              cancellationDate: item.cancellationDate,
              projectId: item.projectId,
              areaId: value.target?.kind === "area" ? null : item.areaId,
              ...(value.target?.kind === "tag" ? {} : { tagIds: item.tagIds }),
            });
            if (value.target?.kind === "tag")
              this.verify(actual, {
                title: item.title,
                notes: item.notes,
                tagIds: item.tagIds?.filter((id) => !deletedTags.includes(id)),
              });
            else if (
              this.destructiveEffect(scopeInput, item, before) ===
              "detach_from_area"
            ) {
              const parent = item.projectId
                ? before.find(
                    (candidate) =>
                      candidate.kind === "project" &&
                      candidate.id === item.projectId,
                  )
                : undefined;
              if (
                actual.inTrash ||
                !(await this.adapter.inList(
                  parent ?? item,
                  "logbook",
                  lease.signal,
                ))
              )
                throw new BridgeError("VERIFICATION_FAILED");
            } else if (!actual.inTrash)
              throw new BridgeError("VERIFICATION_FAILED");
          }
        }
        return {
          target: value.target ?? { kind: "todo" as const, id: "library" },
          changedFields: [value.action],
        };
      },
      undefined,
      false,
      async (lease) => {
        before = await this.readScope(scopeInput, lease.signal);
        if (
          fingerprint({ value: scopeInput, items: before }) !==
          value.expectedScopeRevision
        )
          throw new BridgeError("STALE_ITEM");
      },
      value.action,
    );
  }
  async count(input: unknown) {
    const query = this.parse(querySchema, input);
    if (query.offset !== 0) throw new BridgeError("INVALID_INPUT");
    return this.adapter.count(query);
  }
  async exists(input: unknown) {
    const target = this.parse(referenceSchema, input);
    try {
      await this.adapter.get(target);
      return { exists: true };
    } catch (error) {
      if (error instanceof BridgeError && error.code === "NOT_FOUND")
        return { exists: false };
      throw error;
    }
  }
  async navigate(input: unknown) {
    const value = this.parse(navigateSchema, input);
    return this.mutate("navigate", value, async (lease) => {
      await lease.assertOwned();
      await this.adapter.navigate(value, lease.signal);
      return {
        target: value.target ?? {
          kind: "todo" as const,
          id: value.list ?? "quick-entry",
        },
        changedFields: ["foreground_view"],
        verification: "command_accepted" as const,
      };
    });
  }
  async requestStatus(input: unknown) {
    const { requestId } = this.parse(
      z.strictObject({ requestId: z.uuid() }),
      input,
    );
    await this.state.initialize();
    const record = await this.state.operation(requestId);
    return record
      ? { requestId, state: record.state, receipt: record.receipt }
      : { requestId, state: "not_seen" };
  }
  async move(input: unknown) {
    const value = this.parse(moveSchema, input);
    return this.mutate(
      "move",
      value,
      async (lease) => {
        const destination = value.destination;
        await lease.assertOwned();
        const target = await this.adapter.move(value, lease.signal);
        await lease.assertOwned();
        const actual = await this.adapter.get(target, lease.signal);
        if (destination.kind === "project")
          this.verify(actual, { projectId: destination.id });
        else if (destination.kind === "area")
          this.verify(actual, {
            areaId: destination.id,
            ...(value.target.kind === "todo" ? { projectId: null } : {}),
          });
        else if (destination.kind === "detach")
          this.verify(actual, {
            [destination.parent === "project" ? "projectId" : "areaId"]: null,
          });
        else if (
          !(await this.adapter.inList(target, destination.list, lease.signal))
        )
          throw new BridgeError("VERIFICATION_FAILED");
        return { target, changedFields: ["placement"] };
      },
      value,
      false,
      async (lease) => {
        const destination = value.destination;
        if (destination.kind === "area" || destination.kind === "project") {
          const parent = await this.adapter.get(destination, lease.signal);
          if (parent.inTrash) throw new BridgeError("INVALID_INPUT");
        }
      },
    );
  }
  async trash(input: unknown) {
    const value = this.parse(trashSchema, input);
    return this.mutate(
      "trash",
      value,
      async (lease) => {
        await lease.assertOwned();
        const target = await this.adapter.trash(value, lease.signal);
        await lease.assertOwned();
        if (!(await this.adapter.inList(target, "trash", lease.signal)))
          throw new BridgeError("VERIFICATION_FAILED");
        return { target, changedFields: ["inTrash"] };
      },
      value,
      true,
    );
  }
  async restore(input: unknown) {
    const value = this.parse(restoreSchema, input);
    return this.mutate(
      "restore",
      value,
      async (lease) => {
        const before = await this.adapter.get(value.target, lease.signal);
        if (fingerprint(before) !== value.expectedRevision)
          throw new BridgeError("STALE_ITEM");
        await lease.assertOwned();
        const target = await this.adapter.restore(value, lease.signal);
        const actual = await this.adapter.get(target, lease.signal);
        this.verify(actual, {
          title: before.title,
          notes: before.notes,
          status: before.status,
          deadline: before.deadline,
          tagIds: before.tagIds,
          inTrash: false,
        });
        if (
          !(await this.adapter.inList(
            target,
            value.target.kind === "project" ? "today" : "inbox",
            lease.signal,
          ))
        )
          throw new BridgeError("VERIFICATION_FAILED");
        return { target, changedFields: ["inTrash", "placement"] };
      },
      value,
    );
  }
  private parse<T>(schema: z.ZodType<T>, input: unknown): T {
    const result = schema.safeParse(input);
    if (!result.success) throw new BridgeError("INVALID_INPUT");
    return result.data;
  }
  private verify(actual: Item, expected: Partial<Item>) {
    if (
      Object.entries(expected).some(([key, value]) => {
        const observed = actual[key as keyof Item];
        if (key === "tagIds" && Array.isArray(value) && Array.isArray(observed))
          return (
            fingerprint([...observed].sort()) !== fingerprint([...value].sort())
          );
        return observed !== value;
      })
    ) {
      throw new BridgeError("VERIFICATION_FAILED");
    }
  }
  private async mutate(
    operation: string,
    input: { requestId: string },
    action: (lease: Lease) => Promise<{
      target: Reference;
      changedFields: string[];
      verification?: "read_back" | "command_accepted";
    }>,
    precondition?: { target: Reference; expectedRevision: string },
    requiresTrash = false,
    beforeWrite?: (lease: Lease) => Promise<void>,
    advanced?: DestructiveAction,
  ) {
    return this.state.exclusive(async (lease) => {
      if (!(await this.state.writesEnabled()))
        throw new BridgeError("READ_ONLY");
      if (advanced && !(await this.state.advancedEnabled(advanced)))
        throw new BridgeError("ADVANCED_DISABLED");
      if (requiresTrash && !(await this.state.trashEnabled()))
        throw new BridgeError("TRASH_DISABLED");
      const hash = fingerprint({ operation, input });
      const previous = await this.state.operation(input.requestId);
      if (previous) {
        if (previous.fingerprint !== hash)
          throw new BridgeError("REQUEST_CONFLICT");
        if (
          previous.state === "completed" &&
          previous.receipt &&
          previous.receipt.verification !== "url_dispatched"
        )
          return { ...previous.receipt, replayed: true };
        throw new BridgeError("OUTCOME_UNKNOWN");
      }
      let children: Item[] | undefined;
      if (precondition) {
        const current = await this.adapter.get(
          precondition.target,
          lease.signal,
        );
        if (fingerprint(current) !== precondition.expectedRevision)
          throw new BridgeError("STALE_ITEM");
        if (
          operation === "restore"
            ? !current.inTrash || current.status !== "open"
            : current.inTrash
        )
          throw new BridgeError("INVALID_INPUT");
        if (operation === "trash" && current.status !== "open")
          throw new BridgeError("VERIFICATION_UNAVAILABLE");
        if (
          operation === "restore" &&
          current.kind === "todo" &&
          current.projectId
        ) {
          const parent = await this.adapter.get(
            { kind: "project", id: current.projectId },
            lease.signal,
          );
          if (parent.inTrash) throw new BridgeError("INVALID_INPUT");
        }
        if (precondition.target.kind === "project" && operation !== "restore") {
          children = await this.adapter.children(
            precondition.target,
            lease.signal,
          );
          if (
            fingerprint(
              [...children].sort((a, b) => a.id.localeCompare(b.id)),
            ) !== current.childRevision
          )
            throw new BridgeError("STALE_ITEM");
        }
      }
      await beforeWrite?.(lease);
      await this.state.checkCapacity();
      await this.state.record(
        input.requestId,
        {
          fingerprint: hash,
          state: "pending",
        },
        lease,
      );
      try {
        const result = await action(lease);
        if (children && precondition) {
          const afterChildren = await this.adapter.children(
            precondition.target,
            lease.signal,
          );
          if (
            fingerprint(afterChildren.map((item) => item.id).sort()) !==
            fingerprint(children.map((item) => item.id).sort())
          )
            throw new BridgeError("VERIFICATION_FAILED");
          const changedStatus =
            operation === "update"
              ? (input as Update).changes.status
              : undefined;
          for (const before of children) {
            const after = await this.adapter.get(before, lease.signal);
            this.verify(after, {
              title: before.title,
              notes: before.notes,
              projectId: before.projectId,
              deadline: before.deadline,
              tagIds: before.tagIds,
              status:
                before.status === "open" &&
                changedStatus &&
                changedStatus !== "open"
                  ? changedStatus
                  : before.status,
            });
          }
        }
        const receipt: Receipt = {
          requestId: input.requestId,
          ...result,
          verification: result.verification ?? "read_back",
        };
        await lease.assertOwned();
        await this.state.record(
          input.requestId,
          {
            fingerprint: hash,
            state: "completed",
            receipt,
          },
          lease,
        );
        return { ...receipt, replayed: false };
      } catch (error) {
        await this.state
          .record(
            input.requestId,
            { fingerprint: hash, state: "unknown" },
            lease,
          )
          .catch(() => undefined);
        if (
          error instanceof BridgeError &&
          ["AUTOMATION_DENIED", "VERIFICATION_FAILED"].includes(error.code)
        )
          throw error;
        throw new BridgeError("OUTCOME_UNKNOWN");
      }
    });
  }
}
