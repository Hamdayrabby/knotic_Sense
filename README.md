# knotic_Sense

A **personal job search tracker (CRM-style)** built with the **MERN** stack. Track applications in a pipeline, manage multiple resumes, score ATS fit, and use **Gemini** to analyze semantic match between resumes and job descriptions.

**Live:** https://knotic-sense.vercel.app  
**Repository:** https://github.com/Hamdayrabby/knotic_Sense

---

## Table of Contents

- [Why this project](#why-this-project)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture (high level)](#architecture-high-level)
- [Project Structure](#project-structure)
- [Getting Started (Local Development)](#getting-started-local-development)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Install](#install)
  - [Run](#run)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
  - [Frontend (Vercel)](#frontend-vercel)
  - [Backend Hosting](#backend-hosting)
- [Security Notes](#security-notes)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contributing](#contributing)

---

## Why this project

Applying to jobs often becomes a messy process spread across spreadsheets, browser tabs, and multiple resume versions. **knotic_Sense** brings that workflow into one place:

- A structured pipeline to track progress and next steps
- A resume library to maintain tailored versions
- AI assistance (Gemini) to evaluate resume ↔ job alignment and suggest improvements

---

## Key Features

### 1) Job Pipeline (Lifecycle Tracking)
- Create and manage job applications
- Track status/stage (e.g., Saved → Applied → Interview → Offer → Rejected)
- Store job info such as company, title, job link, notes, and job description

### 2) Resume Library
- Save and manage multiple resumes
- Select/attach the best resume to a specific job
- Organize versions for different roles/tech stacks

### 3) ATS-aware Resume Scoring
- Score resume quality for ATS-style parsing and relevance
- Identify missing keywords and weak sections
- Provide actionable improvement suggestions

### 4) Semantic Match Analysis (Gemini)
- Uses Gemini to analyze how well a resume matches a job description semantically
- Produces match insights beyond simple keyword overlap

---

## Tech Stack

**Frontend**
- React + **Vite**
- SPA deployed on **Vercel**

**Backend**
- Node.js + Express

**Database**
- **MongoDB Atlas**
- **Mongoose**

**AI**
- **Gemini API**

---

## Architecture (high level)

1. User interacts with the **Vite/React** UI in the browser
2. UI calls the **Express** API for auth/jobs/resumes operations
3. API persists data in **MongoDB Atlas** via **Mongoose**
4. For scoring/matching, API calls **Gemini** and returns structured results to the UI

---

## Project Structure

Top-level:
- `client/` — Vite/React frontend
- `server/` — backend API code (routes/controllers/services)
- `app.js` — Express app setup (middleware/routes)
- `index.js` — server entry point (bootstrapping/listen)
- `API_REFERENCE.md` — API endpoints and usage
- `STUDY_GUIDE.md` — notes / learning guide

---

## Getting Started (Local Development)

### Prerequisites

- Node.js (LTS recommended)
- npm
- MongoDB Atlas cluster + database user
- Gemini API key

> Your app uses **port 3000** locally.

---

### Environment Variables

Create a `.env` file in the **project root** (adjust if your backend reads env from `server/`).

```env
# App
NODE_ENV=development
PORT=3000

# MongoDB Atlas (Mongoose)
MONGO_URI="mongodb+srv://<username>:<password>@<cluster>/<dbName>?retryWrites=true&w=majority"

# CORS / Client
CLIENT_URL="http://localhost:3000"

# Auth (only if implemented in your server)
JWT_SECRET="replace_with_a_long_random_secret"
JWT_EXPIRES_IN="7d"

# Gemini
GEMINI_API_KEY="your_gemini_api_key"
```

Notes:
- Never commit `.env`.
- If your code uses different names (e.g., `MONGODB_URI`, `GOOGLE_API_KEY`), rename accordingly.

---

### Install

```bash
git clone https://github.com/Hamdayrabby/knotic_Sense.git
cd knotic_Sense
npm install
```

Install client dependencies:

```bash
cd client
npm install
cd ..
```

---

### Run

Because scripts can differ per project, here are the two common ways:

#### Run frontend + backend separately

**Backend (Express):**
```bash
npm run server
```

**Frontend (Vite on port 3000):**
```bash
cd client
npm run dev -- --port 3000
```

Open:
- http://localhost:3000

#### Run both together (if configured)

If you use `concurrently` in the root `package.json`, you might have:

```bash
npm run dev
```

> If you paste your root `package.json` scripts and `client/package.json`, I can replace these with the exact commands your repo supports.

---

## API Documentation

See [`API_REFERENCE.md`](./API_REFERENCE.md) for endpoint details and request/response formats.

---

## Deployment

### Frontend (Vercel)

- The repo includes `vercel.json` for SPA routing.
- Configure environment variables in Vercel if the client needs them (e.g., API URL).

Common Vite settings in Vercel:
- Build Command: `npm run build`
- Output Directory: `dist`

Depending on how you deploy, you may set the Vercel **Root Directory** to `client/`.

### Backend Hosting

Host the Express API on:
- Render / Railway / Fly.io / DigitalOcean / AWS, etc.

Production checklist:
- Use MongoDB Atlas connection string for `MONGO_URI`
- Add `GEMINI_API_KEY` in host environment variables
- Restrict CORS to your deployed frontend domain (Vercel URL)
- Use HTTPS and secure cookies/tokens (if applicable)

---

## Security Notes

- Keep `MONGO_URI`, `JWT_SECRET`, and `GEMINI_API_KEY` out of the frontend.
- Use server-side calls for Gemini (never expose the key in client bundles).
- Validate and sanitize user inputs (especially job descriptions and pasted resume text).
- Add rate limiting to AI endpoints if you expect public usage.

---

## Troubleshooting

### Port 3000 already in use
Close the process using port 3000 or run Vite on a different port:

```bash
npm run dev -- --port 5173
```

### MongoDB Atlas connection issues
- Ensure your IP is allowed in Atlas (Network Access)
- Verify DB username/password
- Confirm the cluster connection string is correct

### CORS errors
Ensure `CLIENT_URL` matches your frontend origin and your Express CORS config allows it.

---

## Roadmap

Potential next steps:
- Follow-up reminders and notifications
- Interview scheduling helpers
- More analytics (pipeline conversion rates, time-in-stage)
- Exportable “application package” per job (resume + notes + match report)
- Better onboarding with sample/demo data

---

## Contributing

1. Fork this repository
2. Create a branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m "feat: add my feature"`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request
