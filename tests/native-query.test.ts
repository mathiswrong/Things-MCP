import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { moveSchema, querySchema } from "../src/domain.js";

const source = await readFile(
  new URL("../src/native/things.jxa.js", import.meta.url),
  "utf8",
);
const project = {
  id: () => "empty-project",
  name: () => "Empty project",
  notes: () => "",
  status: () => "open",
  dueDate: (): Date | null => null,
  activationDate: () => null,
  area: () => null,
  tagNames: () => "",
  tags: { id: (): string[] => [] },
  creationDate: () => null,
  modificationDate: () => null,
  completionDate: () => null,
  cancellationDate: () => null,
  exists: () => true,
};
function collection(items: (typeof project)[]) {
  const values = () => items;
  Object.defineProperty(values, "name", {
    value: () => items.map((item) => item.name()),
  });
  return Object.assign(values, {
    id: () => items.map((item) => item.id()),
    notes: () => items.map((item) => item.notes()),
    status: () => items.map((item) => item.status()),
    whose:
      (filter: {
        _match?: [unknown, string];
        tagNames?: { _contains: string };
      }) =>
      () =>
        items.filter((item) =>
          filter._match
            ? (item as typeof project & { project?: () => typeof project })
                .project?.()
                ?.id() === filter._match[1]
            : filter.tagNames
              ? item.tagNames().includes(filter.tagNames._contains)
              : false,
        ),
    byId: (id: string) =>
      items.find((item) => item.id() === id) ?? { exists: () => false },
  });
}
function execute(
  operation: string,
  input: unknown,
  trashed = false,
  tasks = [project],
  loggedTasks: (typeof project)[] = [],
  scheduledDates: number[][] = [],
  trashTasks?: (typeof project)[],
  overrides: Record<string, unknown> = {},
  clock?: () => number,
) {
  const parent = { ...project, toDos: collection(tasks) };
  const container = {
    exists: () => true,
    toDos: collection(tasks),
  };
  const empty = { ...container, toDos: collection([]) };
  const app = {
    schedule: (_item: unknown, options: { for: Date }) => {
      const date = options.for;
      scheduledDates.push([
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        date.getHours(),
      ]);
    },
    running: () => true,
    projects: collection([parent]),
    selectedToDos: collection(tasks),
    toDos: collection(tasks),
    lists: {
      byId: (id: string) =>
        id === "TMTrashListSource" && trashTasks
          ? { ...container, toDos: collection(trashTasks) }
          : id === "TMLogbookListSource"
            ? { ...container, toDos: collection(loggedTasks) }
            : id === "TMTrashListSource" && !trashed
              ? empty
              : container,
    },
    areas: { byId: () => container },
  };
  const request = JSON.stringify({ operation, input });
  return JSON.parse(
    runInNewContext(`${source}\nrun()`, {
      Application: () => ({ ...app, ...overrides }),
      Date: clock
        ? class extends Date {
            static now() {
              return clock();
            }
          }
        : Date,
      ObjectSpecifier: () => ({ project: { id: "project-id-property" } }),
      ObjC: { import: () => {}, unwrap: (value: unknown) => value },
      $: {
        NSFileHandle: {
          fileHandleWithStandardInput: { readDataToEndOfFile: request },
        },
        NSString: {
          alloc: { initWithDataEncoding: (value: unknown) => value },
        },
      },
    }),
  );
}

test("native scoped searches separate project entries from to-dos", () => {
  const result = execute(
    "find",
    querySchema.parse({ kind: "project", list: "someday" }),
  );
  assert.equal(result.ok, true);
  assert.equal(result.result.items[0].id, "empty-project");
  assert.equal(result.result.items[0].inTrash, false);
  assert.equal(
    execute("find", querySchema.parse({ kind: "todo", list: "someday" })).result
      .items.length,
    0,
  );
});

test("project children include logged items once when native collections change", () => {
  const child = (id: string) => ({
    ...project,
    id: () => id,
    project: () => project,
    status: () => "completed",
  });
  const active = child("active-child");
  const logged = child("logged-child");
  const unrelated = {
    ...child("unrelated"),
    project: () => ({ ...project, id: () => "other-project" }),
  };
  const target = { kind: "project", id: project.id() };
  for (const collection of [[active], [active, logged]]) {
    const children = execute("children", target, false, collection, [
      logged,
      unrelated,
    ]);
    assert.equal(children.ok, true);
    assert.deepEqual(
      children.result.map((item: { id: string }) => item.id).sort(),
      ["active-child", "logged-child"],
    );
    const query = querySchema.parse({ kind: "todo", parent: target });
    assert.equal(
      execute("count", query, false, collection, [logged, unrelated]).result
        .count,
      2,
    );
    const scope = execute(
      "scope",
      { action: "delete_container", target },
      false,
      collection,
      [logged, unrelated],
    );
    assert.equal(scope.result.length, 3);
  }
});

test("closed project children use their retained collection without a history query", () => {
  const parent = { ...project, status: () => "completed" };
  const child = {
    ...project,
    id: () => "closed-child",
    project: () => parent,
    status: () => "completed",
  };
  const container = { ...parent, toDos: collection([child]) };
  const result = execute(
    "children",
    { kind: "project", id: parent.id() },
    false,
    [child],
    [],
    [],
    [],
    {
      projects: collection([container]),
      lists: {
        byId: (id: string) => {
          assert.notEqual(id, "TMLogbookListSource");
          return { exists: () => true, toDos: collection([]) };
        },
      },
    },
  );
  assert.equal(result.ok, true);
  assert.equal(result.result.length, 1);
  assert.equal(result.result[0].id, child.id());
});

test("date sorting is limited to kinds with exposed date fields", () => {
  for (const kind of ["area", "tag"]) {
    assert.equal(
      querySchema.safeParse({ kind, sortBy: "creationDate" }).success,
      false,
    );
    assert.equal(
      querySchema.safeParse({ kind, sortBy: "title" }).success,
      true,
    );
  }
});

test("tag deletion previews include tagged project roots outside the global to-do collection", () => {
  const tag = {
    ...project,
    id: () => "tag-scope",
    name: () => "Scope",
    parentTag: () => null,
    keyboardShortcut: () => "",
  };
  const taggedProject = {
    ...project,
    tags: { id: () => [tag.id()] },
    tagNames: () => tag.name(),
    toDos: collection([]),
  };
  const result = execute(
    "scope",
    { action: "delete_container", target: { kind: "tag", id: tag.id() } },
    false,
    [],
    [],
    [],
    [],
    {
      tags: collection([tag]),
      areas: collection([]),
      projects: collection([taggedProject]),
    },
  );
  assert.equal(result.ok, true);
  assert.deepEqual(
    result.result.map((item: { id: string }) => item.id).sort(),
    [project.id(), tag.id()].sort(),
  );
});

test("Logbook queries recognize completed projects absent from the active project collection", () => {
  const closedProject = {
    ...project,
    id: () => "closed-project",
    status: () => "completed",
  };
  const task = {
    ...project,
    id: () => "closed-task",
    status: () => "completed",
    project: () => null,
  };
  const projects = collection([]);
  projects.byId = (id: string) =>
    id === closedProject.id() ? closedProject : { exists: () => false };
  for (const kind of ["project", "todo"]) {
    const result = execute(
      "find",
      querySchema.parse({ kind, list: "logbook" }),
      false,
      [],
      [closedProject, task],
      [],
      [],
      { projects },
    );
    assert.equal(result.ok, true);
    assert.deepEqual(
      result.result.items.map((item: { id: string }) => item.id),
      [kind === "project" ? closedProject.id() : task.id()],
    );
  }
});

test("slow scans yield a continuation without skipping the next unexamined item", () => {
  const tasks = [0, 1, 2].map((index) => ({
    ...project,
    id: () => `slow-${index}`,
    project: () => null,
  }));
  let ticks = 0;
  const clock = () => (ticks += 6000);
  const first = execute(
    "count",
    querySchema.parse({ kind: "todo" }),
    false,
    tasks,
    [],
    [],
    [],
    {},
    clock,
  ).result;
  assert.deepEqual(first, { count: 1, scanComplete: false, nextScanOffset: 1 });
  const next = execute(
    "find",
    querySchema.parse({ kind: "todo", scanOffset: first.nextScanOffset }),
    false,
    tasks,
    [],
    [],
    [],
    {},
    clock,
  ).result;
  assert.equal(next.items[0].id, "slow-1");
  assert.equal(next.nextScanOffset, 2);
});

test("trashed project child enumeration rejects instead of reporting an empty project", () => {
  const target = { kind: "project", id: project.id() };
  assert.deepEqual(execute("children", target, true), {
    ok: false,
    code: "INVALID_INPUT",
  });
});

test("known children inherit a trashed project's state and stay out of active searches and counts", () => {
  const child = {
    ...project,
    id: () => "nested-child",
    project: () => project,
  };
  const read = execute(
    "get",
    { kind: "todo", id: child.id() },
    false,
    [child],
    [],
    [],
    [project],
  );
  assert.equal(read.result.inTrash, true);
  for (const operation of ["find", "count"]) {
    const result = execute(
      operation,
      querySchema.parse({ kind: "todo" }),
      false,
      [child],
      [],
      [],
      [project],
    );
    assert.equal(result.ok, true);
    assert.equal(
      operation === "count" ? result.result.count : result.result.items.length,
      0,
    );
  }
});

test("calendar scheduling preserves dates across leap days and DST boundaries", () => {
  for (const date of [
    "2028-02-29",
    "2026-03-08",
    "2026-11-01",
    "2026-03-29",
    "2026-10-25",
  ]) {
    const scheduled: number[][] = [];
    const result = execute(
      "schedule",
      { target: { kind: "project", id: project.id() }, date },
      false,
      [],
      [],
      scheduled,
    );
    assert.equal(result.ok, true);
    assert.deepEqual(scheduled, [[...date.split("-").map(Number), 12]]);
  }
});

test("project Anytime moves and queries fail validation instead of claiming unverifiable membership", () => {
  assert.equal(
    querySchema.safeParse({ kind: "project", list: "anytime" }).success,
    false,
  );
  assert.equal(
    moveSchema.safeParse({
      target: { kind: "project", id: "empty-project" },
      requestId: "a550e840-e29b-41d4-a716-446655440000",
      expectedRevision: "a".repeat(64),
      destination: { kind: "list", list: "anytime" },
    }).success,
    false,
  );
});

test("bounded pagination accepts its final offset and project queries reject project parents", () => {
  assert.equal(querySchema.safeParse({ offset: 4999, limit: 1 }).success, true);
  assert.equal(querySchema.safeParse({ offset: 5000 }).success, false);
  assert.equal(
    querySchema.safeParse({
      kind: "project",
      parent: { kind: "project", id: "fixture-project" },
    }).success,
    false,
  );
});

test("unverified Logbook moves are rejected while Logbook reads remain available", () => {
  assert.equal(querySchema.safeParse({ list: "logbook" }).success, true);
  assert.equal(
    moveSchema.safeParse({
      target: { kind: "todo", id: "fixture-task" },
      requestId: "a550e840-e29b-41d4-a716-446655440000",
      expectedRevision: "a".repeat(64),
      destination: { kind: "list", list: "logbook" },
    }).success,
    false,
  );
});

test("scan continuations traverse beyond 5000 objects without skipping the lookahead item", () => {
  const tasks = Array.from({ length: 5003 }, (_, i) => ({
    ...project,
    id: () => `task-${i}`,
    name: () => `Task ${i}`,
    project: () => null,
  }));
  const page = (scanOffset: number, text = "") =>
    execute(
      "find",
      querySchema.parse({ kind: "todo", scanOffset, limit: 2, text }),
      false,
      tasks,
    ).result;
  assert.deepEqual(
    page(0).items.map((item: { id: string }) => item.id),
    ["task-0", "task-1"],
  );
  assert.equal(page(0).nextScanOffset, 2);
  assert.deepEqual(
    page(2).items.map((item: { id: string }) => item.id),
    ["task-2", "task-3"],
  );
  const sparse = page(0, "Task 5002");
  assert.equal(sparse.items.length, 0);
  assert.equal(sparse.nextScanOffset, 5000);
  const last = page(sparse.nextScanOffset, "Task 5002");
  assert.equal(last.items[0].id, "task-5002");
  assert.equal(last.nextScanOffset, null);
  assert.equal(last.scanComplete, true);
});

test("native filters apply tag and inclusive date boundaries together", () => {
  const tasks = [
    {
      ...project,
      id: () => "task-filter",
      project: () => null,
      tags: { id: () => ["tag-filter"] },
      dueDate: () => new Date(2026, 9, 12),
    },
  ];
  const result = execute(
    "find",
    querySchema.parse({
      kind: "todo",
      tagId: "tag-filter",
      deadlineFrom: "2026-10-12",
      deadlineThrough: "2026-10-12",
      selected: true,
    }),
    false,
    tasks,
  );
  assert.equal(result.ok, true);
  assert.equal(result.result.items.length, 1);
  assert.equal(
    querySchema.safeParse({ selected: true, list: "today" }).success,
    false,
  );
  assert.equal(
    querySchema.safeParse({ scanOffset: 5000, offset: 1 }).success,
    false,
  );
});

test("counts and result sorting preserve resumable scan semantics", () => {
  const tasks = Array.from({ length: 5003 }, (_, i) => ({
    ...project,
    id: () => `todo-${i}`,
    name: () => `Name ${String(i).padStart(5, "0")}`,
    project: () => null,
  }));
  const first = execute(
    "count",
    querySchema.parse({ kind: "todo" }),
    false,
    tasks,
  ).result;
  assert.equal(first.count, 5000);
  assert.equal(first.scanComplete, false);
  assert.equal(first.nextScanOffset, 5000);
  const last = execute(
    "count",
    querySchema.parse({ kind: "todo", scanOffset: first.nextScanOffset }),
    false,
    tasks,
  ).result;
  assert.equal(last.count, 3);
  assert.equal(last.scanComplete, true);
  const sorted = execute(
    "find",
    querySchema.parse({
      kind: "todo",
      limit: 2,
      sortBy: "title",
      sortOrder: "descending",
    }),
    false,
    tasks,
  ).result;
  assert.deepEqual(
    sorted.items.map((item: { id: string }) => item.id),
    ["todo-5002", "todo-5001"],
  );
});
