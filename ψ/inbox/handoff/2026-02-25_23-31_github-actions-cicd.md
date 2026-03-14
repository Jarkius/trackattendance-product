# Handoff: GitHub Actions CI/CD Pipeline Setup

**Date**: 2026-02-25 23:31

## What We Did
- Pulled frontend repo (was 13 commits behind, resolved xxx.env copy conflict)
- Updated frontend .env with new Voice Playback and Camera Proximity Detection sections
- Investigated rate limiter fix (f047b38) — confirmed deployed on Cloud Run
- Tested rate limiting live: discovered per-instance memory store is ineffective on auto-scaling Cloud Run
- Set up GitHub Actions CI/CD for trackattendance-api:
  - Created Workload Identity Federation (pool + OIDC provider scoped to Jarkius/trackattendance-api)
  - Granted 3 IAM roles to service account (run.developer, artifactregistry.writer, iam.serviceAccountUser)
  - Added 3 GitHub secrets (GCP_PROJECT_ID, GCP_WORKLOAD_IDENTITY_PROVIDER, GCP_SERVICE_ACCOUNT)
  - Created `.github/workflows/deploy.yml` (build Docker → push Artifact Registry → deploy Cloud Run)
  - Deprecated cloudbuild.yaml (wrong region, unused)
- First pipeline run: all green in 1m52s
- Verified frontend still connects to API after fresh deployment

## Pending
- [ ] Rate limiting per-instance issue (need Redis/Memorystore for real protection)
- [ ] API has no test suite (npm test is stub) — no quality gate in pipeline
- [ ] Frontend CI/CD not set up (desktop app, lower priority)
- [ ] `xxx.env copy.local` sitting in frontend repo (local backup of env)

## Next Session
- [ ] Consider adding test step to deploy.yml when API gets tests
- [ ] Evaluate Redis-based rate limiting if DDoS protection needed
- [ ] Continue camera plugin work or other frontend features

## Key Files
- `trackattendance-api/.github/workflows/deploy.yml` — the new CI/CD pipeline
- `trackattendance-api/cloudbuild.yaml` — deprecated, replaced by GitHub Actions
- `trackattendance-frontend/.env` — updated with voice + camera sections
- `ψ/memory/learnings/2026-02-25_github-actions-wif-cloud-run-cicd.md` — lesson learned
