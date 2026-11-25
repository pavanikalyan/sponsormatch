# SponsorMatch AI — V3 Partnership Studio

Live demo: https://pavanikalyan.github.io/sponsormatch/

An interactive university prototype demonstrating how community clubs and business sponsors can discover opportunities, compare potential compatibility and manage sample sponsorship proposals.

## What's in the upgraded prototype
- Responsive dashboard and compact mobile navigation with a dismissible backdrop
- Club and sponsor discovery with filters
- Transparent, rule-based matching with explanations of each compatibility score
- Proposal drafting and **Reviewer demo** status simulation
- Campaign brief template builder (offline; not live generative AI)
- Browser-local persistence, JSON export and sample-data reset
- Accessible navigation labels, keyboard focus improvements and form validation
- Clear sample-data and prototype notices

## Run locally

Open `index.html` in a modern browser, or serve this folder with a basic static server. No package installation or build is needed. The stylesheet and script files `upgrade.css` and `upgrade.js` must remain beside `index.html`.

## Host on GitHub Pages

Settings → Pages → Deploy from a branch → `main` → `/(root)`.

## Security and scope

**This is not a production service.** All example organisations and proposals are fictional; values are saved in each visitor's `localStorage`, not a shared database. Anyone can inspect or alter demo browser data. Reviewer mode does **not** implement real authentication or authorisation. Do not enter personal, financial or sensitive information. There are no live payment, verified organisation, backend or external AI integrations.

For deployment beyond a university demonstration, implement server-side accounts, permissions, validated APIs, a database, organisational verification and a security/privacy assessment.

See [QA.md](QA.md) for acceptance checks and remaining work.
