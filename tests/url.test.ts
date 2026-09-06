import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { urlActionSchema, urlCommand } from "../src/url-domain.js";

test("typed templates preserve JSON text and support headings and checked checklist rows", () => {
  const title = 'Quotes " & x-success=https://example.invalid/secret';
  const input = urlActionSchema.parse({
    action: "template",
    requestId: randomUUID(),
    item: {
      kind: "project",
      title,
      items: [
        { kind: "heading", title: "Prepare" },
        {
          kind: "todo",
          title: "Check",
          checklist: [{ title: "Ready", completed: true }],
        },
      ],
    },
  });
  const command = urlCommand(input);
  assert.equal(command.command, "json");
  assert.deepEqual(Object.keys(command.parameters), ["data"]);
  const data = JSON.parse(command.parameters.data ?? "");
  assert.equal(data[0].attributes.title, title);
  assert.equal(
    data[0].attributes.items[1].attributes["checklist-items"][0].attributes
      .completed,
    true,
  );
});

test("URL inputs reject caller credentials, callbacks, arbitrary commands and ambiguous edits", () => {
  const base = {
    action: "edit",
    requestId: randomUUID(),
    target: { kind: "todo", id: "synthetic" },
    expectedRevision: "0".repeat(64),
    changes: { when: "today@09:30" },
  };
  assert.equal(urlActionSchema.safeParse(base).success, true);
  for (const extra of [
    { authToken: "secret" },
    { "x-success": "https://example.invalid" },
    { command: "delete" },
    { url: "file:///tmp/test" },
  ])
    assert.equal(
      urlActionSchema.safeParse({ ...base, ...extra }).success,
      false,
    );
  for (const when of [
    "2026-02-30",
    "today@25:00",
    "anytime@09:30",
    "today@12:00@13:00",
    "javascript:alert(1)",
  ])
    assert.equal(
      urlActionSchema.safeParse({ ...base, changes: { when } }).success,
      false,
    );
  assert.equal(
    urlActionSchema.safeParse({
      ...base,
      changes: { checklist: [], appendChecklist: ["New"] },
    }).success,
    false,
  );
  assert.equal(
    urlActionSchema.safeParse({
      ...base,
      target: { kind: "project", id: "synthetic" },
      changes: { checklist: [] },
    }).success,
    false,
  );
});

test("checklist clearing, incremental text, scheduling clearing and duplication compile distinctly", () => {
  const base = {
    action: "edit",
    requestId: randomUUID(),
    target: { kind: "todo", id: "synthetic" },
    expectedRevision: "0".repeat(64),
  };
  for (const [changes, expected] of [
    [{ checklist: [] }, { "checklist-items": [] }],
    [{ appendChecklist: ["A", "B"] }, { "append-checklist-items": "A\nB" }],
    [{ prependChecklist: ["A"] }, { "prepend-checklist-items": "A" }],
    [{ when: "" }, { when: "" }],
  ] as const) {
    const command = urlCommand(urlActionSchema.parse({ ...base, changes }));
    const { id: _id, ...parameters } = command.parameters;
    assert.deepEqual(
      command.command === "json"
        ? JSON.parse(command.parameters.data ?? "")[0].attributes
        : parameters,
      expected,
    );
  }
  const duplicate = urlCommand(
    urlActionSchema.parse({ ...base, action: "duplicate", title: "Copy" }),
  );
  assert.equal(duplicate.command, "update");
  assert.equal(duplicate.parameters.duplicate, "true");
});
