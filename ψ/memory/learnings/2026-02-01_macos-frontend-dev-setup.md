# macOS Development Setup for Windows-Target PyQt6 Apps

**Date**: 2026-02-01
**Context**: Setting up TrackAttendance frontend (Windows kiosk app) for development on MacBook Air M4
**Confidence**: High

## Key Learning

When developing a PyQt6 desktop app that targets Windows but using macOS for development, the only blockers are Windows-specific packages — in this case `pythonnet` and `clr_loader` (Python/.NET bridge). The core stack (PyQt6, QWebEngineView, SQLite, requests) works identically on both platforms.

The cleanest approach is to exclude platform-specific packages during install rather than maintaining separate requirements files. A simple `grep -v` filter works: `grep -v "pythonnet\|clr_loader" requirements.txt | pip install -r /dev/stdin`. This avoids diverging dependency lists while keeping the canonical `requirements.txt` complete for the target platform.

## The Pattern

```bash
# Install all deps except Windows-only ones on macOS
grep -v "pythonnet\|clr_loader" requirements.txt | pip install -r /dev/stdin
```

For `.env`-driven config, use `SHOW_FULL_SCREEN=False` during development to avoid kiosk mode taking over your screen.

## Why This Matters

Cross-platform development is common — developers use Macs while deploying to Windows kiosks. Knowing exactly which packages are platform-specific (and that the rest "just works") saves setup time and prevents unnecessary worry about compatibility. The key insight: PyQt6 + QWebEngineView is fully cross-platform; only .NET interop packages are Windows-bound.

## Tags

`pyqt6`, `cross-platform`, `macos`, `windows`, `development-setup`, `trackattendance`
