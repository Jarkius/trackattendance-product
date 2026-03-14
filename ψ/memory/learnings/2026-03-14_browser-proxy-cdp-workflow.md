# Browser Control: MQTT Proxy + CDP Dual-Path Pattern

**Date**: 2026-03-14
**Context**: TrackAttendance session — needed to read fleet dashboard in Chrome
**Confidence**: High

## Key Learning

The workspace uses **Claude Browser Proxy v3.2.0** (custom Chrome extension) for browser automation, NOT the official claude-in-chrome extension. The `mcp__claude-in-chrome__*` tools will always fail because the official extension is not installed.

There are two reliable paths to control Chrome:

1. **MQTT** via `mosquitto_pub` — sends commands to the extension which executes them
2. **CDP** (Chrome DevTools Protocol) on port 9222 — direct WebSocket access to any tab

CDP is more reliable for reading page content because MQTT responses go to profile-specific topics that can be tricky to subscribe to. MQTT is better for Gemini-specific actions (chat, select_model, wait_response).

## The Pattern

```bash
# CDP: List tabs (always works)
curl -s http://localhost:9222/json/list | python3 -c "import json,sys; [print(f'{t[\"id\"]} | {t[\"url\"][:60]}') for t in json.load(sys.stdin)]"

# CDP: Read page content via WebSocket
bun -e "
const ws = new WebSocket('ws://localhost:9222/devtools/page/TAB_ID');
ws.onopen = () => ws.send(JSON.stringify({id:1, method:'Runtime.evaluate', params:{expression:'document.body.innerText'}}));
ws.onmessage = (e) => { const r = JSON.parse(e.data); if (r.id===1) { console.log(r.result?.result?.value); ws.close(); }};
"

# MQTT: Send browser command
mosquitto_pub -t "claude/browser/command" -m '{"action":"get_text","tabId":CHROME_TAB_ID}'

# MQTT: Listen for response (wildcard for any profile)
mosquitto_sub -t "claude/browser/+/response" -C 1 -W 10
```

## Why This Matters

Every new session wastes time re-discovering this workflow. The updated `/gemini` skill now documents the full pattern, but the key insight is: **always try CDP first for reading, MQTT for actions**. Never waste time on claude-in-chrome MCP tools.

## Tags

`browser-automation`, `cdp`, `mqtt`, `claude-browser-proxy`, `workflow`, `tooling`
