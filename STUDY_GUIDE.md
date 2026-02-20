# Knotic Sense - Deep Dive Study Guide

> 🎯 **Purpose**: Interview preparation document. Understand the architecture, design decisions, and technical depth of this project.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Authentication Flow](#authentication-flow)
4. [Resume Processing Pipeline](#resume-processing-pipeline)
5. [AI Integration & Caching](#ai-integration--caching)
6. [Key Design Decisions](#key-design-decisions)
7. [Common Interview Questions](#common-interview-questions)

---

## Project Overview

**Knotic Sense** is a job application tracker with AI-powered resume analysis. It helps users:
- Track job applications through various stages (Interested → Applied → Interviewing → Offer/Rejected)
- Upload and parse resumes from PDF to structured JSON
- Analyze resume-to-job-description match using Google's Gemini AI
- Get actionable feedback to improve ATS (Applicant Tracking System) compatibility

### Tech Stack
| Layer | Technology |
|-------|------------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB (Mongoose ODM) |
| Authentication | JWT (JSON Web Tokens) |
| AI | Google Gemini 2.5 Flash |
| File Upload | Multer (memory storage) |
| PDF Parsing | pdf-parse library |
| Deployment | Render (Backend) + Vercel (Frontend) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (Frontend)                       │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP Requests
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     EXPRESS.JS SERVER                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    MIDDLEWARE LAYER                      ││
│  │  • CORS (Cross-Origin Resource Sharing)                 ││
│  │  • JSON Body Parser                                      ││
│  │  • Authentication (JWT verification)                     ││
│  │  • File Upload (Multer)                                  ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │                     ROUTES LAYER                         ││
│  │  /api/auth    → authRoutes.js                           ││
│  │  /api/jobs    → jobRoutes.js                            ││
│  │  /api/resume  → resumeRoutes.js                         ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │                   CONTROLLERS LAYER                      ││
│  │  AuthController.js  → login, register, profile          ││
│  │  JobController.js   → CRUD, status updates, AI analysis ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │                     UTILS LAYER                          ││
│  │  pdfParser.js     → PDF text extraction                 ││
│  │  resumeParser.js  → AI-powered JSON structuring         ││
│  │  resumeScorer.js  → General ATS quality assessment      ││
│  │  jobMatcher.js    → Resume-to-JD matching with scoring  ││
│  │  contentHash.js   → MD5 hashing for cache invalidation  ││
│  └─────────────────────────────────────────────────────────┘│
└────────────────────────────┬────────────────────────────────┘
                             │ Mongoose ODM
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                        MONGODB                               │
│  Collections: users, jobs                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

### Registration
```
POST /api/auth/register
Body: { name, email, password }
```

1. Validate email format and password length (6+ chars)
2. Check if email already exists
3. Hash password using bcrypt (cost factor 10)
4. Create user document in MongoDB
5. Generate JWT token (7-day expiry)
6. Return token + user data (password excluded)

### Login
```
POST /api/auth/login
Body: { email, password }
```

1. Find user by email
2. Compare password with bcrypt
3. Generate JWT token
4. Return token

### Protected Routes
- All `/api/jobs` and `/api/resume` routes require authentication
- `authenticate` middleware extracts and verifies JWT from `Authorization: Bearer <token>`
- Decoded user ID attached to `req.user.id`

**Interview Talking Point**: "I implemented stateless authentication using JWTs. The token contains the user's ID and role, making it self-contained. This allows horizontal scaling without session storage."

---

## Resume Processing Pipeline

This is a **3-stage pipeline** with clear separation of concerns:

### Stage 1: File Upload (Multer)
```javascript
// Middleware: resumeUpload.js
const storage = multer.memoryStorage(); // No disk writes
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb({ code: 'LIMIT_FILE_TYPES', message: 'Only PDFs allowed' }, false);
    }
};
```

**Why memory storage?**
- We immediately extract text and discard the binary
- No cleanup needed for temp files
- Faster processing (no disk I/O)
- 2MB limit protects against buffer overflow attacks

### Stage 2: Text Extraction (pdf-parse)
```javascript
// Utils: pdfParser.js
const extractTextFromPDF = async (buffer) => {
    const data = await pdf(buffer);
    if (!data.text || data.text.trim().length < 50) {
        throw new Error('SCANNED_PDF'); // Can't extract text from images
    }
    return data.text;
};
```

**Error Handling**: Detects scanned PDFs (image-based) that can't be parsed.

### Stage 3: AI Structuring (Gemini)
```javascript
// Utils: resumeParser.js
const normalizeResume = async (rawText) => {
    // Send to Gemini with strict JSON schema
    // Returns structured object: { candidate, education, experience, skills, projects }
};
```

**Interview Talking Point**: "I used prompt engineering to enforce a strict JSON schema. The AI extracts entities like skills, experience, and education, then categorizes them appropriately. For example, it distinguishes between paid work experience and student club activities."

---

## AI Integration & Caching

### Two Types of AI Analysis

| Feature | Resume Score | Job Match |
|---------|--------------|-----------|
| Endpoint | `POST /api/resume/score` | `POST /api/jobs/:id/analyze` |
| Input | Resume only | Resume + Job Description |
| Output | General ATS quality (0-100) | Match score with detailed breakdown |
| Use Case | "Is my resume good?" | "Do I match this specific job?" |

### Job Matching Scoring Rubric
```
Total Score: 100 points
├── Keyword Matching:     45% (exact matches between JD and resume)
├── Skills Match:         25% (hard skills and tools)
├── Experience Alignment: 15% (years and role relevance)
├── Education/Certs:      10% (degree and certifications)
└── Format Quality:        5% (completeness and structure)
```

### Caching Strategy (Cost Optimization)

**Problem**: Every AI call costs API credits.

**Solution**: Content-based cache invalidation using MD5 hashes.

```javascript
// Generate hashes of current content
const currentJdHash = generateContentHash(job.jobDescription);
const currentResumeHash = generateContentHash(user.resumeStructured);

// Compare with cached hashes
if (cachedJdHash === currentJdHash && cachedResumeHash === currentResumeHash) {
    return cachedResult; // No API call needed!
}
```

**Why MD5?**
- Fast (< 1ms for typical content)
- 8-character truncation gives 4 billion unique values
- We're not using it for security, just change detection
- Node's built-in `crypto` module (no dependencies)

**Interview Talking Point**: "I implemented content-aware caching to reduce API costs. The system generates MD5 hashes of both the job description and resume. On subsequent analysis requests, it compares hashes to detect changes. If nothing changed, we return the cached result instantly."

---

## Key Design Decisions

### 1. Status History with $push
```javascript
// Instead of overwriting status, we maintain history
const update = {
    $set: { status: newStatus },
    $push: { statusHistory: { status: newStatus, changedAt: Date.now() } }
};
```
**Why?** Users can track their job application journey over time.

### 2. Mongoose Pre-save Hooks
```javascript
userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});
```
**Why?** Ensures passwords are always hashed, even if saved from different code paths.

### 3. Lazy Imports in Controllers
```javascript
const analyzeJob = async (req, res) => {
    const { matchResumeToJob } = require('../Utils/jobMatcher'); // Imported inside function
    // ...
};
```
**Why?** These AI utilities are only needed for specific routes. Lazy loading reduces startup time and memory for requests that don't need them.

### 4. Error Categories
```javascript
if (error.message.startsWith('MATCHER_')) { ... }
if (error.message.startsWith('SCORER_')) { ... }
if (error.message.startsWith('LLM_')) { ... }
```
**Why?** Error prefixes allow specific handling for different failure modes (API errors vs parse errors vs config errors).

---

## Common Interview Questions

### Q: "How do you handle file uploads securely?"
**A**: I use Multer with memory storage, a strict PDF-only MIME type filter, and a 2MB size limit. Memory storage means we never write untrusted data to disk. The size limit prevents denial-of-service through large file uploads.

### Q: "Explain your AI caching strategy."
**A**: I implemented content-aware caching using MD5 hashes. When a user requests analysis, I hash both the job description and resume, then compare to cached hashes. If they match, I return the cached result without calling the API. This can reduce API costs by 80%+ for repeat requests.

### Q: "Why MongoDB over SQL for this project?"
**A**: The schema is document-oriented. Users have embedded resumes, jobs have embedded AI analysis results. These nested structures map naturally to BSON documents. Also, the resume schema can vary (some have certifications, some don't) which fits MongoDB's flexible schema model.

### Q: "How would you scale this?"
**A**: 
1. **Horizontal scaling**: JWT auth is stateless, so any server can handle any request
2. **Read replicas**: MongoDB replica sets for read-heavy job listing queries
3. **Queue for AI**: Move AI calls to a background job queue (Bull/Redis) to handle traffic spikes
4. **CDN**: Serve static assets from a CDN

### Q: "What's your error handling strategy?"
**A**: I use prefixed error messages (LLM_, MATCHER_, SCORER_) to categorize errors. Controllers check these prefixes and return appropriate HTTP status codes. Development mode includes error details; production hides them to prevent information leakage.

### Q: "Walk me through a request lifecycle."
**A**: 
1. Request hits Express
2. CORS middleware allows/blocks origin
3. JSON parser extracts body
4. Route matcher finds handler
5. Auth middleware verifies JWT, attaches user to request
6. Controller executes business logic
7. Mongoose queries MongoDB
8. Response sent with appropriate status code

---

## Code Snippets to Know

### JWT Generation
```javascript
jwt.sign({ id: this._id, email: this.email, role: this.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
```

### Password Hashing
```javascript
const salt = await bcrypt.genSalt(10);
this.password = await bcrypt.hash(this.password, salt);
```

### Content Hash for Caching
```javascript
crypto.createHash('md5').update(JSON.stringify(content)).digest('hex').substring(0, 8);
```

### MongoDB Atomic Update with History
```javascript
Job.findByIdAndUpdate(id, {
    $set: { status: newStatus },
    $push: { statusHistory: { status: newStatus, changedAt: Date.now() } }
}, { new: true });
```

---

## Frontend Architecture (React)

### Tech Stack
| Layer | Technology |
|-------|------------|
| Build Tool | Vite |
| Framework | React 18 |
| Styling | TailwindCSS v4 |
| Routing | React Router DOM v6 |
| HTTP Client | Axios |
| Icons | Lucide React |

### Project Structure
```
client/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.jsx   # Auth guard
│   │   └── layout/
│   │       ├── MainLayout.jsx       # Sidebar + content
│   │       ├── Sidebar.jsx          # Navigation
│   │       └── LoadingSpinner.jsx   # Auth loading state
│   ├── context/
│   │   └── AuthContext.jsx          # Global auth state
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── Dashboard.jsx
│   ├── services/
│   │   └── api.js                   # Axios + interceptors
│   ├── App.jsx                      # Router setup
│   └── index.css                    # Tailwind + theme
```

---

## AuthContext (Global State)

### The Pattern
```jsx
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // CRITICAL for flicker prevention

  // Restore session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('knotic_token');
    const savedUser = localStorage.getItem('knotic_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // ... login, register, logout functions
};
```

### Why `loading` State Matters
Without it, users see the Login page for a split second on refresh before the `useEffect` restores their session. This is called **"auth flicker"**.

**Interview Talking Point**: "I use a loading boolean in AuthContext. While it's true, I show a spinner instead of the Login page. This prevents the UX issue where authenticated users briefly see the login screen on page refresh."

---

## Axios Interceptors

### Request Interceptor (Attach Token)
```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('knotic_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Response Interceptor (Auto-Logout on 401)
```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('knotic_token');
      localStorage.removeItem('knotic_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**Interview Talking Point**: "I use Axios interceptors to handle authentication globally. The request interceptor attaches the JWT to every request. The response interceptor catches 401 errors—which mean the token expired—and automatically logs the user out. This prevents stale tokens from causing confusing errors."

---

## Protected Routes

```jsx
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;      // Prevents flicker
  if (!user) return <Navigate to="/login" />;  // Redirect unauthenticated

  return children;
};
```

**Usage in Router:**
```jsx
<Route
  element={
    <ProtectedRoute>
      <MainLayout />
    </ProtectedRoute>
  }
>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>
```

---

## Design System (Knotic Theme)

### TailwindCSS v4 Custom Colors
```css
@theme {
  --color-knotic-bg: #0f172a;      /* Slate 900 */
  --color-knotic-card: #1e293b;    /* Slate 800 */
  --color-knotic-accent: #6366f1;  /* Indigo 500 */
  --color-knotic-hover: #4f46e5;   /* Indigo 600 */
  --color-knotic-text: #f1f5f9;    /* Slate 100 */
  --color-knotic-muted: #94a3b8;   /* Slate 400 */
  --color-knotic-border: #334155;  /* Slate 700 */
  --color-knotic-error: #ef4444;   /* Red 500 */
  --color-knotic-success: #22c55e; /* Green 500 */
}
```

**Design Philosophy**: Dark, professional CRM aesthetic. Slate base with Indigo accents creates a modern, premium feel appropriate for job tracking.

---

## Frontend Interview Questions

### Q: "Why React Context over Redux?"
**A**: For auth state, Context is sufficient. Redux adds complexity that's only justified for large apps with many interconnected state slices. Our auth state is simple: user, token, loading. Context + useReducer would scale if needed.

### Q: "How do you handle token expiration?"
**A**: I use an Axios response interceptor. When any API call returns 401, the interceptor clears localStorage and redirects to login. This handles expiration globally without checking in every component.

### Q: "Explain the auth flicker prevention."
**A**: On page load, there's a race condition: React renders before `useEffect` restores the token from localStorage. Without handling this, users see the Login page briefly. I solve it with a `loading` boolean—while true, I show a spinner, not the Login page.

### Q: "Why Vite over Create React App?"
**A**: Vite uses native ES modules during development, making hot reload nearly instant. CRA bundles everything with Webpack, which is slower. Vite's build times are also 10-100x faster for production.

### Q: "How do you persist auth across refreshes?"
**A**: I store the JWT and user object in localStorage. On app mount, `AuthContext`'s `useEffect` checks for saved values and restores them to state. The API interceptor reads from localStorage for every request.

---

## Job Dashboard (CRUD UI)

### Table Design
```
┌──────────────────────────────────────────────────────────────┐
│ Company & Role  │ Applied    │ Status       │ Score │ Actions │
├──────────────────────────────────────────────────────────────┤
│ Google          │ Feb 2, 2026│ [🔵 Applied] │ [85%] │ 🗑     │
│ Frontend Dev    │            │              │       │        │
├──────────────────────────────────────────────────────────────┤
│ Meta            │ Jan 15     │ [🟡 Interview]│ [72%] │ 🗑     │
│ React Engineer  │            │              │       │        │
└──────────────────────────────────────────────────────────────┘
```

### Status Badges with Colors
```javascript
const statusConfig = {
  Interested: { bg: 'blue', dot: 'blue' },
  Applied: { bg: 'indigo', dot: 'indigo' },
  Interviewing: { bg: 'amber', dot: 'amber' },
  Offer: { bg: 'emerald', dot: 'emerald' },
  Rejected: { bg: 'red', dot: 'red' },
};
```

### Optimistic UI Pattern
```javascript
// 1. Save previous state
const previousJobs = [...jobs];

// 2. Update UI immediately
setJobs(prev => prev.map(job =>
  job._id === jobId ? { ...job, status: newStatus } : job
));

// 3. Make API call
try {
  await api.patch(`/jobs/${jobId}/status`, { status: newStatus });
} catch (error) {
  // 4. Revert on failure
  setJobs(previousJobs);
}
```

**Interview Talking Point**: "I implemented optimistic updates for status changes. Also, I realized that 'Success Rate' is misleading if calculated against *all* applications. I updated the logic to be `Offers / (Offers + Rejections)` to show the true conversion rate of *concluded* applications."

### Empty State UX
```jsx
<EmptyState onAddJob={() => setIsModalOpen(true)}>
  <BriefcaseIcon />
  <h3>No jobs tracked yet</h3>
  <p>Start by adding jobs you're interested in...</p>
  <Button>Add Your First Job</Button>
</EmptyState>
```

**Why?** A blank table looks broken. The empty state guides new users to take action.

---

## Job Dashboard Interview Questions

### Q: "What is optimistic UI and why use it?"
**A**: Optimistic UI updates the interface immediately before the server confirms the change. It makes apps feel instant. I use it for status updates—change the badge color right away, then revert only if the API fails.

### Q: "How do you handle the delete confirmation?"
**A**: I use a confirmation dialog with a "double-click" pattern. First click opens the dialog, second click (on "Delete" button) actually deletes. This prevents accidental data loss—critical for a CRM where users track important job applications.

### Q: "Explain your client-side filtering and sorting."
**A**: I use `useMemo` to compute filtered/sorted results only when dependencies change. The filter checks if company or position includes the search query. Sorting uses a comparator function that handles date, score, or status order.

---

## Bugs & Lessons Learned

This section documents real bugs encountered during development and how they were fixed.

### Bug 1: CORS Blocking Frontend Requests
**Symptom**: `Access to XMLHttpRequest blocked by CORS policy`

**Root Cause**: Vite dev server uses dynamic ports (5173, 5174, 5175...) when the default is busy. The backend only allowed `localhost:5173`.

**Fix**: Allow any localhost origin dynamically:
```javascript
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Postman, curl
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true); // Any localhost port
    }
    if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) {
      return callback(null, true); // Production
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
```

**Interview Talking Point**: "I learned that Vite picks fallback ports when the default is busy. Rather than hardcoding ports, I wrote a dynamic CORS check that allows any localhost in development."

---

### Bug 2: Response Data Structure Mismatch
**Symptom**: Login succeeded but user was immediately redirected back to login. `localStorage` contained `"undefined"`.

**Root Cause**: Backend returns nested response:
```json
{ "success": true, "data": { "token": "...", "user": {...} } }
```
Frontend was reading `response.data.token` instead of `response.data.data.token`.

**Fix**: Access the nested `data` property:
```javascript
// WRONG
const { token, user } = response.data;

// CORRECT
const { token, user } = response.data.data;
```

**Interview Talking Point**: "This is a classic API contract mismatch. The fix was simple, but debugging required checking localStorage to see that 'undefined' was being stored. Lesson: always verify the actual response shape with console.log or network tab."

---

### Bug 3: 401 Interceptor Triggering on Auth Pages
**Symptom**: Login failures caused the page to blank/reload instead of showing error message.

**Root Cause**: Axios response interceptor redirected to `/login` on ANY 401, including failed login attempts.

**Fix**: Exclude auth endpoints and auth pages from auto-redirect:
```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = error.config?.url?.includes('/auth/');
    const isOnAuthPage = ['/login', '/register'].includes(window.location.pathname);
    
    // Only auto-logout for 401 on protected routes
    if (error.response?.status === 401 && !isAuthEndpoint && !isOnAuthPage) {
      localStorage.removeItem('knotic_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**Interview Talking Point**: "The interceptor was too aggressive. A 401 on `/auth/login` means 'wrong password,' not 'expired token.' I added conditions to only auto-logout when it makes semantic sense."

---

### Bug 4: 404 on Root Deployment URL
**Symptom**: Visiting `https://backend.onrender.com/` returned `{"success":false,"message":"Route / not found"}`.

**Root Cause**: I only defined routes for `/api/...`. Express had no handler for the root path `/`.

**Fix**: Added a simple health check route:
```javascript
app.get('/', (req, res) => res.json({ message: 'API Running' }));
```

**Lesson**: Always have a root route verify deployment status immediately.

---

### Bug 5: SPA Routing 404 on Refresh (Vercel)
**Symptom**: App works fine on load, but refreshing `/dashboard` or `/login` returns 404.

**Root Cause**: Vercel (and other static hosts) look for a file named `dashboard.html` or `login.html`. Since it's a Single Page App (SPA), only `index.html` exists.

**Fix**: Created `vercel.json` to rewrite all routes to `index.html`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

### Bug 6: Mixed Content & Blocking
**Symptom**: `ERR_BLOCKED_BY_CLIENT` when frontend tries to fetch `localhost` API.

**Root Cause**: The deployed frontend (HTTPS) cannot request the local backend (HTTP) due to mixed content security policies. Also, the frontend simply didn't know the production backend URL.

**Fix**: Used Environment Variables (`VITE_API_URL` on Vercel) to point to the production backend.

---

## Feature Details: Resume Library & CV Selection

### Problem
Originally, users could only store a single parsed resume in the `User` schema (`resumeStructured`). If they applied to a new job with a tailored CV, they lost their old AI insights and structural data. 

### Solution
1. **Database Update**: Migrated from a single object to a `resumes` array in MongoDB:
   ```javascript
   resumes: [{
       fileName: String,
       text: String,
       structured: Object,
       uploadedAt: { type: Date, default: Date.now }
   }]
   ```
2. **Backward Compatibility**: To prevent breaking old features immediately, the route updates *both* the new array and the old `resumeStructured` legacy field. Old CVs (uploaded before the array existed) are dynamically injected into the frontend history list as "Previous Upload" to ensure users can still view or delete them.
3. **Job Details Integration**: Instead of the AI automatically matching against the default profile resume, the Job Details page now includes a dropdown of the user's `resumeHistory`. This passes the specific `resumeId` to the `POST /api/jobs/:id/analyze` backend endpoint. The backend fetches that exact CV from the user's history array, parses it, and saves the AI results.

**Interview Talking Point**: "When adding the multiple-resume feature, my biggest priority was backward compatibility. I didn't want to break the existing dashboard for current users, so I designed a hybrid approach where the active CV is still accessible via the root document, but all historical CVs are preserved in an array. I also dynamically polyfilled old single-CV uploads into the history array on the frontend so users wouldn't lose access to them."

---

## Debugging Workflow

When frontend-backend integration fails, follow this checklist:

1. **Check Network Tab**: Is the request even being sent? What's the response?
2. **Check Console**: Any CORS errors? Any JavaScript exceptions?
3. **Check localStorage**: Is data being stored correctly?
4. **Test API Directly**: Use `fetch()` in console or Postman to isolate frontend vs backend issues.
5. **Log Response Shape**: `console.log(response.data)` before destructuring.

---

Good luck with your interview! 🚀
