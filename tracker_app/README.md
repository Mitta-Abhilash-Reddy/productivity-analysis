# WorkTracker — Remote Employee Productivity Monitor

An ethical, background Electron.js application for remote employee productivity monitoring.
Runs transparently in the system tray. Tracks app usage and aggregated activity only — no keystrokes, no raw coordinates, no personal data.

---

## Project Structure

```
tracker-app/
├── assets/
│   └── tray-icon.png        ← 16x16 or 32x32 PNG (add your own)
├── main.js                  ← Electron entry point & lifecycle
├── tracker.js               ← Activity polling loop (every 7s)
├── idle.js                  ← Idle detection logic
├── mouse.js                 ← Aggregated mouse activity
├── screenshot.js            ← Screenshot capture (every 10–15 min)
├── api.js                   ← Axios API handler with retry + queue
├── tray.js                  ← System tray icon and context menu
├── config.js                ← All settings in one place
└── package.json
```

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

> **Windows:** If native modules fail, run first:
> ```bash
> npm install --global --production windows-build-tools
> ```

> **Linux:** Install xdotool for active window detection:
> ```bash
> sudo apt install xdotool
> ```

### 2. Add a tray icon

Place a 16×16 or 32×32 PNG at `assets/tray-icon.png`.

### 3. Configure settings

Edit `config.js` to set your `USER_ID`, `API_URL`, and intervals.

### 4. Start the app

```bash
npm start
```

The app runs silently in the background. Look for the tray icon in your system tray.

### 5. Build for distribution

```bash
npm run build          # Current platform
npm run build:win      # Windows .exe
npm run build:mac      # macOS .dmg
npm run build:linux    # Linux AppImage
```

---

## Data Events

### Activity Event (every 7 seconds)
```json
{
  "type": "activity",
  "user": "emp1",
  "app": "Chrome",
  "title": "YouTube - Google Chrome",
  "timestamp": "2026-03-24T10:30:00.000Z",
  "idle": false,
  "mouse": {
    "clicks": 3,
    "movement": true
  },
  "switch": false
}
```

### Screenshot Event (every 10–15 minutes)
```json
{
  "type": "screenshot",
  "user": "emp1",
  "image_url": "data:image/png;base64,iVBORw0KGgoAAAA...",
  "timestamp": "2026-03-24T10:45:00.000Z"
}
```

Both events are sent via `POST http://localhost:5000/track`.

---

## Architecture

```
main.js
 ├── tray.js          ← User control (Start / Pause / Exit)
 ├── tracker.js       ← Heartbeat loop (every 7s)
 │    ├── active-win  ← Gets focused app + window title
 │    ├── idle.js     ← Checks/resets idle state
 │    ├── mouse.js    ← Flushes aggregated click/movement data
 │    └── api.js      ← Sends activity event
 └── screenshot.js    ← Independent loop (random 10–15 min)
      └── api.js      ← Sends screenshot event separately
```

---

## Configuration Reference (`config.js`)

| Key | Default | Description |
|---|---|---|
| `USER_ID` | `"emp1"` | Employee identifier |
| `ACTIVITY_INTERVAL_MS` | `7000` | Activity poll interval (ms) |
| `IDLE_THRESHOLD_MS` | `60000` | Idle detection threshold (ms) |
| `SCREENSHOT_MIN_MS` | `600000` | Min screenshot interval (10 min) |
| `SCREENSHOT_MAX_MS` | `900000` | Max screenshot interval (15 min) |
| `API_URL` | `http://localhost:5000/track` | Backend endpoint |
| `API_TIMEOUT_MS` | `8000` | API request timeout (ms) |
| `MAX_QUEUE_SIZE` | `50` | Max offline queue size |
| `TRAY_ICON_PATH` | `./assets/tray-icon.png` | Path to tray icon |

---

## Privacy & Ethics

- ✅ No keystroke logging
- ✅ No raw mouse coordinates stored or transmitted
- ✅ No clipboard access
- ✅ No microphone or camera
- ✅ System tray always visible — user can pause or exit at any time
- ✅ Screenshots sent directly to backend, not stored locally
- ✅ Only tracks: active app name, window title, click count (aggregated), movement (boolean)

---

## Production Hardening Checklist

- [ ] Set `USER_ID` from auth token / login system
- [ ] Add `Authorization: Bearer <token>` header in `api.js`
- [ ] Load `API_URL` from environment variable (`process.env.API_URL`)
- [ ] Integrate `iohook` for true native click counting
- [ ] Add multi-monitor screenshot support (`screenshot-desktop` supports screen IDs)
- [ ] Add `electron-updater` for silent auto-updates
- [ ] Sign the binary for macOS (Gatekeeper) and Windows (SmartScreen)
- [ ] Fetch config dynamically from backend on startup
