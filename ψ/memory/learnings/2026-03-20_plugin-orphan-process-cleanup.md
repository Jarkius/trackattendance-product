# Runaway Plugin Daemons: Archive the Binary, Don't Just Disable

**Date**: 2026-03-20
**Context**: claude-mem plugin spawning unlimited orphan Claude subagent processes
**Confidence**: High

## Key Learning

When a Claude Code plugin daemon auto-respawns and creates orphan processes, configuration-level disabling (setting `enabledPlugins: false`, renaming keys in `installed_plugins.json`) is insufficient. The plugin system discovers hooks from marketplace directories independently of the enabled flag, and daemon processes with auto-restart logic will re-launch even after being killed.

The only reliable way to stop a misbehaving plugin is to physically remove (or archive) its files from the discovery path: both the `cache/` directory (where the actual code lives) and the `marketplaces/` directory (where hooks are discovered). This is analogous to the Unix principle: to stop a service that keeps restarting, remove its binary rather than sending signals.

Additionally, hooks loaded into a running Claude session are cached in memory. Even after removing all files, the current session will continue to fire cached hooks until the session ends. This is expected behavior, not a bug — but it means cleanup always requires a session restart to fully take effect.

## The Pattern

```
# Wrong approach (daemon respawns):
kill <pid>                    # Daemon restarts
kill -9 <pid>                 # Daemon restarts
enabledPlugins: false         # Hooks still discovered from marketplace/
rename key in plugins.json    # Daemon still has cached path

# Right approach:
mv cache/plugin ~/archive/           # Remove binary
mv marketplaces/plugin ~/archive/    # Remove hook discovery
kill -9 <pid>                         # Now stays dead
# Restart session to clear cached hooks
```

## Why This Matters

A single leaky plugin created 117 orphan processes consuming ~5GB RAM over 4 days. Without intervention, this would continue growing indefinitely. Understanding the plugin lifecycle (discovery → load → cache → execute) is critical for effective troubleshooting. The "nothing deleted" principle works perfectly here — archive to ~/workspace/archive/ rather than rm -rf.

## Tags

`claude-code`, `plugins`, `process-management`, `daemon`, `orphan-processes`, `troubleshooting`, `claude-mem`
