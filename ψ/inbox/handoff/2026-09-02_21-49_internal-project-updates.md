# Handoff: Updates from trackattendance-internal — please check

**Date**: 2026-09-02 21:49

## What Happened

Checked and synced the two source repos from `trackattendance-internal`:

- **trackattendance-frontend**: was 32+ commits behind (v2.0.0 era). Fast-forwarded local clone to `d034599` (v2.1.7). Notable: sync-coordinator hardening, new tests (`test_sync_coordinator.py`, `test_auto_sync_coordinator_integration.py`, etc.), `.env.example` export flow, big log cleanup. 6 open bugs/tech-debt issues remain there (#65–#70), all tied to PR #64 (sync coordinator race conditions, misclassified sync failures, SQLite-on-background-thread).
- **trackattendance-api**: fast-forwarded to `af0663d`. Notable: `#24` closed an **auth bypass via URL-prefix path traversal** + dashboard XSS hardening (2026-08-26); `#25`/`#27` raised `RATE_LIMIT_MAX` 300→600 for a 1800-participant event.

## Action Taken

Transferred all 8 open issues from `trackattendance-api` into **this repo** (`trackattendance-product`) since product-level backlog should live here:

| Old (`trackattendance-api`) | New (`trackattendance-product`) |
|---|---|
| #5 per-client API keys (security, high-priority) | #13 |
| #6 monitoring/observability (high-priority) | #14 |
| #9 retry logic for transient DB failures | #15 |
| #11 connection pool sizing | #16 |
| #12 error handling/responses | #17 |
| #13 modularize single-file architecture | #18 |
| #14 OpenAPI/Swagger docs | #19 |
| #16 externalize hardcoded config | #20 |

`trackattendance-api` now has 0 open issues.

## Pending / Next Session

- [ ] Triage new issues #13–#20 here.
- [ ] #13 (per-client API keys): confirmed not needed on `trackattendance-api` — that repo is internal-only, no per-client-key code/schema existed there (was just a "Planned" README section, now removed). Ownership belongs fully to `trackattendance-product` alongside `docs/PLAN-commercialize.md` — decide here whether/when to build it.
- [ ] `trackattendance-frontend` still has 6 open sync-coordinator bugs (#65–#70) — not transferred; decide if those belong here too or stay repo-local.
- [ ] No open PRs in either source repo — both clean.

## Key Paths
- Local clones: `~/workspace/project/trackattendance-internal/trackattendance-frontend`, `~/workspace/project/trackattendance-internal/trackattendance-api`
- Remotes: `https://github.com/Jarkius/trackattendance-frontend`, `https://github.com/Jarkius/trackattendance-api`
