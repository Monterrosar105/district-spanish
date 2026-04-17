# Documentation Index

Last updated: 2026-04-16

Use this file as the entry point for AI agents and collaborators.

## Read Order For New Agents
1. ../README.md
2. PROJECT_SUMMARY.md
3. DEPLOYMENT.md
4. CUSTOMIZATION.md
5. LAUNCH_CHECKLIST.md
6. ../external/d1/README.md

## File Purpose Map
- ../README.md: Fast runtime facts and entrypoint
- PROJECT_SUMMARY.md: Current state snapshot and known constraints
- DEPLOYMENT.md: Exact deployment and configuration steps
- CUSTOMIZATION.md: What can be edited safely and where
- LAUNCH_CHECKLIST.md: Final readiness checks
- ../external/d1/README.md: D1 SQL and setup coordination notes

## Quick Facts
- Frontend form posts to Cloudflare Worker, not mailto.
- Worker sends email via Resend.
- Worker currently targets team@districtspanish.com.
- RESEND_API_KEY must be configured as Cloudflare Secret.
- Worker source in repo is external/worker-form.js and is manually deployed to Cloudflare dashboard.
- D1 SQL artifacts live in external/d1/sql and external/d1/migrations.
