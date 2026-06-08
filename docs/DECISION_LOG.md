# Aetheris Consulting Website Decision Log

This file tracks the product, content, routing, deployment, and implementation decisions made while working on the Aetheris Consulting website.

Use it as the running memory for the repo: every meaningful change should record the date, decision, reason, files touched, validation, and deployment notes.

## Log Format

- Date
- Status: Proposed, Implemented, Deployed, Revisited
- Decision
- Reason
- Work completed
- Validation
- Deployment notes

## 2026-06-09 - Case Studies Slider Loop And Auto-Scroll

Status: Implemented and deployed

Decision: Keep the existing Webflow/Swiper slider structure, but add a local Aetheris script that makes the case-study gallery behave like a continuous loop and auto-scrolls through the items.

Reason: After one full pass, the slider reached an empty end state. The desired behavior is a continuous gallery where users never see a blank area, plus a gentle automatic progression when they stop interacting.

Work completed:

- Added `js/aetheris-swiper-loop.js`.
- Duplicated the original case-study slides as a visual buffer so the slider can wrap without showing empty space.
- Added auto-scroll every 4.5 seconds.
- Paused auto-scroll on hover, focus, touch, pointer, and document visibility changes.
- Resumed auto-scroll after 7 seconds of no interaction.
- Loaded the script after the Swiper CDN script across pages that include the exported Webflow slider runtime.

Validation:

- Ran `node --check js/aetheris-swiper-loop.js`.
- Ran `git diff --check`.
- Verified locally with Chrome DevTools Protocol that 12 consecutive next-button clicks looped without blank states.
- Verified local auto-scroll advanced the active slide automatically.
- Verified the deployed Vercel page includes and serves the new script.

Deployment notes:

- Production URL: `https://aetheris-consulting-website-v2.vercel.app/en/cases`

## 2026-06-08 - Public Vercel Deployment

Status: Implemented and deployed

Decision: Use Vercel as the public preview and production delivery URL for the static Webflow export.

Reason: The site needs a shareable public URL where anyone with the link can review the current implementation without local setup.

Work completed:

- Added `vercel.json` for clean static routing and fallback handling.
- Deployed the site to Vercel production.
- Confirmed the public alias is reachable.

Deployment notes:

- Public alias: `https://aetheris-consulting-website-v2.vercel.app`

## 2026-06-08 - Internal Navigation Links

Status: Implemented and deployed

Decision: Associate broken navigation items, calls to action, and homepage links with their corresponding internal pages.

Reason: The imported Webflow export contained several non-working or placeholder links, including navigation and "Manifesto services" interactions. The site needs complete page-to-page navigation before content review can be meaningful.

Work completed:

- Reviewed the homepage, navigation, buttons, and text links that should route to internal pages.
- Connected available pages such as services, manifesto, cases, resources, contact, privacy, and policy routes.
- Preserved the static-export structure instead of introducing a framework-level router.

Validation:

- Smoke-tested key local routes.
- Verified Vercel served the updated route structure.

## 2026-06-08 - Brand Text Replacement

Status: Implemented and deployed

Decision: Replace long-form company references from WGB or WE GO BEYOND to Aetheris Consulting where they refer to the business identity, while avoiding purely technical or footer-like references unless they are visible content.

Reason: The website is now for Aetheris Consulting, but the Webflow export still included inherited WGB copy in long-form content.

Work completed:

- Replaced visible long-form company references with Aetheris Consulting.
- Left technical structure and unrelated generated export details intact where changing them could create noise or break references.

Validation:

- Searched the repo for remaining WGB and WE GO BEYOND references.
- Reviewed the replacement scope to avoid unnecessary churn.

## Maintenance Rule

When future work changes site behavior, navigation, copy, deployment, analytics, forms, SEO, or third-party integrations, add a new entry to this file before committing.
