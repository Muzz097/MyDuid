# MyDuid — Project & Agent Instructions

## 1. Product direction
MyDuid is a personal finance application: **Your Money, Understood.**
It helps users record, understand, plan, and manage personal finances.

Four product pillars:
- Fast Input: manual transactions first; receipt OCR, voice, and external channels as later input methods.
- Smart Understanding: accurate financial summaries and AI explanations based on verified account data.
- Financial Planning: budgets, savings goals, spending simulations, and reports.
- Friendly Experience: clear, warm, accessible UI with useful microinteractions.

The approved redesign roadmap:
1. UI/UX foundation: design tokens, app shell, navigation, themes, reusable components, responsive states.
2. Core pages: dashboard, transactions, wallets, budgets, reports, categories.
3. Smart input: receipt OCR, voice, categorization suggestions, duplicate detection, recurring transactions.
4. AI assistant: secure financial query tools, insights, spending simulation, user-confirmed drafts.
5. External integrations: evaluate WhatsApp policy/technical feasibility first; then notifications and import/export.

Do not implement every roadmap feature at once. Work only on the explicitly assigned step.

## 2. Existing project — preserve before extending
This repository already contains working Laravel API and React SPA features, including authentication, transactions, wallets, transfers, categories, budgets, and dashboard functionality to varying degrees.

Never assume a feature is missing because it is not visible in one screenshot or one page.
Before changing a feature:
- Inspect its current page, components, API client, backend route/controller/service, validation, model, migration, and tests as relevant.
- Classify what exists as implemented, partial, mock, or missing.
- Reuse and extend existing code where appropriate.
- Do not recreate existing functionality, duplicate routes/services/components, or replace working API integration with mock data.
- Do not perform a broad rewrite when a scoped enhancement is sufficient.
- If current implementation conflicts with these instructions, report the conflict and follow verified code plus the user's latest explicit direction.

## 3. Confirmed technology
### Frontend (`frontend/`)
- React 19, TypeScript, Vite.
- Tailwind CSS 4 with `@tailwindcss/vite`.
- React Router DOM 7.
- Recharts.
- lucide-react.
- clsx.
- Oxlint.

Use the installed stack. Do not introduce another framework, router, state library, chart library, animation library, or dependency unless the user explicitly approves it.

### Backend (`backend/`)
- Laravel 13, PHP 8.3+ (project currently developed with PHP 8.4).
- PostgreSQL 16.
- Laravel Sanctum first-party SPA authentication using session cookies and CSRF; do not introduce bearer-token storage in browser storage.
- Pest 5 and Laravel Pint.

UI language and user-facing validation/error messages: Indonesian.
Code identifiers, class names, and technical comments: English unless existing conventions require otherwise.

## 4. Financial and backend safety — mandatory
- Money is stored and calculated as integer whole Rupiah (BIGINT). Never use float for money.
- Format money through the existing `@/lib/money` utilities on frontend.
- Follow the existing `App\\Services\\BalanceService` for authoritative wallet balance calculations. Do not create competing balance calculations.
- Every financial record must be scoped to the authenticated user. Derive ownership from the authenticated request/session, never trust client-supplied `user_id`.
- Never expose another user's records. Use ownership-scoped queries and authorization policies.
- Validate referenced wallet/category ownership and active status on the server.
- Transfers are not income or expenses and must remain atomic using a database transaction.
- Use existing Form Requests, API Resources, services, policies, and response conventions.
- Never return raw Eloquent models where the project uses API Resources.
- Do not edit an existing migration that may already have run. Create a new migration for schema changes.
- Do not run destructive database commands, reset databases, or modify production data.
- Do not add Composer/npm dependencies without explicit approval.
- AI must not receive unrestricted SQL/database access. Financial calculations must be performed by controlled backend queries/tools scoped to the authenticated user. AI may explain returned results, not invent totals.
- AI-created or externally submitted financial changes must be validated and require user confirmation before persistence.
- Never expose secrets, tokens, credentials, or contents of environment files.

## 5. Frontend architecture and design rules
- Inspect existing aliases, components, hooks, API client, store, types, and folder conventions before adding files.
- Use the existing `@/` import alias where configured.
- Use existing `cn()` from `@/lib/cn` for conditional classes where appropriate.
- Reuse existing UI components before creating alternatives.
- Keep components typed, focused, and consistent with existing conventions.
- Do not create a parallel design system or duplicate an existing component.
- Do not hardcode hex colors in page components. Use the design tokens in `frontend/src/index.css`; change token definitions only as part of an explicitly assigned design-system task.
- Current semantic meanings: brand color for primary actions; income color for incoming money; expense/coral color for outgoing money; warning/danger for status. Never communicate status by color alone.
- Use tabular numerals for monetary values.
- Use lucide-react icons, not emoji, for product UI. Respect existing icon mapping utilities and stored icon keys.
- Mobile-first; touch targets at least 44px; support keyboard focus and accessible labels.
- Respect `prefers-reduced-motion`. Microinteractions should communicate state, not merely decorate.
- Include loading, empty, error, disabled, and success states where relevant.
- Never show a successful save or update optimistic financial balances as final until the server confirms success.
- Use neutral, non-judgmental Indonesian copy.

## 6. Approved visual direction
The default theme direction is **Rupiah Merah**: a warm red/coral and cream interpretation inspired by the visual mood of the Indonesian Rp100,000 banknote, paired with clear green income semantics. This is a design inspiration, not an attempt to reproduce official banknote artwork.

Approved theme concepts:
- Rupiah Merah — default.
- MyDuid Garden — pink and botanical green.
- Emerald — fresh green.
- Midnight Rose — dark theme.
- Ocean Blue and Monochrome may be considered later.

Theme switching should support light, dark, and system modes, previews, persistent user preference, and smooth accessible transitions. Preserve the existing pink/green brand identity as an available theme direction rather than discarding it.

Approved navigation direction:
- Mobile: Beranda, Transaksi, central Catat (+), Laporan, Asisten.
- Dompet remains accessible from Beranda and secondary navigation.
- Desktop sidebar groups: Ringkasan; Kelola Keuangan; Analisis; Perencanaan; Asisten; Akun.
- Do not add a navigation item until its page or meaningful destination exists.

## 7. Working protocol for every task
1. Read this file and any applicable local agent instructions.
2. Check Git status and inspect the exact files involved before editing.
3. State the task scope and list files expected to change.
4. Implement only the requested task. Do not opportunistically refactor unrelated code.
5. Preserve current behavior and API contracts unless the task explicitly changes them.
6. Run the narrowest relevant checks, then broader checks when appropriate.
7. Report changed files, behavior, commands run, test/build results, and anything not verified.
8. Never claim a test/build passed unless it was actually run successfully.
9. Do not commit, push, deploy, alter secrets, or run destructive commands unless explicitly requested.
10. If requirements conflict or a change risks data integrity/security, stop and explain before proceeding.

## 8. Verification commands
Frontend (from `frontend/`):
- `npm run lint`
- `npm run build`

Backend (from `backend/`):
- `./vendor/bin/pint`
- `./vendor/bin/pest`

Run only relevant commands for the task; explain any command that cannot be run in the current environment.

## 9. Collaboration
- Cursor: primary agent for scoped multi-file frontend/UI implementation.
- GitHub Copilot: inline completion, small component edits, and explanations while the developer works.
- OpenCode: scoped backend/API/testing/debugging tasks.
- Do not have multiple agents edit the same files or task concurrently.
- The user is a beginner: explain important decisions and verification steps clearly.
