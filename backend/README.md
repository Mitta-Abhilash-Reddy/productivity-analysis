# WorkTracker Backend — Express + Supabase

Minimal production-ready backend for the WorkTracker Electron app.
Receives activity and screenshot events, stores them in Supabase.

---

## Project Structure

```
tracker-server/
├── index.js                  ← Express server entry point
├── supabaseClient.js         ← Supabase client singleton
├── routes/
│   └── track.js              ← POST /track route
├── controllers/
│   └── trackController.js    ← Event routing + validation logic
├── utils/
│   └── upload.js             ← Base64 → Supabase Storage upload
├── supabase_setup.sql        ← Run once in Supabase SQL Editor
├── .env.example              ← Copy to .env and fill values
├── .gitignore
└── package.json
```

---

## Step 1 — Create Supabase Tables

1. Go to [supabase.com](https://supabase.com) → your project
2. Click **SQL Editor** → **New Query**
3. Paste the contents of `supabase_setup.sql`
4. Click **Run**

This creates two tables:
- `activity_logs` — stores all activity events
- `screenshots` — stores screenshot URLs

---

## Step 2 — Create Supabase Storage Bucket

1. In your Supabase project → click **Storage** (left sidebar)
2. Click **New bucket**
3. Name it exactly: `screenshots`
4. Check **Public bucket** → click **Create bucket**

> The bucket must be public so the Electron app and dashboard can load screenshot images.

---

## Step 3 — Get Your Supabase Keys

1. In your Supabase project → **Settings** → **API**
2. Copy:
   - **Project URL** → this is your `SUPABASE_URL`
   - **service_role** key (scroll down, reveal it) → this is your `SUPABASE_KEY`

> ⚠️ Use the `service_role` key, NOT the `anon` key. The service role key bypasses RLS and is required for storage uploads. Keep it secret — only use it on the backend, never in frontend code.

---

## Step 4 — Local Setup

```bash
# Install dependencies
npm install

# Create .env from template
cp .env.example .env
# Then edit .env with your actual Supabase URL and key

# Start development server
npm run dev

# Or start production server
npm start
```

Test it:
```bash
curl http://localhost:3000/health
# → { "status": "ok", "timestamp": "..." }

curl -X POST http://localhost:3000/track \
  -H "Content-Type: application/json" \
  -d '{"type":"activity","user":"emp_test","app":"Chrome","title":"GitHub","timestamp":"2026-03-24T10:00:00Z","idle":false,"mouse":{"clicks":2,"movement":true},"switch":false}'
# → { "success": true }
```

---

## Step 5 — Deploy on Render

1. Push your project to a GitHub repository
   - Make sure `.env` is in `.gitignore` (it is by default)

2. Go to [render.com](https://render.com) → **New** → **Web Service**

3. Connect your GitHub repo

4. Configure the service:
   | Field | Value |
   |---|---|
   | **Name** | `tracker-server` (or any name) |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |

5. Add environment variables under **Environment**:
   | Key | Value |
   |---|---|
   | `SUPABASE_URL` | your Supabase project URL |
   | `SUPABASE_KEY` | your Supabase service role key |

   > Do NOT set `PORT` — Render sets it automatically.

6. Click **Create Web Service**

7. Wait for the build to finish (~1-2 minutes)

---

## Step 6 — Get Your Public URL

After deployment, Render gives you a URL like:

```
https://tracker-server-xxxx.onrender.com
```

Your live endpoint is:
```
POST https://tracker-server-xxxx.onrender.com/track
```

Test it:
```bash
curl https://tracker-server-xxxx.onrender.com/health
```

---

## Step 7 — Connect Electron App

In your Electron app's `config.js`, update the API URL:

```js
// config.js
API_URL: process.env.API_URL || "https://tracker-server-xxxx.onrender.com/track",
```

Or set it via environment variable when starting the app:
```bash
API_URL=https://tracker-server-xxxx.onrender.com/track npm start
```

If you used the `store.js` setup from v2, you can also set it dynamically at runtime.

---

## API Reference

### `POST /track`

Accepts both event types in a single endpoint.

**Activity event:**
```json
{
  "type": "activity",
  "user": "emp_john_001",
  "app": "Google Chrome",
  "title": "GitHub",
  "timestamp": "2026-03-24T10:30:00.000Z",
  "idle": false,
  "mouse": { "clicks": 3, "movement": true },
  "switch": false
}
```

**Screenshot event:**
```json
{
  "type": "screenshot",
  "user": "emp_john_001",
  "image_url": "data:image/png;base64,...",
  "timestamp": "2026-03-24T10:45:00.000Z"
}
```

**Response (success):**
```json
{ "success": true }
```

**Response (error):**
```json
{ "success": false, "error": "Missing required fields: type, user, timestamp." }
```

### `GET /health`

Returns server status. Used by Render for health checks.

```json
{ "status": "ok", "timestamp": "2026-03-24T10:30:00.000Z" }
```

---

## Notes

- **Free tier:** Render free services spin down after 15 min of inactivity. First request after spin-down takes ~30s. Upgrade to a paid plan for always-on.
- **Supabase free tier:** 500MB database, 1GB storage — plenty for a prototype.
- **Screenshot size:** Base64 PNG screenshots can be 500KB–2MB each. Supabase Storage handles this fine on the free tier.
