---
title: # Python Venv Path Binding & Dashboard Verification Patterns
tags: [python, venv, debugging, testing, integration, dashboard, trackattendance, devops]
created: 2026-03-01
source: rrr: Jarkius/trackattendance
---

# # Python Venv Path Binding & Dashboard Verification Patterns

# Python Venv Path Binding & Dashboard Verification Patterns

Python virtual environments are path-bound. When you create a venv with `python3 -m venv .venv`, the absolute path is hardcoded into `pyvenv.cfg` and into every script shebang in `.venv/bin/`. If you move or rename the parent directory, `source .venv/bin/activate` will appear to succeed but python3 will silently resolve to the system interpreter because the old path no longer exists in PATH.

Fix: check `pyvenv.cfg` command field and `which python3` after activate. If mismatched, recreate venv: `pip freeze > /tmp/reqs.txt`, delete, recreate, reinstall.

For end-to-end verification of multi-component systems (local app → cloud sync → mobile dashboard), the most valuable test is a data comparison: fetch stats from both local SQLite and cloud API after the pipeline runs and diff them. This catches integration bugs (SQL JOIN errors, missing fields, sync failures) that unit tests miss entirely. A 5-line comparison function provides more integration confidence than dozens of mocked unit tests.

---
*Added via Oracle Learn*
