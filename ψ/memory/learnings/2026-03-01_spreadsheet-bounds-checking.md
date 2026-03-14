# Always Bounds-Check Spreadsheet Column Access

**Date**: 2026-03-01
**Context**: TrackAttendance roster import crash when employee.xlsx contained duplicate Legacy IDs and short rows
**Confidence**: High

## Key Learning

When reading Excel files with openpyxl (or any spreadsheet library), never assume that data rows have the same number of columns as the header row. Trailing empty cells in a row cause openpyxl to return a shorter tuple than expected. Accessing `row[column_index]` will raise an `IndexError` if the row is shorter than the column index.

This is especially dangerous when optional columns (like Email) are at the end of the header — rows without that data will be shorter. The fix is simple: always check `index < len(row)` before accessing, or use a helper that returns None for out-of-bounds access.

Additionally, duplicate primary keys in roster data should be handled gracefully — skip with a warning log rather than crashing. The `seen_ids` set pattern already existed but the crash happened before reaching it due to the column access error.

## The Pattern

```python
# BAD — crashes on short rows
email = row[email_index] if email_index is not None else ""

# GOOD — bounds-checked
email = row[email_index] if email_index is not None and email_index < len(row) else None
```

For bulk data import with potential duplicates:
```python
seen_ids: set[str] = set()
duplicate_count = 0
for row in data:
    if id in seen_ids:
        duplicate_count += 1
        continue
    seen_ids.add(id)
    # ... process row ...

if duplicate_count:
    LOGGER.warning("Skipped %d duplicate(s)", duplicate_count)
```

## Why This Matters

Roster import runs at app startup. A crash here prevents the entire kiosk application from launching — a critical failure at event time. Defensive coding for data import is essential because the Excel file is user-provided and may contain duplicates, missing columns, or inconsistent row lengths.

## Tags

`openpyxl`, `excel`, `bounds-checking`, `defensive-coding`, `data-import`, `startup-crash`
