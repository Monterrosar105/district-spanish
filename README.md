# District Spanish Website

Agent-first documentation is organized under docs/ for a cleaner root.

Last updated: 2026-04-16

## Quick Start For Agents
1. Read docs/INDEX.md.
2. Read docs/PROJECT_SUMMARY.md.
3. Use docs/CUSTOMIZATION.md or docs/DEPLOYMENT.md based on task type.

## Current Runtime Facts
- Frontend form submit file: js/app.js
- Worker source file in repo: external/worker-form.js
- Frontend endpoint: https://district-spanish-form.robmonterrosa105.workers.dev/
- Worker sender: noreply@districtspanish.com
- Worker recipient: team@districtspanish.com
- Required Worker secret: RESEND_API_KEY (type: Secret)
- Required Worker D1 binding: DB

## Admin App (Implemented Scaffold)
- admin/index.html: username/password login page
- admin/dashboard.html: lead tracking + usage dashboard view
- admin/admin.js: auth/session, lead updates, analytics summary loading
- admin/style.css: admin UI styling

## Worker Route Surface (Current)
- POST /form (also POST / for compatibility): create lead + send email
- POST /analytics/events: ingest essential funnel events
- POST /admin/login: create admin session token
- GET /admin/session: validate current session
- POST /admin/logout: revoke current session
- GET /admin/leads: paginated lead list with filters
- PATCH /admin/leads/:id: update status/notes/assignment/contact timestamp
- GET /admin/analytics/summary: KPI + lead status breakdown

## External Infrastructure Layout
- external/worker-form.js: Cloudflare Worker source of truth in this repo
- external/d1/README.md: D1 setup context and workflow notes
- external/d1/sql/schema.sql: consolidated D1 schema snapshot
- external/d1/sql/seed_admin.sql: first admin user seed template
- external/d1/migrations/001_init.sql: leads + metadata schema
- external/d1/migrations/002_admin_auth.sql: admin users + sessions
- external/d1/migrations/003_analytics_core.sql: analytics events + daily metrics

## Important Deployment Model
- The repo Worker file is not auto-connected to Cloudflare.
- You edit external/worker-form.js in this repo, then copy/deploy the updated code in Cloudflare Worker dashboard.
- D1 SQL files in external/d1 are source artifacts to apply in Cloudflare D1 setup when instructed.

## Documentation Set
- docs/INDEX.md
- docs/PROJECT_SUMMARY.md
- docs/CUSTOMIZATION.md
- docs/DEPLOYMENT.md
- docs/LAUNCH_CHECKLIST.md
