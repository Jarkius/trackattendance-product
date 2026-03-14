---
title: # Admin Clear Should Reset ALL State
tags: [sqlite, admin, reset, state-management, ux, trackattendance]
created: 2026-02-02
source: rrr: Jarkius/trackattendance-frontend
---

# # Admin Clear Should Reset ALL State

# Admin Clear Should Reset ALL State

When building a "clear all data" admin function, think beyond just the primary data rows. Consider all related state that should reset: configuration (station names), sequences (autoincrement IDs), caches, and application state. A partial clear leaves stale config that can silently carry over to the next usage context.

The fix: clear the stations table, reset SQLite's sqlite_sequence, and auto-close the app so the next launch starts completely fresh. SQLite doesn't support TRUNCATE — use DELETE + sqlite_sequence clear to reset IDs. Always think: "what state exists beyond the primary table?"

---
*Added via Oracle Learn*
