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
    assert.equal(tools.tools.length, 10);
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
