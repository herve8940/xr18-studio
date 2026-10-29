-- REAPER action: start once, emits region changes while playing.
-- Configure project extstate XR18_STUDIO / SONG_ID to match the Studio song ID.
-- Outbox defaults to REAPER resource directory. Override XR18_STUDIO_OUTBOX.
local r = reaper
local outbox = os.getenv('XR18_STUDIO_OUTBOX') or (r.GetResourcePath() .. '/xr18-studio-events.jsonl')
local _, song = r.GetProjExtState(0, 'XR18_STUDIO', 'SONG_ID')
if song == '' then
  local ok, value = r.GetUserInputs('XR18 Studio', 1, 'Identifiant du morceau dans XR18 Studio', '')
  if not ok or value == '' then return end
  song = value; r.SetProjExtState(0, 'XR18_STUDIO', 'SONG_ID', song)
end
local function quote(s)
  return '"' .. s:gsub('[%z\1-\31\\"]', function(c)
    if c == '"' then return '\\"' elseif c == '\\' then return '\\\\' end
    return string.format('\\u%04x', string.byte(c))
  end) .. '"'
end
local run = tostring(os.time()) .. '-' .. tostring(r.time_precise())
local sequence, previous, previousPosition = 0, nil, nil
local _, _, section, command = r.get_action_context()
r.SetToggleCommandState(section, command, 1); r.RefreshToolbar2(section, command)
r.atexit(function() r.SetToggleCommandState(section, command, 0); r.RefreshToolbar2(section, command) end)
local function loop()
  if (r.GetPlayState() & 1) ~= 0 then
    local position = r.GetPlayPosition()
    local _, region = r.GetLastMarkerAndCurRegion(0, position)
    local active = nil
    if region >= 0 then
      local ok, isRegion, _, _, name, id = r.EnumProjectMarkers3(0, region)
      if ok > 0 and isRegion then active = tostring(id) .. ':' .. name
        if active ~= previous or (previousPosition and position < previousPosition - 0.2) then
          sequence = sequence + 1
          local file, err = io.open(outbox, 'a')
          if not file then r.ShowConsoleMsg('XR18 Studio : ' .. tostring(err) .. '\n'); return end
          file:write('{"eventId":' .. quote(run .. '-' .. sequence) .. ',"songId":' .. quote(song) .. ',"section":' .. quote(name) .. '}\n'); file:close()
        end
      end
    end
    previous, previousPosition = active, position
  else previous, previousPosition = nil, nil end
  r.defer(loop)
end
loop()
