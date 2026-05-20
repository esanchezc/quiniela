# Application Blueprint: Intelligence-Driven Hybrid PWA

This blueprint captures the "International Financial Planner" stack, optimized for AI-driven data extraction, SQL bridge capabilities, and cloud-synced storage.

## 🏗️ Technical Stack
- **Runtime:** Python 3.11+
- **Framework:** FastAPI (High-performance async API)
- **Dependency Management:** `uv` (Fastest Python package manager)
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL + Auth + Real-time)
- **Intelligence:** [Google Gemini API](https://aistudio.google.com/) (GenAI for PDF parsing and Text-to-SQL)
- **Storage:** Google Drive API (For automated document ingestion)
- **Frontend:** React/Angular (Vercel PWA)

## 🎯 Architectural Strategies

### 1. The "Two-Lens" Architecture
Maintain two distinct perspectives on data:
- **Cash Flow Lens:** Tracks actual bank balances (Debit/Checking). Source of truth for liquidity.
- **Spend Analyzer Lens:** Overlays Credit Card transactions while neutralizing "Credit Card Payments" as transfers to prevent double-counting.

### 2. Universal LLM Parsing
Instead of rigid regex-based parsers, use a **Universal LLM Prompt** to ingest varied PDF formats (Chase, Discover, Wells Fargo).
- **Process:** PDF -> Text Extraction -> Gemini Pro/Flash -> JSON Schema -> Database.
- **Schema:** Use `is_recurring`, `is_transfer`, and `is_cash_flow` flags for intelligent categorization.

### 3. NLQ Bridge (Text-to-SQL)
Enable non-technical users to query the database using natural language.
- **Strategy:** Feed the DB schema to Gemini along with the user's natural language question to generate valid PostgreSQL queries.

## 🛠️ Configuration & Setup

### Environment Variables (.env)
```bash
GEMINI_API_KEY=        # Obtain from https://aistudio.google.com/
SUPABASE_URL=          # Project Settings -> API in Supabase
SUPABASE_KEY=          # Service Role Key for backend access
GDRIVE_INBOX_FOLDER_ID= # ID of the GDrive folder to watch
GDRIVE_KEY_PATH=gdrive_key.json
```

### Essential Tooling
- **`uv`:** Use `uv sync` for instant environment setup.
- **`supabase_schema.sql`:** Foundational schema for accounts, transactions, and categories.
- **`gdrive_service.py`:** Standardized wrapper for service account interaction.

## 🔗 Current Project References (For Quick Migration)
- **Supabase Project URL:** `https://pevogtaufbnieaelqcof.supabase.co`
- **Google AI Studio (Gemini):** `https://aistudio.google.com/`
- **Google Drive Inbox ID:** `1E4JqgH5TkICwc2zQnikcftEyD-z4jtQH`
- **Google Drive Archive ID:** `1qSmUfvMiUIlhtKdidzqX-BghB672pC88`

## 🚀 Scaling & Deployment
- **Backend:** Dockerized and deployed to Vercel/Render/Fly.io.
- **Frontend:** Vercel (Optimized for PWA and rapid deployments).
- **Free Tier Strategy:** Keep within 2 backend images and use "Flash" models to minimize costs.
