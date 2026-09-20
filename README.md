# Vansh Construction — Labour & Site Management (Next.js)

A full Next.js 14 (App Router) rebuild of the labour/site management app for
**Vansh Construction / Nitin Dohate**. Sidebar navigation, animated navy-gold
"royal" theme, dark mode toggle, and a real Firebase Firestore backend so
data syncs across every device and never gets lost on refresh.

## Features

- **Dashboard** — today's attendance, this month's wages/material/total
  expense, site-wise expense table, and a side panel showing exactly who is
  owed how much this week.
- **Sites** — add/edit/delete, with search.
- **Labourers** — add/edit/delete Mistri/Labour/Centring/Other, with search.
  The first time the list is empty, 35 default "Mistri 1..35" are seeded —
  edit each with the real names.
- **Attendance** — mark Full / Half / Absent per labourer per day per site,
  or log a "slab day" bulk lump-sum for the whole gang.
- **Weekly Payment** — automatic Sunday–Sunday wage calculation, paid/unpaid
  toggle, and a **CSV export** button.
- **Material** — sqft-based estimator (cement/sand/gravel/steel, adjustable
  ratios) plus an actual-purchase-cost log.
- **Revenue** — your ₹/day commission per labourer (editable), this
  week's/month's commission totals, and a site-wise "who owes you what"
  table with CSV export.
- **Dark mode** toggle (saved locally), fully mobile responsive sidebar.

## 1. Install

```bash
npm install
```

## 2. Set up Firebase (free — no card needed)

1. Go to https://console.firebase.google.com → **Add project** → any name.
2. On the project page click the **`</>`** (Web) icon → register a web app
   → copy the `firebaseConfig` object it shows you.
3. In the left sidebar: **Build → Firestore Database → Create database**
   → *Start in production mode* → pick a region (e.g. `asia-south1`) → Enable.
4. In Firestore's **Rules** tab, replace the rules with:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```

   Click **Publish**. (This keeps it open/no-login since it's a single-owner
   internal tool — don't share the deployed link publicly.)

5. Copy `.env.local.example` to `.env.local`:

   ```bash
   cp .env.local.example .env.local
   ```

   Paste the values from your `firebaseConfig` into it, e.g.:

   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=vansh-construction.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=vansh-construction
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=vansh-construction.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
   NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
   ```

## 3. Run locally

```bash
npm run dev
```

Open http://localhost:3000 — the warning banner should be gone once your
`.env.local` is filled in correctly.

## 4. Deploy to Vercel

1. Push this folder to a GitHub repo (or use `vercel` CLI / drag-and-drop
   the folder on vercel.com — either works).
2. On https://vercel.com → **Add New → Project** → import the repo.
3. In the import screen, open **Environment Variables** and add the same
   6 `NEXT_PUBLIC_FIREBASE_*` keys from your `.env.local` (Vercel does not
   read `.env.local` from the repo — you must add them here).
4. Click **Deploy**. You'll get a live URL (e.g. `vansh-construction.vercel.app`)
   that works on any device, with data always saved in Firestore.

## Notes

- Firebase's free "Spark" plan (1 GB storage, 50k reads/day, 20k writes/day)
  is more than enough for one contractor's daily use — this app costs ₹0.
- The commission rate (Revenue tab) defaults to ₹100/labourer/day and is
  editable anytime; it's stored in Firestore so it also persists.
