# QWebChannel Async Timing vs Sync UI Behavior

**Date**: 2026-03-14
**Context**: TrackAttendance debug panel focus lock race condition
**Confidence**: High

## Key Learning

When a PyQt6 QWebEngineView app needs a setting to affect UI behavior from the very first paint (like disabling focus lock), you cannot rely solely on the async QWebChannel callback to set the controlling variable. The `DOMContentLoaded` event fires before the QWebChannel bridge is established, so any UI behavior that runs at startup (like `returnFocusToInput()`) will execute with the default/false value.

The solution is a dual-guard pattern: check both the async-set variable AND a synchronous observable state (like whether a DOM element is visible). This way the behavior is correct even before the async payload arrives.

Additionally, `navigator.clipboard.writeText` requires a secure context (HTTPS or localhost). Pages loaded via `file://` URLs in QWebEngineView are NOT secure contexts, so the Clipboard API silently fails or is undefined. Always provide an `execCommand('copy')` fallback for embedded browser contexts.

## The Pattern

```javascript
// BAD: Only checks async-set variable
const returnFocusToInput = () => {
    if (debugMode) return;  // debugMode set later in async callback
    barcodeInput.focus();   // fires immediately at DOMContentLoaded
};

// GOOD: Also checks synchronous observable state
const returnFocusToInput = () => {
    if (debugMode || debugConsole._visible) return;
    barcodeInput.focus();
};

// Clipboard fallback for file:// context
const copyText = (text, onSuccess) => {
    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(onSuccess).catch(() => {
            fallbackCopy(text); onSuccess?.();
        });
    } else {
        fallbackCopy(text); onSuccess?.();
    }
};
```

## Why This Matters

This pattern applies to any QWebChannel-based app where config from Python needs to affect JS behavior at startup. The race condition is subtle because it only manifests when a persisted setting (not an env var) needs to control immediate UI behavior. Settings that only affect responses to user actions (like button clicks) don't have this issue because the async callback completes long before the user interacts.

Also: any audit of cross-feature interactions (like "log level change + debug buffer") catches bugs that linear testing misses. Using an audit agent to systematically check all code paths is valuable after implementing features that touch shared state (like the root logger).

## Tags

`qwebchannel`, `race-condition`, `focus-management`, `pyqt6`, `clipboard-api`, `secure-context`, `async-timing`
