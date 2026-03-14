---
title: # macOS Development Setup for Windows-Target PyQt6 Apps
tags: [pyqt6, cross-platform, macos, windows, development-setup, trackattendance]
created: 2026-02-01
source: rrr: Jarkius/trackattendance-frontend
---

# # macOS Development Setup for Windows-Target PyQt6 Apps

# macOS Development Setup for Windows-Target PyQt6 Apps

When developing a PyQt6 desktop app that targets Windows but using macOS for development, the only blockers are Windows-specific packages — `pythonnet` and `clr_loader` (Python/.NET bridge). The core stack (PyQt6, QWebEngineView, SQLite, requests) works identically on both platforms.

Cleanest approach: exclude platform-specific packages during install with `grep -v "pythonnet\|clr_loader" requirements.txt | pip install -r /dev/stdin`.

For `.env`-driven config, use `SHOW_FULL_SCREEN=False` during development to avoid kiosk mode taking over the screen.

Key insight: PyQt6 + QWebEngineView is fully cross-platform; only .NET interop packages are Windows-bound. Always confirm which git repo you're in when working with nested repo structures.

---
*Added via Oracle Learn*
