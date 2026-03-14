# Fastify additionalProperties Silently Strips Unlisted Fields

**Date**: 2026-03-01
**Context**: TrackAttendance scan_source field was always "manual" in cloud despite frontend sending correct values
**Confidence**: High

## Key Learning

When Fastify's JSON schema validation uses `additionalProperties: false`, any field NOT explicitly listed in the `properties` object is silently removed from the request body before the handler receives it. There is no error, no warning, no log — the field simply disappears.

This caused a multi-hour debugging session. The frontend was correctly sending `scan_source: "badge"` in sync payloads, but the cloud database always stored "manual" (the column default). The scan_source field was present in the `additionalProperties: false` schema's parent but was never added to the `properties` list when the field was first introduced. Fastify stripped it silently, and the INSERT used the column default.

The fix was one line: adding `scan_source: { type: ["string", "null"], maxLength: 32 }` to the properties object. But finding it required tracing the entire pipeline from JavaScript → Python → HTTP POST → Fastify validation → Postgres INSERT.

## The Pattern

```typescript
// BAD — scan_source will be silently stripped
properties: {
  badge_id: { type: "string" },
  station_name: { type: "string" },
  // scan_source NOT listed
},
additionalProperties: false,  // ← strips scan_source!

// GOOD — scan_source preserved
properties: {
  badge_id: { type: "string" },
  station_name: { type: "string" },
  scan_source: { type: ["string", "null"], maxLength: 32 },  // ← listed!
},
additionalProperties: false,
```

**Secondary learning**: CSS custom property architecture makes theme switching trivial. Define all colors as `--variables` in `:root`, then override them in a class (`html.light`). A three-state toggle (auto/light/dark) with localStorage persistence respects system preference while allowing manual override.

## Why This Matters

This is a class of bug that's extremely hard to detect because:
1. No error is thrown
2. The data appears correct at the source
3. The database has a sensible default that masks the missing value
4. Only cross-layer investigation (HTTP payload inspection) reveals the gap

**Prevention**: When adding a new field to a Fastify endpoint that uses `additionalProperties: false`, ALWAYS add it to the `properties` object. Add this to the code review checklist.

## Tags

`fastify`, `json-schema`, `additionalProperties`, `silent-failure`, `data-loss`, `debugging`, `css-custom-properties`, `theme-toggle`, `trackattendance`
