# Python Venv Path Binding & Dashboard Verification Patterns

**Date**: 2026-03-01
**Context**: TrackAttendance project — venv broke after directory restructuring, stress test enhanced with dashboard comparison
**Confidence**: High

## Key Learning

Python virtual environments are path-bound. When you create a venv with `python3 -m venv .venv`, the absolute path is hardcoded into `pyvenv.cfg` (the `command` field) and into every script shebang in `.venv/bin/` (pip, pytest, etc.). If you move or rename the parent directory, `source .venv/bin/activate` will appear to succeed but python3 will silently resolve to the system interpreter because the old path no longer exists in PATH.

The fix is to recreate the venv at the new path. Save packages first with `pip freeze > /tmp/reqs.txt`, delete the old venv, create fresh, and reinstall. This is fast (~30s) and avoids subtle import failures that look like missing packages but are actually wrong interpreters.

For end-to-end verification of multi-component systems (local app → cloud sync → mobile dashboard), the most valuable test is a data comparison: fetch stats from both sources after the pipeline runs and diff them. This catches integration bugs (COALESCE errors, missing fields, sync failures) that unit tests miss entirely.

## The Pattern

```bash
# Diagnose: check if venv python is actually being used
which python3  # Should show .venv/bin/python3, not /opt/homebrew/bin/python3
cat .venv/pyvenv.cfg | grep command  # Check if path matches current directory

# Fix: recreate venv
.venv/bin/python3 -m pip freeze > /tmp/reqs.txt
rm -rf .venv
python3 -m venv .venv
.venv/bin/python3 -m pip install -r /tmp/reqs.txt
```

```python
# Dashboard verification pattern
local_stats = get_stats_from_local_sqlite(db)
cloud_stats = requests.get(f'{api_url}/v1/dashboard/public/stats').json()
mismatches = compare(local_stats, cloud_stats)
assert len(mismatches) == 0, f"Dashboard mismatch: {mismatches}"
```

## Why This Matters

Venv path binding is a silent failure mode — everything looks correct (activate succeeds, python3 runs) but imports fail for packages that are definitely installed. This wastes debugging time. Knowing to check `pyvenv.cfg` and `which python3` immediately saves 10+ minutes.

Dashboard comparison as a test catches the class of bugs that unit tests structurally cannot: SQL JOIN errors, missing API response fields, sync payload mismatches. It's a 5-line addition to any stress test that provides integration confidence.

## Tags

`python`, `venv`, `debugging`, `testing`, `integration`, `dashboard`, `trackattendance`
