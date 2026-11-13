import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import * as Sentry from "@sentry/node";
import { BridgeError } from "../src/errors.js";
import {
  closeTelemetry,
  reportFailure,
  startTelemetry,
} from "../src/telemetry.js";

test("the SDK sends only a scrubbed failure to the configured receiver", async (t) => {
  const envelopes: string[] = [];
  const receiver = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    envelopes.push(Buffer.concat(chunks).toString("utf8"));
    response.end("{}");
  });
  receiver.listen(0, "127.0.0.1");
  await once(receiver, "listening");
  t.after(() => receiver.close());
  const { port } = receiver.address() as AddressInfo;
  startTelemetry(undefined);
  assert.equal(Sentry.isInitialized(), false);
  startTelemetry(`http://synthetic@127.0.0.1:${port}/1`);
  try {
    Sentry.withScope((scope) => {
      scope.setUser({ email: "private-fixture@example.invalid" });
      scope.setExtra("task", "private-fixture task contents");
      scope.setTag("path", "/private-fixture/library");
      reportFailure(new BridgeError("READ_ONLY"));
    });
  } finally {
    await closeTelemetry();
  }
  assert.equal(envelopes.length, 1);
  const [envelope] = envelopes;
  assert.ok(envelope);
  assert.doesNotMatch(envelope, /private-fixture/);
  const [, itemHeader, payload, ...extraItems] = envelope.trimEnd().split("\n");
  assert.ok(itemHeader && payload);
  assert.deepEqual(extraItems, []);
  assert.equal(JSON.parse(itemHeader).type, "event");
  const event = JSON.parse(payload);
  assert.deepEqual(Object.keys(event).sort(), [
    "event_id",
    "level",
    "message",
    "sdk",
    "tags",
    "timestamp",
  ]);
  assert.deepEqual(event.tags, { code: "READ_ONLY" });
  assert.equal(event.message, "Local bridge operation failed");
});
