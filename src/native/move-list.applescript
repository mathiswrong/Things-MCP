on run arguments
  try
    if (count of arguments) is not 3 and (count of arguments) is not 4 then return "{\"ok\":false,\"code\":\"INVALID_INPUT\"}"
    set restoring to false
    if (count of arguments) is 4 then
      if item 4 of arguments is not "restore" then return "{\"ok\":false,\"code\":\"INVALID_INPUT\"}"
      set restoring to true
    end if
    set itemKind to item 1 of arguments
    set itemID to item 2 of arguments
    set destination to item 3 of arguments
    if restoring then
      if not ((itemKind is "todo" and destination is "inbox") or (itemKind is "project" and destination is "today")) then return "{\"ok\":false,\"code\":\"INVALID_INPUT\"}"
    end if
    if destination is "inbox" then
      if itemKind is "project" then return "{\"ok\":false,\"code\":\"INVALID_INPUT\"}"
      set listID to "TMInboxListSource"
    else if destination is "today" then
      set listID to "TMTodayListSource"
    else if destination is "anytime" then
      if itemKind is "project" then return "{\"ok\":false,\"code\":\"INVALID_INPUT\"}"
      set listID to "TMNextListSource"
    else if destination is "someday" then
      set listID to "TMSomedayListSource"
    else
      return "{\"ok\":false,\"code\":\"INVALID_INPUT\"}"
    end if
    tell application id "com.culturedcode.ThingsMac"
      if not running then return "{\"ok\":false,\"code\":\"APP_UNAVAILABLE\"}"
      if itemKind is "todo" then
        if exists project id itemID then return "{\"ok\":false,\"code\":\"INVALID_INPUT\"}"
        set targetItem to to do id itemID
      else if itemKind is "project" then
        set targetItem to project id itemID
      else
        return "{\"ok\":false,\"code\":\"INVALID_INPUT\"}"
      end if
      if not (exists targetItem) then return "{\"ok\":false,\"code\":\"NOT_FOUND\"}"
      set isTrashed to exists to do id itemID of list id "TMTrashListSource"
      if restoring then
        if not isTrashed or status of targetItem is not open then return "{\"ok\":false,\"code\":\"INVALID_INPUT\"}"
      else if isTrashed then
        return "{\"ok\":false,\"code\":\"INVALID_INPUT\"}"
      end if
      move targetItem to list id listID
    end tell
    return "{\"ok\":true,\"result\":true}"
  on error errorText number errorNumber
    if errorNumber is -1743 then return "{\"ok\":false,\"code\":\"AUTOMATION_DENIED\"}"
    return "{\"ok\":false,\"code\":\"NATIVE_FAILURE\"}"
  end try
end run
