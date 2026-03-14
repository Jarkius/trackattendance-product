# GitHub Actions CI/CD to Cloud Run with Workload Identity Federation

**Date**: 2026-02-25
**Context**: Setting up automated deployment for trackattendance-api
**Confidence**: High

## Key Learning

Workload Identity Federation (WIF) is the recommended way to authenticate GitHub Actions to GCP — no service account keys to store or rotate. The setup requires three GCP resources: a Workload Identity Pool, an OIDC Provider scoped to the GitHub repo, and an IAM binding on the service account.

Critical detail: GCP now enforces `--attribute-condition` when creating OIDC providers for deployment pipelines. Without it, `gcloud iam workload-identity-pools providers create-oidc` fails with `INVALID_ARGUMENT`. The condition should scope to the specific repo: `assertion.repository=='Owner/repo-name'`.

Per-instance in-memory rate limiting (@fastify/rate-limit default store) is ineffective on Cloud Run because auto-scaling distributes requests across instances, each with its own counter. 120 rapid requests yielded zero 429s. For real rate limiting on Cloud Run, use Redis/Memorystore as the backing store.

## The Pattern

```yaml
# .github/workflows/deploy.yml — key steps
- uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
    service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}

# GCP setup (one-time)
gcloud iam workload-identity-pools create "github-actions" --location="global"
gcloud iam workload-identity-pools providers create-oidc "github" \
  --workload-identity-pool="github-actions" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='Owner/repo'" \  # REQUIRED
  --issuer-uri="https://token.actions.githubusercontent.com"
```

## Why This Matters

- Eliminates stored credentials (Nothing is Deleted, but Nothing is Leaked either)
- Pipeline runs in ~2 minutes end-to-end including health check verification
- GitHub Actions preferred over Cloud Build for small teams: 2000 free mins/month, single pane of glass with code/PRs
- The rate limiting discovery affects any stateless auto-scaling platform, not just Cloud Run

## Tags

`cicd`, `github-actions`, `gcp`, `cloud-run`, `workload-identity-federation`, `rate-limiting`, `devops`
