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
  dueDate: () => null,
  activationDate: () => null,
  area: () => null,
  tagNames: () => "",
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
    byId: (id: string) =>
      items.find((item) => item.id() === id) ?? { exists: () => false },
  });
}
function execute(operation: string, input: unknown, trashed = false) {
  const container = {
    exists: () => true,
    toDos: collection([project]),
  };
  const empty = { ...container, toDos: collection([]) };
  const app = {
    running: () => true,
    projects: collection([project]),
    toDos: collection([project]),
    lists: {
      byId: (id: string) =>
        id === "TMTrashListSource" && !trashed ? empty : container,
    },
    areas: { byId: () => container },
  };
  const request = JSON.stringify({ operation, input });
  return JSON.parse(
    runInNewContext(`${source}\nrun()`, {
      Application: () => app,
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
