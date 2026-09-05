import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  type Adapter,
  type Create,
  fingerprint,
  type Item,
  type Query,
  type Reference,
  type Schedule,
  type Update,
} from "../src/domain.js";
import { BridgeError, type ErrorCode } from "../src/errors.js";
import { ThingsService } from "../src/service.js";
import { type Lease, State } from "../src/state.js";

class MemoryAdapter implements Adapter {
  items = new Map<string, Item>();
  mutations = { create: 0, update: 0, schedule: 0 };
  reads = 0;
  failRead = false;
  failAfterCreate = false;
  discardWrites = false;
  onRead?: (signal?: AbortSignal) => Promise<void>;

  async health() {
    return { version: "fixture", running: true, timezone: "UTC" };
  }
  async get(reference: Reference, signal?: AbortSignal) {
    this.reads += 1;
    await this.onRead?.(signal);
    if (this.failRead) throw new BridgeError("NATIVE_FAILURE");
    const item = this.items.get(reference.id);
    if (!item || item.kind !== reference.kind)
      throw new BridgeError("NOT_FOUND");
    return { ...item };
  }
  async find(query: Query) {
    const matches = [...this.items.values()].filter(
      (item) =>
        item.kind === query.kind &&
        item.title.includes(query.text) &&
        (!query.status || item.status === query.status),
    );
    const next = query.offset + query.limit;
    const hasMore = matches.length > next;
    return {
      items: matches.slice(query.offset, next).map((item) => ({ ...item })),
      hasMore,
      scanComplete: true,
      nextOffset: hasMore ? next : null,
    };
  }
  async create(input: Create) {
    this.mutations.create += 1;
    const target = { kind: input.kind, id: `item-${this.mutations.create}` };
    this.items.set(target.id, {
      ...target,
      title: this.discardWrites ? "Unchanged title" : input.title,
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    });
    if (this.failAfterCreate) throw new BridgeError("NATIVE_FAILURE");
    return target;
  }
  async update(input: Update) {
    this.mutations.update += 1;
    const item = this.items.get(input.target.id);
    if (!item) throw new BridgeError("NOT_FOUND");
    if (!this.discardWrites)
      this.items.set(item.id, { ...item, ...input.changes });
    return input.target;
  }
  async schedule(input: Schedule) {
    this.mutations.schedule += 1;
    const item = this.items.get(input.target.id);
    if (!item) throw new BridgeError("NOT_FOUND");
    if (!this.discardWrites)
      this.items.set(item.id, { ...item, scheduledDate: input.date });
    return input.target;
  }
}

async function fixture(
  run: (value: {
    directory: string;
    state: State;
    adapter: MemoryAdapter;
    service: ThingsService;
  }) => Promise<void>,
  allowWrites = true,
) {
  const parent = join(homedir(), "Downloads", "Things-MCP-tests");
  await mkdir(parent, { recursive: true });
  const directory = await mkdtemp(join(parent, "core-"));
  try {
    const state = new State(directory);
    if (allowWrites) await state.setWrites(true);
    const adapter = new MemoryAdapter();
    await run({
      directory,
      state,
      adapter,
      service: new ThingsService(adapter, state),
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

function code(expected: ErrorCode) {
  return (error: unknown) =>
    error instanceof BridgeError && error.code === expected;
}
function seed(adapter: MemoryAdapter): Item {
  const item: Item = {
    kind: "todo",
    id: "synthetic-task",
    title: "Read a book",
    notes: "Synthetic private note",
    status: "open",
  };
  adapter.items.set(item.id, item);
  return item;
}
function update(item: Item) {
  return {
    requestId: randomUUID(),
    target: { kind: item.kind, id: item.id },
    expectedRevision: fingerprint(item),
    changes: { title: "Read two books" },
  };
}

test("a read-only connection stays restricted when shared write permission changes", async () => {
  await fixture(async ({ adapter, state, directory }) => {
    const restricted = new State(directory, false);
    const service = new ThingsService(adapter, restricted);
    const item = seed(adapter);
    for (const enabled of [true, false, true]) {
      await state.setWrites(enabled);
      assert.equal(await state.writesEnabled(), enabled);
      assert.equal((await service.health()).writesEnabled, false);
      await assert.rejects(
        service.create({
          requestId: randomUUID(),
          kind: "todo",
          title: "Never created",
        }),
        code("READ_ONLY"),
      );
      await assert.rejects(service.update(update(item)), code("READ_ONLY"));
      await assert.rejects(
        service.schedule({
          requestId: randomUUID(),
          target: { kind: item.kind, id: item.id },
          expectedRevision: fingerprint(item),
          date: "2026-09-05",
        }),
        code("READ_ONLY"),
      );
    }
    assert.equal(adapter.reads, 0);
    assert.deepEqual(adapter.mutations, { create: 0, update: 0, schedule: 0 });
  });
});

test("client grants are independent and revocation survives unchanged host configuration and restarts", async () => {
  await fixture(async ({ state, adapter, directory }) => {
    const desktop = new State(directory, true, "desktop-extension");
    const browser = new State(directory, true, "browser");
    await desktop.configureClient(false);
    await browser.configureClient(false);
    await state.setWrites(true);
    assert.equal(await desktop.writesEnabled(), false);
    assert.equal(await browser.writesEnabled(), false);
    await desktop.configureClient(true);
    assert.equal(await desktop.writesEnabled(), true);
    assert.equal(await browser.writesEnabled(), false);
    const service = new ThingsService(adapter, desktop);
    await service.create({
      requestId: randomUUID(),
      kind: "todo",
      title: "Native setting fixture",
    });
    await state.setWrites(false);
    await desktop.configureClient(true);
    const restarted = new State(directory, true, "desktop-extension");
    await restarted.configureClient(true);
    assert.equal(await restarted.writesEnabled(), false);
    await assert.rejects(
      service.create({
        requestId: randomUUID(),
        kind: "todo",
        title: "Must not exist",
      }),
      code("READ_ONLY"),
    );
    await restarted.configureClient(false);
    await restarted.configureClient(true);
    assert.equal(await restarted.writesEnabled(), true);
    assert.equal(await state.writesEnabled(), false);
    assert.equal(await browser.writesEnabled(), false);
    await restarted.configureClient(false);
    assert.equal(await desktop.writesEnabled(), false);
    assert.equal(adapter.mutations.create, 1);
  });
});

test("ordinary writes are denied by default before any adapter access", async () => {
  await fixture(async ({ adapter, service }) => {
    const item = seed(adapter);
    await assert.rejects(
      service.create({
        requestId: randomUUID(),
        kind: "todo",
        title: "Synthetic task",
      }),
      code("READ_ONLY"),
    );
    await assert.rejects(service.update(update(item)), code("READ_ONLY"));
    await assert.rejects(
      service.schedule({
        ...update(item),
        changes: undefined,
        date: "2026-09-05",
      }),
      code("INVALID_INPUT"),
    );
    await assert.rejects(
      service.schedule({
        requestId: randomUUID(),
        target: { kind: item.kind, id: item.id },
        expectedRevision: fingerprint(item),
        date: "2026-09-05",
      }),
      code("READ_ONLY"),
    );
    assert.deepEqual(adapter.mutations, { create: 0, update: 0, schedule: 0 });
    assert.equal(adapter.reads, 0);
  }, false);
});

test("strict inputs reject impossible dates, unsupported fields, and type-specific changes", async () => {
  await fixture(async ({ adapter, service }) => {
    const item = seed(adapter);
    const invalid: Array<() => Promise<unknown>> = [
      () =>
        service.update({
          ...update(item),
          changes: { deadline: "2026-02-29" },
        }),
      () =>
        service.update({
          ...update(item),
          changes: { deadline: "2026-04-31" },
        }),
      () => service.update({ ...update(item), changes: { title: " " } }),
      () => service.update({ ...update(item), changes: {} }),
      () =>
        service.update({
          ...update(item),
          changes: { notes: "x", delete: true },
        }),
      () =>
        service.update({
          ...update(item),
          target: { kind: "tag", id: item.id },
          changes: { status: "completed" },
        }),
      () =>
        service.update({
          ...update(item),
          target: { kind: "area", id: item.id },
          changes: { notes: "x" },
        }),
      () =>
        service.create({
          requestId: randomUUID(),
          kind: "area",
          title: "Area",
          notes: "x",
        }),
      () =>
        service.create({
          requestId: randomUUID(),
          kind: "tag",
          title: "Tag",
          notes: "x",
        }),
      () =>
        service.create({
          requestId: randomUUID(),
          kind: "todo",
          title: "Task",
          arbitraryScript: "execute",
        }),
      () => service.get({ kind: "todo", id: "../settings" }),
      () => service.find({ limit: 101 }),
      () => service.find({ includeNotes: "true" }),
      () => service.find({ unknown: true }),
      () => service.requestStatus({ requestId: "../../settings" }),
      () =>
        service.schedule({
          requestId: randomUUID(),
          target: { kind: "tag", id: item.id },
          expectedRevision: fingerprint(item),
          date: "2026-09-05",
        }),
      () =>
        service.schedule({
          requestId: randomUUID(),
          target: { kind: "todo", id: item.id },
          expectedRevision: fingerprint(item),
          date: "2026-13-01",
        }),
    ];
    for (const action of invalid)
      await assert.rejects(action(), code("INVALID_INPUT"));
    assert.deepEqual(adapter.mutations, { create: 0, update: 0, schedule: 0 });
    assert.equal(adapter.reads, 0);
  });
});

test("create returns a verified receipt and stores no task content in the journal", async () => {
  await fixture(async ({ adapter, service, state, directory }) => {
    const request = {
      requestId: randomUUID(),
      kind: "todo",
      title: "Synthetic task",
      notes: "Synthetic confidential note",
    };
    const receipt = await service.create(request);
    assert.deepEqual(receipt, {
      requestId: request.requestId,
      target: { kind: "todo", id: "item-1" },
      changedFields: ["title", "notes"],
      verification: "read_back",
      replayed: false,
    });
    assert.equal(adapter.reads, 1);
    const record = await state.operation(request.requestId);
    assert.equal(record?.state, "completed");
    assert.equal(JSON.stringify(record).includes(request.title), false);
    assert.equal(JSON.stringify(record).includes(request.notes), false);
    assert.equal(
      (await stat(join(directory, `request-${request.requestId}.json`))).mode &
        0o077,
      0,
    );
    assert.deepEqual(
      await service.requestStatus({ requestId: request.requestId }),
      {
        requestId: request.requestId,
        state: "completed",
        receipt: record?.receipt,
      },
    );
  });
});

test("completed requests replay across fresh service and state instances without another write", async () => {
  await fixture(async ({ adapter, service, directory }) => {
    const request = {
      requestId: randomUUID(),
      kind: "project",
      title: "Synthetic project",
    };
    const receipt = await service.create(request);
    const fresh = new ThingsService(adapter, new State(directory));
    assert.deepEqual(
      await fresh.create({
        title: request.title,
        kind: request.kind,
        requestId: request.requestId,
      }),
      { ...receipt, replayed: true },
    );
    assert.equal(adapter.mutations.create, 1);
    assert.equal(adapter.reads, 1);
  });
});

test("a request ID cannot be reused with different arguments or operations", async () => {
  await fixture(async ({ adapter, service }) => {
    const request = {
      requestId: randomUUID(),
      kind: "todo",
      title: "Synthetic task",
    };
    await service.create(request);
    await assert.rejects(
      service.create({ ...request, title: "Another task" }),
      code("REQUEST_CONFLICT"),
    );
    const item = adapter.items.get("item-1");
    assert.ok(item);
    await assert.rejects(
      service.update({ ...update(item), requestId: request.requestId }),
      code("REQUEST_CONFLICT"),
    );
    assert.deepEqual(adapter.mutations, { create: 1, update: 0, schedule: 0 });
  });
});

test("stale revisions prevent updates and schedules without recording a write attempt", async () => {
  await fixture(async ({ adapter, service, state }) => {
    const item = seed(adapter);
    const request = update(item);
    adapter.items.set(item.id, {
      ...item,
      notes: "Changed outside this request",
    });
    await assert.rejects(service.update(request), code("STALE_ITEM"));
    await assert.rejects(
      service.schedule({
        requestId: randomUUID(),
        target: request.target,
        expectedRevision: request.expectedRevision,
        date: "2028-02-29",
      }),
      code("STALE_ITEM"),
    );
    assert.equal(await state.operation(request.requestId), undefined);
    assert.deepEqual(adapter.mutations, { create: 0, update: 0, schedule: 0 });
  });
});

for (const failure of [
  "readback unavailable",
  "readback mismatch",
  "write outcome uncertain",
] as const) {
  test(`${failure} never causes the same request to execute again`, async () => {
    await fixture(async ({ adapter, service, state, directory }) => {
      const request = {
        requestId: randomUUID(),
        kind: "todo",
        title: "Synthetic task",
      };
      adapter.failRead = failure === "readback unavailable";
      adapter.discardWrites = failure === "readback mismatch";
      adapter.failAfterCreate = failure === "write outcome uncertain";
      await assert.rejects(
        service.create(request),
        code(
          failure === "readback mismatch"
            ? "VERIFICATION_FAILED"
            : "OUTCOME_UNKNOWN",
        ),
      );
      assert.equal(
        (await state.operation(request.requestId))?.state,
        "unknown",
      );
      adapter.failRead = false;
      adapter.discardWrites = false;
      adapter.failAfterCreate = false;
      const fresh = new ThingsService(adapter, new State(directory));
      await assert.rejects(fresh.create(request), code("OUTCOME_UNKNOWN"));
      assert.equal(adapter.mutations.create, 1);
    });
  });
}

test("a pending journal entry left by an interrupted process blocks re-execution", async () => {
  await fixture(async ({ adapter, state, directory }) => {
    const request = {
      requestId: randomUUID(),
      kind: "todo",
      title: "Synthetic task",
    };
    await state.exclusive(() =>
      state.record(request.requestId, {
        state: "pending",
        fingerprint: fingerprint({ operation: "create", input: request }),
      }),
    );
    const fresh = new ThingsService(adapter, new State(directory));
    await assert.rejects(fresh.create(request), code("OUTCOME_UNKNOWN"));
    assert.equal(adapter.mutations.create, 0);
  });
});

test("two state instances share one lock and release it after a failed operation", async () => {
  await fixture(async ({ state, directory }) => {
    const other = new State(directory);
    let finish!: () => void;
    let entered!: () => void;
    const started = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const hold = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const first = state.exclusive(async () => {
      entered();
      await hold;
    });
    await started;
    try {
      let called = false;
      await assert.rejects(
        other.exclusive(async () => {
          called = true;
        }),
        code("BUSY"),
      );
      assert.equal(called, false);
    } finally {
      finish();
      await first;
    }
    await assert.rejects(
      other.exclusive(async () => {
        throw new Error("Synthetic failure");
      }),
      /Synthetic failure/,
    );
    assert.equal(await state.exclusive(async () => "released"), "released");
  });
});

test("search omits notes by default while its revision remains valid for editing", async () => {
  await fixture(async ({ adapter, service }) => {
    const item = seed(adapter);
    const found = await service.find({});
    const first = found.items[0];
    assert.ok(first);
    assert.equal(first.notes, undefined);
    assert.equal(JSON.stringify(found).includes(item.notes as string), false);
    assert.equal(first.revision, fingerprint(item));
    assert.equal(
      (await service.find({ includeNotes: true })).items[0]?.notes,
      item.notes,
    );
    const receipt = await service.update({
      ...update(item),
      expectedRevision: first.revision,
    });
    assert.equal(receipt.verification, "read_back");
    assert.equal(adapter.items.get(item.id)?.notes, item.notes);
    assert.equal(adapter.items.get(item.id)?.title, "Read two books");
  });
});

test("a valid leap day is scheduled and verified before a receipt is issued", async () => {
  await fixture(async ({ adapter, service }) => {
    const item = seed(adapter);
    const request = {
      requestId: randomUUID(),
      target: { kind: "todo", id: item.id },
      expectedRevision: fingerprint(item),
      date: "2028-02-29",
    };
    const receipt = await service.schedule(request);
    assert.equal(receipt.verification, "read_back");
    assert.deepEqual(receipt.changedFields, ["scheduledDate"]);
    assert.equal(adapter.items.get(item.id)?.scheduledDate, request.date);
    assert.equal((await service.schedule(request)).replayed, true);
    assert.equal(adapter.mutations.schedule, 1);
  });
});

test("revoking writes applies to an existing service on its next request", async () => {
  await fixture(async ({ adapter, service, directory }) => {
    await new State(directory).setWrites(false);
    await assert.rejects(
      service.create({
        requestId: randomUUID(),
        kind: "todo",
        title: "Synthetic task",
      }),
      code("READ_ONLY"),
    );
    assert.equal(adapter.mutations.create, 0);
  });
});

test("a corrupt journal fails closed before another write", async () => {
  await fixture(async ({ adapter, service, directory }) => {
    const request = {
      requestId: randomUUID(),
      kind: "todo",
      title: "Synthetic task",
    };
    await writeFile(
      join(directory, `request-${request.requestId}.json`),
      "{invalid",
      { mode: 0o600 },
    );
    await assert.rejects(service.create(request), code("STATE_FAILURE"));
    assert.equal(adapter.mutations.create, 0);
  });
});

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

test("replacing the lock during a precondition read aborts before any native mutation or journal receipt", async () => {
  await fixture(async ({ adapter, service, state, directory }) => {
    const item = seed(adapter);
    const request = update(item);
    const entered = deferred<AbortSignal>();
    const resume = deferred();
    adapter.onRead = async (signal) => {
      assert.ok(signal);
      entered.resolve(signal);
      await resume.promise;
    };
    const outcome = assert.rejects(
      service.update(request),
      code("OUTCOME_UNKNOWN"),
    );
    const signal = await entered.promise;
    const lockPath = `${directory}.lock`;
    try {
      assert.equal(signal.aborted, false);
      await rm(lockPath, { recursive: true });
      await mkdir(lockPath);
      const replacement = await lstat(lockPath);
      resume.resolve();
      await outcome;
      assert.equal(signal.aborted, true);
      assert.deepEqual(adapter.mutations, {
        create: 0,
        update: 0,
        schedule: 0,
      });
      assert.equal(await state.operation(request.requestId), undefined);
      assert.equal((await lstat(lockPath)).ino, replacement.ino);
    } finally {
      resume.resolve();
      await outcome;
      await rm(lockPath, { recursive: true, force: true });
    }
  });
});

test("a lost lease aborts its signal and cannot remove a replacement holder's lock", async () => {
  await fixture(async ({ state, directory }) => {
    const oldEntered = deferred<Lease>();
    const resumeOld = deferred();
    const newEntered = deferred<Lease>();
    const resumeNew = deferred();
    const oldOutcome = assert.rejects(
      state.exclusive(async (lease) => {
        oldEntered.resolve(lease);
        await resumeOld.promise;
        await lease.assertOwned();
      }),
      code("OUTCOME_UNKNOWN"),
    );
    const oldLease = await oldEntered.promise;
    const lockPath = `${directory}.lock`;
    let replacement: Promise<void> | undefined;
    try {
      await rm(lockPath, { recursive: true });
      replacement = new State(directory).exclusive(async (lease) => {
        newEntered.resolve(lease);
        await resumeNew.promise;
      });
      const newLease = await newEntered.promise;
      const replacementStat = await lstat(lockPath);
      resumeOld.resolve();
      await oldOutcome;
      assert.equal(oldLease.signal.aborted, true);
      assert.equal(newLease.signal.aborted, false);
      assert.equal((await lstat(lockPath)).ino, replacementStat.ino);
      await newLease.assertOwned();
    } finally {
      resumeOld.resolve();
      resumeNew.resolve();
      await oldOutcome;
      await replacement;
      await rm(lockPath, { recursive: true, force: true });
    }
  });
});

test("a symlinked settings file cannot enable writes", async () => {
  await fixture(async ({ adapter, service, directory }) => {
    const target = join(directory, "synthetic-settings.json");
    await writeFile(target, JSON.stringify({ allowWrites: true }), {
      mode: 0o600,
    });
    await symlink(target, join(directory, "settings.json"));
    await assert.rejects(
      service.create({
        requestId: randomUUID(),
        kind: "todo",
        title: "Synthetic task",
      }),
      code("STATE_FAILURE"),
    );
    assert.equal(adapter.mutations.create, 0);
  }, false);
});

test("a permissive state directory prevents access and mutation", async () => {
  await fixture(async ({ adapter, service, directory }) => {
    await chmod(directory, 0o755);
    await assert.rejects(
      service.create({
        requestId: randomUUID(),
        kind: "todo",
        title: "Synthetic task",
      }),
      code("UNSAFE_STATE"),
    );
    assert.equal(adapter.mutations.create, 0);
    assert.equal(adapter.reads, 0);
  });
});
