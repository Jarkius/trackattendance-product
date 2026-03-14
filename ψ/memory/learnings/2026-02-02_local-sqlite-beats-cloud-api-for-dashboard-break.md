---
title: # Local SQLite Beats Cloud API for Dashboard Breakdown Queries
tags: [performance, sqlite, dashboard, api-optimization, local-first, trackattendance]
created: 2026-02-02
source: rrr: Jarkius/trackattendance-frontend
---

# # Local SQLite Beats Cloud API for Dashboard Breakdown Queries

# Local SQLite Beats Cloud API for Dashboard Breakdown Queries

When a dashboard needs to cross-reference cloud scan data with local employee data (e.g., grouping scans by business unit), it's far more efficient to compute the breakdown locally using SQLite JOINs than to fetch the entire scan dataset from a cloud API and process it in Python.

The original implementation made two API calls per dashboard open: one for stats and another to `/v1/dashboard/export` which returned ALL scans. The fix was a single SQLite query with a LEFT JOIN that runs in under 1ms locally versus 1-2 seconds for the API round-trip.

Pattern applies broadly: whenever you need to JOIN cloud data with local reference data, consider whether the JOIN can happen locally instead of fetching everything from the cloud. The trade-off is local data only reflects this station's scans (not multi-station aggregate), but for most use cases per-station breakdown is sufficient.

---
*Added via Oracle Learn*
