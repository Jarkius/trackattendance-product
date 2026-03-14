# GCP Artifact Cleanup: Set Policies at Migration Time

**Date**: 2026-03-01
**Context**: trackattendance-api infrastructure cleanup — clearing stale gcr.io, Artifact Registry images, and Cloud Run revisions
**Confidence**: High

## Key Learning

When migrating CI/CD pipelines (e.g., from Cloud Build + gcr.io to GitHub Actions + Artifact Registry), always set up artifact cleanup policies immediately. In this project, 3 months passed between the migration and cleanup, resulting in 20 accumulated images and 22 Cloud Run revisions that needed manual deletion.

Artifact Registry supports JSON-based cleanup policies that run automatically. The optimal configuration for a small production service is: delete images older than 30 days, but always keep the latest 5 (for rollback safety). This is set via `gcloud artifacts repositories set-cleanup-policies`.

Cloud Run revisions do NOT have automatic cleanup — they must be deleted manually or via scripting. Only the revision actively serving traffic is needed; old revisions reference deleted images anyway.

## The Pattern

```bash
# Set cleanup policy on Artifact Registry (do this at CI/CD setup time)
cat <<'EOF' > cleanup-policy.json
[
  {"name": "delete-old", "action": {"type": "Delete"}, "condition": {"olderThan": "30d", "tagState": "ANY"}},
  {"name": "keep-recent", "action": {"type": "Keep"}, "mostRecentVersions": {"keepCount": 5}}
]
EOF

gcloud artifacts repositories set-cleanup-policies REPO \
  --project=PROJECT --location=REGION --policy=cleanup-policy.json

# Tagged images require --delete-tags for manual deletion
gcloud artifacts docker images delete IMAGE@DIGEST --delete-tags --quiet

# Cloud Run revision cleanup (no auto-policy available)
gcloud run revisions delete REVISION --region=REGION --quiet
```

## Why This Matters

- Prevents storage cost creep from accumulated container images
- gcr.io (Container Registry) is legacy — Artifact Registry is the successor
- `cloudbuild.yaml` has no utility when using GitHub Actions or `gcloud run deploy --source .` (both use Dockerfile directly)
- Cloud Run revisions pointing at deleted images are dead weight

## Tags

`gcp`, `artifact-registry`, `cloud-run`, `cleanup-policy`, `docker`, `ci-cd`, `infrastructure`
