# Deployment Guide

Last updated: 2026-04-16

This project has two deployment surfaces:
1. Static website files
2. Cloudflare Worker API
3. Cloudflare D1 database setup artifacts

## A. Static Site Deployment
Deploy repository as static site to any provider:
- Netlify
- Vercel
- Cloudflare Pages
- GitHub Pages
- Traditional hosting

Requirement:
- index.html, css, js, and images folders must be served as static assets.

## B. Cloudflare Worker Deployment
Worker source file:
- external/worker-form.js

Important:
- This repo file is the source of truth, but deployment is manual.
- After edits, copy/deploy updated Worker code in Cloudflare dashboard.

### Required Configuration
Cloudflare Worker secret:
- Name: RESEND_API_KEY
- Type: Secret
- Value: valid Resend API key

Cloudflare Worker binding:
- D1 binding variable name: DB

### Expected Runtime Behavior
- OPTIONS: returns 204 for preflight
- POST /form (and POST / for compatibility): validates payload, stores lead in D1, sends email via Resend
- POST /analytics/events: stores funnel events and updates daily counters
- POST /admin/login: validates admin credentials and issues session token
- GET /admin/session: validates session token
- POST /admin/logout: revokes session token
- GET /admin/leads: paginated lead list for admin table
- PATCH /admin/leads/:id: updates status/notes/assignment
- GET /admin/analytics/summary: returns KPI summary and status breakdown

### Current Email Routing
- from: noreply@districtspanish.com
- to: team@districtspanish.com

## C. Frontend To Worker Wiring
In js/app.js, form submission fetch URL must match deployed Worker URL.
Current value:
- https://district-spanish-form.robmonterrosa105.workers.dev/

If this changes, update it in js/app.js and redeploy static site.

## D. Cloudflare D1 Setup Artifacts
D1 files in repo:
- external/d1/sql/schema.sql
- external/d1/migrations/001_init.sql
- external/d1/migrations/002_admin_auth.sql
- external/d1/migrations/003_analytics_core.sql
- external/d1/sql/seed_admin.sql

Usage model:
- Update SQL files in repo.
- Apply migrations in order during Cloudflare D1 setup (dashboard or CLI).
- Keep migration files additive.

## E. Admin Frontend Deployment
Admin files in repo:
- admin/index.html
- admin/dashboard.html
- admin/admin.js
- admin/style.css

These are static files and deploy with the rest of the site.

## F. Verification Checklist
1. Open site and submit form with valid test data.
2. Confirm success status appears in UI.
3. Confirm email received at team@districtspanish.com.
4. Confirm lead row exists in D1 `leads` table.
5. Login through admin/index.html and verify admin dashboard loads.
6. If failed, inspect Worker logs and Resend/D1 responses.

## G. Common Failure Causes
- Missing RESEND_API_KEY secret
- Missing DB binding
- Invalid Resend API key
- Sender identity/domain not verified in Resend
- Incorrect Worker URL in js/app.js
- Worker not deployed or wrong environment
