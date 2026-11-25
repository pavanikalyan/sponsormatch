# SponsorMatch AI — Community Sponsorship Platform

**Live website:** https://pavanikalyan.github.io/sponsormatch/

SponsorMatch is a Sheffield Hallam University prototype designed to help clubs/VCSE organisations and business sponsors discover compatible partnerships, create sponsorship proposals, and manage their responses.

## What's new

- Completely refreshed white/forest-green corporate UI with a responsive desktop/mobile sidebar.
- Clear separation of **Club**, **Business Sponsor** and **Administrator** experiences.
- Explainable rule-based matching (category, location and budget; not generative AI).
- A complete proposal lifecycle: **Draft → Submitted → Accepted/Rejected**.
- Organisation registration and administrator approval workflow.
- Optional real account sign-in and shared PostgreSQL database using **Supabase Auth + Row Level Security**.
- Keyboard-accessible native dialogs, form validation, labelled navigation and reduced-motion support.
- Demo data reset/export and an obvious Demo Mode indicator.
- Browser smoke tests under \`tests/\`, runnable with GitHub Actions.
- Original V3 demo retained at [legacy.html](legacy.html).

## Important: demo vs connected mode

Out of the box, GitHub Pages runs in **Demo Mode**. Sample organisations and proposals are fictional and saved in that visitor's browser. Demo personas (Club/Sponsor/Admin) are **not** real accounts or permission enforcement.

**Connected Mode** can be enabled by the project owner using the Supabase setup below. Connected Mode uses actual email/password authentication, shared data and server-enforced permissions. Without setup it is inaccurate to claim the website has real login, verification or a live database.

No payment processing, real sponsorship transfer or trained AI matching service is included. Do not submit sensitive data.

## Activate secure Connected Mode

1. Create a new project in [Supabase](https://supabase.com/dashboard), choose a strong database password and select a suitable region.
2. From Supabase's **SQL Editor**, run the whole migration in [supabase/schema.sql](supabase/schema.sql). This creates tables, triggers, audit events, permissions and database RLS policies.
3. Open **Authentication → URL Configuration**. Set Site URL to \`https://pavanikalyan.github.io/sponsormatch/\` and add that exact URL as an allowed redirect URL. Enable email confirmations and configure email delivery for your intended pilot.
4. Open Supabase Project Settings / Connect / API. Obtain your **Project URL** and **publishable key** (or legacy **anon** key).
5. Edit [supabase-config.js](supabase-config.js) in this repository. Put only those two public values into \`url\` and \`anonKey\`, then commit. **Never paste a service-role or secret key into GitHub, HTML or JavaScript.**
6. Open the GitHub Pages website again. Register a Club and Sponsor account using separate test email addresses, verify both emails, sign in, and create their organisation profiles.
7. To enable organisation approvals, register a trusted administrator as a normal user first. From Supabase → Authentication → Users copy that person's UUID. In SQL Editor run:
   \`insert into public.admin_users(user_id) values ('THE-TRUSTED-USER-UUID');\`
   This must be done by the project owner, **never via the browser**. Sign out/in again and the Verification menu appears for that user.
8. Approve both sample organisations, sign in as a Sponsor, submit a proposal, then sign in as the Club and accept or reject it. Check the proposal audit log in \`public.proposal_events\`.

**Do not share project passwords or secret keys with ChatGPT or in public code.** Only the nonsecret publishable/anon key is suitable for the browser. Supabase's URL and publishable key are public by design; security relies on correctly configured RLS policies.

## Testing

\`\`\`bash
npm install
npx playwright install chromium
npm run test:syntax
npm test
\`\`\`

Tests cover navigation, mobile overflow, explainable matching, simulated proposal statuses, pending approvals, reset and role presentation. They **do not prove that live Supabase authentication or RLS policies are secure**. For real use, add negative permission tests against separate accounts and perform a security review. See [SECURITY.md](SECURITY.md).

## Design and data integrity

The matching algorithm is deliberately transparent:

\`\`\`
40 baseline + 25 shared cause + 20 same city + up to 15 budget fit
\`\`\`

This is a **heuristic**, not a calibrated probability of sponsorship agreement. Matching percentages must not be represented as AI accuracy or a prediction. Future improvements may involve recommendation models, if tested for fairness and validity.

## Deployment

GitHub Pages serves \`index.html\` from the \`main\` branch's root. Supabase, if configured, is a separate hosted service that stores application data. GitHub Pages alone cannot provide protected accounts, secure server-side permissions or shared storage.

## Before taking real users

- Create a privacy notice identifying the responsible organisation, lawful bases and retention rules.
- Perform access-control and RLS penetration tests, verify backups and incident response.
- Add consent, moderation and anti-fraud policies; make accessibility checks.
- Review UK GDPR/Data Protection Act 2018 and other applicable requirements.
- Conduct student research/pilot ethics and consent reviews where appropriate.
