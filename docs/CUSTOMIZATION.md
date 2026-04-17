# Customization Guide

Last updated: 2026-04-16

This guide lists common edits and where to make them.

## Business Contact Values
Edit in index.html:
- Public contact email link currently points to team@districtspanish.com
- WhatsApp link currently uses wa.me/14155552671

Edit in external/worker-form.js:
- Email sender currently noreply@districtspanish.com
- Email recipient currently team@districtspanish.com

## Form Endpoint
Edit in js/app.js:
- fetch URL points to Cloudflare Worker deployment

Use this if Worker URL changes between environments.

## Branding Assets
Current image usage in index.html includes:
- images/logo.png
- images/logo-tab.png
- images/teachers/*.png
- images/culture/*.png
- images/icons/*.png
- images/whatsapp.png

When replacing assets:
- Keep filenames stable when possible to avoid HTML updates.
- If filename changes, update all references in index.html and CSS if used there.

## Main Content Edits
- Hero and section copy: index.html
- Program details and pricing cards: index.html
- Teacher names/bios/images: index.html
- Contact form fields and labels: index.html

## Style And Layout
- Global colors, spacing, and responsive behavior: css/style.css
- CTA button visuals and modal styles: css/style.css

## Behavior And Interactions
- Nav menu, modal open/close logic, form validation and submit: js/app.js

## Worker Behavior
- Request validation and response codes: external/worker-form.js
- Resend API integration payload: external/worker-form.js
- CORS headers and OPTIONS handling: external/worker-form.js

## D1 SQL Artifacts
- Schema scaffold: external/d1/sql/schema.sql
- Migration scaffold: external/d1/migrations/001_init.sql
- D1 setup notes: external/d1/README.md

These files are maintained in-repo so AI agents can reason about Worker plus database setup together.

## Safety Rules For Editing
- Keep required form field names consistent across index.html, js/app.js, and Worker payload validation.
- After changing Worker payload structure, verify both frontend and Worker still agree on property names.
- Do not remove CORS headers from Worker responses.
- Worker and D1 artifacts in repo are not auto-applied in Cloudflare; apply/deploy manually.
