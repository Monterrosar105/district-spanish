# Project Summary

Last updated: 2026-04-16

## Status
Active marketing site with functioning form submission pipeline through Cloudflare Worker and Resend.

## Implemented Website Areas
- Navigation and hero
- Programs section and program detail modals
- Teachers section with real teacher profiles
- Testimonials and culture content
- Our Story section
- Contact section with CTA buttons and social links
- Contact form modal

Note: FAQ markup exists but is hidden in current UI.

## Lead Capture Architecture
Frontend:
- Modal form in index.html
- Validation and submission logic in js/app.js

Backend:
- Cloudflare Worker source in external/worker-form.js
- Required method: POST
- CORS enabled for browser requests
- Required env secret: RESEND_API_KEY

Database (planned):
- Cloudflare D1 setup will be represented in-repo under external/d1
- SQL scaffold files are prepared for future D1 setup steps

Email:
- from: noreply@districtspanish.com
- to: team@districtspanish.com
- reply_to: user submitted email

## Known Operational Dependencies
- Cloudflare Worker must be deployed and reachable
- Resend API key must exist in Worker secrets
- Sender identity/domain must be valid in Resend configuration
- Worker source changes in repo must be manually deployed in Cloudflare dashboard
- D1 SQL changes in repo must be manually applied in Cloudflare D1 setup

## What Is No Longer True
- Form does not use mailto
- Form does not use FormSubmit/Formspree/Basin by default
- Placeholder svg logos/teachers are not the primary live setup

## Maintenance Guidance
When code changes:
1. Update README.md first.
2. Update any affected procedural docs.
3. Keep this file concise and factual.
