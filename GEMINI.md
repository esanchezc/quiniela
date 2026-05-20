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

### 📋 Requirements
- [x] **4 Players:** Emanuel, Obi-Wan, Ruthy, Daniel.
- [x] **48 Teams:** Official 2026 qualifiers (including debutants like Uzbekistan and Jordan).
- [x] **Draft Format:** Snake (1-2-3-4, 4-3-2-1). 8 rounds (32 teams total picked).
- [x] **Authentication:** Secret tokens mapped to player names.

### 🗄️ Database Schema
- `players`: id, name, draft_order, secret_token (UUID).
- `teams`: id, name, flag_emoji, is_picked, picked_by_id, pick_number.
- `draft_state`: current_pick_number (1-32), is_active.
- `scoring_config`: Rules for points calculation.

### 🎮 Snake Logic
The player whose turn it is is determined by `(current_pick_number - 1) % 8`.
- Pick 1-4: Order [1, 2, 3, 4]
- Pick 5-8: Order [4, 3, 2, 1]
- ...and so on.

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
