import { z } from "zod";
import {
  type Adapter,
  createSchema,
  fingerprint,
  type Item,
  present,
  querySchema,
  type Reference,
  referenceSchema,
  scheduleSchema,
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
    ) => Promise<{ target: Reference; changedFields: string[] }>,
    precondition?: { target: Reference; expectedRevision: string },
  ) {
    return this.state.exclusive(async (lease) => {
      if (!(await this.state.writesEnabled()))
        throw new BridgeError("READ_ONLY");
      const hash = fingerprint({ operation, input });
      const previous = await this.state.operation(input.requestId);
      if (previous) {
        if (previous.fingerprint !== hash)
          throw new BridgeError("REQUEST_CONFLICT");
        if (previous.state === "completed" && previous.receipt)
          return { ...previous.receipt, replayed: true };
        throw new BridgeError("OUTCOME_UNKNOWN");
      }
      if (
        precondition &&
        fingerprint(
          await this.adapter.get(precondition.target, lease.signal),
        ) !== precondition.expectedRevision
      ) {
        throw new BridgeError("STALE_ITEM");
      }
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
