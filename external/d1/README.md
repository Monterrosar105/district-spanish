# Cloudflare D1 Setup (Scaffold)

Purpose:
- Keep D1 SQL and setup context in-repo so AI agents and developers can reason about database + Worker integration together.
- SQL files here are source artifacts. You can run/adapt them in Cloudflare D1 setup when ready.

Current status:
- D1 schema is a scaffold placeholder and will be finalized later.
- Worker code source is maintained in external/worker-form.js and manually copied/deployed to Cloudflare Worker dashboard.

Suggested workflow:
1. Update SQL in external/d1/sql and/or external/d1/migrations.
2. Apply SQL in Cloudflare D1 (dashboard or CLI).
3. Update external/worker-form.js for any DB reads/writes.
4. Deploy updated Worker code to Cloudflare dashboard.
5. Validate form flow and DB operations in staging.

Notes:
- Keep SQL idempotent when possible.
- Prefer additive migrations (new files) over rewriting historical migrations.
