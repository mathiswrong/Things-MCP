import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import {
  type FileHandle,
  lstat,
  mkdir,
  open,
  readdir,
  realpath,
  rename,
  rm,
} from "node:fs/promises";
import { join } from "node:path";
import lockfile from "proper-lockfile";
import { z } from "zod";
import type { DestructiveAction } from "./domain.js";
import { BridgeError } from "./errors.js";

export const descendantImpactSchema = z.strictObject({
  scope: z.literal("exposed_task_fields"),
  beforeCount: z.number().int().nonnegative(),
  afterCount: z.number().int().nonnegative(),
  beforeComplete: z.boolean(),
  afterComplete: z.boolean(),
  comparedCount: z.number().int().nonnegative(),
  changedCount: z.number().int().nonnegative(),
  unchangedExposedFieldsCount: z.number().int().nonnegative(),
  notComparedCount: z.number().int().nonnegative(),
  changes: z
    .array(
      z.strictObject({
        id: z.string(),
        changedFields: z.array(z.string()),
      }),
    )
    .max(20),
  changesTruncated: z.boolean(),
  limitations: z.string(),
});

export const receiptSchema = z.strictObject({
  requestId: z.uuid(),
  target: z.strictObject({
    kind: z.enum(["todo", "project", "area", "tag"]),
    id: z.string(),
  }),
  changedFields: z.array(z.string()),
  verification: z.enum(["read_back", "command_accepted"]),
  descendantImpact: descendantImpactSchema.optional(),
});
export type Receipt = z.infer<typeof receiptSchema>;
export const urlReceiptSchema = z.strictObject({
  requestId: z.uuid(),
  target: z
    .strictObject({ kind: z.enum(["todo", "project"]), id: z.string() })
    .optional(),
  operation: z.enum(["template", "edit", "duplicate", "navigate"]),
  verification: z.literal("url_dispatched"),
  message: z.literal(
    "Sent to Things; result not verified. Inspect Things before making another change. Do not repeat this request with a new ID.",
  ),
});
export type UrlReceipt = z.infer<typeof urlReceiptSchema>;
const recordSchema = z.strictObject({
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  state: z.enum(["pending", "completed", "unknown", "dispatched"]),
  receipt: z.union([receiptSchema, urlReceiptSchema]).optional(),
});
export type OperationRecord = z.infer<typeof recordSchema>;
export const clientIdSchema = z.enum([
  "desktop-extension",
  "desktop-plugin",
  "browser",
]);
export type ClientId = z.infer<typeof clientIdSchema>;
const settingsSchema = z.strictObject({
  allowWrites: z.boolean(),
  clients: z
    .partialRecord(
      clientIdSchema,
      z.strictObject({
        configured: z.boolean(),
        enabled: z.boolean(),
      }),
    )
    .optional(),
});
const trashSettingsSchema = settingsSchema
  .omit({ allowWrites: true })
  .extend({ allowTrash: z.boolean() });
export interface Lease {
  signal: AbortSignal;
  assertOwned(): Promise<void>;
}
export class State {
  constructor(
    public readonly directory: string,
    private readonly permitWrites = true,
    private readonly clientId?: ClientId,
  ) {}
  async initialize() {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    const stat = await lstat(this.directory);
    if (
      !stat.isDirectory() ||
      stat.isSymbolicLink() ||
      (stat.mode & 0o077) !== 0 ||
      (process.getuid && stat.uid !== process.getuid())
    )
      throw new BridgeError("UNSAFE_STATE");
  }
  private async read(name: string): Promise<unknown | undefined> {
    let file: FileHandle | undefined;
    try {
      file = await open(
        join(this.directory, name),
        constants.O_RDONLY | constants.O_NOFOLLOW,
      );
      const stat = await file.stat();
      if (
        !stat.isFile() ||
        (stat.mode & 0o077) !== 0 ||
        stat.size > 65536 ||
        (process.getuid && stat.uid !== process.getuid())
      )
        throw new BridgeError("UNSAFE_STATE");
      return JSON.parse(await file.readFile("utf8"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
      if (error instanceof BridgeError) throw error;
      throw new BridgeError("STATE_FAILURE");
    } finally {
      await file?.close();
    }
  }
  private async write(name: string, value: unknown, lease?: Lease) {
    const temporary = join(this.directory, `.${randomUUID()}.tmp`);
    try {
      const file = await open(temporary, "wx", 0o600);
      try {
        await file.writeFile(JSON.stringify(value));
        await file.sync();
      } finally {
        await file.close();
      }
      await lease?.assertOwned();
      await rename(temporary, join(this.directory, name));
      const directory = await open(this.directory, "r");
      try {
        await directory.sync();
      } finally {
        await directory.close();
      }
    } catch (error) {
      if (error instanceof BridgeError) throw error;
      throw new BridgeError("STATE_FAILURE");
    } finally {
      await rm(temporary, { force: true });
    }
  }
  async writesEnabled() {
    if (!this.permitWrites) return false;
    const settings = await this.settings();
    return this.clientId
      ? settings.clients?.[this.clientId]?.enabled === true
      : settings.allowWrites;
  }
  async trashEnabled() {
    if (!(await this.writesEnabled())) return false;
    const settings = await this.trashSettings();
    return this.clientId
      ? settings.clients?.[this.clientId]?.enabled === true
      : settings.allowTrash;
  }
  async advancedEnabled(action: DestructiveAction) {
    if (!(await this.writesEnabled())) return false;
    const settings = await this.advancedSettings(action);
    return this.clientId
      ? settings.clients?.[this.clientId]?.enabled === true
      : settings.allowWrites;
  }
  private async advancedSettings(action: DestructiveAction) {
    if (!["delete_container", "empty_trash", "log_completed"].includes(action))
      throw new BridgeError("INVALID_INPUT");
    const value = await this.read(`${action}-settings.json`);
    if (value === undefined)
      return { allowWrites: false } as z.infer<typeof settingsSchema>;
    const parsed = settingsSchema.safeParse(value);
    if (!parsed.success) throw new BridgeError("STATE_FAILURE");
    return parsed.data;
  }
  async configureAdvanced(grants: Record<DestructiveAction, boolean>) {
    await this.exclusive(async (lease) => {
      for (const action of [
        "delete_container",
        "empty_trash",
        "log_completed",
      ] as const) {
        const settings = await this.advancedSettings(action);
        const enabled = grants[action];
        if (this.clientId) {
          if (settings.clients?.[this.clientId]?.configured !== enabled)
            await this.write(
              `${action}-settings.json`,
              {
                ...settings,
                clients: {
                  ...settings.clients,
                  [this.clientId]: { configured: enabled, enabled },
                },
              },
              lease,
            );
        } else
          await this.write(
            `${action}-settings.json`,
            { ...settings, allowWrites: enabled },
            lease,
          );
      }
    });
  }
  private async trashSettings() {
    const value = await this.read("trash-settings.json");
    if (value === undefined)
      return { allowTrash: false } as z.infer<typeof trashSettingsSchema>;
    const result = trashSettingsSchema.safeParse(value);
    if (!result.success) throw new BridgeError("STATE_FAILURE");
    return result.data;
  }
  private async settings() {
    const value = await this.read("settings.json");
    if (value === undefined)
      return { allowWrites: false } as z.infer<typeof settingsSchema>;
    const result = settingsSchema.safeParse(value);
    if (!result.success) throw new BridgeError("STATE_FAILURE");
    return result.data;
  }
  async configureClient(enabled: boolean, allowTrash = false) {
    if (!this.clientId) throw new BridgeError("INVALID_INPUT");
    const id = this.clientId;
    await this.exclusive(async (lease) => {
      const settings = await this.settings();
      const trash = await this.trashSettings();
      if (trash.clients?.[id]?.configured !== allowTrash) {
        await this.write(
          "trash-settings.json",
          {
            ...trash,
            clients: {
              ...trash.clients,
              [id]: { configured: allowTrash, enabled: allowTrash },
            },
          },
          lease,
        );
      }
      if (settings.clients?.[id]?.configured !== enabled) {
        await this.write(
          "settings.json",
          {
            ...settings,
            clients: {
              ...settings.clients,
              [id]: { configured: enabled, enabled },
            },
          },
          lease,
        );
      }
    });
  }
  async setWrites(enabled: boolean) {
    await this.exclusive(async (lease) => {
      const settings = await this.settings();
      if (!enabled) {
        for (const action of [
          "delete_container",
          "empty_trash",
          "log_completed",
        ] as const) {
          const advanced = await this.advancedSettings(action);
          for (const grant of Object.values(advanced.clients ?? {}))
            grant.enabled = false;
          await this.write(
            `${action}-settings.json`,
            { ...advanced, allowWrites: false },
            lease,
          );
        }
        const trash = await this.trashSettings();
        for (const grant of Object.values(trash.clients ?? {}))
          grant.enabled = false;
        await this.write(
          "trash-settings.json",
          { ...trash, allowTrash: false },
          lease,
        );
        for (const grant of Object.values(settings.clients ?? {}))
          grant.enabled = false;
      }
      await this.write(
        "settings.json",
        { ...settings, allowWrites: enabled },
        lease,
      );
    });
  }
  async setTrash(enabled: boolean) {
    await this.exclusive(async (lease) => {
      const settings = await this.trashSettings();
      await this.write(
        "trash-settings.json",
        { ...settings, allowTrash: enabled },
        lease,
      );
    });
  }
  async exclusive<T>(action: (lease: Lease) => Promise<T>): Promise<T> {
    await this.initialize();
    let release: () => Promise<void>;
    const controller = new AbortController();
    const lockPath = `${await realpath(this.directory)}.lock`;
    try {
      release = await lockfile.lock(this.directory, {
        stale: 120000,
        update: 10000,
        retries: 0,
        onCompromised: () => {
          controller.abort();
        },
      });
    } catch {
      throw new BridgeError("BUSY");
    }
    const identity = await lstat(lockPath);
    try {
      const lease: Lease = {
        signal: controller.signal,
        assertOwned: async () => {
          try {
            const current = await lstat(lockPath);
            if (
              controller.signal.aborted ||
              current.ino !== identity.ino ||
              current.dev !== identity.dev ||
              current.birthtimeMs !== identity.birthtimeMs ||
              Date.now() - current.mtimeMs > 120000
            ) {
              throw new Error("Lock ownership changed");
            }
          } catch {
            controller.abort();
            throw new BridgeError("OUTCOME_UNKNOWN");
          }
        },
      };
      await lease.assertOwned();
      const result = await action(lease);
      await lease.assertOwned();
      return result;
    } finally {
      const current = await lstat(lockPath).catch(() => undefined);
      if (
        current?.ino === identity.ino &&
        current.dev === identity.dev &&
        current.birthtimeMs === identity.birthtimeMs
      ) {
        await release().catch(() => undefined);
      }
    }
  }
  async operation(id: string): Promise<OperationRecord | undefined> {
    if (!z.uuid().safeParse(id).success) throw new BridgeError("INVALID_INPUT");
    const value = await this.read(`request-${id}.json`);
    if (value === undefined) return undefined;
    const parsed = recordSchema.safeParse(value);
    if (!parsed.success) throw new BridgeError("STATE_FAILURE");
    return parsed.data;
  }
  async record(id: string, record: OperationRecord, lease?: Lease) {
    if (!z.uuid().safeParse(id).success) throw new BridgeError("INVALID_INPUT");
    await this.write(`request-${id}.json`, recordSchema.parse(record), lease);
  }
  async checkCapacity() {
    if (
      (await readdir(this.directory)).filter((name) =>
        name.startsWith("request-"),
      ).length >= 10000
    ) {
      throw new BridgeError("STATE_FAILURE");
    }
  }
}
