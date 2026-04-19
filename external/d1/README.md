# Cloudflare D1 Setup

Purpose:
- Keep D1 SQL and setup context in-repo so AI agents and developers can reason about database + Worker integration together.
- SQL files here are source artifacts. You can run/adapt them in Cloudflare D1 setup when ready.

Current status:
- D1 schema and migrations are implemented in this repo.
- Worker code source is maintained in external/worker-form.js and manually copied/deployed to Cloudflare Worker dashboard.

Files:
- external/d1/sql/schema.sql: consolidated schema snapshot
- external/d1/sql/seed_admin.sql: first admin seed template
- external/d1/migrations/001_init.sql: leads table
- external/d1/migrations/002_admin_auth.sql: admin users and sessions
- external/d1/migrations/003_analytics_core.sql: analytics events and daily metrics

Suggested workflow:
1. Apply migrations in order: 001 -> 002 -> 003.
2. Optionally run seed_admin.sql after replacing password hash placeholder.
3. Ensure Worker D1 binding variable is DB.
4. Update external/worker-form.js for any DB reads/writes.
5. Deploy updated Worker code to Cloudflare dashboard.
6. Validate form flow, admin auth, and analytics endpoints.

Notes:
- Keep SQL idempotent when possible.
- Prefer additive migrations (new files) over rewriting historical migrations.
