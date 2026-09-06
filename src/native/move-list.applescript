on run arguments
  try
    if (count of arguments) is not 3 then return "{\"ok\":false,\"code\":\"INVALID_INPUT\"}"
    set itemKind to item 1 of arguments
    set itemID to item 2 of arguments
    set destination to item 3 of arguments
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
      if exists to do id itemID of list id "TMTrashListSource" then return "{\"ok\":false,\"code\":\"INVALID_INPUT\"}"
      move targetItem to list id listID
    end tell
    return "{\"ok\":true,\"result\":true}"
  on error errorText number errorNumber
    if errorNumber is -1743 then return "{\"ok\":false,\"code\":\"AUTOMATION_DENIED\"}"
    return "{\"ok\":false,\"code\":\"NATIVE_FAILURE\"}"
  end try
end run
