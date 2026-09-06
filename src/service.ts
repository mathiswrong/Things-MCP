import { z } from "zod";
import {
  type Adapter,
  createSchema,
  fingerprint,
  type Item,
  moveSchema,
  present,
  querySchema,
  type Reference,
  referenceSchema,
  scheduleSchema,
  trashSchema,
  updateSchema,
} from "./domain.js";
import { BridgeError } from "./errors.js";
import type { Lease, Receipt, State } from "./state.js";

export class ThingsService {
  constructor(
    private readonly adapter: Adapter,
    private readonly state: State,
  ) {}
  async health() {
    await this.state.initialize();
    return {
      ...(await this.adapter.health()),
      writesEnabled: await this.state.writesEnabled(),
      trashEnabled: await this.state.trashEnabled(),
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
    return this.mutate("create", value, async (lease) => {
      await lease.assertOwned();
      const target = await this.adapter.create(value, lease.signal);
      await lease.assertOwned();
      const current = await this.adapter.get(target, lease.signal);
      this.verify(current, {
        title: value.title,
        ...(value.notes !== undefined ? { notes: value.notes } : {}),
      });
      return {
        target,
        changedFields: [
          "title",
          ...(value.notes !== undefined ? ["notes"] : []),
        ],
      };
    });
  }
  async update(input: unknown) {
    const value = this.parse(updateSchema, input);
    return this.mutate(
      "update",
      value,
      async (lease) => {
        await lease.assertOwned();
        const target = await this.adapter.update(value, lease.signal);
        await lease.assertOwned();
        this.verify(
          await this.adapter.get(target, lease.signal),
          value.changes,
        );
        return { target, changedFields: Object.keys(value.changes) };
      },
      value,
    );
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
    let before: Awaited<ReturnType<ThingsService["projectTasks"]>> | undefined;
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
        const descendantImpact = before
          ? this.compareProjectTasks(
              before,
              await this.projectTasks(value.target.id, lease),
            )
          : undefined;
        return {
          target,
          changedFields: ["placement"],
          ...(descendantImpact ? { descendantImpact } : {}),
        };
      },
      value,
      false,
      async (lease) => {
        const destination = value.destination;
        if (destination.kind === "area" || destination.kind === "project") {
          const parent = await this.adapter.get(destination, lease.signal);
          if (parent.inTrash) throw new BridgeError("INVALID_INPUT");
        }
        if (value.target.kind === "project") {
          before = await this.projectTasks(value.target.id, lease);
          const current = await this.adapter.get(value.target, lease.signal);
          if (fingerprint(current) !== value.expectedRevision)
            throw new BridgeError("STALE_ITEM");
        }
      },
    );
  }
  private async projectTasks(id: string, lease: Lease) {
    const items = new Map<string, Item>();
    for (let offset = 0; offset < 1000; offset += 100) {
      await lease.assertOwned();
      const page = await this.adapter.find(
        querySchema.parse({
          kind: "todo",
          parent: { kind: "project", id },
          limit: 100,
          offset,
          includeNotes: true,
        }),
        lease.signal,
      );
      await lease.assertOwned();
      for (const item of page.items) items.set(item.id, item);
      if (!page.hasMore) return { items, complete: page.scanComplete };
    }
    return { items, complete: false };
  }
  private compareProjectTasks(
    before: { items: Map<string, Item>; complete: boolean },
    after: { items: Map<string, Item>; complete: boolean },
  ): NonNullable<Receipt["descendantImpact"]> {
    let comparedCount = 0;
    let changedCount = 0;
    const changes: { id: string; changedFields: string[] }[] = [];
    for (const [id, previous] of before.items) {
      const current = after.items.get(id);
      if (!current) continue;
      comparedCount++;
      const fields = new Set([
        ...Object.keys(previous),
        ...Object.keys(current),
      ]);
      const changedFields = [...fields]
        .filter(
          (field) =>
            previous[field as keyof Item] !== current[field as keyof Item],
        )
        .sort();
      if (changedFields.length) {
        changedCount++;
        if (changes.length < 20) changes.push({ id, changedFields });
      }
    }
    return {
      scope: "exposed_task_fields",
      beforeCount: before.items.size,
      afterCount: after.items.size,
      beforeComplete: before.complete,
      afterComplete: after.complete,
      comparedCount,
      changedCount,
      unchangedExposedFieldsCount: comparedCount - changedCount,
      notComparedCount:
        before.items.size + after.items.size - 2 * comparedCount,
      changes,
      changesTruncated: changedCount > changes.length,
      limitations:
        "Counts cover observed non-Trash project tasks, up to 1000 per snapshot. Incomplete counts are lower bounds. Only tasks present in both snapshots are compared. Unchanged exposed fields do not mean unaffected: inherited list behavior and hidden checklists are not verified. Concurrent edits may contribute to observed differences; snapshots are not atomic.",
    };
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
  private parse<T>(schema: z.ZodType<T>, input: unknown): T {
    const result = schema.safeParse(input);
    if (!result.success) throw new BridgeError("INVALID_INPUT");
    return result.data;
  }
  private verify(actual: Item, expected: Partial<Item>) {
    if (
      Object.entries(expected).some(
        ([key, value]) => actual[key as keyof Item] !== value,
      )
    ) {
      throw new BridgeError("VERIFICATION_FAILED");
    }
  }
  private async mutate(
    operation: string,
    input: { requestId: string },
    action: (
      lease: Lease,
    ) => Promise<Omit<Receipt, "requestId" | "verification">>,
    precondition?: { target: Reference; expectedRevision: string },
    requiresTrash = false,
    beforeWrite?: (lease: Lease) => Promise<void>,
  ) {
    return this.state.exclusive(async (lease) => {
      if (!(await this.state.writesEnabled()))
        throw new BridgeError("READ_ONLY");
      if (requiresTrash && !(await this.state.trashEnabled()))
        throw new BridgeError("TRASH_DISABLED");
      const hash = fingerprint({ operation, input });
      const previous = await this.state.operation(input.requestId);
      if (previous) {
        if (previous.fingerprint !== hash)
          throw new BridgeError("REQUEST_CONFLICT");
        if (previous.state === "completed" && previous.receipt)
          return { ...previous.receipt, replayed: true };
        throw new BridgeError("OUTCOME_UNKNOWN");
      }
      if (precondition) {
        const current = await this.adapter.get(
          precondition.target,
          lease.signal,
        );
        if (fingerprint(current) !== precondition.expectedRevision)
          throw new BridgeError("STALE_ITEM");
        if (current.inTrash) throw new BridgeError("INVALID_INPUT");
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
        const receipt: Receipt = {
          requestId: input.requestId,
          ...result,
          verification: "read_back",
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
