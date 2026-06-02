# Engagement Tracker

React + Vite + Supabase. Email sync via Claude (no Azure required).

---

## Deploy in 3 steps

### 1. Supabase — create the tables

Open your Supabase project → SQL Editor → New query.
Paste `supabase-schema.sql` and click Run.

Go to Project Settings → API and copy:
- Project URL → `VITE_SUPABASE_URL`
- anon/public key → `VITE_SUPABASE_ANON_KEY`

---

### 2. GitHub — push the repo

```bash
cd engagement-tracker
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/engagement-tracker.git
git push -u origin main
```

---

### 3. Vercel — connect and set env vars

1. vercel.com → Add New Project → import your GitHub repo
2. Framework preset: **Vite** (auto-detected)
3. Settings → Environment Variables:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | your Supabase anon key |

4. Deploy. Auto-deploys on every push to `main`.

---

## How email sync works

Email data lives in `src/emailData.js`. The "Sync now" button in the app
reads this file and imports any emails not yet in the database.

**To get fresh emails:**
1. Open Claude and say "sync my emails" (or "fetch new sent emails")
2. Claude fetches from Outlook via the Microsoft 365 connector
3. Claude updates `src/emailData.js` with the new data
4. Commit and push → Vercel auto-deploys → click Sync now in the app

This approach needs no Azure app registration or server-side tokens.

---

## Local development

```bash
cp .env.example .env.local
# Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

---

## File structure

```
engagement-tracker/
├── src/
│   ├── App.jsx          — main React app (Swiss design)
│   ├── emailData.js     — email feed updated by Claude each sync
│   ├── supabase.js      — Supabase client
│   └── main.jsx         — entry point
├── supabase-schema.sql  — run once in Supabase SQL editor
├── .env.example         — copy to .env.local
├── vite.config.js
└── package.json
```
