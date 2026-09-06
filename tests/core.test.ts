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
  type DestructiveScope,
  fingerprint,
  type Item,
  type List,
  type Move,
  type Query,
  type Reference,
  type Restore,
  type Schedule,
  type ScopeItem,
  type Trash,
  type Update,
} from "../src/domain.js";
import { BridgeError, type ErrorCode } from "../src/errors.js";
import { ThingsService } from "../src/service.js";
import { type Lease, State } from "../src/state.js";

class MemoryAdapter implements Adapter {
  readonly destructiveVerified = {
    todo: false,
    project: true,
    area: true,
    tag: true,
    empty_trash: true,
    log_completed: true,
  };
  items = new Map<string, Item>();
  mutations = { create: 0, update: 0, schedule: 0 };
  reads = 0;
  failRead = false;
  failAfterCreate = false;
  discardWrites = false;
  onRead?: (signal?: AbortSignal) => Promise<void>;

  async scope(input: DestructiveScope): Promise<ScopeItem[]> {
    const item = input.target ? this.items.get(input.target.id) : undefined;
    return item ? [{ ...item }] : [];
  }
  async destructive() {
    return true;
  }
  async count() {
    return { count: 0, scanComplete: true, nextScanOffset: null };
  }
  async navigate() {
    return true;
  }
  async children(reference: Reference) {
    return [...this.items.values()]
      .filter((item) => item.projectId === reference.id)
      .map((item) => ({ ...item }));
  }
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
    if (item.kind === "project" && !item.inTrash) {
      const children = await this.children(reference);
      return {
        ...item,
        childRevision: fingerprint(
          children.sort((a, b) => a.id.localeCompare(b.id)),
        ),
        childCount: children.length,
      };
    }
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
  moved = 0;
  trashed = 0;
  membership = new Map<string, List>();
  async move(input: Move) {
    this.moved++;
    const item = this.items.get(input.target.id);
    if (!item) throw new BridgeError("NOT_FOUND");
    if (!this.discardWrites) {
      const destination = input.destination;
      if (destination.kind === "area")
        this.items.set(item.id, {
          ...item,
          areaId: destination.id,
          ...(item.kind === "todo" ? { projectId: null } : {}),
        });
      else if (destination.kind === "project")
        this.items.set(item.id, { ...item, projectId: destination.id });
      else if (destination.kind === "detach")
        this.items.set(item.id, {
          ...item,
          [destination.parent === "area" ? "areaId" : "projectId"]: null,
        });
      else this.membership.set(item.id, destination.list);
    }
    return input.target;
  }
  async trash(input: Trash) {
    this.trashed++;
    if (!this.discardWrites) {
      const item = await this.get(input.target);
      this.items.set(item.id, { ...item, inTrash: true });
      this.membership.set(item.id, "trash");
    }
    return input.target;
  }
  restored = 0;
  async restore(input: Restore) {
    this.restored++;
    if (!this.discardWrites) {
      const item = await this.get(input.target);
      this.items.set(item.id, { ...item, inTrash: false });
      this.membership.set(
        item.id,
        input.target.kind === "project" ? "today" : "inbox",
      );
    }
    return input.target;
  }
  async inList(target: Reference, list: List) {
    return this.membership.get(target.id) === list;
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

test("moves require a fresh revision and verify parent placement before replay", async () => {
  await fixture(async ({ adapter, service }) => {
    const item = seed(adapter);
    adapter.items.set("destination", {
      kind: "project",
      id: "destination",
      title: "Synthetic project",
    });
    const request = {
      requestId: randomUUID(),
      target: { kind: "todo", id: item.id },
      expectedRevision: fingerprint(item),
      destination: { kind: "project", id: "destination" },
    };
    await assert.rejects(
      service.move({ ...request, expectedRevision: "0".repeat(64) }),
      code("STALE_ITEM"),
    );
    assert.equal(adapter.moved, 0);
    assert.equal((await service.move(request)).verification, "read_back");
    assert.equal(adapter.items.get(item.id)?.projectId, "destination");
    assert.equal(adapter.items.get(item.id)?.notes, item.notes);
    assert.equal((await service.move(request)).replayed, true);
    assert.equal(adapter.moved, 1);
  });
});

test("list movement is verified by destination membership and uncertain moves never repeat", async () => {
  await fixture(async ({ adapter, service }) => {
    const item = seed(adapter);
    const request = {
      requestId: randomUUID(),
      target: { kind: "todo", id: item.id },
      expectedRevision: fingerprint(item),
      destination: { kind: "list", list: "someday" },
    };
    adapter.discardWrites = true;
    await assert.rejects(service.move(request), code("VERIFICATION_FAILED"));
    adapter.discardWrites = false;
    await assert.rejects(service.move(request), code("OUTCOME_UNKNOWN"));
    assert.equal(adapter.moved, 1);
    const success = await service.move({ ...request, requestId: randomUUID() });
    assert.equal(success.verification, "read_back");
    assert.equal(
      await adapter.inList({ kind: "todo", id: item.id }, "someday"),
      true,
    );
  });
});

test("move and Trash input cannot target invalid types, unsafe destinations, or arbitrary commands", async () => {
  await fixture(async ({ adapter, service, state }) => {
    const item = seed(adapter);
    const request = {
      requestId: randomUUID(),
      target: { kind: "todo", id: item.id },
      expectedRevision: fingerprint(item),
    };
    for (const destination of [
      { kind: "list", list: "trash" },
      { kind: "list", list: "upcoming" },
      { kind: "project", id: "../../invalid" },
      { kind: "shell", command: "echo x" },
    ]) {
      await assert.rejects(
        service.move({ ...request, destination }),
        code("INVALID_INPUT"),
      );
    }
    await assert.rejects(
      service.move({
        ...request,
        target: { kind: "project", id: item.id },
        destination: { kind: "project", id: "other" },
      }),
      code("INVALID_INPUT"),
    );
    for (const kind of ["project", "area", "tag"])
      await assert.rejects(
        service.trash({ ...request, target: { kind, id: item.id } }),
        code("INVALID_INPUT"),
      );
    await assert.rejects(
      service.trash({ ...request, permanent: true }),
      code("INVALID_INPUT"),
    );
    await state.setWrites(false);
    await assert.rejects(
      service.move({
        ...request,
        destination: { kind: "list", list: "today" },
      }),
      code("READ_ONLY"),
    );
    await assert.rejects(service.trash(request), code("READ_ONLY"));
    assert.equal(adapter.moved + adapter.trashed, 0);
  });
});

test("Trash has a separate grant and a verified receipt; it never permanently deletes", async () => {
  await fixture(async ({ adapter, service, state }) => {
    const item = seed(adapter);
    const request = {
      requestId: randomUUID(),
      target: { kind: "todo", id: item.id },
      expectedRevision: fingerprint(item),
    };
    await assert.rejects(service.trash(request), code("TRASH_DISABLED"));
    assert.equal(adapter.reads, 0);
    assert.equal(adapter.trashed, 0);
    await state.setTrash(true);
    assert.equal((await service.trash(request)).verification, "read_back");
    assert.equal(adapter.items.get(item.id)?.inTrash, true);
    assert.equal((await service.trash(request)).replayed, true);
    assert.equal(adapter.trashed, 1);
    assert.equal(adapter.items.get(item.id)?.notes, item.notes);
    await state.setWrites(false);
    assert.equal(await state.trashEnabled(), false);
    await state.setWrites(true);
    assert.equal(await state.trashEnabled(), false);
  });
});

test("Trash grant revocation persists independently across clients and unchanged host settings", async () => {
  await fixture(async ({ state, directory }) => {
    const desktop = new State(directory, true, "desktop-extension");
    const browser = new State(directory, true, "browser");
    await desktop.configureClient(true, true);
    await browser.configureClient(true, false);
    assert.equal(await desktop.trashEnabled(), true);
    assert.equal(await browser.trashEnabled(), false);
    await state.setWrites(false);
    await desktop.configureClient(true, true);
    assert.equal(await desktop.writesEnabled(), false);
    assert.equal(await desktop.trashEnabled(), false);
    await desktop.configureClient(false, true);
    await desktop.configureClient(true, true);
    assert.equal(await desktop.writesEnabled(), true);
    assert.equal(await desktop.trashEnabled(), false);
    await desktop.configureClient(true, false);
    await desktop.configureClient(true, true);
    assert.equal(await desktop.trashEnabled(), true);
    assert.equal(await browser.trashEnabled(), false);
  });
});

test("an ignored Trash command is uncertain and existing Trash items cannot be edited or moved", async () => {
  await fixture(async ({ adapter, service, state }) => {
    const item = seed(adapter);
    const request = {
      requestId: randomUUID(),
      target: { kind: "todo", id: item.id },
      expectedRevision: fingerprint(item),
    };
    await state.setTrash(true);
    adapter.discardWrites = true;
    await assert.rejects(service.trash(request), code("VERIFICATION_FAILED"));
    await assert.rejects(service.trash(request), code("OUTCOME_UNKNOWN"));
    assert.equal(adapter.trashed, 1);
    const trashedItem = { ...item, inTrash: true };
    adapter.items.set(item.id, trashedItem);
    const current = {
      ...request,
      requestId: randomUUID(),
      expectedRevision: fingerprint(trashedItem),
    };
    await assert.rejects(service.trash(current), code("INVALID_INPUT"));
    await assert.rejects(
      service.move({
        ...current,
        destination: { kind: "list", list: "inbox" },
      }),
      code("INVALID_INPUT"),
    );
    await assert.rejects(
      service.update({ ...current, changes: { status: "open" } }),
      code("INVALID_INPUT"),
    );
    assert.equal(adapter.moved, 0);
    assert.equal(adapter.mutations.update, 0);
  });
});

test("missing or trashed move destinations fail before journaling or applying a move", async () => {
  await fixture(async ({ adapter, service, state }) => {
    const item = seed(adapter);
    const request = {
      requestId: randomUUID(),
      target: { kind: "todo", id: item.id },
      expectedRevision: fingerprint(item),
      destination: { kind: "project", id: "destination" },
    };
    await assert.rejects(service.move(request), code("NOT_FOUND"));
    assert.equal(await state.operation(request.requestId), undefined);
    adapter.items.set("destination", {
      kind: "project",
      id: "destination",
      title: "Deleted destination",
      inTrash: true,
    });
    await assert.rejects(service.move(request), code("INVALID_INPUT"));
    assert.equal(await state.operation(request.requestId), undefined);
    assert.equal(adapter.moved, 0);
  });
});

test("tag replacement and incremental edits preserve unrelated fields and replay once", async () => {
  await fixture(async ({ adapter, service }) => {
    const item = seed(adapter);
    adapter.items.set(item.id, { ...item, tagIds: ["tag-a"] });
    adapter.items.set("tag-a", { kind: "tag", id: "tag-a", title: "A" });
    adapter.items.set("tag-b", { kind: "tag", id: "tag-b", title: "B" });
    const current = await service.get({ kind: item.kind, id: item.id });
    const input = {
      requestId: randomUUID(),
      target: { kind: item.kind, id: item.id },
      expectedRevision: current.revision,
      changes: { addTagIds: ["tag-b"], removeTagIds: ["tag-a"] },
    };
    input.target = { kind: item.kind, id: item.id };
    await service.update(input);
    assert.deepEqual(
      (await service.get({ kind: item.kind, id: item.id })).tagIds,
      ["tag-b"],
    );
    assert.equal(
      (await service.get({ kind: item.kind, id: item.id })).title,
      item.title,
    );
    assert.equal((await service.update(input)).replayed, true);
    assert.equal(adapter.mutations.update, 1);
  });
});

test("tag hierarchy cycles fail before a write receipt", async () => {
  await fixture(async ({ adapter, service }) => {
    adapter.items.set("tag-a", {
      kind: "tag",
      id: "tag-a",
      title: "A",
      parentTagId: null,
    });
    adapter.items.set("tag-b", {
      kind: "tag",
      id: "tag-b",
      title: "B",
      parentTagId: "tag-a",
    });
    const target = { kind: "tag", id: "tag-a" };
    const current = await service.get(target);
    const requestId = randomUUID();
    await assert.rejects(
      service.update({
        target,
        expectedRevision: current.revision,
        requestId,
        changes: { parentTagId: "tag-b" },
      }),
      code("INVALID_INPUT"),
    );
    assert.equal(
      (await service.requestStatus({ requestId })).state,
      "not_seen",
    );
    assert.equal(adapter.mutations.update, 0);
  });
});

test("restoration requires writes, an open trashed item and its current revision", async () => {
  await fixture(async ({ adapter, service, state }) => {
    const item = { ...seed(adapter), inTrash: true };
    adapter.items.set(item.id, item);
    const input = {
      target: { kind: "todo", id: item.id },
      requestId: randomUUID(),
      expectedRevision: fingerprint(item),
    };
    await state.setWrites(false);
    await assert.rejects(service.restore(input), code("READ_ONLY"));
    await state.setWrites(true);
    await assert.rejects(
      service.restore({ ...input, expectedRevision: "0".repeat(64) }),
      code("STALE_ITEM"),
    );
    assert.equal(adapter.restored, 0);
    assert.equal(
      (await service.requestStatus({ requestId: input.requestId })).state,
      "not_seen",
    );
  });
});

test("restoration verifies content and Inbox membership, replays once, and preserves uncertainty", async () => {
  await fixture(async ({ adapter, service }) => {
    const item = { ...seed(adapter), inTrash: true };
    adapter.items.set(item.id, item);
    const input = {
      target: { kind: "todo", id: item.id },
      requestId: randomUUID(),
      expectedRevision: fingerprint(item),
    };
    adapter.discardWrites = true;
    await assert.rejects(service.restore(input), code("VERIFICATION_FAILED"));
    await assert.rejects(service.restore(input), code("OUTCOME_UNKNOWN"));
    assert.equal(adapter.restored, 1);
    adapter.discardWrites = false;
    const next = { ...input, requestId: randomUUID() };
    assert.equal((await service.restore(next)).verification, "read_back");
    assert.equal((await service.restore(next)).replayed, true);
    assert.equal(adapter.restored, 2);
    assert.equal(adapter.items.get(item.id)?.notes, item.notes);
    const active = {
      ...next,
      requestId: randomUUID(),
      expectedRevision: fingerprint(adapter.items.get(item.id)),
    };
    await assert.rejects(service.restore(active), code("INVALID_INPUT"));
    adapter.items.set(item.id, { ...item, status: "completed" });
    await assert.rejects(
      service.restore({
        ...active,
        expectedRevision: fingerprint(adapter.items.get(item.id)),
      }),
      code("INVALID_INPUT"),
    );
  });
});

test("append edits enforce final limits and reject a concurrent change before writing", async () => {
  await fixture(async ({ adapter, service }) => {
    const item = seed(adapter);
    const current = await service.get({ kind: item.kind, id: item.id });
    const target = { kind: item.kind, id: item.id };
    await assert.rejects(
      service.update({
        target,
        requestId: randomUUID(),
        expectedRevision: current.revision,
        changes: { appendTitle: "x".repeat(4000) },
      }),
      code("INVALID_INPUT"),
    );
    assert.equal(adapter.mutations.update, 0);
    let reads = 0;
    adapter.onRead = async () => {
      if (++reads === 2)
        adapter.items.set(item.id, { ...item, title: "Concurrent edit" });
    };
    await assert.rejects(
      service.update({
        target,
        requestId: randomUUID(),
        expectedRevision: current.revision,
        changes: { appendNotes: "new" },
      }),
      code("STALE_ITEM"),
    );
    assert.equal(adapter.mutations.update, 0);
  });
});

test("timestamp offsets normalize and type-specific fields stay restricted", async () => {
  await fixture(async ({ adapter, service }) => {
    const item = seed(adapter);
    const current = await service.get({ kind: item.kind, id: item.id });
    const target = { kind: item.kind, id: item.id };
    await service.update({
      target,
      requestId: randomUUID(),
      expectedRevision: current.revision,
      changes: { creationDate: "2026-09-01T05:00:00-07:00" },
    });
    assert.equal(
      (await service.get(target)).creationDate,
      "2026-09-01T12:00:00.000Z",
    );
    await assert.rejects(
      service.create({
        kind: "tag",
        title: "x",
        tagIds: [],
        requestId: randomUUID(),
      }),
      code("INVALID_INPUT"),
    );
    await assert.rejects(
      service.create({
        kind: "project",
        title: "x",
        projectId: item.id,
        requestId: randomUUID(),
      }),
      code("INVALID_INPUT"),
    );
  });
});

test("advanced actions require separate grants and reject changed scope before mutation", async () => {
  await fixture(async ({ adapter, state, service }) => {
    let applied = 0;
    const target = { kind: "area" as const, id: "area-scope" };
    adapter.items.set(target.id, { ...target, title: "Synthetic area" });
    adapter.scope = async () => [
      { ...target, title: adapter.items.get(target.id)?.title ?? "" },
    ];
    adapter.destructive = async () => {
      applied++;
      adapter.items.delete(target.id);
      return true;
    };
    const preview = await service.previewDestructive({
      action: "delete_container",
      target,
    });
    const input = {
      action: "delete_container",
      target,
      expectedScopeRevision: preview.scopeRevision,
      requestId: randomUUID(),
    };
    await assert.rejects(service.destructive(input), code("ADVANCED_DISABLED"));
    await state.configureAdvanced({
      delete_container: true,
      empty_trash: false,
      log_completed: false,
    });
    adapter.items.set(target.id, { ...target, title: "Changed scope" });
    await assert.rejects(service.destructive(input), code("STALE_ITEM"));
    assert.equal(applied, 0);
    assert.equal(
      (await service.requestStatus({ requestId: input.requestId })).state,
      "not_seen",
    );
    const updated = await service.previewDestructive({
      action: "delete_container",
      target,
    });
    const ready = { ...input, expectedScopeRevision: updated.scopeRevision };
    await service.destructive(ready);
    assert.equal(applied, 1);
    assert.equal((await service.destructive(ready)).replayed, true);
    assert.equal(applied, 1);
  });
});

test("advanced grant revocation survives restart and never grants another connection", async () => {
  await fixture(async ({ directory, state }) => {
    const local = new State(directory, true, "desktop-extension");
    const remote = new State(directory, true, "browser");
    await local.configureClient(true);
    await remote.configureClient(true);
    const grants = {
      delete_container: true,
      empty_trash: false,
      log_completed: false,
    };
    await local.configureAdvanced(grants);
    assert.equal(await local.advancedEnabled("delete_container"), true);
    assert.equal(await remote.advancedEnabled("delete_container"), false);
    await state.setWrites(false);
    await local.configureClient(true);
    await local.configureAdvanced(grants);
    assert.equal(await local.advancedEnabled("delete_container"), false);
    await local.configureClient(false);
    await local.configureClient(true);
    assert.equal(await local.advancedEnabled("delete_container"), false);
    await local.configureAdvanced({ ...grants, delete_container: false });
    await local.configureAdvanced(grants);
    assert.equal(await local.advancedEnabled("delete_container"), true);
    assert.equal(
      await new State(directory, false, "desktop-extension").advancedEnabled(
        "delete_container",
      ),
      false,
    );
  });
});

test("native action gates and unsupported deletion states reject before journaling", async () => {
  await fixture(async ({ adapter, state, service }) => {
    await state.configureAdvanced({
      delete_container: true,
      empty_trash: true,
      log_completed: true,
    });
    adapter.destructiveVerified.empty_trash = false;
    const requestId = randomUUID();
    await assert.rejects(
      service.destructive({
        action: "empty_trash",
        requestId,
        expectedScopeRevision: "0".repeat(64),
      }),
      code("VERIFICATION_UNAVAILABLE"),
    );
    assert.equal(
      (await service.requestStatus({ requestId })).state,
      "not_seen",
    );
    const target = { kind: "project" as const, id: "trashed-project" };
    adapter.items.set(target.id, {
      ...target,
      title: "Synthetic",
      status: "open",
      inTrash: true,
    });
    await assert.rejects(
      service.previewDestructive({ action: "delete_container", target }),
      code("INVALID_INPUT"),
    );
    const child = { ...seed(adapter), inTrash: true, projectId: target.id };
    adapter.items.set(child.id, child);
    await assert.rejects(
      service.restore({
        target: { kind: "todo", id: child.id },
        requestId: randomUUID(),
        expectedRevision: fingerprint(child),
      }),
      code("INVALID_INPUT"),
    );
    const closed = { ...seed(adapter), status: "completed" as const };
    adapter.items.set(closed.id, closed);
    await state.setTrash(true);
    await assert.rejects(
      service.trash({
        target: { kind: "todo", id: closed.id },
        requestId: randomUUID(),
        expectedRevision: fingerprint(closed),
      }),
      code("VERIFICATION_UNAVAILABLE"),
    );
    assert.equal(adapter.trashed + adapter.restored, 0);
  });
});

test("project deletion never reports verified if unrelated content changes", async () => {
  await fixture(async ({ adapter, state, service }) => {
    const project: Item = {
      kind: "project",
      id: "project-delete",
      title: "Synthetic project",
      status: "open",
      tagIds: ["tag-keep"],
    };
    adapter.items.set(project.id, project);
    adapter.scope = async () => {
      const current = adapter.items.get(project.id);
      assert.ok(current);
      return [{ ...current }];
    };
    adapter.destructive = async () => {
      adapter.items.set(project.id, { ...project, inTrash: true, tagIds: [] });
      return true;
    };
    await state.configureAdvanced({
      delete_container: true,
      empty_trash: false,
      log_completed: false,
    });
    const target = { kind: project.kind, id: project.id };
    const preview = await service.previewDestructive({
      action: "delete_container",
      target,
    });
    const requestId = randomUUID();
    const input = {
      action: "delete_container",
      target,
      requestId,
      expectedScopeRevision: preview.scopeRevision,
    };
    await assert.rejects(
      service.destructive(input),
      code("VERIFICATION_FAILED"),
    );
    await assert.rejects(service.destructive(input), code("OUTCOME_UNKNOWN"));
    assert.equal((await service.requestStatus({ requestId })).state, "unknown");
  });
});

test("area deletion previews distinguish active contents from retained Logbook projects", async () => {
  await fixture(async ({ adapter, state, service }) => {
    const area: Item = {
      kind: "area",
      id: "area-delete",
      title: "Synthetic area",
    };
    const open: Item = {
      kind: "project",
      id: "open-project",
      title: "Open",
      status: "open",
      areaId: area.id,
      inTrash: false,
    };
    const closed: Item = {
      ...open,
      id: "closed-project",
      title: "Closed",
      status: "completed",
    };
    const openChild: Item = {
      kind: "todo",
      id: "open-parent-child",
      title: "Child",
      projectId: open.id,
      status: "completed",
      areaId: null,
      inTrash: false,
    };
    const closedChild: Item = {
      ...openChild,
      id: "closed-parent-child",
      projectId: closed.id,
    };
    for (const item of [area, open, closed, openChild, closedChild])
      adapter.items.set(item.id, item);
    adapter.membership.set(closed.id, "logbook");
    const scope: ScopeItem[] = [
      area,
      { ...open, inLogbook: false },
      { ...closed, inLogbook: true },
      { ...openChild, inLogbook: true },
      { ...closedChild, inLogbook: true },
    ];
    adapter.scope = async () => scope.map((item) => ({ ...item }));
    adapter.destructive = async () => {
      adapter.items.delete(area.id);
      for (const item of [open, closed, openChild, closedChild])
        adapter.items.set(item.id, {
          ...item,
          areaId: null,
          inTrash: item.id === open.id || item.projectId === open.id,
        });
      return true;
    };
    const target = { kind: area.kind, id: area.id };
    const preview = await service.previewDestructive({
      action: "delete_container",
      target,
    });
    assert.deepEqual(
      Object.fromEntries(preview.items.map((item) => [item.id, item.effect])),
      {
        [area.id]: "permanent_delete",
        [open.id]: "move_to_trash",
        [closed.id]: "detach_from_area",
        [openChild.id]: "move_to_trash",
        [closedChild.id]: "detach_from_area",
      },
    );
    await state.configureAdvanced({
      delete_container: true,
      empty_trash: false,
      log_completed: false,
    });
    const receipt = await service.destructive({
      action: "delete_container",
      target,
      requestId: randomUUID(),
      expectedScopeRevision: preview.scopeRevision,
    });
    assert.equal(receipt.verification, "read_back");
    assert.equal(adapter.items.get(closedChild.id)?.projectId, closed.id);
    assert.equal(adapter.items.get(closed.id)?.inTrash, false);
  });
});

test("project revisions reject changed child content and failed cascades remain uncertain", async () => {
  await fixture(async ({ adapter, service }) => {
    const target = { kind: "project" as const, id: "project-scope" };
    adapter.items.set(target.id, {
      ...target,
      title: "Project",
      status: "open",
    });
    adapter.items.set("child", {
      kind: "todo",
      id: "child",
      title: "Child",
      status: "open",
      projectId: target.id,
    });
    const old = await service.get(target);
    const changedChild = adapter.items.get("child");
    assert.ok(changedChild);
    adapter.items.set("child", {
      ...changedChild,
      title: "Edited child",
    });
    const requestId = randomUUID();
    await assert.rejects(
      service.update({
        target,
        requestId,
        expectedRevision: old.revision,
        changes: { status: "completed" },
      }),
      code("STALE_ITEM"),
    );
    assert.equal(adapter.mutations.update, 0);
    const fresh = await service.get(target);
    await assert.rejects(
      service.update({
        target,
        requestId,
        expectedRevision: fresh.revision,
        changes: { status: "completed" },
      }),
      code("VERIFICATION_FAILED"),
    );
    assert.equal((await service.requestStatus({ requestId })).state, "unknown");
    assert.equal(adapter.mutations.update, 1);
  });
});

test("navigation is permission checked and reports acceptance rather than a task mutation", async () => {
  await fixture(async ({ service, state }) => {
    const request = { requestId: randomUUID(), action: "quick_entry" };
    await state.setWrites(false);
    await assert.rejects(service.navigate(request), code("READ_ONLY"));
    await state.setWrites(true);
    const receipt = await service.navigate(request);
    assert.equal(receipt.verification, "command_accepted");
    assert.equal((await service.navigate(request)).replayed, true);
    await assert.rejects(
      service.navigate({
        requestId: randomUUID(),
        action: "show",
        url: "file:///tmp",
      }),
      code("INVALID_INPUT"),
    );
  });
});

test("URL dispatch preserves permissions, revisions and receipts without storing credentials", async () => {
  await fixture(async ({ adapter, state, directory }) => {
    const item = seed(adapter);
    let sent = 0;
    let tokenReads = 0;
    const transport = {
      token: async () => {
        tokenReads++;
        return "synthetic-url-token";
      },
      send: async (command: { parameters: Record<string, string> }) => {
        sent++;
        assert.equal(command.parameters["auth-token"], "synthetic-url-token");
      },
    };
    const service = new ThingsService(adapter, state, transport);
    const request = {
      action: "edit",
      requestId: randomUUID(),
      target: { kind: "todo", id: item.id },
      expectedRevision: fingerprint(item),
      changes: { checklist: [{ title: "Synthetic checklist text" }] },
    };
    await state.setWrites(false);
    await assert.rejects(service.url(request), code("READ_ONLY"));
    assert.equal(tokenReads, 0);
    await state.setWrites(true);
    await assert.rejects(
      service.url({ ...request, expectedRevision: "0".repeat(64) }),
      code("STALE_ITEM"),
    );
    assert.equal(sent, 0);
    const receipt = await service.url(request);
    assert.equal(receipt.verification, "url_dispatched");
    assert.equal(sent, 1);
    assert.equal(
      (await service.requestStatus({ requestId: request.requestId })).state,
      "dispatched",
    );
    assert.equal(
      (
        await new ThingsService(adapter, new State(directory), transport).url(
          request,
        )
      ).replayed,
      true,
    );
    assert.equal(sent, 1);
    const stored = JSON.stringify(await state.operation(request.requestId));
    assert.ok(!stored.includes("synthetic-url-token"));
    assert.ok(!stored.includes("Synthetic checklist text"));
    await assert.rejects(
      service.url({ ...request, changes: { when: "evening" } }),
      code("REQUEST_CONFLICT"),
    );
    await state.setWrites(false);
    await assert.rejects(service.url(request), code("READ_ONLY"));
  });
});

test("URL token failures and changes during Keychain access reject before dispatch", async () => {
  await fixture(async ({ adapter, state }) => {
    const item = seed(adapter);
    let sent = 0;
    const request = {
      action: "duplicate",
      requestId: randomUUID(),
      target: { kind: "todo", id: item.id },
      expectedRevision: fingerprint(item),
    };
    const missing = new ThingsService(adapter, state, {
      token: async () => {
        throw new BridgeError("URL_AUTH_REQUIRED");
      },
      send: async () => {
        sent++;
      },
    });
    await assert.rejects(missing.url(request), code("URL_AUTH_REQUIRED"));
    assert.equal(await state.operation(request.requestId), undefined);
    const changed = new ThingsService(adapter, state, {
      token: async () => {
        adapter.items.set(item.id, { ...item, title: "Changed elsewhere" });
        return "synthetic";
      },
      send: async () => {
        sent++;
      },
    });
    await assert.rejects(changed.url(request), code("STALE_ITEM"));
    assert.equal(sent, 0);
    assert.equal(await state.operation(request.requestId), undefined);
  });
});

test("uncertain URL dispatch never replays and cannot claim a created ID", async () => {
  await fixture(async ({ adapter, state, directory }) => {
    let sent = 0;
    const request = {
      action: "template",
      requestId: randomUUID(),
      item: { kind: "todo", title: "Synthetic template" },
    };
    const transport = {
      token: async () => {
        throw new Error("No token needed");
      },
      send: async () => {
        sent++;
        throw new Error("Disconnected after delivery");
      },
    };
    const service = new ThingsService(adapter, state, transport);
    await assert.rejects(service.url(request), code("OUTCOME_UNKNOWN"));
    await assert.rejects(
      new ThingsService(adapter, new State(directory), transport).url(request),
      code("OUTCOME_UNKNOWN"),
    );
    assert.equal(sent, 1);
    const success = await new ThingsService(adapter, state, {
      ...transport,
      send: async () => {},
    }).url({ ...request, requestId: randomUUID() });
    assert.equal(success.target, undefined);
    assert.equal(success.verification, "url_dispatched");
  });
});

test("URL templates validate parents and payload size without dispatching", async () => {
  await fixture(async ({ adapter, state }) => {
    let sent = 0;
    const service = new ThingsService(adapter, state, {
      token: async () => "",
      send: async () => {
        sent++;
      },
    });
    const request = {
      action: "template",
      requestId: randomUUID(),
      item: {
        kind: "todo",
        title: "Synthetic",
        list: { kind: "project", id: "missing" },
      },
    };
    await assert.rejects(service.url(request), code("NOT_FOUND"));
    await assert.rejects(
      service.url({
        action: "template",
        requestId: randomUUID(),
        item: {
          kind: "project",
          title: "Synthetic",
          items: Array.from({ length: 100 }, () => ({
            kind: "todo",
            title: "a".repeat(4000),
            notes: "b".repeat(10000),
          })),
        },
      }),
      code("INVALID_INPUT"),
    );
    assert.equal(sent, 0);
  });
});
