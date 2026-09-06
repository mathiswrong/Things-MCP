import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport } from "@modelcontextprotocol/server";
import { NativeAdapter } from "../src/adapter.js";
import type { Adapter } from "../src/domain.js";
import { BridgeError } from "../src/errors.js";
import { createServer } from "../src/server.js";
import { ThingsService } from "../src/service.js";
import { State } from "../src/state.js";

test("MCP initialization, discovery, reads, and write rejection work through the official client", async () => {
  const parent = join(homedir(), "Downloads", "Things-MCP-tests");
  await mkdir(parent, { recursive: true });
  const directory = await mkdtemp(join(parent, "protocol-"));
  const fixture = {
    id: "fixture-task",
    kind: "todo" as const,
    title: "Synthetic task",
    notes: "Private fixture",
  };
  let mutations = 0;
  const forbidden = async (): Promise<never> => {
    mutations++;
    throw new Error("Unexpected mutation");
  };
  const adapter: Adapter = {
    destructiveVerified: {
      todo: false,
      project: false,
      area: false,
      tag: false,
      empty_trash: false,
      log_completed: false,
    },
    children: async () => [],
    scope: async () => [],
    destructive: async () => true,
    count: async () => ({ count: 0, scanComplete: true, nextScanOffset: null }),
    navigate: async () => {
      throw new Error("not called");
    },
    health: async () => ({ version: "test", running: true, timezone: "UTC" }),
    get: async () => fixture,
    find: async () => ({
      items: [fixture],
      hasMore: false,
      scanComplete: true,
      nextOffset: null,
    }),
    create: forbidden,
    update: forbidden,
    schedule: forbidden,
    move: forbidden,
    trash: forbidden,
    restore: forbidden,
    inList: async () => false,
  };
  const server = createServer(new ThingsService(adapter, new State(directory)));
  const client = new Client({ name: "protocol-test", version: "1.0.0" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  try {
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);
    const tools = await client.listTools();
    assert.equal(tools.tools.length, 20);
    assert.equal(
      tools.tools.find((tool) => tool.name === "things_find_items")?.annotations
        ?.readOnlyHint,
      true,
    );
    assert.equal(
      tools.tools.find((tool) => tool.name === "things_update_item")
        ?.annotations?.destructiveHint,
      true,
    );
    const found = await client.callTool({
      name: "things_find_items",
      arguments: {},
    });
    assert.equal(found.isError, undefined);
    assert.ok(
      JSON.stringify(found.structuredContent).includes("Synthetic task"),
    );
    assert.ok(!JSON.stringify(found).includes("Private fixture"));
    const denied = await client.callTool({
      name: "things_create_item",
      arguments: {
        kind: "todo",
        title: "Never created",
        requestId: "a550e840-e29b-41d4-a716-446655440000",
      },
    });
    assert.equal(denied.isError, true);
    assert.ok(JSON.stringify(denied).includes("READ_ONLY"));
    assert.equal(mutations, 0);
    const invalid = await client.callTool({
      name: "things_get_item",
      arguments: { kind: "todo", id: "../../secret" },
    });
    assert.equal(invalid.isError, true);
  } finally {
    await client.close();
    await server.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("the native adapter rejects malformed output without reflecting task contents", async () => {
  const adapter = new NativeAdapter(async () => ({
    password: "must-not-appear",
    id: "bad",
  }));
  await assert.rejects(adapter.get({ kind: "todo", id: "task" }), (error) => {
    assert.ok(error instanceof BridgeError);
    assert.equal(error.code, "NATIVE_FAILURE");
    assert.ok(!error.message.includes("must-not-appear"));
    return true;
  });
});

test("native mutation response corruption is an uncertain outcome", async () => {
  const adapter = new NativeAdapter(async () => "unexpected output");
  await assert.rejects(
    adapter.create({
      kind: "todo",
      title: "Fixture",
      requestId: "a550e840-e29b-41d4-a716-446655440000",
    }),
    (error: unknown) =>
      error instanceof BridgeError && error.code === "OUTCOME_UNKNOWN",
  );
});

test("the official MCP client receives and replays the project descendant summary", async () => {
  const parent = join(homedir(), "Downloads", "Things-MCP-tests");
  await mkdir(parent, { recursive: true });
  const directory = await mkdtemp(join(parent, "project-impact-protocol-"));
  let areaId: string | null = null;
  let mutations = 0;
  const project = { kind: "project" as const, id: "protocol-project" };
  const child = () => ({
    kind: "todo",
    id: "protocol-child",
    title: "Private task",
    notes: "Private notes",
    projectId: project.id,
    areaId,
    status: "open",
  });
  const adapter = new NativeAdapter(async (operation, input) => {
    const value = input as { id: string; kind: string };
    if (operation === "children") return [child()];
    if (operation === "get") {
      if (value.kind === "project")
        return { ...project, title: "Private project", status: "open", areaId };
      if (value.kind === "area")
        return { kind: "area", id: "protocol-area", title: "Private area" };
      return child();
    }
    if (operation === "move") {
      mutations++;
      areaId = "protocol-area";
      return project;
    }
    throw new Error("Unexpected native operation");
  });
  const state = new State(directory);
  await state.setWrites(true);
  const server = createServer(new ThingsService(adapter, state));
  const client = new Client({ name: "project-impact-test", version: "1.0.0" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  try {
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);
    const tools = await client.listTools();
    assert.match(
      tools.tools.find((item) => item.name === "things_move_item")
        ?.description ?? "",
      /descendantImpact/,
    );
    const read = await client.callTool({
      name: "things_get_item",
      arguments: project,
    });
    assert.ok(read.structuredContent);
    const request = {
      requestId: "719b8d71-2c79-4b7a-80ae-1ca9499e9914",
      target: project,
      expectedRevision: (
        read.structuredContent as { result: { revision: string } }
      ).result.revision,
      destination: { kind: "area", id: "protocol-area" },
    };
    const response = await client.callTool({
      name: "things_move_item",
      arguments: request,
    });
    assert.equal(response.isError, undefined);
    const result = (
      response.structuredContent as {
        result: {
          descendantImpact: {
            comparedCount: number;
            changedCount: number;
            changes: unknown[];
          };
          replayed: boolean;
        };
      }
    ).result;
    assert.equal(result.descendantImpact.comparedCount, 1);
    assert.equal(result.descendantImpact.changedCount, 1);
    assert.deepEqual(result.descendantImpact.changes, [
      { id: "protocol-child", changedFields: ["areaId"] },
    ]);
    assert.ok(!JSON.stringify(response).includes("Private"));
    assert.deepEqual(
      JSON.parse((response.content[0] as { text: string }).text),
      result,
    );
    const replay = await client.callTool({
      name: "things_move_item",
      arguments: request,
    });
    assert.deepEqual((replay.structuredContent as { result: unknown }).result, {
      ...result,
      replayed: true,
    });
    assert.equal(mutations, 1);
  } finally {
    await client.close();
    await server.close();
    await rm(directory, { recursive: true, force: true });
  }
});
