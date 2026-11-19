import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { NativeAdapter } from "../src/adapter.js";
import { ThingsService } from "../src/service.js";
import { clientIdSchema, State } from "../src/state.js";

const projectId = process.env.THINGS_MCP_LIVE_PLACEMENT_PROJECT;
test("create and move to-dos into a synthetic project with a heading", {
  skip: !projectId,
}, async () => {
  assert.ok(projectId);
  const directory =
    process.env.THINGS_MCP_STATE_DIR ??
    join(homedir(), "Library", "Application Support", "Things MCP");
  const client = clientIdSchema
    .optional()
    .parse(process.env.THINGS_MCP_LIVE_CLIENT);
  const adapter = new NativeAdapter();
  const service = new ThingsService(
    adapter,
    new State(directory, true, client),
  );
  const destination = { kind: "project" as const, id: projectId };
  const fixture = await adapter.getFields(destination);
  assert.match(fixture.title, /^Things MCP placement fixture [a-f0-9]{8}$/);
  assert.equal(fixture.inTrash, false);
  const health = await service.health();
  assert.equal(health.writesEnabled, true);
  const scheduledDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: health.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const marker = randomUUID().slice(0, 8);
  const created = await service.create({
    kind: "todo",
    title: `Placement create ${marker}`,
    projectId,
    scheduledDate,
    requestId: randomUUID(),
  });
  assert.equal((await service.get(created.target)).projectId, projectId);
  const inbox = await service.create({
    kind: "todo",
    title: `Placement move ${marker}`,
    scheduledDate,
    requestId: randomUUID(),
  });
  const before = await service.get(inbox.target);
  assert.equal(before.projectId, null);
  await service.move({
    target: inbox.target,
    expectedRevision: before.revision,
    destination,
    requestId: randomUUID(),
  });
  assert.equal((await service.get(inbox.target)).projectId, projectId);
});
