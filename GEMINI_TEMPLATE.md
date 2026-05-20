# Project Memory Bank: International Financial Planner (US & Mexico)

## 🎯 Current Objective
**Phase 4: Credit Card Hub (Detail)**
- **Goal:** Implement a "Two-Lens" architecture. Maintain the Debit-based Cash Flow dashboard as the source of truth for bank balances, while adding a Spend Analyzer layer for Chase/Discover transactions.

## 📈 Roadmap & Progress

### Phase 1, 2 & 3: Foundation, Intelligence & Security (COMPLETE)
- [x] Automation, Hybrid Parsing, 12 months US ingest verified.
- [x] Bilingual NLQ Bridge (Text-to-SQL).
- [x] Supabase Auth & Vercel PWA Deployment.

### Phase 4: Credit Card Hub (Detail) (CURRENT)
- [x] **Milestone 15: Schema Hardening (US CC Prep)** (COMPLETE)
    - [x] Add `is_cash_flow` to `accounts` (TRUE for Debit, FALSE for CC).
    - [x] Add `is_recurring` and `is_transfer` to `transactions`.
    - [x] Retro-tag existing "Credit Card Payment" rows in bank history as `is_transfer`.
- [ ] **Milestone 16: CC Ingestion (Chase & Discover)** (NEXT)
    - [ ] Refine the **Universal LLM Prompt** to handle CC-specific items (Rewards, Interest, Payments).
    - [ ] Implement "Recurring Engine" (Automatic detection of Fixed vs. Variable recurring items).
- [ ] **Milestone 17: The Spend Analyzer UI**
    - [ ] **Unified View:** Spending = (Debit Expenses - Transfers) + CC Expenses.
    - [ ] **Drill-down transactions:** Click a category to see all line items.
    - [ ] **Annual Average Box:** Normalized averages for the selected calendar year.

### Phase 5: The Budget Strategist
- [ ] **Milestone 18: Fixed Cost Command**
- [ ] **Milestone 19: Manual Balance & Future Planner**

## 💡 Project Priorities
1. **The Two-Lens Rule:** The main dashboard MUST only show `is_cash_flow = TRUE` accounts to preserve bank balance accuracy.
2. **Neutralization:** CC payments must be tagged as transfers to avoid double-counting in the Analyzer.
3. **Infrastructure:** Maintain "Free Tier Preservation" (max 2 backend images, v0.x nomenclature).

## 🔄 Lifecycle Mandates
- **Post-Milestone Review:** Update TECHNICAL_DESIGN.md.
- **Branching:** Milestone 16 will start on `feature/milestone-16-cc-ingestion`.

## 📍 Checkpoint: Milestone 16 (READY TO START)
- **Status:** Milestone 15 merged. DB schema is hardened. v10 deployed.
- **Resume Point:** Begin testing Chase/Discover PDFs with Universal Parser.
