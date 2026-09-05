import * as Sentry from "@sentry/node";
import { BridgeError } from "./errors.js";

export function scrubEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  return {
    type: event.type,
    event_id: event.event_id,
    timestamp: event.timestamp,
    level: "error",
    message: "Local bridge operation failed",
    tags: {
      code:
        typeof event.tags?.code === "string"
          ? event.tags.code
          : "NATIVE_FAILURE",
    },
  };
}

export function startTelemetry(dsn: string | undefined) {
  if (!dsn) return;
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    defaultIntegrations: false,
    tracesSampleRate: 0,
    beforeSend: scrubEvent,
    beforeBreadcrumb: () => null,
  });
}
export function reportFailure(error: unknown) {
  if (!Sentry.isInitialized()) return;
  Sentry.captureMessage("Local bridge operation failed", {
    level: "error",
    tags: {
      code: error instanceof BridgeError ? error.code : "NATIVE_FAILURE",
    },
  });
}
export async function closeTelemetry() {
  await Sentry.close(1500);
}
