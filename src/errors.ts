export type ErrorCode =
  | "INVALID_INPUT"
  | "READ_ONLY"
  | "NOT_FOUND"
  | "AUTOMATION_DENIED"
  | "APP_UNAVAILABLE"
  | "PLATFORM_UNSUPPORTED"
  | "NATIVE_FAILURE"
  | "OUTCOME_UNKNOWN"
  | "STALE_ITEM"
  | "REQUEST_CONFLICT"
  | "BUSY"
  | "VERIFICATION_FAILED"
  | "UNSAFE_STATE"
  | "STATE_FAILURE";

const messages: Record<ErrorCode, string> = {
  INVALID_INPUT: "The request contains invalid or unsupported fields.",
  READ_ONLY:
    "Writes are disabled. Enable ordinary writes in the local setup command.",
  NOT_FOUND: "The requested item was not found. Find it again before retrying.",
  AUTOMATION_DENIED:
    "Allow automation access to Things in macOS Privacy & Security settings.",
  APP_UNAVAILABLE:
    "Things is unavailable. Open Things on this Mac, then retry.",
  PLATFORM_UNSUPPORTED: "The Things adapter requires macOS.",
  NATIVE_FAILURE:
    "Things automation failed. Run the local doctor command for connection status.",
  OUTCOME_UNKNOWN:
    "The write may have happened. Read the affected items before taking another action. This request will not be repeated automatically.",
  STALE_ITEM:
    "This item changed after it was read. Fetch it again and review the proposed changes.",
  REQUEST_CONFLICT:
    "This request ID was already used with different arguments. It cannot be reused.",
  BUSY: "Another local operation is running. Retry this same request later.",
  VERIFICATION_FAILED:
    "Things did not return the expected values after the write. Read the item before making another change.",
  UNSAFE_STATE:
    "The local state directory or file has unsafe ownership, permissions, or a symbolic link.",
  STATE_FAILURE:
    "The local operation journal could not be read or written safely. Resolve it before further writes.",
};
export class BridgeError extends Error {
  constructor(public readonly code: ErrorCode) {
    super(messages[code]);
  }
}
export function publicError(error: unknown) {
  const safe =
    error instanceof BridgeError ? error : new BridgeError("NATIVE_FAILURE");
  return { code: safe.code, message: safe.message };
}
