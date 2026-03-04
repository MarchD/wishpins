# WishPins

WishPins is a small drag-and-drop pin board powered by **React + Vite + TypeScript** on the frontend and a **Google Sheet** as the source of truth via **Google Apps Script Web App**.

## Features

- Board with two areas:
  - `TO DO`
  - `IN PROGRESS / DONE` (split into two subcolumns)
- Sticky-note card UI with optional image thumbnail
- Drag cards between statuses (`todo`, `in_progress`, `done`)
- Confirmation modal before moving a card to `done`
- Optimistic UI update with rollback if Google Sheets update fails
- Loading, error + retry, and manual refresh button
- Static deploy friendly (Netlify/Cloudflare Pages/GitHub Pages)

## Tech Stack

- React 19
- Vite
- TypeScript
- MUI
- `@dnd-kit/core`
- Google Apps Script bound to Google Sheet

## 1) Create the Google Sheet

1. Create a new Google Sheet.
2. Rename first tab to `wishes`.
3. Put these exact headers in row 1:

```text
id | title | link | image | status | x | y | updatedAt
```

4. Add sample rows (starting row 2), for example:

```text
book-1 | Atomic Habits | https://example.com/book |  | todo |  |  | 
lego-1 | Lego Set | https://example.com/lego | https://picsum.photos/200 | in_progress |  |  | 
hoodie-1 | Oversize Hoodie |  |  | done |  |  | 2026-01-01T12:00:00.000Z
```

## 2) Add Apps Script API (Option A, writable)

1. Open the sheet.
2. Go to **Extensions -> Apps Script**.
3. Replace default script content with [`apps_script/Code.gs`](apps_script/Code.gs) from this repo.
4. Save.
5. Click **Deploy -> New deployment**.
6. Type: **Web app**.
7. Execute as: **Me**.
8. Who has access: **Anyone with the link**.
9. Deploy and copy the Web App URL. It should look like:

```text
https://script.google.com/macros/s/AKfycb.../exec
```

The frontend will call:
- `GET {URL}?action=items`
- `POST {URL}?action=update`

## 3) Configure frontend

1. Copy env template:

```bash
cp .env.example .env
```

2. Set your Apps Script URL:

```env
VITE_SHEETS_API_URL=https://script.google.com/macros/s/AKfycb.../exec
```

Optional (recommended for production proxy):

```env
VITE_PROXY_API_BASE=/api
```

## 4) Run locally

```bash
npm install
npm run dev
```

Open the local URL from Vite (usually `http://localhost:5173`).

Local dev uses a Vite proxy to avoid browser CORS errors:
- Browser calls `/api?action=items` and `/api?action=update`
- Vite forwards those requests to `VITE_SHEETS_API_URL`

If you change `.env`, restart `npm run dev`.

## 5) Build

```bash
npm run build
npm run preview
```

## 6) Deploy static frontend

You can deploy `dist/` to:
- Netlify
- Cloudflare Pages
- GitHub Pages

### Netlify production setup (CORS-safe)

This repo includes a Netlify Function proxy:
- [`netlify/functions/sheets.js`](netlify/functions/sheets.js)
- [`netlify.toml`](netlify.toml) redirect from `/api` to the function

Set these Netlify environment variables:
- `SHEETS_API_URL=https://script.google.com/macros/s/AKfycb.../exec`
- `VITE_PROXY_API_BASE=/api`

Then redeploy. In production, browser calls your own domain `/api?...`, and Netlify server-side function calls Apps Script, avoiding browser CORS blocks.

## Done move confirmation text

When card is moved into `DONE`, app shows modal with:
- Title: `Ти прям точно впевнений? 👀`
- Body: `Бо тіко закриєш цю сторінку — інші не зможуть це подарувать, а ти не зможеш передумать. А мені було лінь тут щось придумувать ВАХХААХ.`
- Cancel: `Нє, передумав(ла)`
- Confirm: `Так, забираю`

Cancel keeps previous status. Confirm persists `status=done` to sheet.
