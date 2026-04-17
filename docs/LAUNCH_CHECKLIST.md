# Launch Checklist

Last updated: 2026-04-16

Use this for final go-live verification.

## Content
- Company and offer copy reviewed
- Teacher names, bios, and images verified
- Pricing and program details approved
- Public contact email verified in index.html

## UX And Functionality
- CTA buttons open form modal correctly
- Contact form validates and submits
- Success and error states display correctly
- Mobile menu and responsive layout tested
- Social and WhatsApp links tested

## Form Pipeline
- Cloudflare Worker deployed
- Worker source updates from external/worker-form.js manually deployed to Cloudflare
- Worker URL in js/app.js is correct
- RESEND_API_KEY set as Secret in Worker settings
- Resend sender identity/domain configured
- Form test email received at team@districtspanish.com

## D1 Readiness
- D1 schema/migrations tracked in external/d1
- D1 SQL applied in Cloudflare environment used for launch
- Worker deploy includes any D1 integration code changes

## Technical
- No critical browser console errors
- Key sections render on desktop and mobile
- Images load correctly
- HTTPS enabled on production host

## Final
- Stakeholder sign-off received
- Backup of current working version created
- Documentation reviewed and current
