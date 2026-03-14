# Runtime Config via SQLite for Kiosk Applications

**Date**: 2026-03-10
**Context**: TrackAttendance v1.8.0 admin panel redesign
**Confidence**: High

## Key Learning

When building kiosk/embedded applications operated by non-technical users, storing configuration in a database table (SQLite config) rather than environment files (.env) enables runtime changes without restart. This pattern proved essential for the TrackAttendance admin panel, where operators need to adjust proximity detection distance, duplicate detection windows, sync intervals, and audio settings during live events.

The implementation stores key-value pairs in a `config` table with type coercion on read. The admin panel reads current values on load, presents them as sliders/toggles with default markers, and writes changes back immediately. The application watches for config changes and applies them without restart.

A complementary pattern emerged for asset customization: filesystem priority (local folder > bundled assets). Voice files can be overridden by dropping mp3s in a `voices/` directory next to the executable. The app checks the local folder first, falling back to bundled `assets/voices/`. This gives operators zero-friction customization without rebuilding or understanding the build system.

## The Pattern

```
# Config storage: SQLite key-value with defaults
config table: key TEXT PRIMARY KEY, value TEXT, updated_at TIMESTAMP

# Read with fallback
def get_config(key, default):
    row = db.execute("SELECT value FROM config WHERE key=?", [key])
    return row.value if row else default

# Asset override: filesystem priority
def get_voice_file(name):
    local = Path("voices") / name
    if local.exists():
        return local
    return Path("assets/voices") / name
```

## Why This Matters

Kiosk applications have a unique deployment constraint: the person operating the device is rarely the person who built it. Environment files require shell access and restarts. Database-backed config with a GUI panel makes the application self-service. This pattern applies broadly to any embedded/kiosk/field-deployed application.

The slider default markers UX detail matters too — when operators can adjust 6+ settings, they need visual anchors showing "normal" values to avoid misconfiguration.

## Tags

`architecture`, `kiosk`, `configuration`, `sqlite`, `admin-panel`, `ux`, `pyqt6`, `trackattendance`
