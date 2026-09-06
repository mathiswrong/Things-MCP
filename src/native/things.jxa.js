ObjC.import("Foundation");

// biome-ignore lint/correctness/noUnusedVariables: Entry point invoked by osascript.
function run() {
  function fail(code) {
    throw new Error(code);
  }
  try {
    const data = $.NSFileHandle.fileHandleWithStandardInput.readDataToEndOfFile;
    const text = ObjC.unwrap(
      $.NSString.alloc.initWithDataEncoding(data, $.NSUTF8StringEncoding),
    );
    const request = JSON.parse(text);
    const app = Application("com.culturedcode.ThingsMac");
    if (!app.running()) fail("APP_UNAVAILABLE");
    const projectKinds = new Map();
    function isProject(id) {
      if (!projectKinds.has(id))
        projectKinds.set(id, app.projects.byId(id).exists());
      return projectKinds.get(id);
    }

    function collection(kind) {
      switch (kind) {
        case "todo":
          return app.toDos;
        case "project":
          return app.projects;
        case "area":
          return app.areas;
        case "tag":
          return app.tags;
        default:
          return fail("INVALID_INPUT");
      }
    }
    function resolve(reference) {
      const item = collection(reference.kind).byId(reference.id);
      if (!item.exists()) fail("NOT_FOUND");
      if (reference.kind === "todo" && isProject(reference.id))
        fail("INVALID_INPUT");
      return item;
    }
    function builtin(name) {
      const ids = {
        inbox: "TMInboxListSource",
        today: "TMTodayListSource",
        anytime: "TMNextListSource",
        upcoming: "TMCalendarListSource",
        someday: "TMSomedayListSource",
        logbook: "TMLogbookListSource",
        trash: "TMTrashListSource",
      };
      if (!ids[name]) fail("INVALID_INPUT");
      const list = app.lists.byId(ids[name]);
      if (!list.exists()) fail("NOT_FOUND");
      return list;
    }
    let trashIds;
    function inTrash(id) {
      if (!trashIds) trashIds = builtin("trash").toDos.id();
      return trashIds.indexOf(id) >= 0;
    }
    function dateOnly(value) {
      if (!value?.getFullYear || !Number.isFinite(value.getTime())) return null;
      return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
    }
    function localDate(value) {
      const parts = value.split("-").map(Number);
      const date = new Date(0);
      date.setFullYear(parts[0], parts[1] - 1, parts[2]);
      date.setHours(12, 0, 0, 0);
      return date;
    }
    function parentId(property) {
      const parent = property();
      if (!parent) return null;
      return parent.id() || null;
    }
    function timestamp(value) {
      return value?.getTime && Number.isFinite(value.getTime())
        ? value.toISOString()
        : null;
    }
    function serialize(item, kind) {
      const result = { kind: kind, id: item.id(), title: item.name() };
      if (kind === "todo" || kind === "project") {
        result.inTrash = inTrash(result.id);
        result.notes = item.notes() || "";
        for (const field of [
          "creationDate",
          "modificationDate",
          "completionDate",
          "cancellationDate",
        ])
          result[field] = timestamp(item[field]());
        result.status = item.status();
        result.deadline = dateOnly(item.dueDate());
        result.scheduledDate = dateOnly(item.activationDate());
        result.areaId = parentId(item.area);
        if (kind === "todo") {
          result.projectId = parentId(item.project);
          if (result.projectId && inTrash(result.projectId))
            result.inTrash = true;
        }
        result.tagNames = item.tagNames() || "";
        result.tagIds = item.tags.id().sort();
      } else if (kind === "area") {
        result.tagNames = item.tagNames() || "";
        result.tagIds = item.tags.id().sort();
        result.collapsed = item.collapsed();
      } else {
        result.parentTagId = parentId(item.parentTag);
        result.keyboardShortcut = item.keyboardShortcut() || "";
      }
      return result;
    }
    function properties(fields) {
      const result = {};
      const mapping = {
        title: "name",
        notes: "notes",
        status: "status",
        collapsed: "collapsed",
        keyboardShortcut: "keyboardShortcut",
      };
      for (const field of Object.keys(mapping))
        if (fields[field] !== undefined) result[mapping[field]] = fields[field];
      if (fields.deadline !== undefined && fields.deadline !== null)
        result.dueDate = localDate(fields.deadline);
      for (const field of [
        "creationDate",
        "modificationDate",
        "completionDate",
        "cancellationDate",
      ])
        if (fields[field] !== undefined && fields[field] !== null)
          result[field] = new Date(fields[field]);
      for (const pair of [
        ["projectId", "project"],
        ["areaId", "area"],
        ["parentTagId", "parentTag"],
      ])
        if (fields[pair[0]])
          result[pair[1]] = resolve({
            kind: pair[0] === "parentTagId" ? "tag" : pair[1],
            id: fields[pair[0]],
          });
      if (fields.tagIds !== undefined) {
        const allNames = app.tags.name();
        result.tagNames = fields.tagIds
          .map((id) => {
            const name = resolve({ kind: "tag", id: id }).name();
            if (
              !name ||
              name.trim() !== name ||
              name.indexOf(",") >= 0 ||
              allNames.filter((candidate) => candidate === name).length !== 1
            )
              fail("INVALID_INPUT");
            return name;
          })
          .join(", ");
      }
      return result;
    }
    function apply(item, fields, converted) {
      for (const key of Object.keys(converted)) item[key] = converted[key];
      for (const pair of [
        ["deadline", "dueDate"],
        ["parentTagId", "parentTag"],
        ["completionDate", "completionDate"],
        ["cancellationDate", "cancellationDate"],
      ])
        if (fields[pair[0]] === null) app.delete(item[pair[1]]);
      if (fields.scheduledDate !== undefined)
        app.schedule(item, { for: localDate(fields.scheduledDate) });
    }
    function projectChildren(parent) {
      if (inTrash(parent.id())) fail("INVALID_INPUT");
      const children = parent.toDos();
      const logged = builtin("logbook").toDos.whose({
        _match: [ObjectSpecifier().project.id, parent.id()],
      })();
      const byId = new Map();
      for (const item of [...children, ...logged]) byId.set(item.id(), item);
      return [...byId.values()].map((item) => serialize(item, "todo"));
    }
    function scope(value) {
      const taskKind = (item) => (isProject(item.id()) ? "project" : "todo");
      if (value.action === "empty_trash")
        return builtin("trash")
          .toDos()
          .map((item) => serialize(item, taskKind(item)));
      if (
        value.action === "delete_container" &&
        value.target.kind === "project"
      ) {
        const parent = resolve(value.target);
        return [serialize(parent, "project"), ...projectChildren(parent)];
      }
      if (value.action === "log_completed") {
        const logged = builtin("logbook").toDos.id();
        return app.toDos
          .whose({ status: { _notEquals: "open" } })()
          .map((item) => serialize(item, taskKind(item)))
          .filter((item) => !item.inTrash && !logged.includes(item.id));
      }
      if (value.target.kind === "area") {
        const parent = resolve(value.target);
        const logged = builtin("logbook").toDos.whose({
          _match: [ObjectSpecifier().area.id, value.target.id],
        })();
        const items = new Map();
        for (const object of [...parent.toDos(), ...logged]) {
          const item = serialize(object, taskKind(object));
          if (item.inTrash) continue;
          items.set(item.id, item);
          if (item.kind === "project")
            for (const child of projectChildren(object))
              items.set(child.id, child);
        }
        return [serialize(parent, "area"), ...items.values()];
      }
      if (value.target.kind === "tag") {
        const tags = app.tags().map((item) => serialize(item, "tag"));
        const ids = new Set([value.target.id]);
        let previous = 0;
        while (previous !== ids.size) {
          previous = ids.size;
          for (const tag of tags) if (ids.has(tag.parentTagId)) ids.add(tag.id);
        }
        const affectedTags = tags.filter((item) => ids.has(item.id));
        const candidates = new Map();
        const sources = [
          app.toDos,
          app.projects,
          builtin("logbook").toDos,
          builtin("trash").toDos,
          ...app.projects().map((project) => project.toDos),
        ];
        for (const source of sources)
          for (const tag of affectedTags) {
            for (const object of source.whose({
              tagNames: { _contains: tag.title },
            })()) {
              if (!candidates.has(object.id())) {
                const item = serialize(object, taskKind(object));
                if (item.tagIds.some((id) => ids.has(id)))
                  candidates.set(item.id, item);
              }
            }
          }
        return [
          ...affectedTags,
          ...candidates.values(),
          ...app
            .areas()
            .map((item) => serialize(item, "area"))
            .filter((item) => item.tagIds.some((id) => ids.has(id))),
        ];
      }
      fail("INVALID_INPUT");
    }
    let result;
    const input = request.input;
    switch (request.operation) {
      case "health":
        result = {
          version: app.version(),
          running: true,
          timezone: ObjC.unwrap($.NSTimeZone.localTimeZone.name),
        };
        break;
      case "get":
        result = serialize(resolve(input), input.kind);
        break;
      case "children": {
        if (input.kind !== "project") fail("INVALID_INPUT");
        result = projectChildren(resolve(input));
        break;
      }
      case "count":
      case "find": {
        const counting = request.operation === "count";
        const scoped = input.list || input.parent || input.selected;
        const source = input.selected
          ? app.selectedToDos
          : input.list
            ? builtin(input.list).toDos
            : input.parent
              ? resolve(input.parent).toDos
              : collection(input.kind);
        const projectRows =
          input.parent?.kind === "project"
            ? projectChildren(resolve(input.parent))
            : null;
        const objects = projectRows || source();
        const ids = projectRows
          ? projectRows.map((item) => item.id)
          : source.id();
        const titles =
          input.text || input.sortBy === "title"
            ? projectRows
              ? projectRows.map((item) => item.title)
              : source.name()
            : [];
        const notes =
          input.text && (input.kind === "todo" || input.kind === "project")
            ? projectRows
              ? projectRows.map((item) => item.notes)
              : source.notes()
            : [];
        const statuses = input.status
          ? projectRows
            ? projectRows.map((item) => item.status)
            : source.status()
          : [];
        const targetCount = counting
          ? Infinity
          : input.offset + input.limit + 1;
        const positions = ids.map((_id, index) => index);
        if (input.sortBy) {
          const field = {
            deadline: "dueDate",
            scheduledDate: "activationDate",
            creationDate: "creationDate",
            modificationDate: "modificationDate",
          }[input.sortBy];
          const sortValues =
            input.sortBy === "title"
              ? titles.map((value) => value.toLowerCase())
              : (projectRows
                  ? projectRows.map((item) =>
                      item[input.sortBy] ? new Date(item[input.sortBy]) : null,
                    )
                  : source[field]()
                ).map((value) =>
                  value?.getTime && Number.isFinite(value.getTime())
                    ? value.getTime()
                    : null,
                );
          positions.sort((a, b) => {
            const left = sortValues[a],
              right = sortValues[b];
            if (left === null || right === null)
              return left === right
                ? ids[a].localeCompare(ids[b])
                : left === null
                  ? 1
                  : -1;
            const comparison =
              typeof left === "string"
                ? left.localeCompare(right)
                : left - right;
            return (
              (input.sortOrder === "descending" ? -comparison : comparison) ||
              ids[a].localeCompare(ids[b])
            );
          });
        }
        const matches = [];
        const matchPositions = [];
        const start = input.scanOffset || 0;
        const scanStarted = Date.now();
        let scanned = start;
        for (; scanned < Math.min(objects.length, start + 5000); scanned++) {
          if (scanned > start && Date.now() - scanStarted >= 5000) break;
          const position = positions[scanned];
          const object = objects[position];
          const id = ids[position];
          if (input.status && statuses[position] !== input.status) continue;
          const searchable =
            `${titles[position] || ""}\n${notes[position] || ""}`.toLowerCase();
          if (input.text && searchable.indexOf(input.text.toLowerCase()) < 0)
            continue;
          if (input.kind === "todo" && isProject(id)) continue;
          if (input.kind === "project" && scoped && !isProject(id)) continue;
          if (
            !input.list &&
            (input.kind === "todo" || input.kind === "project") &&
            inTrash(id)
          )
            continue;
          if (
            !input.list &&
            input.kind === "todo" &&
            (projectRows ? object.inTrash : inTrash(parentId(object.project)))
          )
            continue;
          if (
            counting &&
            !input.tagId &&
            !input.deadlineFrom &&
            !input.deadlineThrough &&
            !input.scheduledFrom &&
            !input.scheduledThrough
          ) {
            matches.push(id);
            continue;
          }
          const item = projectRows ? object : serialize(object, input.kind);
          if (input.tagId && !item.tagIds.includes(input.tagId)) continue;
          if (
            input.deadlineFrom &&
            (!item.deadline || item.deadline < input.deadlineFrom)
          )
            continue;
          if (
            input.deadlineThrough &&
            (!item.deadline || item.deadline > input.deadlineThrough)
          )
            continue;
          if (
            input.scheduledFrom &&
            (!item.scheduledDate || item.scheduledDate < input.scheduledFrom)
          )
            continue;
          if (
            input.scheduledThrough &&
            (!item.scheduledDate || item.scheduledDate > input.scheduledThrough)
          )
            continue;
          if (item.id !== id || (input.status && item.status !== input.status))
            continue;
          if (
            input.text &&
            `${item.title}\n${item.notes || ""}`
              .toLowerCase()
              .indexOf(input.text.toLowerCase()) < 0
          )
            continue;
          matches.push(item);
          matchPositions.push(scanned);
          if (matches.length >= targetCount) {
            scanned++;
            break;
          }
        }
        const hasMore = matches.length > input.offset + input.limit;
        result = counting
          ? {
              count: matches.length,
              scanComplete: scanned >= objects.length,
              nextScanOffset: scanned < objects.length ? scanned : null,
            }
          : {
              items: matches.slice(input.offset, input.offset + input.limit),
              hasMore: hasMore,
              scanComplete: scanned >= objects.length,
              nextOffset:
                hasMore && input.offset + input.limit < 5000
                  ? input.offset + input.limit
                  : null,
              nextScanOffset: hasMore
                ? matchPositions[input.offset + input.limit]
                : scanned < objects.length
                  ? scanned
                  : null,
            };
        break;
      }
      case "create": {
        const converted = properties(input);
        let item;
        switch (input.kind) {
          case "todo":
            item = app.ToDo(converted);
            break;
          case "project":
            item = app.Project(converted);
            break;
          case "area":
            item = app.Area(converted);
            break;
          case "tag":
            item = app.Tag(converted);
            break;
          default:
            fail("INVALID_INPUT");
        }
        collection(input.kind).push(item);
        if (input.scheduledDate !== undefined)
          app.schedule(item, { for: localDate(input.scheduledDate) });
        result = { kind: input.kind, id: item.id() };
        break;
      }
      case "update": {
        const item = resolve(input.target);
        apply(item, input.changes, properties(input.changes));
        result = input.target;
        break;
      }
      case "schedule":
        app.schedule(resolve(input.target), { for: localDate(input.date) });
        result = input.target;
        break;
      case "inList":
        result = builtin(input.list).toDos.byId(input.target.id).exists();
        break;
      case "move": {
        const item = resolve(input.target);
        if (inTrash(input.target.id)) fail("INVALID_INPUT");
        const destination = input.destination;
        if (destination.kind === "project") item.project = resolve(destination);
        else if (destination.kind === "area") item.area = resolve(destination);
        else if (
          destination.kind === "detach" &&
          destination.parent === "project"
        )
          app.delete(item.project);
        else if (destination.kind === "detach" && destination.parent === "area")
          app.delete(item.area);
        else fail("INVALID_INPUT");
        result = input.target;
        break;
      }
      case "scope":
        result = scope(input);
        break;
      case "destructive":
        if (input.action === "empty_trash") app.emptyTrash();
        else if (input.action === "log_completed") app.logCompletedNow();
        else if (
          input.action === "delete_container" &&
          ["project", "area", "tag"].includes(input.target.kind)
        )
          app.delete(resolve(input.target));
        else fail("INVALID_INPUT");
        result = true;
        break;
      case "navigate":
        if (input.action === "quick_entry")
          app.showQuickEntryPanel({ withAutofill: false });
        else if (input.action === "edit") app.edit(resolve(input.target));
        else app.show(input.list ? builtin(input.list) : resolve(input.target));
        result = true;
        break;
      case "trash": {
        if (input.target.kind !== "todo") fail("INVALID_INPUT");
        const item = resolve(input.target);
        if (inTrash(input.target.id)) fail("INVALID_INPUT");
        app.delete(item);
        result = input.target;
        break;
      }
      default:
        fail("INVALID_INPUT");
    }
    return JSON.stringify({ ok: true, result: result });
  } catch (error) {
    const allowed = ["APP_UNAVAILABLE", "NOT_FOUND", "INVALID_INPUT"];
    const code =
      Number(error.errorNumber) === -1743
        ? "AUTOMATION_DENIED"
        : allowed.indexOf(error.message) >= 0
          ? error.message
          : "NATIVE_FAILURE";
    return JSON.stringify({ ok: false, code: code });
  }
}
