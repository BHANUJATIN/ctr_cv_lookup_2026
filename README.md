# CV Submission Tracker

A full-stack application to manage CV submissions with a 60-day cooldown period per company. Solves the problem of Clay executing rows in parallel without context, causing multiple CV generations for the same company.

## 🎯 Problem Statement

When using Clay for automation:
- Multiple jobs from the same company execute in parallel
- No row context awareness leads to duplicate CV submissions
- Need to enforce 60-day cooldown per company
- Support for both English and German CVs

## ✨ Solution

This system provides:
- **Request Queuing**: Processes requests sequentially to prevent race conditions
- **Company Identification**: Cross-checks both domain and LinkedIn URL
- **Dual CV Tracking**: Separate cooldown for English and German CVs
- **Visual Dashboard**: Monitor all companies and their cooldown status
- **RESTful API**: Easy integration with Clay or other automation tools

## 🏗️ Architecture

```
ctr_cv_lookup_2026/
├── client/              # Next.js frontend
│   ├── app/            # App router pages
│   ├── components/     # React components
│   └── lib/            # API client utilities
└── server/             # Express backend
    ├── config/         # Database configuration
    ├── controllers/    # Business logic
    ├── middleware/     # Request queue
    ├── models/         # Database queries
    ├── routes/         # API endpoints
    ├── utils/          # Helper functions
    └── database/       # SQL schema
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)
- npm or yarn

### 1. Clone and Install

```bash
cd ctr_cv_lookup_2026

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Set Up Supabase Database

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor
3. Copy and run the schema from `server/database/schema.sql`
4. Get your project URL and API key from Settings

### 3. Configure Environment Variables

**Server (.env):**
```bash
cd server
cp .env.example .env
# Edit .env with your Supabase credentials
```

```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
CLIENT_URL=http://localhost:3000
```

**Client (.env.local):**
```bash
cd client
# Create .env.local file
```

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. Start the Application

**Terminal 1 - Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Client:**
```bash
cd client
npm run dev
```

Visit:
- Frontend: http://localhost:3000
- API: http://localhost:3001

## 📡 API Usage

### Check CV Eligibility

Before generating a CV, check if the company is eligible:

```bash
curl -X POST http://localhost:3001/api/cv/check \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "cvType": "english"
  }'
```

Response:
```json
{
  "canGenerateCV": true,
  "company": {
    "id": "uuid",
    "name": "example.com",
    "domain": "example.com"
  },
  "cvType": "english",
  "daysRemaining": 0,
  "message": "No previous submission found. CV can be generated."
}
```

### Submit CV Record

After generating a CV, record the submission:

```bash
curl -X POST http://localhost:3001/api/cv/submit \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "cvType": "english",
    "companyName": "Example Corp",
    "jobTitle": "Software Engineer"
  }'
```

### Get All Companies

```bash
curl http://localhost:3001/api/cv/companies
```

## 🔗 Clay Integration

### Clay Table Setup

1. Add a column for "Check CV Eligibility"
2. Use HTTP API enrichment with:
   - Method: POST
   - URL: `http://your-server:3001/api/cv/check`
   - Body:
   ```json
   {
     "domain": "{{company_domain}}",
     "linkedinUrl": "{{company_linkedin}}",
     "cvType": "english"
   }
   ```

3. Add conditional logic:
   - If `canGenerateCV` is `true`, proceed with CV generation
   - If `false`, skip and note `daysRemaining`

4. After CV generation, call submit endpoint:
   - Method: POST
   - URL: `http://your-server:3001/api/cv/submit`
   - Body:
   ```json
   {
     "domain": "{{company_domain}}",
     "cvType": "english",
     "jobTitle": "{{job_title}}"
   }
   ```

## 🎨 Features

### Dashboard
- **Real-time Stats**: Total companies, available CVs, submission counts
- **Company Cards**: Visual status for both English and German CVs
- **Search & Filter**: Find companies quickly
- **Auto-refresh**: Updates every 30 seconds
- **Queue Monitoring**: See pending requests

### API Features
- **Sequential Processing**: Queue prevents race conditions
- **Flexible Lookup**: Domain OR LinkedIn URL
- **Cooldown Tracking**: 60-day period per CV type
- **Date Calculations**: Days remaining, next available date
- **Error Handling**: Comprehensive validation

## 🔒 Security Notes

The current setup includes public RLS policies for easy development. **For production:**

1. Update Row Level Security policies in Supabase
2. Add authentication to API endpoints
3. Use environment-specific API keys
4. Enable CORS only for trusted domains
5. Add rate limiting

## 📝 Database Schema

**companies table:**
- `id`: UUID (primary key)
- `name`: Company name
- `domain`: Company domain (unique)
- `linkedin_url`: LinkedIn URL (unique)
- `created_at`, `updated_at`: Timestamps

**cv_submissions table:**
- `id`: UUID (primary key)
- `company_id`: Foreign key to companies
- `cv_type`: 'english' or 'german'
- `job_title`: Job title
- `job_description`: Job description
- `submitted_at`: Submission timestamp
- `created_at`: Record creation

## 🛠️ Tech Stack

**Frontend:**
- Next.js 15 (App Router)
- React 19
- Tailwind CSS
- JavaScript

**Backend:**
- Node.js
- Express.js
- Supabase (PostgreSQL)
- p-queue (request queuing)

## 📊 API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/queue/stats` | GET | Queue statistics |
| `/api/cv/check` | POST | Check CV eligibility |
| `/api/cv/submit` | POST | Submit CV record |
| `/api/cv/companies` | GET | Get all companies |

## 🐛 Troubleshooting

**Can't connect to API:**
- Verify server is running on port 3001
- Check NEXT_PUBLIC_API_URL in client/.env.local
- Ensure no firewall blocking

**Database errors:**
- Verify Supabase credentials in server/.env
- Check schema.sql was executed
- Confirm RLS policies are set

**Queue not working:**
- Check server logs for errors
- Verify p-queue is installed
- See `/api/queue/stats` endpoint

## 📚 Additional Documentation

- [Server README](server/README.md) - Backend setup and API details
- [Database Schema](server/database/schema.sql) - SQL schema

## 🤝 Contributing

This is a custom automation tool. Modify as needed for your use case.

## 📄 License

Private project - All rights reserved
