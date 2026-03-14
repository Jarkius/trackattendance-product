---
title: # GitHub Actions CI/CD to Cloud Run with Workload Identity Federation
tags: [cicd, github-actions, gcp, cloud-run, workload-identity-federation, rate-limiting, devops, fastify]
created: 2026-02-25
source: rrr: Jarkius/trackattendance-api
---

# # GitHub Actions CI/CD to Cloud Run with Workload Identity Federation

# GitHub Actions CI/CD to Cloud Run with Workload Identity Federation

Workload Identity Federation (WIF) is the recommended way to authenticate GitHub Actions to GCP — no service account keys to store or rotate. Setup requires: Workload Identity Pool, OIDC Provider scoped to repo, IAM binding on service account.

Critical: GCP enforces `--attribute-condition` on OIDC providers for deployment pipelines. Without it, creation fails with INVALID_ARGUMENT. Scope to specific repo: `assertion.repository=='Owner/repo'`.

Per-instance in-memory rate limiting (@fastify/rate-limit default) is ineffective on Cloud Run — auto-scaling distributes requests across instances with separate counters. 120 rapid requests yielded zero 429s. Need Redis/Memorystore for distributed rate limiting.

GitHub Actions preferred over Cloud Build for small teams: 2000 free mins/month vs 120, single pane of glass with code/PRs, simpler setup. Pipeline runs ~2 minutes including health check.

---
*Added via Oracle Learn*
