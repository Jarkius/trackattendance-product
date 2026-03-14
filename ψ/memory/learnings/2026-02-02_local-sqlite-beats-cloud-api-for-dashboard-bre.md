# Local SQLite Beats Cloud API for Dashboard Breakdown Queries

**Date**: 2026-02-02
**Context**: TrackAttendance dashboard BU breakdown was fetching ALL scans from cloud API just to group by business unit
**Confidence**: High

## Key Learning

When a dashboard needs to cross-reference cloud scan data with local employee data (e.g., grouping scans by business unit), it's far more efficient to compute the breakdown locally using SQLite JOINs than to fetch the entire scan dataset from a cloud API and process it in Python.

The original implementation made two API calls per dashboard open: one for stats and another to `/v1/dashboard/export` which returned ALL scans. It then loaded the entire employee table into a Python dict, iterated through every scan, and built per-BU sets. For an event with 1000+ scans, this meant transferring kilobytes of JSON over the network, parsing it, and doing O(n) dictionary lookups — all to produce a 5-row BU summary.

The fix was a single SQLite query: `SELECT e.sl_l1_desc AS bu_name, COUNT(DISTINCT e.legacy_id) AS registered, COUNT(DISTINCT s.badge_id) AS scanned FROM employees e LEFT JOIN scans s ON e.legacy_id = s.badge_id GROUP BY e.sl_l1_desc`. This runs in under 1ms locally versus 1-2 seconds for the API round-trip, and eliminates network dependency for BU data.

## The Pattern

```python
# SLOW: Fetch all scans from API, cross-reference locally
response = requests.get(f"{api_url}/v1/dashboard/export")  # 1-2 seconds
scans = response.json()["scans"]  # All records over network
employee_cache = db.load_employee_cache()  # Full table load
for scan in scans:  # O(n) iteration
    bu = employee_cache.get(scan["badge_id"])

# FAST: Local SQLite JOIN
results = db.execute("""
    SELECT e.sl_l1_desc AS bu_name,
           COUNT(DISTINCT s.badge_id) AS scanned
    FROM employees e
    LEFT JOIN scans s ON e.legacy_id = s.badge_id
    GROUP BY e.sl_l1_desc
""")  # < 1ms
```

## Why This Matters

Dashboard responsiveness directly affects user experience during events. A 2-second delay every time someone opens the dashboard creates friction. The trade-off is that local data only reflects this station's scans (not multi-station aggregate), but for most use cases the per-station BU breakdown is sufficient. The cloud stats endpoint still provides the multi-station totals.

This pattern applies broadly: whenever you need to JOIN cloud data with local reference data, consider whether the JOIN can happen locally instead of fetching everything from the cloud.

## Tags

`performance`, `sqlite`, `dashboard`, `api-optimization`, `local-first`, `trackattendance`
