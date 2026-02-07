# Project Structure

Complete overview of the CV Submission Tracker project structure.

## Root Directory

```
ctr_cv_lookup_2026/
├── client/                 # Next.js frontend application
├── server/                 # Express backend API
├── .gitignore             # Git ignore rules
├── README.md              # Main project documentation
├── SETUP_GUIDE.md         # Step-by-step setup instructions
├── API_EXAMPLES.md        # API usage examples
├── PROJECT_STRUCTURE.md   # This file
└── start-dev.bat          # Windows script to start both servers
```

## Client (Frontend)

```
client/
├── app/                    # Next.js app directory
│   ├── layout.js          # Root layout component
│   ├── page.js            # Dashboard page (main UI)
│   ├── globals.css        # Global styles
│   └── favicon.ico        # Favicon
├── components/            # React components
│   ├── CompanyCard.js     # Company display card
│   ├── StatsCard.js       # Statistics card
│   └── LoadingSpinner.js  # Loading indicator
├── lib/                   # Utilities and helpers
│   └── api.js            # API client functions
├── public/               # Static assets
│   ├── next.svg
│   └── vercel.svg
├── .env.local           # Environment variables (not in git)
├── .eslintrc.json       # ESLint configuration
├── .gitignore           # Client-specific git ignore
├── jsconfig.json        # JavaScript configuration
├── next.config.mjs      # Next.js configuration
├── package.json         # Dependencies and scripts
├── package-lock.json    # Dependency lock file
├── postcss.config.mjs   # PostCSS configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── README.md            # Client documentation
```

### Key Files Description

**app/page.js**
- Main dashboard component
- Fetches and displays all companies
- Implements search and filter functionality
- Auto-refreshes every 30 seconds

**components/CompanyCard.js**
- Displays individual company information
- Shows English and German CV status
- Color-coded status badges
- Displays days remaining until next submission

**components/StatsCard.js**
- Reusable statistics card
- Shows totals and counts
- Customizable icon and color

**lib/api.js**
- Centralized API client
- Functions for all backend endpoints
- Error handling

## Server (Backend)

```
server/
├── config/
│   └── database.js           # Supabase client setup
├── controllers/
│   └── cvController.js       # Business logic for CV operations
├── middleware/
│   └── requestQueue.js       # Queue middleware for sequential processing
├── models/
│   └── companyModel.js       # Database query functions
├── routes/
│   └── cvRoutes.js          # API route definitions
├── utils/
│   └── dateHelpers.js       # Date calculation utilities
├── database/
│   └── schema.sql           # PostgreSQL database schema
├── .env                     # Environment variables (not in git)
├── .env.example             # Environment template
├── .gitignore              # Server-specific git ignore
├── index.js                # Main server entry point
├── package.json            # Dependencies and scripts
├── package-lock.json       # Dependency lock file
└── README.md               # Server documentation
```

### Key Files Description

**index.js**
- Express server setup
- Middleware configuration
- Route mounting
- Error handling

**config/database.js**
- Supabase client initialization
- Connection configuration

**controllers/cvController.js**
- `checkCVEligibility()` - Check if CV can be generated
- `saveCVSubmission()` - Record CV submission
- `getAllCompanies()` - Fetch all companies with status

**middleware/requestQueue.js**
- Request queuing with p-queue
- Sequential processing (concurrency = 1)
- Queue statistics

**models/companyModel.js**
- `findCompany()` - Find by domain or LinkedIn
- `createCompany()` - Create new company
- `getOrCreateCompany()` - Get existing or create new
- `getLatestCVSubmission()` - Get latest submission by type
- `createCVSubmission()` - Record new submission
- `getAllCompaniesWithSubmissions()` - Fetch all with history

**utils/dateHelpers.js**
- `daysBetween()` - Calculate days between dates
- `daysUntilNextSubmission()` - Calculate cooldown remaining
- `canSubmitCV()` - Check if cooldown expired
- `getNextSubmissionDate()` - Calculate next available date

**database/schema.sql**
- Creates `companies` table
- Creates `cv_submissions` table
- Indexes for performance
- Row Level Security policies

## Data Flow

### 1. Check CV Eligibility Flow

```
Clay/Client
    ↓
POST /api/cv/check
    ↓
Request Queue (middleware)
    ↓
cvController.checkCVEligibility()
    ↓
companyModel.getOrCreateCompany()
    ↓
companyModel.getLatestCVSubmission()
    ↓
dateHelpers.canSubmitCV()
    ↓
Response: { canGenerateCV, daysRemaining, ... }
```

### 2. Submit CV Flow

```
Clay/Client
    ↓
POST /api/cv/submit
    ↓
Request Queue (middleware)
    ↓
cvController.saveCVSubmission()
    ↓
companyModel.getOrCreateCompany()
    ↓
companyModel.getLatestCVSubmission()
    ↓
dateHelpers.canSubmitCV()
    ↓
companyModel.createCVSubmission()
    ↓
Response: { success, submission, company }
```

### 3. Dashboard Data Flow

```
Client Dashboard (page.js)
    ↓
GET /api/cv/companies
    ↓
cvController.getAllCompanies()
    ↓
companyModel.getAllCompaniesWithSubmissions()
    ↓
dateHelpers calculations (for each company)
    ↓
Response: { companies: [...] }
    ↓
Dashboard renders CompanyCards
```

## Database Schema

### companies

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Company name |
| domain | TEXT | Company domain (unique) |
| linkedin_url | TEXT | LinkedIn URL (unique) |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

**Constraints:**
- At least one of domain or linkedin_url must be provided
- Both domain and linkedin_url are unique

### cv_submissions

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| company_id | UUID | Foreign key to companies |
| cv_type | TEXT | 'english' or 'german' |
| job_title | TEXT | Job title (optional) |
| job_description | TEXT | Job description (optional) |
| submitted_at | TIMESTAMP | Submission time |
| created_at | TIMESTAMP | Record creation time |

**Constraints:**
- cv_type must be 'english' or 'german'
- company_id references companies(id) with CASCADE delete

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/queue/stats` | GET | Queue statistics |
| `/api/cv/check` | POST | Check CV eligibility |
| `/api/cv/submit` | POST | Submit CV record |
| `/api/cv/companies` | GET | Get all companies |

## Environment Variables

### Server (.env)

```env
PORT=3001                    # Server port
SUPABASE_URL=...            # Supabase project URL
SUPABASE_KEY=...            # Supabase anon/public key
CLIENT_URL=http://localhost:3000  # Frontend URL (for CORS)
```

### Client (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001  # Backend API URL
```

## Dependencies

### Server

```json
{
  "express": "^5.2.1",              // Web framework
  "@supabase/supabase-js": "^2.95.3",  // Database client
  "cors": "^2.8.6",                 // CORS middleware
  "dotenv": "^17.2.4",             // Environment variables
  "p-queue": "^9.1.0",             // Request queuing
  "nodemon": "^3.1.11"             // Dev server (devDep)
}
```

### Client

```json
{
  "next": "15.x.x",               // React framework
  "react": "19.x.x",              // UI library
  "react-dom": "19.x.x",          // React DOM
  "tailwindcss": "^3.x.x",        // CSS framework
  "eslint": "^8.x.x"              // Linting (devDep)
}
```

## Scripts

### Server

```bash
npm start       # Start production server
npm run dev     # Start development server with nodemon
```

### Client

```bash
npm run dev     # Start development server
npm run build   # Build for production
npm start       # Start production server
npm run lint    # Run ESLint
```

## Key Features Implementation

### 1. Request Queuing

**Location:** `server/middleware/requestQueue.js`

Uses `p-queue` with concurrency of 1 to ensure sequential processing.

```javascript
const queue = new PQueue({ concurrency: 1 });
```

Applied to `/check` and `/submit` endpoints in `cvRoutes.js`.

### 2. Company Identification

**Location:** `server/models/companyModel.js`

Finds companies by domain OR LinkedIn URL using Supabase OR query.

```javascript
query = query.or('domain.eq.xxx,linkedin_url.eq.yyy');
```

### 3. Cooldown Tracking

**Location:** `server/utils/dateHelpers.js`

Calculates days between dates and checks 60-day cooldown.

```javascript
const canSubmit = daysPassed >= 60;
```

### 4. Dual CV Types

**Location:** `server/controllers/cvController.js`

Separate tracking for 'english' and 'german' CVs.

Each company can have:
- 1 English CV every 60 days
- 1 German CV every 60 days
- Both tracked independently

### 5. Auto-refresh Dashboard

**Location:** `client/app/page.js`

```javascript
useEffect(() => {
  fetchData();
  const interval = setInterval(fetchData, 30000);
  return () => clearInterval(interval);
}, []);
```

## Development Workflow

1. **Start Development**
   ```bash
   # Option 1: Manual (2 terminals)
   cd server && npm run dev
   cd client && npm run dev

   # Option 2: Windows batch script
   start-dev.bat
   ```

2. **Make Changes**
   - Server: Changes auto-reload with nodemon
   - Client: Changes hot-reload with Next.js

3. **Test API**
   - Use cURL, Postman, or API_EXAMPLES.md
   - Check server terminal for logs

4. **View Dashboard**
   - Visit http://localhost:3000
   - Check browser console (F12) for errors

## Deployment Considerations

1. **Environment Variables**
   - Update for production URLs
   - Use secure keys (not anon key)

2. **Database**
   - Update RLS policies for security
   - Add authentication if needed

3. **CORS**
   - Restrict to specific domains
   - Don't use * in production

4. **Rate Limiting**
   - Add express-rate-limit
   - Protect against abuse

5. **Logging**
   - Add proper logging (winston, pino)
   - Monitor queue performance

## Monitoring

### Queue Statistics

```bash
curl http://localhost:3001/api/queue/stats
```

Shows:
- `size`: Requests waiting
- `pending`: Requests processing
- `isPaused`: Queue status

### Health Check

```bash
curl http://localhost:3001/health
```

Shows:
- `status`: ok/error
- `timestamp`: Current time
- `uptime`: Server uptime in seconds

### Database Monitoring

Use Supabase dashboard:
- Table Editor: View data
- SQL Editor: Run queries
- Logs: View API logs
- Database: Check connections

## Troubleshooting

See [SETUP_GUIDE.md](SETUP_GUIDE.md#troubleshooting) for common issues.

## Future Enhancements

Potential improvements:
- [ ] Add authentication
- [ ] Add webhook notifications
- [ ] Export to CSV/Excel
- [ ] Email alerts for cooldown expiry
- [ ] Analytics dashboard
- [ ] Bulk import companies
- [ ] API rate limiting
- [ ] Audit logging
- [ ] Multi-tenant support
- [ ] Custom cooldown periods per company

---

Last Updated: 2026-02-06
