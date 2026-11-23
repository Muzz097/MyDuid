# MyDuid — Product Context & Experience Blueprint

**Product:** MyDuid  
**Tagline:** Your Money, Understood.  
**Document type:** Product vision, functional scope, UX direction, and delivery roadmap  
**Audience:** Product owner, developers, designers, AI coding agents, reviewers  
**Primary market and language:** Indonesia; user-facing language is Bahasa Indonesia  
**Status:** Living product brief. The latest explicit user decision and verified repository implementation always take precedence.

This document complements `AGENTS.md` (engineering, security, and collaboration rules) and `docs/design-system.md` (visual tokens and component styling). It describes what MyDuid should become and how its features should work together. It does not authorize implementing every planned feature at once.

---

## 1. Product vision

MyDuid is a personal finance companion that helps people **record, understand, plan, and manage their money** in one connected experience.

MyDuid is more than an income-and-expense ledger. It should help users answer:
- How much money do I actually have, across my wallets?
- Where did my money go, and what changed?
- What can I safely spend based on the budgets and obligations I have recorded?
- What should I pay attention to next?
- How can I reach a savings goal without losing track of daily spending?

The product promise is **clarity and control, not financial judgment**. MyDuid must explain what is known, identify what is estimated, disclose missing data, and leave financial decisions with the user.

### Four product pillars

1. **Fast Input** — make recording money movement quick and consistent.
2. **Smart Understanding** — turn verified financial records into understandable summaries and insights.
3. **Financial Planning** — help users budget, save, simulate decisions, and review progress.
4. **Friendly Experience** — make personal finance approachable through clear language, thoughtful interaction, accessibility, and a recognizable brand.

All input channels must converge on the same canonical transaction model and validation flow. A receipt, voice transcript, WhatsApp message, and manual form must never create separate financial ledgers.

## 2. Target experience and product principles

Design for people who want to manage everyday Indonesian Rupiah finances without needing accounting knowledge. Support both frequent quick entries and deeper periodic reviews.

Non-negotiable principles:
- **Clarity over decoration:** financial information and next actions take priority.
- **Trust over cleverness:** never fabricate balances, calculations, insights, or save states.
- **Progressive disclosure:** show essential information first; reveal advanced controls when needed.
- **User control:** users review and confirm proposed financial changes.
- **One source of truth:** all channels use the same backend rules and transaction records.
- **Privacy by design:** financial data is private, isolated per account, and accessed only for a clear purpose.
- **Accessible by default:** responsive layouts, keyboard operation, adequate contrast and touch targets, clear labels, and reduced-motion support.
- **Non-judgmental language:** avoid shame, guilt, or pressure around spending.
- **Useful density:** use desktop space deliberately; do not leave large areas empty or constrain content without reason.
- **Distinctive, not decorative:** MyDuid should not look like a generic AI-generated SaaS dashboard.

## 3. Product and visual identity

### Brand character

Minimalist, professional, warm, approachable, calm, and recognizable as an Indonesian personal-finance product.

The visual language should feel considered and editorial:
- Strong information hierarchy and purposeful typography.
- Intentional whitespace and balanced content density.
- A deliberate mix of open layouts, grouped rows, dividers, charts, and cards.
- Cards only where grouping or interaction benefits from a container; not every section needs a card.
- Restrained borders and shadows; avoid excessive rounding or uniform card grids.
- Functional charts with readable labels and legends.
- Warm surfaces and carefully controlled brand accents.
- Subtle, purposeful motion only.

Avoid:
- Neon, excessive glow, decorative gradients, and ornamental effects without function.
- Repeated identical cards for every piece of information.
- Generic template-like dashboard compositions.
- Emoji as product UI icons.
- Color as the only signal for status or transaction type.

### Mascot and illustration

A friendly MyDuid character may support onboarding, empty states, guidance, and occasional celebrations. Use a consistent illustration language and keep it secondary to financial information. Do not place the mascot everywhere or make the product childish. Use designed illustrations/stickers rather than emoji.

### Theme system

The approved palettes and tokens are specified in `docs/design-system.md` and the current frontend theme implementation. Preserve:
- Rupiah Merah (default; warm red/rose/cream/burgundy interpretation inspired by the mood of Indonesian Rupiah, not a reproduction of banknote artwork).
- MyDuid Garden (pink and botanical green).
- Emerald.
- Midnight Rose.

Appearance modes: Light, Dark, System. Theme palette and appearance mode are independent. Do not replace or duplicate the existing theme provider, persistence, or switcher. Additional palettes such as Ocean Blue or Monochrome are future candidates, not current scope.

## 4. Information architecture

Navigation should reflect user activity and product maturity. A menu item must lead to a working page or a clearly identified unavailable/coming-soon state; never create fake routes or empty shells just to fill navigation.

### Desktop navigation groups

- **Ringkasan:** Beranda.
- **Kelola Keuangan:** Transaksi, Dompet, Anggaran, Kategori.
- **Analisis:** Laporan, Kalender Keuangan.
- **Perencanaan:** Target Tabungan, Aset & Utang, Transaksi Berulang.
- **Asisten:** MyDuid AI.
- **Akun:** Profil, Preferensi, Keamanan, Privasi, Bantuan.

Show only destinations that exist or have a meaningful implemented destination. Secondary navigation can be progressively introduced as those features become real.

### Mobile navigation

Recommended primary destinations:
- Beranda.
- Transaksi.
- Central Catat (+) action.
- Laporan.
- Asisten.

Dompet, Anggaran, Kategori, Kalender, Target, and account settings remain accessible through the home page, contextual links, or a clearly discoverable secondary menu/drawer. Mobile navigation is an activity-first design, not a compressed copy of the desktop sidebar.

The Catat action sheet should eventually support:
- Pengeluaran.
- Pemasukan.
- Transfer.
- Foto struk.
- Suara.
- Input cepat.

Only enable actions that are implemented end-to-end. Unavailable actions must be clearly marked and must not pretend to work.

## 5. Core page responsibilities

### 5.1 Beranda — personal financial command center

The dashboard should answer “How am I doing, and what should I look at next?” rather than simply displaying a row of numbers.

Potential content, ordered by relevance and available data:
1. Personal greeting and useful account actions.
2. Total balance across active wallets, with privacy hide/show control and a route to wallet details.
3. Current-period income, expense, and net cash flow.
4. Daily spending guidance, only when the required budget and period data exist. Explain the calculation and missing assumptions; never label an estimate as guaranteed safe-to-spend money.
5. Cash-flow trend with selectable period and clear chart labels.
6. Budget progress and a helpful create-budget state when no budget exists.
7. Wallet overview with each wallet's balance and activity.
8. Evidence-based weekly/monthly insights with links to the underlying records.
9. Upcoming recurring obligations, only when recurring data exists.
10. A clear quick-entry action.

Do not show empty chart frames, fabricated insights, or placeholder financial values. Adapt layout to actual data and user needs.

### 5.2 Transaksi — canonical money activity

This is the user's complete, searchable record of money movement.

Expected capabilities:
- Search merchant, description, note, and other supported fields.
- Filter by date range, wallet, category, and transaction type.
- Period summary for income, expense, and transfers, keeping transfers distinct from income/expense.
- Date-grouped activity with useful subtotals.
- Transaction detail with date, amount, category, wallet, notes, and attachments when available.
- Edit and delete with clear confirmation and server-backed feedback.
- Duplicate-entry warning where evidence supports it.
- Recurring transactions when implemented.
- Split allocations across categories as a future capability; one payment must not be counted as multiple cash movements.

### 5.3 Dompet — sources and locations of money

A wallet represents a place/account where the user keeps money (for example cash, bank, or e-wallet). It is not a category or a savings goal.

Wallet list experience:
- Total balance across eligible active wallets.
- Wallets grouped or filtered by type.
- Wallet name, type, balance, and useful activity summary.
- Search/filter and create-wallet action.
- Contextual actions such as view, edit, and archive, respecting transaction history.

Wallet detail experience:
- Wallet identity and current balance.
- Wallet-specific transaction history.
- Incoming/outgoing transfers.
- Period cash-flow summary and category breakdown where supported.
- Reconciliation/adjustment history when that capability exists.

Reconciliation must be transparent: show recorded balance, actual balance entered by the user, difference, and an auditable adjustment record. Never silently overwrite historical transactions.

### 5.4 Anggaran — spending boundaries and progress

Support an overall period budget and category budgets, with remaining amount and clear period boundaries. Potential enhancements:
- Actual vs planned spending.
- Remaining budget.
- Historical comparison.
- Threshold notifications.
- Forecasts based on observed activity, clearly labeled as estimates.
- Budget detail showing the transactions contributing to actual spending.

Do not imply a forecast is certain. Transfers should not be treated as expenses unless the explicit product accounting rules say otherwise.

### 5.5 Laporan — understand patterns over time

Potential report sections:
- Overview: income, expense, net cash flow.
- Categories: total amount and transaction count as separate metrics.
- Trends: changes over days/weeks/months.
- Wallets: money movement by wallet.
- Comparisons: current vs previous period.
- Export: CSV/PDF when implemented.

Insights should identify their period, calculation basis, and source records. Distinguish “largest by amount” from “most frequent by count.”

### 5.6 MyDuid AI — grounded personal finance assistant

The assistant should answer questions about the authenticated user's own financial records, such as:
- What was my largest expense this month?
- How much did I spend on food?
- Compare this month with last month.
- Which wallet did I use most often?
- What changed in my spending recently?
- What would happen to my budget if I bought an item for a given amount?

Provide suggested questions for new users and evidence-linked insight cards where appropriate.

AI must not calculate financial totals from memory or guesswork. A controlled backend financial tool must perform calculations and return verified results. Responses should include the relevant period and, where practical, the number of records considered and links to supporting transactions.

AI may prepare drafts for transactions, budgets, or goals. Any mutation requires server validation and explicit user confirmation. No unrestricted SQL, database credentials, cross-user access, or silent writes.

## 6. Smart input and automation

All smart input methods produce an **editable draft**, then use the existing canonical transaction creation flow after confirmation.

### 6.1 Manual entry

Keep the existing transaction flow as the canonical baseline. Reuse its validation, category/wallet selection, API integration, and save behavior.

### 6.2 Smart Receipt Scanner (planned)

Flow:
1. Capture or upload receipt image.
2. Send image securely to a backend-controlled OCR/vision service.
3. Extract supported fields such as merchant, date, total, tax, and optionally line items.
4. Suggest category and wallet only when there is sufficient context.
5. Present confidence/uncertainty and an editable draft.
6. User reviews and confirms.
7. Save through the canonical transaction API.

Start with merchant, date, and total. Receipt formats vary; do not promise perfect item-level extraction. Test with real Indonesian receipts, image quality variation, and privacy requirements before selecting a provider.

### 6.3 Voice Transaction (planned)

Flow:
1. User records or provides speech.
2. Audio is transcribed.
3. Text is parsed into a structured transaction draft.
4. Missing or ambiguous fields are asked about.
5. User reviews and confirms.
6. Save through the canonical transaction API.

Example: “Tadi beli kopi di Kopi Kenangan dua puluh lima ribu pakai Jago.” The system may suggest expense, merchant, amount, category, and wallet, but must not silently assume ambiguous details.

Transcription and transaction extraction are separate stages. Protect audio and transcripts, disclose processing, and review provider cost and retention.

### 6.4 Smart categorization and duplicate detection (planned)

Use user-approved history and deterministic rules to suggest categories. Treat suggestions as suggestions, not truth. Duplicate detection may compare amount, merchant, timestamp, wallet, and source; warn rather than automatically discard unless the user explicitly chooses.

### 6.5 WhatsApp (conditional future integration)

WhatsApp is a possible additional input channel, not a foundation of the MVP. Before implementation, verify current Meta policies, official provider capabilities, consent requirements, template rules, regional restrictions, data processing terms, cost, and account-linking design.

A safe conceptual flow:
1. User explicitly links and verifies a WhatsApp number to their MyDuid account.
2. An official webhook receives a message.
3. Backend verifies webhook authenticity and linked account ownership.
4. Backend classifies text, image, or audio.
5. System prepares a draft using the same transaction model.
6. Bot requests explicit confirmation.
7. Backend saves only after a valid confirmation.
8. User receives an accurate result.

Do not assume a general-purpose AI chatbot use case is permitted. Do not train external models on WhatsApp message data. Provide consent, opt-out, retention, and privacy controls. Never link accounts by phone-number matching alone.

## 7. Planning and supporting capabilities

Potential capabilities, introduced only when their data model and UX are ready:
- Savings goals with target, deadline, contribution history, and progress.
- Recurring transactions and upcoming bills.
- Financial calendar.
- Assets and liabilities entered manually.
- Spending simulation (“Cek Sebelum Belanja”).
- Monthly closing and evidence-based monthly recap.
- Notifications and reminders.
- CSV import and CSV/PDF export.
- Audit/change history for important financial edits.
- Wallet reconciliation.

Important accounting rules:
- Do not double-count wallet balances as separate assets when calculating net worth.
- Manual assets/liabilities must be clearly separated from wallet balances.
- Spending simulation is hypothetical and must never create a transaction.
- Transfers move money between wallets; they are not income or expense.
- Split-category allocation must not multiply the underlying cash movement.

## 8. Financial data, trust, and safety requirements

These requirements are mandatory and complement `AGENTS.md`:
- Use integer whole Rupiah (BIGINT) for stored/calculated monetary values; never floating point.
- Use Asia/Jakarta for financial dates and user-facing time boundaries unless the user explicitly configures otherwise.
- The authenticated server session determines user identity. Never trust a client-provided user ID.
- Scope every financial query and mutation to the authenticated user.
- Validate ownership and active status of referenced wallets/categories on the server.
- Transfers must remain atomic and distinct from income/expense.
- Financial calculations are performed by deterministic backend logic, not language-model arithmetic.
- AI and external channels use narrow, validated backend tools; never unrestricted database access.
- Drafts and proposed changes require user review and explicit confirmation.
- Do not report success, update a final balance, or show a successful toast until the server confirms.
- Explain estimates, assumptions, missing data, and relevant periods.
- Protect receipt images, audio, account details, and transaction metadata.
- Do not expose secrets, tokens, or environment files.

## 9. Onboarding and first-use experience

Keep onboarding short, skippable, and useful:
1. Welcome to MyDuid and explain the product promise.
2. Introduce recording, understanding, and planning.
3. Offer creation of the first wallet (skippable).
4. Offer an initial budget or savings goal (optional).
5. Explain smart features only when they are available.
6. Offer external account linking only with clear consent and a skip option.

Do not force users to configure every feature before reaching the app. Use the mascot sparingly to guide empty states and first actions.

## 10. Product maturity and roadmap

The roadmap is sequential. An item below is a product direction, not proof that it is implemented.

### Phase 1 — UI/UX foundation
- 1A Design tokens and visual foundation.
- 1B Theme switcher and appearance modes.
- 1C App shell and navigation.
- 1D Reusable UI, visual refinement, and microinteractions.
- 1E Responsive behavior and accessibility review.

### Phase 2 — Core product pages
- Dashboard/overview.
- Transactions.
- Wallet list and wallet detail.
- Budgets and category management.
- Reports and useful empty/loading/error states.
- Profile, preferences, security, privacy, and help navigation as real destinations become available.

### Phase 3 — Smart input
- Receipt OCR.
- Voice input.
- Smart categorization.
- Duplicate detection.
- Recurring transactions.

### Phase 4 — MyDuid AI
- Secure assistant UI and conversation history.
- Controlled backend financial query tools.
- Grounded insights with source links.
- Spending simulation.
- User-confirmed draft actions.

### Phase 5 — External integrations and maturity
- WhatsApp only after policy and provider feasibility review.
- Notifications.
- Import/export.
- Security, privacy, observability, and performance hardening.

Do not skip foundational validation or implement a future feature as a fake placeholder. Prioritize the user's latest task and verify each phase before moving on.

## 11. Definition of a successful feature

A feature is not complete merely because its UI renders. It should:
- Solve a clear user problem.
- Fit the product's information architecture.
- Work on mobile and desktop.
- Use real authorized data or clearly state that it is not yet available.
- Have loading, empty, error, disabled, and success states as relevant.
- Be accessible by keyboard and assistive technology.
- Respect all four themes and Light/Dark/System.
- Preserve existing workflows and data contracts.
- Validate input and authorization on the server.
- Provide honest feedback based on server results.
- Be tested with relevant automated checks and manual browser flows.
- Include a concise report of changed files, behavior, test results, and unverified areas.

## 12. Collaboration and task execution

- Treat `AGENTS.md` as the mandatory engineering contract.
- Treat this document as the product vision and functional blueprint.
- Treat `docs/design-system.md` as the visual token and component styling authority.
- Inspect the existing implementation before deciding a feature is missing.
- Work only on the explicitly assigned task; do not start the next roadmap task automatically.
- Avoid broad repository audits when the task scope and relevant files are known.
- Do not have multiple agents edit the same files concurrently.
- Keep changes small enough to review and verify.
- Do not commit, push, deploy, or perform destructive operations unless explicitly requested.
- When the user changes product direction, follow the latest explicit decision and update this document only when asked or when the change is clearly approved.

---

**Product north star:** MyDuid should make users feel that their money is easier to see, understand, and manage — without making financial life feel more complicated.
