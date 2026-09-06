import { createHash } from "node:crypto";
import { z } from "zod";

export const kindSchema = z.enum(["todo", "project", "area", "tag"]);
export type Kind = z.infer<typeof kindSchema>;
export const idSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/);
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T12:00:00Z`);
    return (
      Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, "Use an actual calendar date in YYYY-MM-DD format.");
export const statusSchema = z.enum(["open", "completed", "canceled"]);
export const referenceSchema = z.strictObject({
  kind: kindSchema,
  id: idSchema,
});
export type Reference = z.infer<typeof referenceSchema>;
export const listSchema = z.enum([
  "inbox",
  "today",
  "anytime",
  "upcoming",
  "someday",
  "logbook",
  "trash",
]);
export type List = z.infer<typeof listSchema>;
export const itemSchema = z.strictObject({
  kind: kindSchema,
  id: idSchema,
  title: z.string(),
  notes: z.string().optional(),
  status: statusSchema.optional(),
  deadline: dateSchema.nullable().optional(),
  scheduledDate: dateSchema.nullable().optional(),
  projectId: idSchema.nullable().optional(),
  areaId: idSchema.nullable().optional(),
  tagNames: z.string().optional(),
  parentTagId: idSchema.nullable().optional(),
  keyboardShortcut: z.string().optional(),
  inTrash: z.boolean().optional(),
});
export type Item = z.infer<typeof itemSchema>;
export const querySchema = z
  .strictObject({
    kind: kindSchema.default("todo"),
    text: z.string().max(500).default(""),
    status: statusSchema.optional(),
    limit: z.number().int().min(1).max(100).default(25),
    offset: z.number().int().min(0).max(4999).default(0),
    includeNotes: z.boolean().default(false),
    list: listSchema.optional(),
    parent: z
      .strictObject({ kind: z.enum(["project", "area"]), id: idSchema })
      .optional(),
  })
  .superRefine((value, context) => {
    if (
      (value.list && value.parent) ||
      (value.kind === "project" &&
        (value.parent?.kind === "project" ||
          value.list === "anytime" ||
          value.list === "inbox")) ||
      ((value.list || value.parent || value.status) &&
        !["todo", "project"].includes(value.kind))
    )
      context.addIssue({
        code: "custom",
        message: "Choose a list or parent for to-dos or projects.",
      });
  });
export type Query = z.infer<typeof querySchema>;
export const createSchema = z
  .strictObject({
    requestId: z.uuid(),
    kind: z.enum(["todo", "project", "area", "tag"]),
    title: z.string().trim().min(1).max(4000),
    notes: z.string().max(10000).optional(),
  })
  .superRefine((value, context) => {
    if (
      (value.kind === "area" || value.kind === "tag") &&
      value.notes !== undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "Only to-dos and projects have notes.",
      });
    }
  });
export type Create = z.infer<typeof createSchema>;
export const updateSchema = z
  .strictObject({
    requestId: z.uuid(),
    target: referenceSchema,
    expectedRevision: z.string().regex(/^[a-f0-9]{64}$/),
    changes: z
      .strictObject({
        title: z.string().trim().min(1).max(4000).optional(),
        notes: z.string().max(10000).optional(),
        status: statusSchema.optional(),
        deadline: dateSchema.nullable().optional(),
      })
      .refine(
        (value) => Object.keys(value).length > 0,
        "Supply at least one changed field.",
      ),
  })
  .superRefine((value, context) => {
    if (
      (value.target.kind === "area" || value.target.kind === "tag") &&
      Object.keys(value.changes).some((key) => key !== "title")
    ) {
      context.addIssue({
        code: "custom",
        message: "Only title editing is available for this item type.",
      });
    }
  });
export type Update = z.infer<typeof updateSchema>;
export const scheduleSchema = z.strictObject({
  requestId: z.uuid(),
  target: z.strictObject({ kind: z.enum(["todo", "project"]), id: idSchema }),
  expectedRevision: z.string().regex(/^[a-f0-9]{64}$/),
  date: dateSchema,
});
export type Schedule = z.infer<typeof scheduleSchema>;
export const moveSchema = z
  .strictObject({
    requestId: z.uuid(),
    target: z.strictObject({ kind: z.enum(["todo", "project"]), id: idSchema }),
    expectedRevision: z.string().regex(/^[a-f0-9]{64}$/),
    destination: z.discriminatedUnion("kind", [
      z.strictObject({ kind: z.literal("project"), id: idSchema }),
      z.strictObject({ kind: z.literal("area"), id: idSchema }),
      z.strictObject({
        kind: z.literal("list"),
        list: z.enum(["inbox", "today", "anytime", "someday"]),
      }),
      z.strictObject({
        kind: z.literal("detach"),
        parent: z.enum(["project", "area"]),
      }),
    ]),
  })
  .superRefine((value, context) => {
    if (
      value.target.kind === "project" &&
      (value.destination.kind === "project" ||
        (value.destination.kind === "list" &&
          ["inbox", "anytime"].includes(value.destination.list)) ||
        (value.destination.kind === "detach" &&
          value.destination.parent === "project"))
    )
      context.addIssue({
        code: "custom",
        message:
          "Projects cannot move into projects or Inbox. Anytime project membership cannot be verified.",
      });
  });
export type Move = z.infer<typeof moveSchema>;
export const trashSchema = z.strictObject({
  requestId: z.uuid(),
  target: z.strictObject({ kind: z.literal("todo"), id: idSchema }),
  expectedRevision: z.string().regex(/^[a-f0-9]{64}$/),
});
export type Trash = z.infer<typeof trashSchema>;
export const queryResultSchema = z.strictObject({
  items: z.array(itemSchema),
  hasMore: z.boolean(),
  scanComplete: z.boolean(),
  nextOffset: z.number().int().nonnegative().nullable(),
});
export const healthSchema = z.strictObject({
  version: z.string(),
  running: z.boolean(),
  timezone: z.string(),
});
export interface Adapter {
  health(): Promise<z.infer<typeof healthSchema>>;
  get(reference: Reference, signal?: AbortSignal): Promise<Item>;
  find(
    query: Query,
    signal?: AbortSignal,
  ): Promise<z.infer<typeof queryResultSchema>>;
  create(input: Create, signal?: AbortSignal): Promise<Reference>;
  update(input: Update, signal?: AbortSignal): Promise<Reference>;
  schedule(input: Schedule, signal?: AbortSignal): Promise<Reference>;
  move(input: Move, signal?: AbortSignal): Promise<Reference>;
  trash(input: Trash, signal?: AbortSignal): Promise<Reference>;
  inList(target: Reference, list: List, signal?: AbortSignal): Promise<boolean>;
}
export function fingerprint(value: unknown): string {
  const canonical = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(canonical);
    if (input !== null && typeof input === "object") {
      return Object.fromEntries(
        Object.entries(input)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, val]) => [key, canonical(val)]),
      );
    }
    return input;
  };
  return createHash("sha256")
    .update(JSON.stringify(canonical(value)))
    .digest("hex");
}
export function present(item: Item) {
  return {
    ...item,
    revision: fingerprint(item),
    url: `things:///show?id=${encodeURIComponent(item.id)}`,
  };
}
