# MyDuid — GitHub Copilot Instructions

Read the repository-root `AGENTS.md` first. It is the canonical source for product direction, architecture, security, financial rules, design direction, and workflow.

## Non-negotiable rules
- MyDuid is an existing Laravel API + React SPA. Extend and reuse working code; do not rebuild existing features or replace API-backed data with mocks.
- Before editing, inspect the relevant frontend page/components/API client and backend route/controller/service/validation/tests as applicable. Do not assume a feature is missing from its screenshot alone.
- Follow the installed stack and conventions. Do not add dependencies or change frameworks without explicit approval.
- Financial amounts are integer Rupiah only. Never use floating-point arithmetic for money.
- Preserve Sanctum SPA session-cookie/CSRF authentication. Never store auth tokens in browser localStorage/sessionStorage.
- Scope every financial query and mutation to the authenticated user. Never trust client-supplied user_id.
- Transfers remain separate from income/expense and must be atomic.
- Do not edit existing migrations; create a new migration for schema changes.
- AI must use controlled, user-scoped backend tools/queries, never unrestricted SQL. Require user confirmation before saving AI-generated transactions or other financial changes.
- Reuse existing components, utilities, design tokens, routes, API contracts, and tests. Avoid duplicate implementations.
- Indonesian UI copy; lucide-react icons, no emoji in product UI; accessible mobile-first UI and reduced-motion support.
- No unrelated refactors, destructive database operations, secrets exposure, commits, pushes, or deployments unless explicitly requested.

## Current redesign direction
Follow the phased roadmap in `AGENTS.md`: UI foundation → core pages → smart input → AI assistant → external integrations. Current approved default theme concept: Rupiah Merah. Preserve the existing pink/green identity as an available direction.

## Task discipline
Work only on the task explicitly requested. Inspect Git status and relevant files first. Report changed files and actual lint/build/test results. Never claim unrun checks passed.
