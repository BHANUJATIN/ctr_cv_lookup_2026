# CV Lookup Server

Node.js/Express server for managing CV submissions with Supabase PostgreSQL database.

## Features

- Check CV eligibility with 60-day cooldown period
- Track English and German CV submissions separately
- Request queuing to handle concurrent requests
- Company identification by domain or LinkedIn URL
- Seed initial companies in bulk
- Delete companies and their submission history
- RESTful API endpoints

## Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to your project settings and get:
   - Project URL
   - Anon/Public API key

### 3. Set Up Database

1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of `database/schema.sql`
3. Run the SQL script to create tables and indexes

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env`
2. Fill in your Supabase credentials:

```env
PORT=3001
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here
CLIENT_URL=http://localhost:3000
```

### 5. Run the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Check CV Eligibility

Check if a CV can be generated for a company.

```http
POST /api/cv/check
Content-Type: application/json

{
  "domain": "example.com",           // Optional (provide domain OR linkedinUrl)
  "linkedinUrl": "https://...",      // Optional (provide domain OR linkedinUrl)
  "cvType": "english",               // Required: "english" or "german"
  "companyName": "Example Corp"      // Optional
}
```

Response:
```json
{
  "canGenerateCV": true,
  "company": {
    "id": "uuid",
    "name": "Example Corp",
    "domain": "example.com",
    "linkedinUrl": null
  },
  "cvType": "english",
  "daysRemaining": 0,
  "message": "No previous submission found. CV can be generated."
}
```

### Save CV Submission

Record a CV submission for a company. Updates the submission date to today.

```http
POST /api/cv/submit
Content-Type: application/json

{
  "domain": "example.com",           // Optional (provide domain OR linkedinUrl)
  "linkedinUrl": "https://...",      // Optional (provide domain OR linkedinUrl)
  "cvType": "english",               // Required: "english" or "german"
  "companyName": "Example Corp",     // Optional
  "jobTitle": "Software Engineer"    // Optional
}
```

Response:
```json
{
  "success": true,
  "message": "CV submission recorded successfully",
  "submission": {
    "id": "uuid",
    "companyId": "uuid",
    "cvType": "english",
    "submittedAt": "2026-02-06T...",
    "jobTitle": "Software Engineer"
  },
  "company": {
    "id": "uuid",
    "name": "Example Corp",
    "domain": "example.com",
    "linkedinUrl": null
  }
}
```

### Get All Companies

Retrieve all companies with their submission history.

```http
GET /api/cv/companies
```

Response:
```json
{
  "success": true,
  "count": 10,
  "companies": [
    {
      "id": "uuid",
      "name": "Example Corp",
      "domain": "example.com",
      "linkedinUrl": null,
      "createdAt": "2026-02-06T...",
      "english": {
        "lastSubmittedAt": "2026-02-06T...",
        "jobTitle": "Software Engineer",
        "daysRemaining": 45,
        "canSubmit": false,
        "nextAvailableDate": "2026-04-07T..."
      },
      "german": {
        "lastSubmittedAt": null,
        "daysRemaining": 0,
        "canSubmit": true,
        "nextAvailableDate": "2026-02-06T..."
      },
      "totalSubmissions": 1
    }
  ]
}
```

### Delete Company

Delete a company and all its CV submission records.

```http
DELETE /api/cv/companies/:id
```

Response:
```json
{
  "success": true,
  "message": "Company and all submissions deleted",
  "company": {
    "id": "uuid",
    "name": "Example Corp",
    "domain": "example.com"
  }
}
```

### Seed Companies

Add initial companies with their CV submission history. Companies that already exist (matched by domain or LinkedIn URL) are not duplicated, but submission records are still created.

```http
POST /api/cv/seed
Content-Type: application/json

{
  "companies": [
    {
      "name": "Google",
      "domain": "google.com",
      "english_submitted_at": "2026-01-15",
      "german_submitted_at": "2025-12-01"
    },
    {
      "name": "SAP",
      "domain": "sap.com",
      "linkedin_url": "https://linkedin.com/company/sap",
      "english_submitted_at": "2026-02-01",
      "english_job_title": "Backend Developer"
    },
    {
      "name": "Siemens",
      "linkedin_url": "https://linkedin.com/company/siemens"
    }
  ]
}
```

Response:
```json
{
  "success": true,
  "message": "Seeded 3 new companies (0 already existed), 3 submission records created",
  "created": 3,
  "existing": 0,
  "totalSubmissions": 3,
  "companies": [
    {
      "id": "uuid",
      "name": "Google",
      "domain": "google.com",
      "status": "created",
      "submissions": [
        { "id": "uuid", "cv_type": "english", "submitted_at": "2026-01-15T00:00:00.000Z" },
        { "id": "uuid", "cv_type": "german", "submitted_at": "2025-12-01T00:00:00.000Z" }
      ]
    }
  ]
}
```

Each company object accepts:
- `name` (optional) - Company display name (defaults to domain or LinkedIn URL)
- `domain` (optional) - Company website domain (e.g. `google.com`)
- `linkedin_url` (optional) - LinkedIn company page URL
- `english_submitted_at` (optional) - Date last submitted English CV (e.g. `2026-01-15`)
- `german_submitted_at` (optional) - Date last submitted German CV
- `english_job_title` (optional) - Job title for the English submission
- `german_job_title` (optional) - Job title for the German submission

At least one of `domain` or `linkedin_url` must be provided per company.

### Health Check

```http
GET /health
```

### Queue Stats

Check the request queue status.

```http
GET /api/queue/stats
```

## Request Queuing

The server uses a queue system (via `p-queue`) to handle concurrent requests. All CV check and submit requests are processed sequentially to prevent race conditions when multiple Clay rows execute in parallel.

Queue configuration:
- Concurrency: 1 (processes one request at a time)
- Requests wait in queue until processed

## Project Structure

```
server/
├── config/
│   └── database.js          # Supabase client configuration
├── controllers/
│   └── cvController.js      # Business logic for CV operations
├── middleware/
│   └── requestQueue.js      # Request queuing middleware
├── models/
│   └── companyModel.js      # Database queries
├── routes/
│   └── cvRoutes.js          # API route definitions
├── utils/
│   └── dateHelpers.js       # Date calculation utilities
├── database/
│   └── schema.sql           # Database schema
├── index.js                 # Main server file
├── .env                     # Environment variables (not in git)
└── package.json
```

## Testing with cURL

Check CV eligibility:
```bash
curl -X POST http://localhost:3001/api/cv/check \
  -H "Content-Type: application/json" \
  -d '{"domain":"example.com","cvType":"english"}'
```

Submit CV:
```bash
curl -X POST http://localhost:3001/api/cv/submit \
  -H "Content-Type: application/json" \
  -d '{"domain":"example.com","cvType":"english","jobTitle":"Software Engineer"}'
```

Get all companies:
```bash
curl http://localhost:3001/api/cv/companies
```

Delete a company:
```bash
curl -X DELETE http://localhost:3001/api/cv/companies/<company-uuid>
```

Seed companies with submission history:
```bash
curl -X POST http://localhost:3001/api/cv/seed \
  -H "Content-Type: application/json" \
  -d '{
    "companies": [
      {"name": "Google", "domain": "google.com", "english_submitted_at": "2026-01-15", "german_submitted_at": "2025-12-01"},
      {"name": "SAP", "domain": "sap.com", "english_submitted_at": "2026-02-01", "english_job_title": "Backend Developer"},
      {"name": "Siemens", "domain": "siemens.com"},
      {"name": "BMW", "domain": "bmw.com", "german_submitted_at": "2026-01-20"},
      {"name": "Deutsche Bank", "domain": "db.com"}
    ]
  }'
```
