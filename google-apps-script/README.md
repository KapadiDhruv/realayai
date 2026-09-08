# Waitlist → Google Sheets setup

## 1. Create the sheet

Create a new Google Sheet (or use an existing one). Copy its **Sheet ID**
from the URL:

```
https://docs.google.com/spreadsheets/d/SHEET_ID_IS_THIS_PART/edit
```

The script creates a `Waitlist` tab and header row automatically the
first time it runs, so you don't need to set those up by hand.

## 2. Create the Apps Script project

1. Go to [script.google.com](https://script.google.com) → **New project**.
2. Delete the default `Code.gs` contents and paste in this repo's
   `google-apps-script/Code.gs`.
3. In the left sidebar, open **Project Settings** → **Script Properties**
   → **Add script property**, and add two:
   - `SHEET_ID` — the Sheet ID from step 1.
   - `SHARED_SECRET` — the same long random string you'll put in
     `GOOGLE_APPS_SCRIPT_SECRET` in the Next.js app's `.env.local`
     (generate one with `openssl rand -hex 32`).

## 3. Deploy as a Web App

1. Click **Deploy** → **New deployment**.
2. Type: **Web app**.
3. **Execute as**: Me (your account).
4. **Who has access**: **Anyone**. (This is required — the Next.js
   server has no Google account to authenticate with. The shared
   secret is what actually protects the endpoint; see the note below.)
5. Click **Deploy**, authorize the requested permissions, and copy the
   Web app URL — it ends in `/exec`.

## 4. Wire it into the Next.js app

In the project root, copy `.env.local.example` to `.env.local` and fill in:

```
GOOGLE_APPS_SCRIPT_URL=<the /exec URL from step 3>
GOOGLE_APPS_SCRIPT_SECRET=<the same value you put in SHARED_SECRET>
```

`.env.local` is gitignored, so these never get committed. They're read
only in `app/api/waitlist/route.ts` (a server-side route handler), so
the URL and secret never reach the browser bundle.

If you deploy the Next.js app (Vercel, etc.), set these same two
variables in that platform's environment variable settings.

## 5. Re-deploying after edits

Every time you change `Code.gs`, you must **Deploy → Manage deployments
→ Edit (pencil icon) → New version → Deploy** for the change to take
effect — saving the file alone does not update the live Web App.

## Notes / limitations

- **"Anyone" access + shared secret**: Apps Script Web Apps don't support
  custom auth headers being verified before `doPost` runs, so "Anyone"
  access is required for a server-to-server call like this. The
  `SHARED_SECRET` check inside `doPost` is what stops randoms who
  discover the URL from writing to your sheet — keep it long and out of
  the frontend.
- **HTTP status codes**: `ContentService` responses are always sent as
  HTTP 200, regardless of outcome. The Next.js route doesn't rely on the
  status code from Apps Script — it reads the `ok` field in the JSON body
  instead, and maps that to the correct status code it sends back to the
  browser (409 for duplicate, 400 for invalid email, etc).
- **Duplicate checking** reads the full `Email` column on every request,
  which is fine for a waitlist (thousands of rows, well within Apps
  Script's execution limits) but wouldn't scale to a high-volume table.
