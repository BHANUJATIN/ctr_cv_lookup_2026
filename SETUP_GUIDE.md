# Complete Setup Guide

This guide will walk you through setting up the CV Submission Tracker from scratch.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Server Configuration](#server-configuration)
4. [Client Configuration](#client-configuration)
5. [Testing the Setup](#testing-the-setup)
6. [Clay Integration](#clay-integration)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before starting, ensure you have:

- ✅ Node.js 18 or higher installed
- ✅ npm (comes with Node.js)
- ✅ A code editor (VS Code recommended)
- ✅ A Supabase account (free tier is fine)

### Check Node.js Installation

```bash
node --version
# Should output v18.0.0 or higher

npm --version
# Should output 8.0.0 or higher
```

## Supabase Setup

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub or email
4. Click "New Project"
5. Fill in:
   - **Name**: cv-submission-tracker
   - **Database Password**: (create a strong password - save it!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free
6. Click "Create new project"
7. Wait 2-3 minutes for setup to complete

### Step 2: Get Your API Credentials

1. In your project dashboard, click "Settings" (gear icon)
2. Click "API" in the left sidebar
3. You'll see:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (long string)
4. **Keep this page open** - you'll need these values!

### Step 3: Set Up Database Tables

1. Click "SQL Editor" in the left sidebar
2. Click "New Query"
3. Open the file `server/database/schema.sql` in your code editor
4. Copy ALL the contents
5. Paste into the SQL Editor in Supabase
6. Click "Run" (or press Ctrl+Enter)
7. You should see "Success. No rows returned"

### Step 4: Verify Tables Created

1. Click "Table Editor" in the left sidebar
2. You should see two tables:
   - `companies`
   - `cv_submissions`

## Server Configuration

### Step 1: Install Server Dependencies

Open a terminal and run:

```bash
cd server
npm install
```

Wait for installation to complete (about 30 seconds).

### Step 2: Configure Environment Variables

1. In the `server` folder, find the `.env` file
2. Open it in your code editor
3. Replace the values:

```env
PORT=3001

# Paste your Supabase URL here (from Step 2 above)
SUPABASE_URL=https://xxxxx.supabase.co

# Paste your anon/public key here (from Step 2 above)
SUPABASE_KEY=eyJhbGc...

CLIENT_URL=http://localhost:3000
```

4. **Save the file**

### Step 3: Test the Server

In the terminal (still in `server` folder):

```bash
npm run dev
```

You should see:

```
🚀 Server is running on http://localhost:3001
📊 Health check: http://localhost:3001/health
```

Open your browser and visit: http://localhost:3001/health

You should see:

```json
{
  "status": "ok",
  "timestamp": "2026-02-06T...",
  "uptime": 1.234
}
```

✅ **Server is working!**

Keep this terminal open and running.

## Client Configuration

### Step 1: Open a New Terminal

Open a **second terminal window** (keep the server running in the first one).

### Step 2: Install Client Dependencies

```bash
cd client
npm install
```

Wait for installation to complete (about 45 seconds).

### Step 3: Verify Environment Variable

The `.env.local` file should already exist with:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

If it doesn't exist, create it with this content.

### Step 4: Start the Client

In the terminal (still in `client` folder):

```bash
npm run dev
```

You should see:

```
  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
```

Open your browser and visit: http://localhost:3000

You should see the dashboard with "No companies found. Start by making your first API call!"

✅ **Client is working!**

## Testing the Setup

### Method 1: Using cURL (Command Line)

Open a **third terminal** and run:

```bash
# Test 1: Check CV eligibility
curl -X POST http://localhost:3001/api/cv/check \
  -H "Content-Type: application/json" \
  -d "{\"domain\":\"example.com\",\"cvType\":\"english\",\"companyName\":\"Example Corp\"}"

# Test 2: Submit a CV
curl -X POST http://localhost:3001/api/cv/submit \
  -H "Content-Type: application/json" \
  -d "{\"domain\":\"example.com\",\"cvType\":\"english\",\"companyName\":\"Example Corp\",\"jobTitle\":\"Software Engineer\"}"

# Test 3: Check again (should now show cooldown)
curl -X POST http://localhost:3001/api/cv/check \
  -H "Content-Type: application/json" \
  -d "{\"domain\":\"example.com\",\"cvType\":\"english\"}"
```

### Method 2: Using Postman or Thunder Client

1. Install Postman or Thunder Client (VS Code extension)
2. Create a new POST request to `http://localhost:3001/api/cv/check`
3. Set Headers:
   - `Content-Type`: `application/json`
4. Set Body (raw JSON):
   ```json
   {
     "domain": "example.com",
     "cvType": "english",
     "companyName": "Example Corp"
   }
   ```
5. Send the request

### Verify in Dashboard

1. Go back to http://localhost:3000
2. Click "Refresh" button
3. You should now see "Example Corp" in the dashboard
4. The English CV should show as unavailable with 60 days remaining

✅ **Everything is working!**

## Clay Integration

### Setup in Clay

1. In your Clay table, add a new column
2. Choose "HTTP API" enrichment
3. Configure:

**For Checking Eligibility:**
- **Method**: POST
- **URL**: `http://localhost:3001/api/cv/check`
- **Headers**:
  - `Content-Type`: `application/json`
- **Body**:
  ```json
  {
    "domain": "{{company_domain}}",
    "linkedinUrl": "{{company_linkedin}}",
    "cvType": "english",
    "companyName": "{{company_name}}"
  }
  ```

4. Add a condition column:
   - If `canGenerateCV` = true → Generate CV
   - If `canGenerateCV` = false → Skip

**For Recording Submission:**
- **Method**: POST
- **URL**: `http://localhost:3001/api/cv/submit`
- **Headers**:
  - `Content-Type`: `application/json`
- **Body**:
  ```json
  {
    "domain": "{{company_domain}}",
    "cvType": "english",
    "companyName": "{{company_name}}",
    "jobTitle": "{{job_title}}",
    "jobDescription": "{{job_description}}"
  }
  ```

### Production Deployment

For Clay to access your API, you need to deploy it publicly:

**Option 1: Deploy to Railway**
1. Sign up at [railway.app](https://railway.app)
2. Create new project
3. Deploy from GitHub
4. Add environment variables
5. Use the Railway URL in Clay

**Option 2: Deploy to Render**
1. Sign up at [render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repo
4. Add environment variables
5. Use the Render URL in Clay

**Option 3: Use ngrok (Development Only)**
```bash
# In a new terminal
ngrok http 3001
# Use the ngrok URL in Clay
```

## Troubleshooting

### Server won't start

**Error**: `Missing Supabase credentials`
- Solution: Check your `.env` file has the correct values
- Make sure you saved the file after editing

**Error**: `Port 3001 is already in use`
- Solution: Change PORT in `.env` to 3002
- Also update CLIENT_URL in server/.env and NEXT_PUBLIC_API_URL in client/.env.local

### Client won't connect to server

**Error**: `Failed to fetch`
- Check server is running (http://localhost:3001/health)
- Check `.env.local` has correct API URL
- Try restarting the client

### Database errors

**Error**: `relation "companies" does not exist`
- You didn't run the schema.sql script
- Go back to Supabase → SQL Editor → Run the schema

**Error**: `JWT expired`
- Your Supabase key is old
- Get a new key from Supabase Settings → API
- Update `.env` file

### "No companies found" after testing

- Click the "Refresh" button
- Check server terminal for errors
- Try visiting: http://localhost:3001/api/cv/companies
- Should return a JSON response

### Clay returns error

- Make sure your server is publicly accessible (not localhost)
- Check the URL format in Clay
- Verify headers are set correctly
- Test the endpoint with Postman first

## Next Steps

1. ✅ Add more test companies via API
2. ✅ Monitor the dashboard as cooldowns expire
3. ✅ Integrate with your CV generation script
4. ✅ Deploy to production when ready
5. ✅ Set up proper authentication for production

## Support

If you encounter issues:
1. Check server logs in the terminal
2. Check browser console (F12) for frontend errors
3. Verify all environment variables are correct
4. Test each endpoint individually with cURL

## Useful Commands

```bash
# Check if ports are in use
netstat -ano | findstr :3001
netstat -ano | findstr :3000

# Kill a process by port (Windows)
# First find PID from netstat, then:
taskkill /PID <PID> /F

# Restart everything
# Close both terminals (Ctrl+C)
# Run start-dev.bat to start both servers
```

## Quick Reference

- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:3000
- **Health Check**: http://localhost:3001/health
- **Companies API**: http://localhost:3001/api/cv/companies
- **Supabase Dashboard**: https://supabase.com/dashboard

---

**Congratulations! Your CV Submission Tracker is now set up and running! 🎉**
