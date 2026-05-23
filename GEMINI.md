# Memory Bank: Quiniela WC 2026

## 🛡️ Repository Mandates
- **Surgical Commits:** NEVER perform bulk `git add .` or commit irrelevant files. Every commit must be targeted to the current feature.
- **Cleanliness:** Only files strictly related to the Quiniela app should exist in this repository. Remove any legacy or template files from previous project contexts immediately.
- **Verification:** Always confirm file contents and relevance before staging.

## Project Overview
A private, async "Quiniela" (draft-style betting pool) for 4 siblings (Emanuel, Obi-Wan, Ruthy, Daniel). 
**Goal:** Build a functional draft app in a few days.

### Tech Stack
- **Frontend:** React (Vite) + Tailwind CSS
- **Backend/DB:** Supabase (Real-time enabled)
- **Auth:** "Secret Link" approach (UUID tokens in URL)

---

## 🏗️ Phase 1: The Draft (In Progress)

### 📋 Status
- [x] **Git Repository:** Initialized and pushed to `esanchezc/quiniela`.
- [x] **Supabase Setup:** Verified connection and seeded 48 official teams/groups.
- [x] **Draft Logic:** Snake draft logic (1-2-3-4, 4-3-2-1) implemented in `App.tsx`.
- [x] **Real-time:** Supabase channels configured for instant pick updates.
- [x] **Authentication:** Secret Link (UID token) logic implemented and verified.

### 🔗 Handover for Next Session
- **Immediate Task:** Implement the "My Roster" view to show teams picked by each player.
- **Optimization:** Add a "Picking History" log to show who picked whom and when.
- **Vercel:** Prepare for first deployment.
- **Tokens:** Emanuel should share the secret tokens from the Supabase `players` table with siblings to test.

---

## 📈 Phase 2: Dashboard & Scoring (Planned)
- Auto-score using a sports API (to be identified).
- Manual score override for custom rules (e.g., negative points for not advancing).

---

## 📝 Active Tasks
- [x] Create `GEMINI.md`
- [ ] Create `quiniela_schema.sql` (Revised with actual teams and tokens)
- [ ] Initialize Vite + Supabase project
- [ ] Generate secret links for players
