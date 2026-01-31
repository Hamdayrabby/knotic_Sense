# Postman API Reference

Base URL: `http://localhost:3000/api`

## Authentication

### 1. Register User
**POST** `/auth/register`

**Body (JSON):**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123"
}
```

**Response:**
Copy the `token` from the response for subsequent requests.

### 2. Login User
**POST** `/auth/login`

**Body (JSON):**
```json
{
  "email": "jane@example.com",
  "password": "password123"
}
```

---

## Jobs (Protected Routes)

> [!IMPORTANT]
> **Authentication Required**
> 1. Copy the `token` string from the **Login** or **Register** response.
> 2. In Postman, go to the **Authorization** tab.
> 3. Select Type: **Bearer Token**.
> 4. Paste your token into the **Token** field.
> 
> *Alternatively, use the Headers tab:*
> * `Authorization`: `Bearer <your_token>`

### 3. Create Job
**POST** `/jobs`

**Body (JSON):**
```json
{
  "company": "Google",
  "position": "Frontend Developer",
  "description": "Building the next generation of web apps.",
  "location": "Hybrid",
  "salary": {
    "min": 120000,
    "max": 180000,
    "currency": "USD"
  },
  "status": "Applied"
}
```

### 4. Get All Jobs
**GET** `/jobs`

**Query Params (Optional):**
- None implemented yet, returns all jobs for the logged-in user.

### 5. Delete Job
**DELETE** `/jobs/<job_id>`

Replace `<job_id>` with the `_id` of the job you want to delete (e.g., `67972f......`).

### 6. Update Job Status
**PATCH** `/jobs/<job_id>/status`

**Body (JSON):**
```json
{
  "status": "Applied"
}
```
*Note: Setting status to "Applied" will automatically set the `appliedDate`.*

### 7. Analyze Job Match (AI)
**POST** `/jobs/<job_id>/analyze`

**Prerequisites:**
- Job must have `jobDescription` field set
- Job must have `resumeStructured` data (upload resume first)

**Success Response (200):**
```json
{
  "success": true,
  "cached": false,
  "data": {
    "score": 75,
    "matchLevel": "Medium",
    "matchingKeywords": ["python", "react", "mongodb"],
    "missingKeywords": ["kubernetes", "aws"],
    "reasoning": "Strong match on core skills but missing cloud experience.",
    "analyzedAt": "2026-01-31T..."
  }
}
```

*Note: Results are cached. Subsequent calls return cached analysis.*

### 8. Upload & Parse Resume (PDF Text Extraction)
**POST** `/resume/test-upload`

**Body (form-data):**
- Key: `resume`
- Type: `File`
- Value: (Select a .pdf file)

**Constraints:**
- Max size: 2MB
- Only PDF files allowed (`application/pdf`)
- Must be text-based PDF (scanned image PDFs will be rejected)

**Success Response (200):**
```json
{
  "success": true,
  "message": "File uploaded and parsed successfully",
  "data": {
    "filename": "resume.pdf",
    "text": "John Doe Software Engineer...",
    "structured": {
      "candidate": { "name": "John Doe", "email": "...", "phone": "...", "links": [] },
      "education": [...],
      "experience": [...],
      "skills": ["JavaScript", "Python", ...],
      "projects": [...]
    }
  }
}
```

**Error Responses:**
- `400` - Invalid file type, file too large, or scanned PDF
- `401` - Missing/invalid authorization token

### 9. Get Resume ATS Score
**POST** `/resume/score`

**Prerequisites:** Upload resume first

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "atsScore": 78,
    "scoreBreakdown": { "completeness": 20, "keywords": 22, "achievements": 18, "clarity": 18 },
    "suggestedJobs": ["ML Engineer", "Data Scientist", "Backend Developer"],
    "strengths": ["Strong Python experience", "ML project portfolio", "Clear quantified achievements"],
    "improvements": ["Add cloud certifications", "Include more leadership examples", "Expand system design experience"],
    "summary": "Strong technical candidate with ML focus..."
  }
}
```

---

## Testing Flow
1.  **Register** a new user.
2.  Copy the `token` from the response.
3.  Set **Bearer Token** in Postman Authorization tab.
4.  **Upload** resume → `POST /resume/test-upload`
5.  **Get ATS Score** → `POST /resume/score`
6.  **Create** job with `jobDescription` field.
7.  **Analyze** job match → `POST /jobs/:id/analyze`
