export type ErrorCode =
  | "URL_AUTH_REQUIRED"
  | "INVALID_INPUT"
  | "READ_ONLY"
  | "TRASH_DISABLED"
  | "ADVANCED_DISABLED"
  | "VERIFICATION_UNAVAILABLE"
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
  URL_AUTH_REQUIRED:
    "Store the Things URL token in the login Keychain as Things MCP URLs, account default. See the URL setup guide. Never send a token through a tool or chat.",
  INVALID_INPUT: "The request contains invalid or unsupported fields.",
  READ_ONLY:
    "Writes are disabled. Open Things MCP extension settings, enable Allow changes for this connection, and save.",
  VERIFICATION_UNAVAILABLE:
    "This operation has not passed complete scope and native verification. It remains disabled in this release.",
  ADVANCED_DISABLED:
    "This operation requires its separate owner-controlled permission in the extension settings.",
  TRASH_DISABLED:
    "Moving items to Trash is disabled for this connection. Enable Allow moving to Trash in the extension settings and save.",
  NOT_FOUND: "The requested item was not found. Find it again before retrying.",
  AUTOMATION_DENIED:
    "Allow automation access to Things in macOS Privacy & Security settings.",
  APP_UNAVAILABLE:
    "Things is unavailable. Open Things on this Mac, then retry.",
  PLATFORM_UNSUPPORTED: "The Things adapter requires macOS.",
  NATIVE_FAILURE:
    "Things automation failed. Check that Things is running and automation access is allowed, then request a connection health check.",
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
