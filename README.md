# SUDHANVA JARVIS — AI HUD System

A futuristic, emotionally-aware AI assistant with a sci-fi Heads-Up Display (HUD) interface. Combines Google Gemini 2.0, a custom TinyTransformer neural network, OS/web automation, a consciousness engine, and a persistent memory system into one cohesive personal AI companion.

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [How to Run](#2-how-to-run)
3. [File-by-File Explanation](#3-file-by-file-explanation)
   - [Root Level Files](#root-level-files)
   - [Frontend — src/](#frontend--src)
   - [Backend — server/](#backend--server)
   - [Python Agent — python_agent/](#python-agent--python_agent)
   - [Personal Model — personal_model/](#personal-model--personal_model)
4. [Data Flow & Request Lifecycle](#4-data-flow--request-lifecycle)
5. [Key Features Deep Dive](#5-key-features-deep-dive)
6. [API Endpoints Reference](#6-api-endpoints-reference)
7. [Port Map](#7-port-map)
8. [Dependencies](#8-dependencies)

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND  (React + Vite  :5173)                │
│   HUDCanvas │ LeftWidgets │ RightPanel │ BottomBar          │
│   VoiceLoop Hook  ←→  IndianFemaleTTS Hook                  │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP REST (JSON)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          BACKEND  (Node.js + Express  :3000)                │
│  /api/ai/ask   /api/execute   /api/voice/command            │
│  /api/memory/* /api/permissions/* /api/consciousness/state  │
│                                                             │
│  ┌─────────────────┐  ┌────────────────┐  ┌─────────────┐  │
│  │ Gemini 2.0 Flash│  │ Consciousness  │  │   Memory    │  │
│  │ (Cloud LLM)     │  │ Engine         │  │  Manager    │  │
│  └─────────────────┘  └────────────────┘  └─────────────┘  │
│  ┌─────────────────┐  ┌────────────────┐  ┌─────────────┐  │
│  │ Command         │  │ Mood Detection │  │ Permission  │  │
│  │ Interpreter     │  │ (Rule-based)   │  │ Guard       │  │
│  └─────────────────┘  └────────────────┘  └─────────────┘  │
└──────────┬──────────────────────┬───────────────────────────┘
           │                      │
           ▼                      ▼
┌─────────────────┐    ┌──────────────────────┐
│  Python Agent   │    │  Personal Model       │
│  Flask  :5050   │    │  Flask + PyTorch:5051 │
│                 │    │                       │
│  OS Engine      │    │  TinyTransformer NN   │
│  Web Engine     │    │  (emotion/command/    │
│  System Calls   │    │   tone prediction)    │
└─────────────────┘    └──────────────────────┘
           │
           ▼
┌─────────────────┐
│ Camera Emotion  │
│ Flask  :5052    │
│ (Optional)      │
│ FER + MediaPipe │
└─────────────────┘
```

---

## 2. How to Run

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | v18+ |
| Python | v3.11+ |
| Google Gemini API Key | [Get here](https://aistudio.google.com/app/apikey) |
| OS | Windows (for automation features) |

### Step-by-Step Setup

#### 1. Install frontend dependencies
```bash
cd "D:\MINI PROJECT\JARVIS"
npm install
```

#### 2. Install backend dependencies
```bash
cd server
npm install
```

#### 3. Install Python agent dependencies
```bash
cd python_agent
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium
```

#### 4. Install personal model dependencies
```bash
cd personal_model
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

#### 5. Configure environment variables
Create `server/.env`:
```
GEMINI_API_KEY=your_gemini_api_key_here
USE_PERSONAL_MODEL=true
USE_LOCAL_LLM=false
```

### Running (4 terminals needed)

| Terminal | Command | Port |
|----------|---------|------|
| 1 — Python Agent | `cd python_agent && .\venv\Scripts\activate && python agent.py` | 5050 |
| 2 — Personal Model | `cd personal_model && .\venv\Scripts\activate && python personal_model_server.py` | 5051 |
| 3 — Backend | `cd server && npm run dev` | 3000 |
| 4 — Frontend | `npm run dev` (from root) | 5173 |

**Easiest method:** Double-click `JARVIS_START.bat` (starts all four services automatically).

To stop everything: Double-click `JARVIS_SHUTDOWN.bat`.

---

## 3. File-by-File Explanation

---

### Root Level Files

#### `index.html`
The single HTML page that bootstraps the React app.
- Loads **Orbitron** and **Rajdhani** fonts from Google Fonts — these give the HUD its sci-fi aesthetic.
- Contains a single `<div id="root">` where React mounts.
- Imports `src/main.jsx` as an ES module.

#### `package.json`
Frontend package manifest.
- **Name**: `sudhanva-hud`
- **Key scripts**:
  - `dev` — starts Vite dev server
  - `dev:server` — starts the Express backend
  - `dev:all` — runs both concurrently using the `concurrently` package
  - `build` — production build via Vite
- **Runtime deps**: `react`, `react-dom`
- **Dev deps**: `vite`, `@vitejs/plugin-react`, `tailwindcss`, `autoprefixer`, `postcss`, `concurrently`

#### `vite.config.js`
Minimal Vite configuration. Registers `@vitejs/plugin-react` which enables JSX transform and React Fast Refresh (hot module replacement during development).

#### `tailwind.config.js`
Configures Tailwind CSS to scan all `.jsx` and `.js` files inside `src/` for class names. Custom colors like `cyan`, `hudBg`, `hudText`, `neon` are defined here to match the HUD theme.

#### `postcss.config.js`
PostCSS plugins: `tailwindcss` and `autoprefixer`. Required for Tailwind to process CSS.

#### `JARVIS_START.bat`
Windows batch script that opens four separate PowerShell terminals and runs the four services (Python agent, personal model server, Node.js backend, frontend Vite server) in the correct directories with virtual environments activated.

#### `JARVIS_SHUTDOWN.bat`
Windows batch script that kills the processes running on ports 5050, 5051, 3000, and 5173 to cleanly shut down all services.

#### `memory.json`
Persistent JSON file that stores the AI's long-term memory. Structure:
```json
{
  "mood": "neutral",
  "topics": { "ai": { "count": 5, "lastMention": "..." } },
  "conversationHistory": [ { "user": "...", "ai": "...", "mood": "...", "topicTags": [...] } ],
  "preferences": {},
  "usageStats": {},
  "feedback": { "totalPositive": 0, "totalNegative": 0, "perTopic": {} }
}
```
Capped at 30 conversation entries. Updated after every interaction.

#### `consciousness.json`
Persistent JSON file for the AI's "emotional state" simulation. Structure:
```json
{
  "thoughts": [],
  "reasoningChains": [],
  "emotionalState": { "calm": 0.5, "happy": 0.3, "stressed": 0.1, "sad": 0.05, "irritated": 0.05 },
  "selfCorrections": [],
  "workingMemory": { "lastThoughts": [], "lastReasoningChains": [] },
  "rewardHistory": []
}
```
Emotional state decays by 8% every 10 minutes and is updated after each interaction.

#### `tasks.json`
JSON file for tracking planned tasks (used by the planner module).

#### `how to run the jarvis.txt`
Plain text instructions for manually running the four services. Lists PowerShell commands to navigate to each directory, activate the virtual environment, and start the process.

#### `project summary (final).md`
Detailed project documentation with architecture diagrams, control flow, ML model explanations, and use cases (superseded by this README).

#### `FINAL_CHECKLIST.md`
Developer checklist used during testing and pre-submission to verify all features are working.

---

### Frontend — `src/`

#### `src/main.jsx`
React application entry point.
- Creates a React root on `<div id="root">`.
- Wraps `<App>` in `<React.StrictMode>`.
- Imports global CSS files: `global.css`, `hologram.css`, `brain.css`.

#### `src/App.jsx`
**Root component** — owns all top-level state and wires together every sub-component.

**State managed:**
| State | Type | Purpose |
|-------|------|---------|
| `isActivated` | boolean | Whether the AI core is online |
| `demoMode` | boolean | Whether to use simulated or live metrics |
| `metricsSource` | string | `'demo'` or `'live'` |
| `isAiThinking` | boolean | Spinner/glow effect while waiting for AI |
| `systemData` | object | CPU, memory, GPU, latency, temperature, uptime |
| `logs` | array | Timestamped log entries shown in BottomBar |
| `voiceState` | object | `{ isListening, isSpeaking }` |

**Key behaviors:**
- **Demo mode**: Randomly fluctuates `systemData` every 2 seconds using `setInterval`.
- **Live mode**: Polls `/api/system/metrics` every 5 seconds.
- **Uptime counter**: Increments `uptimeSeconds` every 1 second.
- **`handleAiCommand(prompt)`**: Sends the prompt to the backend via `askAI()`, handles the returned `{ reply, intent }`, executes intents via `executeCommand()`, and logs everything.
- **Layout**: 3-column CSS grid — LeftWidgets (280px) | HUDCanvas (flex) | RightPanel (320px).

#### `src/api/aiClient.js`
All HTTP communication with the backend. Every function returns a Promise and handles timeouts via `AbortController`.

| Function | Endpoint | Description |
|----------|----------|-------------|
| `askAI(prompt, includeIntent)` | `POST /api/ai/ask` | Main AI chat — returns `{ reply, intent }` |
| `executeCommand(intent)` | `POST /api/execute` | Execute an action intent |
| `getMemorySummary()` | `GET /api/memory/summary` | Get memory stats |
| `clearMemory()` | `POST /api/memory/clear` | Wipe memory |
| `getPersonalModelPrediction(text)` | `POST :5051/personal_model/predict` | Emotion/command prediction |
| `sendFeedback(rating, ...)` | `POST /api/feedback` | Thumbs up/down |
| `fetchSystemMetrics()` | `GET /api/system/metrics` | CPU/memory/GPU stats |
| `getPendingPermissions()` | `GET /api/permissions/pending` | List pending permission requests |
| `approvePermission(id, reason)` | `POST /api/permissions/approve` | Approve an action |
| `denyPermission(id, reason)` | `POST /api/permissions/deny` | Deny an action |

#### `src/components/HUDCanvas.jsx`
Container for the central animated HUD visualization. Composes three sub-components:
- `ParticleField` — renders 30 floating particles
- `HoloRings` — rotating concentric rings that react to listening/speaking states
- `HoloCore` — the central clickable AI core with pulsing glow

Passes `isListening` and `isSpeaking` down so rings/core animate differently during voice activity.

#### `src/components/HoloCore.jsx`
The clickable central "SUDHANVA" orb in the HUD.
- Displays the AI name with a neon glow effect.
- Pulses faster when speaking, glows differently when listening.
- Click triggers `onActivate` (toggles AI online/offline).

#### `src/components/HoloRings.jsx`
Renders multiple concentric animated rings using CSS animations and SVG/div elements.
- Rings rotate at different speeds.
- Color and opacity shift based on `isListening` (cyan glow) and `isSpeaking` (white glow).

#### `src/components/HologramGrid.jsx`
Full-screen background component that renders a subtle holographic grid pattern behind all UI elements. Uses CSS gradients and perspective transforms for a 3D grid effect.

#### `src/components/ParticleField.jsx`
Renders `count` (default 30) floating particles using absolute positioning and CSS animations. Each particle has randomized size, starting position, animation duration, and opacity — creating a floating "space dust" effect.

#### `src/components/TopBar.jsx`
The header bar across the top of the HUD.
- Displays the system name, date/time, and status indicators.
- Static UI element with a neon border bottom.

#### `src/components/StatusBar.jsx`
Displays a condensed status line (system name, mode, version) used in the HUD header region.

#### `src/components/BottomBar.jsx`
Scrolling event log displayed at the bottom of the screen.
- Receives the `logs` array from `App.jsx`.
- Each entry is formatted as `[HH:MM:SS] MESSAGE`.
- Auto-scrolls to the latest entry.
- Uses monospace Orbitron font with dim cyan coloring.

#### `src/components/LeftWidgets.jsx`
Left column panel — system stats and voice mode controls.

**Widgets shown:**
1. **Tasks** — static placeholder list (Backup scheduled, emails, system update)
2. **System** — Disk usage, last login, IP address
3. **Storage** — Memory usage progress bar driven by live `systemData`
4. **Companion Mode** — Toggle that switches the AI from task assistant to emotional companion mode (stored in `localStorage`)
5. **Voice Mode** — Start/stop continuous voice conversation; shows live status (Listening, Speaking, Processing, transcript)

Uses the `useVoiceLoop` hook to manage the entire voice conversation cycle.

#### `src/components/RightPanel.jsx`
Right column panel — AI status, settings, and permission management.

**Sections:**
1. **SUDHANVA AI SYSTEM** — shows mode (IDLE/ONLINE/PROCESSING), OS version, AI model version
2. **Personal Brain** — displays TinyTransformer predictions (emotion, action hint, tone) when available
3. **Current Status** — shows the last AI response text; includes 👍/👎 feedback buttons that call `sendFeedback()`
4. **Network** — static network info display
5. **Now Playing** — static music display
6. **Brain Settings** — renders `BrainSettings` component
7. **Brain Inspector** — renders `BrainInspector` component
8. **Anything Mode** — toggle to enable OS/web automation (stored on backend in memory.json)
9. **Permission Request** — when Anything Mode is on and an action requires approval, a yellow warning card with YES/NO buttons appears. It polls `/api/permissions/pending` every 1 second.

#### `src/components/BrainSettings.jsx`
Settings panel for the AI's behavior configuration. Allows toggling options like response verbosity or companion preferences. Calls the backend to persist settings.

#### `src/components/BrainInspector.jsx`
Developer/debug panel that displays the AI's internal memory state — conversation history, topic frequencies, mood, usage stats, and feedback counts. Fetches from `/api/memory/summary`.

#### `src/components/SidePanel.jsx`
An optional collapsible side panel component that can render supplementary AI info or additional controls.

#### `src/hooks/useIndianFemaleTTS.js`
Custom React hook for Text-to-Speech using the browser's **Web Speech Synthesis API**.

**Voice selection priority:**
1. Named Indian female voices (Microsoft Heera, Neerja, Priya, Swara, Asha)
2. Any `hi-IN` (Hindi India) voice
3. Any `en-IN` (English India) voice
4. First available voice as fallback

**Configuration:** `rate: 0.92` (slightly slow, comforting pace), `pitch: 1.18` (warm female pitch).

**Returns:** `{ isSupported, isSpeaking, speak(text), stop(), setOnStart(cb), setOnEnd(cb) }`

#### `src/hooks/useVoiceInput.js`
Lower-level hook that wraps the browser's **Web Speech Recognition API** (`webkitSpeechRecognition` / `SpeechRecognition`).
- Sets `continuous: true` so it keeps listening.
- Applies sentence smoothing: capitalizes first letter, adds period if missing.
- Exposes `startListening()`, `stopListening()`, `transcript`, `isListening`.

#### `src/hooks/useVoiceLoop.js`
**The most complex hook** — orchestrates the complete continuous voice conversation loop.

**Flow:**
1. User clicks "VOICE MODE: ON" → `startVoiceMode()` → TTS says "Voice activated" → starts listening
2. Speech recognized → detect emotion (if companion mode) → stop listening → send to AI (`onAiCommand`)
3. AI returns `{ reply, intent }` → if intent exists, execute command → speak `reply` via TTS
4. TTS ends → auto-restart listening after 500ms (1500ms in companion mode)
5. If no speech for a while → auto-restart after 2s

**Permission handling during voice:**
- Polls `/api/permissions/pending` every 2 seconds
- If a permission request exists, speaks it aloud: *"Bhai, do you want me to: open Chrome? Please say yes or no."*
- Detects "yes/yeah/haan" or "no/nahi/cancel" in the next utterance
- Calls `approvePermission()` or `denyPermission()` accordingly

**Emotion detection:** Simple keyword matching — checks for "sad", "stressed", "angry", "happy" etc. in transcripts when companion mode is on.

**Voice feedback detection:** Phrases like "that was good", "perfect", "thanks" → sends positive feedback; "that was bad", "wrong" → sends negative feedback.

#### `src/memory/memoryManager.js`
Frontend-side memory helper. Provides simple get/set wrappers around `localStorage` for persisting user preferences (like companion mode setting) on the client side.

#### `src/styles/global.css`
Global CSS variables and base styles:
- Defines custom color CSS variables (`--cyan`, `--hud-bg`, `--neon-glow`, etc.)
- Base body styles: dark background, no scrollbar, full viewport height
- Utility classes: `.neon-text`, `.holo-panel`, `.neon-border`

#### `src/styles/hologram.css`
Hologram-specific animations:
- `@keyframes hologram-flicker` — subtle opacity flicker for sci-fi effect
- `@keyframes ring-rotate` — CSS ring rotation at various speeds
- `.hologram-grid` — the perspective grid background
- `.scan-line` — moving horizontal scan line animation

#### `src/styles/brain.css`
CSS for the Brain Inspector and Brain Settings panels:
- `.brain-panel` — glassmorphism panel style
- `.brain-bar` — animated fill bar for metrics
- `.brain-node` — neural network node visualization dots

---

### Backend — `server/`

#### `server/package.json`
Backend package manifest.
- **Name**: `sudhanva-hud-server`
- **Dependencies**: `express`, `@google/generative-ai`, `cors`, `dotenv`, `node-fetch`
- Start command: `node index.js`

#### `server/.env`
Environment variables (not committed to git):
```
GEMINI_API_KEY=your_key_here
USE_PERSONAL_MODEL=true    # Enable TinyTransformer integration
USE_LOCAL_LLM=false        # Disable local LLaMA/Gemma (optional)
```

#### `server/index.js`
**The main Express API server** — the brain of the backend. Runs on port 3000.

**Initialization:**
- Loads Gemini API with `@google/generative-ai`
- Initializes the `MemoryManager`
- Checks personal model server availability asynchronously
- Sets up CORS and JSON body parsing

**API Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/ai/ask` | Main AI endpoint |
| `POST` | `/api/voice/command` | Voice command with permission guard |
| `POST` | `/api/execute` | Direct intent execution |
| `GET` | `/api/agent/health` | Python agent health check |
| `POST` | `/api/feedback` | Record user feedback (RLHF) |
| `GET` | `/api/memory/summary` | Get memory stats |
| `POST` | `/api/memory/clear` | Clear all memory |
| `GET` | `/api/vision/emotion` | Camera emotion (proxied from :5052) |
| `GET` | `/api/consciousness/state` | Get AI emotional state |
| `GET` | `/api/system/metrics` | System metrics (random demo values) |
| `GET` | `/api/permissions/pending` | List pending permissions |
| `POST` | `/api/permissions/approve` | Approve a permission |
| `POST` | `/api/permissions/deny` | Deny a permission |
| `POST` | `/api/system/anything-mode` | Enable/disable automation mode |
| `GET` | `/api/system/anything-mode` | Get automation mode status |
| `POST` | `/api/system/abort` | Abort all tasks and permissions |

**`POST /api/ai/ask` — Full processing pipeline:**
1. Detect mood + topic tags from prompt text (rule-based)
2. Query camera emotion service at `:5052` (optional, 2s timeout)
3. Query TinyTransformer at `:5051` for emotion/command/tone predictions
4. Determine final mood: `camera > personal model > rule-based`
5. Run Consciousness Engine: generate thought chain + reasoning chain + update emotional state
6. Load memory summary from `memory.json`
7. Build full prompt = memory summary + consciousness state + personal model signals + system personality prompt + user message
8. Try personal model for response generation first
9. Fall back to Gemini 2.0 Flash if personal model unavailable
10. Parse JSON from response to extract `reply` and `intent`
11. Run self-correction check
12. Append conversation to memory
13. Add training sample to personal model asynchronously
14. Return `{ reply, intent }` to frontend

**AI Personality (system prompt):** SUDHANVA is configured as a calm, warm, emotionally supportive companion — never sarcastic, never overwhelming, always gentle. Uses phrases like "I'm listening…", "Tell me more when you're ready."

#### `server/ai/command_interpreter.js`
Converts natural language text into structured action request objects.

**Two parsing paths:**
1. **Gemini intent available**: Uses the structured JSON from Gemini's response → maps to engine + category + params
2. **Rule-based fallback**: Regex matching on text patterns

**Supported actions (via regex):**
- `open Chrome/VSCode/Spotify/Explorer`
- `open Downloads/Documents/Desktop/Pictures/Videos/Music`
- `take a screenshot`
- `increase/decrease volume`, `mute/unmute`
- `play/pause media`, `next/previous track`
- `search Google for X`
- `shutdown/restart/sleep the computer`
- `lock screen`
- `stop everything / abort` (global abort)

**Sensitive actions** (shutdown, restart, sleep, delete) get `isSensitive: true` flag which triggers an extra warning in the permission UI.

**Returns:**
```javascript
{
  engine: 'os' | 'web',
  category: 'app' | 'file' | 'media' | 'system' | 'web',
  action: 'open_app' | 'screenshot' | 'volume_up' | ...,
  params: { app, folder, url, amount, confirm, ... },
  isSensitive: boolean,
  description: "Human-readable description"
}
```

#### `server/consciousness/consciousnessEngine.js`
Simulates internal AI reasoning — stores and updates a persistent "consciousness" state in `consciousness.json`.

**Key functions:**

- **`generateThoughtChain(prompt, memory, personalModelSignals)`**
  Produces up to 5 internal "thoughts" based on keywords in the prompt. Example:
  - "User wants to open something. Checking available actions."
  - "User seems emotional. Need to provide comfort and support."
  - "User's recent mood: stressed. Adjusting tone accordingly."

- **`generateReasoningChain(prompt, memory)`**
  Produces a structured reasoning object with:
  - `goals[]` — what the AI is trying to achieve
  - `reasoning_steps[]` — how it will achieve it
  - `self_corrections[]` — adjustments based on past negative feedback
  - `final_action` — the decided action type

- **`updateEmotionalState(consciousness, detectedMood, intensity=0.3)`**
  Boosts the corresponding emotion (calm/happy/stressed/sad/irritated) and normalizes all to sum to 1.0.

- **`applyEmotionalDecay(consciousness)`**
  Multiplies all emotions by 0.92 every 10 minutes (simulates emotions fading over time).

- **`selfCorrect(reply, memory, feedback)`**
  Checks if negative feedback exceeds positive → returns adjustment suggestion.

- **`applyReward(reward, topicTags, memory)`**
  RLHF-like feedback: +1 → boosts happy/calm; -1 → boosts stressed/sad.

- **`processConsciousness(...)`** — exported, called by server/index.js on every request
- **`getEmotionalState()`** — exported, used by `/api/consciousness/state`
- **`runSelfCorrection()`** — exported, checks for response quality issues
- **`decayEmotions()`** — runs every 10 minutes via `setInterval`

#### `server/consciousness/planner.js`
Task planning module for multi-step actions. Provides `planAndExecute()` and `abortPlan()` functions for sequencing complex tasks.

#### `server/consciousness/taskPlanner.js`
Manages an active task list. Provides `getTaskSummary()` which formats current tasks for inclusion in the AI's memory context.

#### `server/memory/memoryManager.js`
All memory persistence for the backend. Reads/writes `memory.json`.

**Functions:**

| Function | Description |
|----------|-------------|
| `loadMemory()` | Read and parse `memory.json` (creates default if missing) |
| `saveMemory(mem)` | Write memory object to `memory.json` |
| `getDefaultMemory()` | Returns empty memory structure |
| `appendConversation(user, ai, intent, mood, topicTags)` | Add conversation entry; trim to last 30 |
| `setMood(mood)` / `getMood()` | Get/set current mood |
| `get(pathString)` / `set(pathString, value)` | Dot-notation deep access |
| `recordUsage(intent)` | Increment command frequency counter |
| `getMostUsedCommands(n)` | Return top n commands by frequency |
| `recordFeedback(topicTags, isPositive)` | Update feedback counts |
| `getMemorySummary()` | Return formatted summary string for AI prompt |

Memory summary format:
```
USER MEMORY SUMMARY:
- Current mood: neutral
- Frequent topics: ai, entertainment
- Total interactions: 26
- Commands executed: 8
- Positive feedback: 12, Negative feedback: 2
- User frequently uses these commands: open_app chrome, screenshot

Recent conversation context:
User: "open chrome" → AI: "Okay, opening Chrome for you."
```

#### `server/router/commands.js`
Translates intent objects into HTTP calls to the Python agent at `:5050`.

**Functions:**

- **`mapIntentToCommand(intent)`** — normalizes intent field values (e.g. "google chrome" → "chrome", "photos" → "pictures")

- **`executeCommand(intent)`** — calls `POST :5050/execute` with the normalized command

- **`executeOSAction(actionRequest)`** — routes to specific OS endpoints:
  - Screenshot → `POST :5050/os/screenshot`
  - Window actions → `POST :5050/os/window`
  - System actions (volume, shutdown, etc.) → `POST :5050/os/system`
  - App/folder opens → delegates to `executeCommand()`

- **`executeWebAction(actionRequest)`** — calls `POST :5050/web/execute` with the command and params

- **`checkAgentHealth()`** — calls `GET :5050/health`, returns boolean

#### `server/security/permissionGuard.js`
**Safety layer** — every automation action must pass through this before execution.

**Hard-blocked actions** (always denied regardless of mode):
- `format`, `delete_system`, `modify_registry`, `disable_antivirus`, `disable_firewall`, `bypass_security`
- Any action involving `system32` paths

**Permission flow:**
1. Check if Anything Mode is enabled in memory → if not, deny immediately
2. Check hard-blocked list → if blocked, deny
3. Create a pending permission with unique ID and store in `Map<permissionId, pendingPermission>`
4. Poll every 500ms for up to 30 seconds for user approval/denial
5. Timeout → deny by default

**Exported functions:**
- `requestPermission(actionRequest, options)` — async, waits for user decision
- `approvePermission(permissionId, reason)` — called by `/api/permissions/approve`
- `denyPermission(permissionId, reason)` — called by `/api/permissions/deny`
- `getPendingPermissions()` — returns array of pending requests for UI polling
- `clearAllPermissions()` — used by global abort

#### `server/utils/moodDetection.js`
Rule-based text classifier using regex patterns to detect mood and topic tags.

**Moods detected:** `sad`, `angry`, `stressed`, `happy`, `neutral`

**Priority order:** happy > stressed > angry > sad > neutral (last match wins)

**Topics detected:** `ai`, `college`, `relationships`, `health`, `work`, `finance`, `entertainment`

Each topic has ~20 keywords. Example: `entertainment` matches "movie", "music", "gaming", "youtube", "spotify", "streaming", etc.

Returns: `{ mood: string, topicTags: string[] }`

#### `server/utils/emotionalDecay.js`
Standalone utility that applies gradual emotional decay to consciousness state — used periodically to prevent any single emotion from persisting indefinitely.

#### `server/personal_model/personal_interface.js`
JavaScript wrapper for calling the Python personal model server at `:5051`.

**Functions:**
- `initializePersonalModel()` → checks if `:5051/personal_model/health` is reachable
- `isPersonalModelAvailable()` → boolean availability check
- `predictSignals(text)` → `POST :5051/personal_model/predict` → returns `{ emotion, command_hint, tone_pref }`
- `generateWithPersonalModel(memory, prompt)` → attempts to use personal model for full response generation
- `addTrainingSample(sample)` → `POST :5051/personal_model/add_sample` (called after every interaction)

#### `server/local_llm/gemmaRunner.py` and `server/local_llm/llamaRunner.py`
Optional Python scripts for running local LLMs (Gemma, LLaMA). Enabled by setting `USE_LOCAL_LLM=true` in `.env`. Currently disabled by default.

#### `server/local_llm/model_config.json`
Configuration for local LLM models (model path, context length, temperature, etc.).

---

### Python Agent — `python_agent/`

#### `python_agent/agent.py`
**Main Flask server on port 5050.** The OS/web automation executor.

**Safety settings:**
- `pyautogui.PAUSE = 0.5` — 500ms delay between every pyautogui action
- `pyautogui.FAILSAFE = True` — move mouse to top-left corner to emergency stop

**Application paths** configured (Windows):
- Chrome: `C:\Program Files\Google\Chrome\Application\chrome.exe`
- VSCode, Spotify, WhatsApp: user AppData paths
- Steam, Explorer: standard paths

**Folder paths:** Downloads, Documents, Desktop, Pictures, Videos, Music (using `Path.home()`)

**Routes:**

| Route | Method | Description |
|-------|--------|-------------|
| `/health` | GET | Health check — returns `{ status: "online", platform: "Windows" }` |
| `/execute` | POST | Handles both simple string commands and structured intents |
| `/os/mouse` | POST | Mouse control (move, click, double-click, right-click, drag-drop) |
| `/os/keyboard` | POST | Keyboard control (press key, hotkey, type text) |
| `/os/window` | POST | Window management (close, minimize, maximize, switch) |
| `/os/system` | POST | System control (volume, media, lock, shutdown, restart, sleep) |
| `/os/screenshot` | POST | Take screenshot and save to folder |
| `/web/execute` | POST | Web automation (launch/close browser, open URL, click, type, scroll, extract, search Google) |

**`/execute` routing logic:**
- If request has a `command` string → keyword matching (e.g. "chrome" → `os.startfile(chrome_path)`)
- If request has `action` field → `handle_structured_action()` → delegates to typed helper functions

**Key helper functions:**
- `open_application(app_name)` — opens app from predefined paths or tries Windows `start` command
- `open_folder(folder_name)` — opens Windows Explorer at the folder path
- `change_volume(amount)` — presses VolumeUp/VolumeDown keys via pyautogui
- `play_youtube(video_query)` — opens YouTube search URL in default browser
- `shutdown_system(confirm)` / `restart_system(confirm)` — require `confirm=True`; use `shutdown /s /t 10`
- `sleep_system()` — uses `rundll32.exe powrprof.dll,SetSuspendState`
- `take_screenshot()` — pyautogui screenshot saved to Desktop with timestamp filename
- `search_files(query)` — opens Windows Explorer search

#### `python_agent/os_engine.py`
Low-level OS automation functions, imported by `agent.py`.

**Mouse functions:** `move_mouse(x,y,duration)`, `click_mouse(button, clicks, x, y)`, `double_click()`, `right_click()`, `drag_drop(start_x, start_y, end_x, end_y)`

**Keyboard functions:** `press_key(key)`, `hotkey(*keys)`, `type_text(text, interval)`

**Window functions:**
- `close_window()` — Alt+F4
- `minimize_window()` — Win+D
- `maximize_window()` — Alt+Space, then X
- `switch_window()` — Alt+Tab

**Media/System functions:**
- `volume_up(amount)` / `volume_down(amount)` — presses VolumeUp/Down `amount` times
- `volume_mute()` — VolumeMute key
- `media_play_pause()` — PlayPause key
- `media_next()` / `media_previous()` — NextTrack/PrevTrack keys
- `lock_screen()` — Win+L
- `shutdown_system(confirm)` / `restart_system(confirm)` / `sleep_system(confirm)` — all require `confirm=True`
- `take_screenshot(save_folder)` — saves timestamped PNG

#### `python_agent/web_engine.py`
Browser automation using **Playwright** (Chromium).

Uses a singleton global browser/page instance (`_browser`, `_page`, `_playwright`).

**Functions:**
- `launch_browser(headless)` — starts Playwright Chromium
- `close_browser()` — closes browser and stops Playwright
- `open_url(url)` — navigates to URL (auto-adds `https://` if missing)
- `click(selector, timeout)` — clicks CSS/XPath selector
- `type_text(selector, text, timeout)` — fills input field
- `wait(selector, timeout)` — waits for selector or sleeps
- `scroll(amount, to_bottom)` — scrolls page by pixels or to bottom
- `extract(selector, attribute)` — extracts text content or attribute
- `search_google(query)` — opens `google.com/search?q=...`

#### `python_agent/camera_emotion.py`
Optional Flask microservice on port **5052** for real-time facial emotion detection.

**Libraries used (optional):**
- **FER** (`fer` package) with MTCNN — deep learning facial emotion recognition
- **MediaPipe** — face detection (fallback if FER unavailable)
- **OpenCV** (`cv2`) — webcam capture

**Emotion detection flow:**
1. Open webcam with `cv2.VideoCapture(0)`
2. Capture one frame
3. Run FER detector → get per-emotion probability scores
4. Map FER labels to JARVIS labels: `surprise→surprised`, `fear→stressed`, `disgust→irritated`
5. Return dominant emotion + confidence

**Routes:**
- `GET /camera/emotion` — capture frame and return `{ success, emotion, confidence, method }`
- `GET /camera/health` — returns availability of FER and MediaPipe

**Fallback:** Returns `{ emotion: "neutral", confidence: 0.5, method: "fallback" }` if no camera or detector.

#### `python_agent/requirements.txt`
Python dependencies for the automation agent:
```
flask
flask-cors
pyautogui
psutil
playwright
pillow
opencv-python
fer           (optional - camera emotion)
mediapipe     (optional - camera emotion)
```

---

### Personal Model — `personal_model/`

#### `personal_model/config.json`
Neural network configuration:
```json
{
  "vocab_size": 10000,
  "d_model": 128,
  "num_heads": 4,
  "num_layers": 2,
  "ff_dim": 256,
  "dropout": 0.1,
  "max_length": 64,
  "emotion_labels": ["sad", "angry", "stressed", "happy", "neutral"],
  "command_labels": ["open_app", "open_folder", "screenshot", "search_files", "play_youtube", "system_control", "none"],
  "tone_labels": ["very_soft", "soft", "neutral", "slightly_firm"],
  "train_steps_per_update": 20
}
```

#### `personal_model/tiny_transformer.py`
Defines the custom **TinyPersonalModel** — a small Transformer neural network built with PyTorch.

**`SimpleTokenizer`:**
- Whitespace-based word tokenizer with 10,000 vocab limit
- Pre-built vocabulary includes common English words and emotion/command keywords
- `update_vocab(texts)` — expands vocabulary from training data
- `encode(text)` → fixed-length tensor of token IDs (padded/truncated to `max_length=64`)
- `save(path)` / `load(path)` — JSON serialization

**`PositionalEncoding`:**
Standard sinusoidal positional encoding (sin/cos functions) added to token embeddings to give the transformer sequence position information.

**`TinyPersonalModel(nn.Module)`:**
Architecture:
```
Input Text
    │
    ▼
Embedding Layer (vocab_size → d_model=128)
    │
    ▼
Positional Encoding
    │
    ▼
Dropout (0.1)
    │
    ▼
TransformerEncoder (2 layers, 4 heads, ff_dim=256)
    │
    ▼
Mean Pooling (across sequence length)
    │
    ├─► emotion_head  → Linear(128, 5)  → softmax → emotion probabilities
    ├─► command_head  → Linear(128, 7)  → softmax → command probabilities
    └─► tone_head     → Linear(128, 4)  → softmax → tone probabilities
```

Total parameters: ~300,000 (very lightweight, runs on CPU).

GPU support: Automatically uses CUDA if available via `get_device()`.

#### `personal_model/inference.py`
Inference and online learning utilities.

- **`predict_signals(text, config)`** — loads model checkpoint, tokenizes text, runs forward pass, returns:
  ```python
  {
    "emotion": "stressed",       # dominant predicted class
    "command_hint": "open_app",  # dominant predicted class
    "tone_pref": "soft"          # dominant predicted class
  }
  ```
- **`add_training_sample(sample, config)`** — appends new labeled example to `dataset.json`
- **`run_incremental_training(config, num_steps=20)`** — loads recent samples from `dataset.json`, runs `num_steps` gradient descent steps, saves updated checkpoint to `checkpoints/latest.pt`

This implements **online/continual learning** — the model improves with each user interaction.

#### `personal_model/train_step.py`
Training utilities: loss computation (cross-entropy for each of the 3 output heads), gradient step, checkpoint saving.

#### `personal_model/personal_model_server.py`
Flask server on port **5051** exposing the personal model via HTTP.

**Routes:**

| Route | Method | Description |
|-------|--------|-------------|
| `/personal_model/predict` | POST | `{ text }` → `{ success, emotion, command_hint, tone_pref }` |
| `/personal_model/add_sample` | POST | Add labeled training sample + trigger background training |
| `/personal_model/health` | GET | `{ status: "online", device: "cpu"/"cuda" }` |

**Background training:**
When a new sample is added with `trigger_training: true`, a Python `threading.Thread` runs `run_incremental_training()` in the background so the HTTP response isn't blocked.

#### `personal_model/dataset.json`
Growing collection of labeled training examples. Each entry:
```json
{
  "input_text": "I am feeling very stressed about my exam",
  "emotion_label": "stressed",
  "command_label": "none",
  "tone_label": "very_soft"
}
```
New entries are appended after each user interaction where the intent/emotion is known.

#### `personal_model/checkpoints/latest.pt`
PyTorch model checkpoint — saved after each incremental training run. Loaded at inference time.

#### `personal_model/checkpoints/tokenizer.json`
Serialized tokenizer vocabulary — saved/loaded alongside the model checkpoint.

#### `personal_model/requirements.txt`
```
torch>=2.0.0
flask>=2.3.0
flask-cors>=4.0.0
```

---

## 4. Data Flow & Request Lifecycle

### Full flow for "Open Chrome" via voice:

```
1. User says "Open Chrome"
          ↓
2. Web Speech Recognition (browser)
   → transcript = "Open Chrome."
          ↓
3. useVoiceLoop.onresult()
   → detectEmotion("Open Chrome.") → null (neutral)
   → stopListening()
   → calls onAiCommand("Open Chrome.")
          ↓
4. App.jsx handleAiCommand()
   → setIsAiThinking(true)
   → calls askAI("Open Chrome.", true) via aiClient.js
          ↓
5. POST http://localhost:3000/api/ai/ask
   { prompt: "Open Chrome.", includeIntent: true }
          ↓
6. server/index.js processes request:
   a. detectMoodAndTopics("Open Chrome.") → { mood: "neutral", topicTags: [] }
   b. GET :5052/camera/emotion → "neutral" (or skip if offline)
   c. POST :5051/personal_model/predict → { emotion: "neutral", command_hint: "open_app", tone_pref: "neutral" }
   d. processConsciousness() → thoughtChain, reasoningChain, emotionalState
   e. getMemorySummary() → "USER MEMORY SUMMARY: ..."
   f. Build full prompt with all context
   g. Try personal model for response (if available)
   h. Fall back to Gemini 2.0 Flash
   i. Parse JSON response:
      { reply: "Okay, opening Chrome for you.",
        intent: { action: "open_app", target: "chrome", params: {} } }
   j. Memory.recordUsage({ action: "open_app", target: "chrome" })
   k. Memory.appendConversation(prompt, reply, intent, mood, topicTags)
   l. Add training sample to personal model (async)
          ↓
7. Response: { reply: "Okay, opening Chrome for you.", intent: {...} }
          ↓
8. App.jsx receives response
   → addLog("SUDHANVA RESPONSE: Okay, opening...")
   → calls executeCommand({ action: "open_app", target: "chrome" })
          ↓
9. POST http://localhost:3000/api/execute
   { intent: { action: "open_app", target: "chrome" } }
          ↓
10. server/router/commands.js
    → mapIntentToCommand → { action: "open_app", target: "chrome" }
    → POST :5050/execute { action: "open_app", target: "chrome" }
          ↓
11. python_agent/agent.py /execute
    → cmd = "chrome"
    → "chrome" in cmd → os.startfile(chrome.exe)
    → return { status: "opened chrome" }
          ↓
12. Response bubbles back up
    → addLog("PYTHON AGENT SUCCESS: opened chrome")
          ↓
13. useVoiceLoop speaks reply via TTS
    → speak("Okay, opening Chrome for you.")
    → Indian female voice plays
          ↓
14. TTS ends → auto-restart listening
```

---

## 5. Key Features Deep Dive

### Consciousness Engine
Simulates internal reasoning before every AI response:
- **Thought chain** (≤5 thoughts): Intent analysis, emotional assessment, context awareness
- **Reasoning chain**: Goals, steps, self-corrections, final action decision
- **Emotional state**: 5-dimensional vector (calm/happy/stressed/sad/irritated) that evolves over time with 8% decay every 10 minutes

### Continual Learning (RLHF-inspired)
- Every interaction generates a training sample
- Sample is labeled with detected emotion, command type, and tone preference
- Personal model trains on 20 gradient steps in a background thread
- 👍/👎 feedback adjusts consciousness reward history and memory topic weights

### Permission Guard System
- All OS/web automation gated behind user approval
- "Anything Mode" toggle must be on for automation
- Hard-blocked dangerous actions (registry edits, system32, antivirus disable)
- Sensitive actions (shutdown, restart, sleep, delete) shown with ⚠️ warning
- Voice can approve/deny via "yes"/"no" keywords (supports Hindi: "haan"/"nahi")
- 30-second timeout → auto-deny for safety

### Companion Mode
When enabled:
- AI personality shifts to pure emotional support
- Longer delays between speech and listening restart (1.5s vs 0.5s)
- Emotion detection active (sad/angry/stressed/happy keywords)
- Detected emotion shown in UI and sent to backend for personalization

### Voice Architecture
```
Mic → Web Speech API (browser) → transcript text
                                       ↓
                               AI backend API
                                       ↓
                    reply text → Web Speech Synthesis → speakers
                                 (Indian female voice)
```
All voice processing is browser-native — no external STT/TTS API needed.

---

## 6. API Endpoints Reference

All backend endpoints at `http://localhost:3000`:

```
POST /api/ai/ask              Body: { prompt, includeIntent }
POST /api/voice/command       Body: { command }
POST /api/execute             Body: { intent }
GET  /api/agent/health
POST /api/feedback            Body: { rating, lastIntent, lastTopics, lastMood }
GET  /api/memory/summary
POST /api/memory/clear
GET  /api/vision/emotion
GET  /api/consciousness/state
GET  /api/system/metrics
GET  /api/permissions/pending
POST /api/permissions/approve  Body: { permissionId, reason }
POST /api/permissions/deny     Body: { permissionId, reason }
GET  /api/system/anything-mode
POST /api/system/anything-mode Body: { enabled }
POST /api/system/abort
```

Python agent at `http://localhost:5050`:
```
GET  /health
POST /execute
POST /os/mouse
POST /os/keyboard
POST /os/window
POST /os/system
POST /os/screenshot
POST /web/execute
```

Personal model at `http://localhost:5051`:
```
GET  /personal_model/health
POST /personal_model/predict    Body: { text }
POST /personal_model/add_sample Body: { input_text, emotion_label, command_label, tone_label }
```

Camera emotion at `http://localhost:5052`:
```
GET  /camera/health
GET  /camera/emotion
```

---

## 7. Port Map

| Service | Port | Language | File |
|---------|------|----------|------|
| Frontend (Vite) | 5173 | JavaScript/React | `src/main.jsx` |
| Backend (Express) | 3000 | Node.js | `server/index.js` |
| Python Agent | 5050 | Python/Flask | `python_agent/agent.py` |
| Personal Model | 5051 | Python/Flask + PyTorch | `personal_model/personal_model_server.py` |
| Camera Emotion | 5052 | Python/Flask + OpenCV | `python_agent/camera_emotion.py` |

---

## 8. Dependencies

### Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| react | 18.2.0 | UI framework |
| react-dom | 18.2.0 | React DOM rendering |
| vite | 5.0.8 | Build tool + dev server |
| tailwindcss | 3.4.0 | Utility CSS framework |
| autoprefixer | 10.4.16 | CSS vendor prefixing |
| postcss | 8.4.32 | CSS processing |
| concurrently | 8.2.2 | Run multiple npm scripts |

### Backend (Node.js)
| Package | Version | Purpose |
|---------|---------|---------|
| express | 4.18.2 | HTTP server framework |
| @google/generative-ai | 0.21.0 | Gemini API SDK |
| cors | 2.8.5 | Cross-origin resource sharing |
| dotenv | 16.3.1 | Environment variables |
| node-fetch | 3.3.2 | HTTP requests from Node |

### Python Agent
| Package | Purpose |
|---------|---------|
| flask + flask-cors | HTTP microservice |
| pyautogui | Mouse, keyboard, screenshot automation |
| psutil | System metrics (CPU, memory, battery) |
| playwright | Browser automation (Chromium) |
| pillow | Image processing for screenshots |
| opencv-python | Webcam capture (optional) |
| fer | Facial emotion recognition (optional) |
| mediapipe | Face detection (optional) |

### Personal Model
| Package | Purpose |
|---------|---------|
| torch (PyTorch 2.0+) | Neural network training and inference |
| flask + flask-cors | HTTP microservice |

### Browser APIs (no install needed)
| API | Purpose |
|-----|---------|
| Web Speech Recognition | Voice input (STT) |
| Web Speech Synthesis | Voice output (TTS) |
| Canvas 2D | HUD animations |
| localStorage | Companion mode persistence |

---

## Version

`1.0.0` — Built by Sudhanva Patil
#   j a r v i s  
 