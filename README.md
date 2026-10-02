# CivicPulse - Local Community Information Sharing Platform

A clean, corporate, accessible web platform for sharing, discovering, evaluating, updating, reporting, and resolving local community information and civic problems.

---

## 🛠️ Technology Stack (Strict Constraints Adherence)

- **Frontend**: **Pure HTML5, CSS3, and Plain Vanilla JavaScript only.**
  - **Zero TypeScript** in the frontend.
  - **Zero frontend frameworks** (No React, Vue, Angular, Svelte).
  - **Zero external UI libraries** (No Tailwind, Bootstrap, shadcn, or third-party bundle components).
- **Backend**: **Node.js + Express**
  - Serves static assets from `public/`.
  - Exposes secure REST endpoints (`/api/moderate`, `/api/classify`, `/api/config`).
  - **Keeps all LLM API keys strictly on the server side** in `.env`.

---

## 🔒 Secure LLM Moderation & Mock Mode Setup

The publish workflow connects to an LLM moderation endpoint to detect scams, fraudulent financial solicitations, harassment, and severe misinformation before broad community distribution.

### 1. Backend Security Architecture
- Frontend sends: `POST /api/moderate` with `{ title, description, category, channel }`.
- Backend securely reads `process.env.GEMINI_API_KEY` or `process.env.OPENAI_API_KEY`.
- **Frontend code never contains or handles API keys.**

### 2. Clearly Labeled Mock Moderation Mode
If no `GEMINI_API_KEY` is provided in `.env`:
- The backend automatically runs a sophisticated local safety heuristic engine.
- Responses are clearly labeled with:
  ```json
  {
    "score": "SAFE" | "NEEDS_REVIEW" | "BLOCKED",
    "confidence": 0.96,
    "flags": ["FINANCIAL_SOLICITATION"],
    "reasons": ["Submission mentions direct financial transfer via personal payment handles."],
    "recommendation": "Post flagged for civic moderator verification.",
    "isMock": true,
    "engine": "Mock Moderation Mode (Safe Local Fallback)"
  }
  ```
- The frontend UI displays the active moderation engine badge in real time.

---

## 🔄 Complete Information Lifecycle

The platform implements the full 6-stage lifecycle:

```
1. CREATE INFORMATION
   Author shares notice (Title, Description, Category, Channel, Location, optional Deadline & Images)
          │
          ▼
2. AI CLASSIFICATION & SAFETY CHECK
   Auto-suggests category, channel (#roads, #blood-donation, #internships), tags & performs moderation audit
          │
          ▼
3. COMMUNITY DISCOVERY
   Structured Discord-inspired 3-column channel layout with search, distance sorting, & status filters
          │
          ▼
4. COMMUNITY VALIDATION
   Citizens mark 👍 Useful or 👎 Incorrect with live confidence percentages & comments
          │
          ▼
5. UPDATES & REPORTING
   Incremental updates maintain an audit trail; reported posts move to UNDER REVIEW
          │
          ▼
6. RESOLVE OR EXPIRE
   Civic problems are marked RESOLVED with solution notes; time-sensitive posts transition to EXPIRED
```

---

## 🚀 Quick Start Guide

### 1. Install Server Dependencies
```bash
npm install
```

### 2. (Optional) Configure Backend LLM Key
Create a `.env` file in the project root:
```bash
cp .env.example .env
```
Add your key if available (leave blank to run in Mock Moderation Mode):
```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Start the Server
```bash
npm start
```

### 4. Open in Browser
Navigate to **`http://localhost:3000`**

---

## 📱 Features Summary

1. **Discord-Inspired 3-Column Layout**:
   - **Left Sidebar**: Configurable Categories (General, Education, Medical, Local Issues, Lost & Found, Emergency, Events) & Channels with post counters.
   - **Center Feed**: Structured Information Cards, Search, Multi-Criteria Filters (Status, Sort, Deadlines, Location).
   - **Right Sidebar ("Community Pulse")**: Live Status Breakdown (Active, Pending, Resolved, Under Review), Trending topics, Expiring Soon countdowns, and Nearby posts.
2. **Plain JavaScript State & Storage**:
   - Reactive state store with automatic `localStorage` synchronization.
   - Background deadline expiration watcher.
3. **Themes**:
   - Clean light and deep charcoal dark themes with persistent toggle.
4. **Role Switcher**:
   - Toggle between **Resident** (Rahul Sharma) and **Moderator** (Priya Desai) to test the complete civic workflow.
5. **Interactive Demo Tour**:
   - Built-in 6-step walkthrough for presentation demonstrations.
