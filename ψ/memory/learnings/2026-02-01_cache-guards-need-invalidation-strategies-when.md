---
title: # Cache Guards Need Invalidation Strategies
tags: [cache-invalidation, sqlite, pyqt6, audio, data-pipeline, guard-clause, trackattendance]
created: 2026-02-01
source: rrr: Jarkius/trackattendance-frontend
---

# # Cache Guards Need Invalidation Strategies

# Cache Guards Need Invalidation Strategies

When implementing "load once" guard clauses like `if already_loaded(): return`, always pair them with an invalidation mechanism. In TrackAttendance, `employees_loaded()` checked if the SQLite employees table had any rows. Once a single employee was imported, it would never reimport — even when the source Excel file gained 9 new employees.

This is a classic cache invalidation problem disguised as a simple optimization. The proper solution is change detection: hash the source file on import, store the hash, and compare on startup.

Secondary learning: QMediaPlayer in PyQt6 has a cold-start delay on first playback. Pre-warming the player by loading (but not playing) the first audio file during init eliminates this delay entirely.

Tags: cache-invalidation, sqlite, pyqt6, audio, data-pipeline, guard-clause

---
*Added via Oracle Learn*
