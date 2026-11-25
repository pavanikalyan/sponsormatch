# Security, privacy and production-readiness notes

## Scope
This project is an educational prototype. A properly configured Supabase project supplies authentication, Postgres storage and RLS; a GitHub Pages HTML file on its own does not.

## Security properties designed into the SQL migration
- **Club/Sponsor role is fixed at account creation** and cannot be changed with browser metadata after registration.
- **Admin rights are manually assigned** using \`public.admin_users\`, never via public signup or a UI toggle in Connected Mode.
- **Organisation owner and kind are immutable** under column grants.
- **New organisation profiles are pending by default**, and the admin can approve/reject through the verification table. UI approval is not formal identity proof.
- **Proposals can be submitted only by their sponsor owner**. A receiving club owner can accept or reject a submitted proposal. The database trigger rejects other status changes.
- **Users can only read their own draft proposals and proposals shared with their club**, subject to RLS.
- **Status changes are recorded in proposal_events**.
- Public/publishable keys are not secrets; **service_role key must never be committed**.

## Must-test cases before Connected Mode pilot
1. Without sign-in, direct requests to profiles, orgs and proposals must be denied.
2. As Club A, try to edit Club B's organisation and accept a proposal sent to Club B — both must fail.
3. As Sponsor A, try to edit Sponsor B's organisation and change a proposal to Accepted — both must fail.
4. As a newly created club, try to set its verification status to Approved directly — must fail.
5. As a new user, try to self-assign an admin role — must fail.
6. As a Club user, attempt to create a sponsor organisation — must fail.
7. As a Sponsor user, attempt to alter a submitted proposal's club ID or amount — must fail.
8. As an admin, approve a pending organisation; only then should it become discoverable to other authenticated users.
9. Verify all stored text is rendered escaped and cannot execute script when displayed.
10. Confirm row-level security is enabled on all exposed tables and that no service key appears in \`index.html\`, \`platform.js\` or \`supabase-config.js\`.

Use two or more separately registered test accounts and a test administrator. The team has **not executed these real-database security tests**, because a Supabase project is not connected here.

## Known remaining work
- Email deliverability, abuse/spam protection, rate limiting and monitoring
- Organization identity checks and evidence-handling policy
- Data export/deletion requests and lawful retention controls
- Dedicated audit of RLS and SQL triggers (ideally \`pgTAP\` and negative integration tests)
- Real hosting, auth and error monitoring, backup/restore exercises
- Security headers and Content Security Policy compatible with the CDN/auth provider
- Independent accessibility assessment, performance checks and formal user testing
- Clear service terms and a safeguarding policy before a public pilot

**Production readiness should not be scored 8/10 until the backend is configured, security checks pass and a pilot is verified.**
