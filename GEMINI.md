# Memory Bank: Quiniela WC 2026

## 🛡️ Repository Mandates
- **Surgical Commits:** NEVER perform bulk `git add .` or commit irrelevant files. Every commit must be targeted to the current feature.
- **Cleanliness:** Only files strictly related to the Quiniela app should exist in this repository. Remove any legacy or template files from previous project contexts immediately.
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
- [x] **Snake Draft Logic:** 1-2-3-4, 4-3-2-1 implemented.
- [x] **Authentication:** Secret Link (UID token) logic verified.
- [x] **Wildcards:** Golden Boot, Golden Glove, and MVP picks enabled with lock-out logic (June 10th).
- [x] **Rules:** Dynamic points system (+155 Champion path) with Admin edit mode.

---

## 📈 Phase 2: Tournament Management (In Progress)
- [x] **Leaderboard:** Cumulative scoring logic with visual Podium and Roster audit.
- [x] **Match Center:** Official 104-match schedule seeded with accurate dates/times/cities.
- [x] **Admin Overrides:** Manual score management directly on match cards.
- [ ] **Knockout Placeholders:** Add logic to handle "TBD" teams in knockout matches.
- [ ] **Auto-Standings:** (Future) Logic to move group winners into knockout slots automatically.

---

## 📅 Future Phases (Planned)
- **Playoff Redraft:** Implement logic for picking teams after the Group Stage (half points rule).
- **API Integration:** Identify and integrate a free sports API for live result fetching (Football-Data.org).
- **Leaderboard Verification:** Perform a full mock tournament run to audit point accuracy.

---

## 📝 Active Tasks
- [ ] Implement UI for knockout placeholders in `MatchesView.tsx`.
- [ ] Design the "Redraft" workflow for Commissioner.
- [ ] Add wildcard scoring summary to the top of the Leaderboard.
