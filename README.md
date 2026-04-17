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

## External Infrastructure Layout
- external/worker-form.js: Cloudflare Worker source of truth in this repo
- external/d1/README.md: D1 setup context and workflow notes
- external/d1/sql/schema.sql: shared schema scaffold for D1 setup
- external/d1/migrations/001_init.sql: initial migration scaffold

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
