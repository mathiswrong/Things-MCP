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
export const timestampSchema = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value).toISOString());
const tagIdsSchema = z
  .array(idSchema)
  .max(100)
  .refine((ids) => new Set(ids).size === ids.length, "Do not repeat tag IDs.");
const editableFields = {
  title: z.string().trim().min(1).max(4000).optional(),
  notes: z.string().max(10000).optional(),
  status: statusSchema.optional(),
  deadline: dateSchema.nullable().optional(),
  tagIds: tagIdsSchema.optional(),
  parentTagId: idSchema.nullable().optional(),
  keyboardShortcut: z.string().max(1).optional(),
  collapsed: z.boolean().optional(),
  creationDate: timestampSchema.optional(),
  modificationDate: timestampSchema.optional(),
  completionDate: timestampSchema.nullable().optional(),
  cancellationDate: timestampSchema.nullable().optional(),
};
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
  tagIds: z.array(idSchema).optional(),
  collapsed: z.boolean().optional(),
  creationDate: timestampSchema.nullable().optional(),
  modificationDate: timestampSchema.nullable().optional(),
  completionDate: timestampSchema.nullable().optional(),
  cancellationDate: timestampSchema.nullable().optional(),
  parentTagId: idSchema.nullable().optional(),
  keyboardShortcut: z.string().optional(),
  inTrash: z.boolean().optional(),
  childRevision: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .optional(),
  childCount: z.number().int().nonnegative().optional(),
});
export type Item = z.infer<typeof itemSchema>;
export const scopeItemSchema = itemSchema.extend({
  inLogbook: z.boolean().optional(),
});
export type ScopeItem = z.infer<typeof scopeItemSchema>;
export const querySchema = z
  .strictObject({
    kind: kindSchema.default("todo"),
    text: z.string().max(500).default(""),
    status: statusSchema.optional(),
    limit: z.number().int().min(1).max(100).default(25),
    offset: z.number().int().min(0).max(4999).default(0),
    includeNotes: z.boolean().default(false),
    scanOffset: z.number().int().min(0).max(1_000_000_000).optional(),
    tagId: idSchema.optional(),
    deadlineFrom: dateSchema.optional(),
    deadlineThrough: dateSchema.optional(),
    scheduledFrom: dateSchema.optional(),
    scheduledThrough: dateSchema.optional(),
    selected: z.boolean().optional(),
    sortBy: z
      .enum([
        "title",
        "deadline",
        "scheduledDate",
        "creationDate",
        "modificationDate",
      ])
      .optional(),
    sortOrder: z.enum(["ascending", "descending"]).default("ascending"),
    list: listSchema.optional(),
    parent: z
      .strictObject({ kind: z.enum(["project", "area"]), id: idSchema })
      .optional(),
  })
  .superRefine((value, context) => {
    if (
      (value.selected &&
        (value.list ||
          value.parent ||
          !["todo", "project"].includes(value.kind))) ||
      (value.scanOffset !== undefined && value.offset !== 0) ||
      (value.sortBy &&
        value.sortBy !== "title" &&
        !["todo", "project"].includes(value.kind)) ||
      (value.deadlineFrom &&
        value.deadlineThrough &&
        value.deadlineFrom > value.deadlineThrough) ||
      (value.scheduledFrom &&
        value.scheduledThrough &&
        value.scheduledFrom > value.scheduledThrough) ||
      ((value.tagId ||
        value.deadlineFrom ||
        value.deadlineThrough ||
        value.scheduledFrom ||
        value.scheduledThrough) &&
        !["todo", "project"].includes(value.kind)) ||
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
    ...editableFields,
    title: z.string().trim().min(1).max(4000),
    projectId: idSchema.optional(),
    areaId: idSchema.optional(),
    scheduledDate: dateSchema.optional(),
  })
  .superRefine((value, context) => {
    const fields = Object.keys(value).filter(
      (key) => !["kind", "requestId"].includes(key),
    );
    if (!validFields(value.kind, fields) || (value.projectId && value.areaId)) {
      context.addIssue({
        code: "custom",
        message: "Only to-dos and projects have notes.",
      });
    }
  });
export type Create = z.infer<typeof createSchema>;
function validFields(kind: Kind, fields: string[]) {
  const titles = ["title", "appendTitle", "prependTitle"];
  const tags = ["tagIds", "addTagIds", "removeTagIds"];
  const allowed =
    kind === "tag"
      ? [...titles, "parentTagId", "keyboardShortcut"]
      : kind === "area"
        ? [...titles, ...tags, "collapsed"]
        : [
            ...titles,
            ...tags,
            "notes",
            "appendNotes",
            "prependNotes",
            "status",
            "deadline",
            "creationDate",
            "modificationDate",
            "completionDate",
            "cancellationDate",
            "scheduledDate",
            "areaId",
            ...(kind === "todo" ? ["projectId"] : []),
          ];
  return fields.every((field) => allowed.includes(field));
}
export const updateSchema = z
  .strictObject({
    requestId: z.uuid(),
    target: referenceSchema,
    expectedRevision: z.string().regex(/^[a-f0-9]{64}$/),
    changes: z
      .strictObject({
        ...editableFields,
        appendTitle: z.string().max(4000).optional(),
        prependTitle: z.string().max(4000).optional(),
        appendNotes: z.string().max(10000).optional(),
        prependNotes: z.string().max(10000).optional(),
        addTagIds: tagIdsSchema.optional(),
        removeTagIds: tagIdsSchema.optional(),
      })
      .refine(
        (value) => Object.keys(value).length > 0,
        "Supply at least one changed field.",
      ),
  })
  .superRefine((value, context) => {
    const fields = Object.keys(value.changes);
    if (
      !validFields(value.target.kind, fields) ||
      (value.changes.title !== undefined &&
        (value.changes.appendTitle !== undefined ||
          value.changes.prependTitle !== undefined)) ||
      (value.changes.notes !== undefined &&
        (value.changes.appendNotes !== undefined ||
          value.changes.prependNotes !== undefined)) ||
      (value.changes.tagIds !== undefined &&
        (value.changes.addTagIds !== undefined ||
          value.changes.removeTagIds !== undefined))
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
export const destructiveActionSchema = z.enum([
  "delete_container",
  "empty_trash",
  "log_completed",
]);
export type DestructiveAction = z.infer<typeof destructiveActionSchema>;
export const destructiveScopeSchema = z
  .strictObject({
    action: destructiveActionSchema,
    target: referenceSchema.optional(),
  })
  .superRefine((value, context) => {
    if (
      (value.action === "delete_container" &&
        (!value.target || value.target.kind === "todo")) ||
      (value.action !== "delete_container" && value.target)
    )
      context.addIssue({
        code: "custom",
        message:
          "Container deletion requires a project, area, or tag. Library commands have no target.",
      });
  });
export type DestructiveScope = z.infer<typeof destructiveScopeSchema>;
export const destructiveSchema = destructiveScopeSchema.safeExtend({
  requestId: z.uuid(),
  expectedScopeRevision: z.string().regex(/^[a-f0-9]{64}$/),
});
export type Destructive = z.infer<typeof destructiveSchema>;
export const navigateSchema = z
  .strictObject({
    requestId: z.uuid(),
    action: z.enum(["show", "edit", "quick_entry"]),
    target: referenceSchema.optional(),
    list: listSchema.optional(),
  })
  .superRefine((value, context) => {
    if (
      (value.action === "quick_entry" && (value.target || value.list)) ||
      (value.action !== "quick_entry" &&
        Boolean(value.target) === Boolean(value.list)) ||
      (value.action === "edit" &&
        (!value.target || !["todo", "project"].includes(value.target.kind))) ||
      value.target?.kind === "tag"
    )
      context.addIssue({
        code: "custom",
        message: "Choose a supported item or list.",
      });
  });
export type Navigate = z.infer<typeof navigateSchema>;
export const trashSchema = z.strictObject({
  requestId: z.uuid(),
  target: z.strictObject({ kind: z.literal("todo"), id: idSchema }),
  expectedRevision: z.string().regex(/^[a-f0-9]{64}$/),
});
export type Trash = z.infer<typeof trashSchema>;
export const restoreSchema = trashSchema.extend({
  target: z.strictObject({ kind: z.enum(["todo", "project"]), id: idSchema }),
});
export type Restore = z.infer<typeof restoreSchema>;
export const countResultSchema = z.strictObject({
  count: z.number().int().nonnegative(),
  scanComplete: z.boolean(),
  nextScanOffset: z.number().int().nonnegative().nullable(),
});
export const queryResultSchema = z.strictObject({
  items: z.array(itemSchema),
  hasMore: z.boolean(),
  scanComplete: z.boolean(),
  nextOffset: z.number().int().nonnegative().nullable(),
  nextScanOffset: z.number().int().nonnegative().nullable().optional(),
});
export const healthSchema = z.strictObject({
  version: z.string(),
  running: z.boolean(),
  timezone: z.string(),
});
export interface Adapter {
  readonly destructiveVerified: Readonly<
    Record<Kind | "empty_trash" | "log_completed", boolean>
  >;
  scope(input: DestructiveScope, signal?: AbortSignal): Promise<ScopeItem[]>;
  destructive(input: Destructive, signal?: AbortSignal): Promise<boolean>;
  count(query: Query): Promise<z.infer<typeof countResultSchema>>;
  navigate(input: Navigate, signal?: AbortSignal): Promise<boolean>;
  children(reference: Reference, signal?: AbortSignal): Promise<Item[]>;
  health(): Promise<z.infer<typeof healthSchema>>;
  get(reference: Reference, signal?: AbortSignal): Promise<Item>;
  find(query: Query): Promise<z.infer<typeof queryResultSchema>>;
  create(input: Create, signal?: AbortSignal): Promise<Reference>;
  update(input: Update, signal?: AbortSignal): Promise<Reference>;
  schedule(input: Schedule, signal?: AbortSignal): Promise<Reference>;
  move(input: Move, signal?: AbortSignal): Promise<Reference>;
  trash(input: Trash, signal?: AbortSignal): Promise<Reference>;
  restore(input: Restore, signal?: AbortSignal): Promise<Reference>;
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
