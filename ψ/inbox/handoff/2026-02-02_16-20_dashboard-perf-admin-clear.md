# Handoff: Dashboard Performance + Admin Clear Database

**Date**: 2026-02-02 16:20
**Branch**: frontend `dev/macbook-air-m4`, API `main`

## What We Did
- Updated frontend .env with production credentials + uv pip docs
- Added new voice files (Sarah, Lily, Bella) and pushed
- Optimized dashboard performance: 4 SQLite indexes, local BU breakdown (eliminated cloud API call), employee cache, JS debouncing + TTL cache
- Built PIN-protected admin panel for clearing Neon cloud database before events
- Full stack: API endpoints (server.ts) + Python bridge (main.py, sync.py, config.py) + UI (HTML, JS, CSS)
- Deployed API to Cloud Run (revision trackattendance-api-00010-84t)
- Installed gcloud CLI on macOS, authenticated
- Tested admin endpoints via curl (scan-count: 79, clear-scans safety check: working)

## Pending
- [ ] Test admin clear feature end-to-end in the PyQt6 desktop app
- [ ] Verify SQLite indexes auto-created on next app launch
- [ ] Test dashboard speed improvement (should be noticeably faster without export API call)
- [ ] Neon DB direct access check (blocked on office network, try at home)
- [ ] 79 scans currently in Neon cloud — clear before next event using admin panel

## Next Session
- [ ] Launch frontend app, open dashboard, verify gear icon appears (ADMIN_PIN=1234 in .env)
- [ ] Test PIN flow: wrong PIN -> error, correct PIN -> scan count shown, clear -> confirm -> success
- [ ] After clear, verify dashboard shows 0 scans and sync status resets
- [ ] Consider merging `dev/macbook-air-m4` to main if stable
- [ ] Optional: add local-only Excel export (skip cloud API for the All Scans sheet)

## Key Files
- `trackattendance-frontend/database.py` — 4 new indexes + 3 new methods
- `trackattendance-frontend/dashboard.py` — local BU breakdown, employee cache
- `trackattendance-frontend/web/script.js` — debounce, dashboard cache, admin panel JS
- `trackattendance-frontend/web/index.html` — admin modal HTML
- `trackattendance-frontend/config.py` — ADMIN_PIN config
- `trackattendance-frontend/main.py` — 4 admin pyqtSlot methods
- `trackattendance-frontend/sync.py` — cloud clear methods
- `trackattendance-api/server.ts` — admin endpoints (DELETE clear-scans, GET scan-count)
- `trackattendance-frontend/.env` — ADMIN_PIN=1234 set for testing
