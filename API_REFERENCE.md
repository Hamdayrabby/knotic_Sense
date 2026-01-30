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

### 7. Upload Resume (Test Endpoint)
**POST** `/resume/test-upload`

**Body (form-data):**
- Key: `resume`
- Type: `File`
- Value: (Select a .pdf file)

*Note: Max size 2MB. Only PDF allowed.*

---

## Testing Flow
1.  **Register** a new user.
2.  Copy the `token` from the response.
3.  In Postman, go to the **Authorization** tab for your Job requests, select **Bearer Token**, and paste the token.
4.  **Create** a few jobs.
5.  **Get** the list of jobs to verify they are saved.
6.  **Update** a job status to 'Applied'.
7.  **Upload** a resume PDF to the test endpoint.
8.  **Delete** a job using its ID.
