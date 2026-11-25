# SponsorMatch AI V3 — upgrade validation

## Automated checks completed
- HTML links to `upgrade.css` and `upgrade.js` on the upgrade branch.
- JavaScript passes an ECMAScript syntax parse.
- No external backend, AI API, analytics or payment service is introduced.
- Original V3 data model and navigation are retained.

## Manual browser acceptance checks
1. Desktop: open Overview; navigate all six sections; cards and panels fit without clipping.
2. Mobile (390px): open menu, select a section, close menu by tapping the backdrop, rotate device.
3. Matches: select a club, change the minimum threshold and open 'Why this match?'.
4. Create a club and sponsor using fictional test names; check results are visible in the corresponding lists.
5. Attempt to save a zero/negative funding amount; form should reject it.
6. Draft a proposal; switch to 'Reviewer demo'; update status; refresh and confirm local persistence.
7. Open Export data and confirm JSON download; use Reset demo to restore original seed data.
8. Open the New proposal modal and navigate with Tab and Shift+Tab; Esc should close it.
9. Use keyboard-only navigation and reduced-motion preference.
10. Check Console for errors and confirm no real identifying information is entered.

## Known limitations
- No server/database or true multi-user persistence.
- No secure authentication or access control: 'Reviewer demo' is a client-side demonstration mode only.
- Matching uses explicit rule-based heuristics, not machine learning.
- The campaign studio is a text-template generator, not an AI model.
- No live payment integration or organisation verification.
- Automated end-to-end browser tests and accessibility audit are still recommended before production use.
