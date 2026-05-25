# Memory Bank: Quiniela WC 2026

## 🛡️ Repository Mandates
- **Surgical Commits:** NEVER perform bulk `git add .` or commit irrelevant files. Every commit must be targeted to the current feature.
- **Cleanliness:** Only files strictly related to the Quiniela app should exist in this repository.
- **Verification:** Always confirm file contents and relevance before staging.
- **Push Policy:** NEVER push to remote without explicit user permission.
- **Build Integrity:** ALWAYS run `npm run build` in the `web/` directory and ensure it passes with 0 errors before committing or pushing changes.

## Project Overview
A private, async "Quiniela" (draft-style betting pool) for 4 siblings (Emanuel, Obi-Wan, Ruthy, Daniel). 
**Goal:** Build a functional draft app in a few days.

### Tech Stack
- **Frontend:** React (Vite) + Tailwind CSS
- **Backend/DB:** Supabase (Real-time enabled)
- **Auth:** "Secret Link" approach (UUID tokens in URL)

---

## 🏗️ Phase 1: The Draft & Rules (Completed)

### 📋 Status
- [x] **Git Repository:** Initialized and pushed to `esanchezc/quiniela`.
- [x] **Supabase Setup:** Verified connection and seeded 48 official teams/groups.
- [x] **Draft Logic:** Snake draft logic (1-2-3-4, 4-3-2-1) implemented.
- [x] **Real-time:** Supabase channels configured for instant pick updates.
- [x] **Authentication:** Secret Link (UID token) logic implemented.
- [x] **Wildcards:** Golden Boot, Golden Glove, and MVP picks enabled with lock-out logic (June 11th).
- [x] **Rules:** Dynamic points system (+155 Champion path) with Admin edit mode.

---

## 📈 Phase 2: Tournament Management (In Progress)

### 📋 Status
- [x] **Leaderboard:** Cumulative scoring logic with visual Podium and Roster audit.
- [x] **Match Center:** Official 72-match group stage schedule seeded.
- [x] **Filtering:** Round-based (R1, R2, R3) and "Today" view logic.
- [x] **Admin Overrides:** Manual score and status management in the UI.

### 🔗 Handover for Next Session
- **Immediate Task:** Add knockout rounds match placeholders (R32, R16, QF, SF, Final).
- **Automation:** Plan "Auto-populate" logic to move group winners into knockout slots.
- **Testing:** Perform a mock tournament run to verify leaderboard accuracy.
- **API:** Identify and integrate a free sports API for live result fetching (Football-Data.org).

---

## 📝 Active Tasks
- [ ] Add Knockout match placeholders to `matches` table.
- [ ] Implement "Redraft" logic for playoff teams.
- [ ] Mock results testing for leaderboard verification.
