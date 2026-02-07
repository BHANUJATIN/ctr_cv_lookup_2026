# API Examples & Testing

Complete examples for testing all API endpoints.

## Base URL

```
http://localhost:3001
```

For production, replace with your deployed URL.

## Table of Contents

1. [Health Check](#health-check)
2. [Check CV Eligibility](#check-cv-eligibility)
3. [Submit CV Record](#submit-cv-record)
4. [Get All Companies](#get-all-companies)
5. [Queue Statistics](#queue-statistics)
6. [Complete Workflow](#complete-workflow)

---

## Health Check

Check if the server is running.

### Request

```bash
curl http://localhost:3001/health
```

### Response

```json
{
  "status": "ok",
  "timestamp": "2026-02-06T10:30:00.000Z",
  "uptime": 123.456
}
```

---

## Check CV Eligibility

Check if a CV can be generated for a company.

### Example 1: Check by Domain (English CV)

```bash
curl -X POST http://localhost:3001/api/cv/check \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "google.com",
    "cvType": "english",
    "companyName": "Google"
  }'
```

### Example 2: Check by LinkedIn URL (German CV)

```bash
curl -X POST http://localhost:3001/api/cv/check \
  -H "Content-Type: application/json" \
  -d '{
    "linkedinUrl": "https://linkedin.com/company/microsoft",
    "cvType": "german",
    "companyName": "Microsoft"
  }'
```

### Example 3: Check by Both Domain and LinkedIn

```bash
curl -X POST http://localhost:3001/api/cv/check \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "apple.com",
    "linkedinUrl": "https://linkedin.com/company/apple",
    "cvType": "english",
    "companyName": "Apple Inc."
  }'
```

### Response (Can Generate)

```json
{
  "canGenerateCV": true,
  "company": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Google",
    "domain": "google.com",
    "linkedinUrl": null
  },
  "cvType": "english",
  "daysRemaining": 0,
  "message": "No previous submission found. CV can be generated."
}
```

### Response (Cannot Generate - Cooldown)

```json
{
  "canGenerateCV": false,
  "company": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Google",
    "domain": "google.com",
    "linkedinUrl": null
  },
  "cvType": "english",
  "lastSubmission": {
    "id": "234e5678-e89b-12d3-a456-426614174001",
    "submittedAt": "2026-01-15T10:00:00.000Z",
    "jobTitle": "Software Engineer"
  },
  "daysRemaining": 38,
  "nextAvailableDate": "2026-03-16T10:00:00.000Z"
}
```

### Response (Error - Missing Required Field)

```json
{
  "error": "Either domain or linkedinUrl must be provided"
}
```

### Response (Error - Invalid CV Type)

```json
{
  "error": "cvType must be either \"english\" or \"german\""
}
```

---

## Submit CV Record

Record a CV submission after generation.

### Example 1: Submit English CV

```bash
curl -X POST http://localhost:3001/api/cv/submit \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "amazon.com",
    "cvType": "english",
    "companyName": "Amazon",
    "jobTitle": "Senior Software Engineer",
    "jobDescription": "Full-stack development role..."
  }'
```

### Example 2: Submit German CV

```bash
curl -X POST http://localhost:3001/api/cv/submit \
  -H "Content-Type: application/json" \
  -d '{
    "linkedinUrl": "https://linkedin.com/company/bmw",
    "cvType": "german",
    "companyName": "BMW Group",
    "jobTitle": "Software Entwickler"
  }'
```

### Example 3: Submit Without Job Details

```bash
curl -X POST http://localhost:3001/api/cv/submit \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "tesla.com",
    "cvType": "english"
  }'
```

### Response (Success)

```json
{
  "success": true,
  "message": "CV submission recorded successfully",
  "submission": {
    "id": "345e6789-e89b-12d3-a456-426614174002",
    "companyId": "123e4567-e89b-12d3-a456-426614174000",
    "cvType": "english",
    "submittedAt": "2026-02-06T10:30:00.000Z",
    "jobTitle": "Senior Software Engineer"
  },
  "company": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Amazon",
    "domain": "amazon.com",
    "linkedinUrl": null
  }
}
```

### Response (Error - Still in Cooldown)

```json
{
  "error": "CV cannot be submitted yet",
  "daysRemaining": 45,
  "nextAvailableDate": "2026-03-23T10:00:00.000Z",
  "lastSubmission": {
    "submittedAt": "2026-01-07T10:00:00.000Z",
    "jobTitle": "Software Engineer"
  }
}
```

---

## Get All Companies

Retrieve all companies with their submission history.

### Request

```bash
curl http://localhost:3001/api/cv/companies
```

### Response

```json
{
  "success": true,
  "count": 3,
  "companies": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Google",
      "domain": "google.com",
      "linkedinUrl": null,
      "createdAt": "2026-02-01T10:00:00.000Z",
      "english": {
        "lastSubmittedAt": "2026-02-06T10:00:00.000Z",
        "jobTitle": "Software Engineer",
        "daysRemaining": 54,
        "canSubmit": false,
        "nextAvailableDate": "2026-04-07T10:00:00.000Z"
      },
      "german": {
        "lastSubmittedAt": null,
        "daysRemaining": 0,
        "canSubmit": true,
        "nextAvailableDate": "2026-02-06T10:00:00.000Z"
      },
      "totalSubmissions": 1
    },
    {
      "id": "234e5678-e89b-12d3-a456-426614174001",
      "name": "Microsoft",
      "domain": "microsoft.com",
      "linkedinUrl": "https://linkedin.com/company/microsoft",
      "createdAt": "2026-02-03T15:00:00.000Z",
      "english": {
        "lastSubmittedAt": "2026-01-10T12:00:00.000Z",
        "jobTitle": "Cloud Architect",
        "daysRemaining": 33,
        "canSubmit": false,
        "nextAvailableDate": "2026-03-11T12:00:00.000Z"
      },
      "german": {
        "lastSubmittedAt": "2026-01-15T14:00:00.000Z",
        "jobTitle": "DevOps Engineer",
        "daysRemaining": 38,
        "canSubmit": false,
        "nextAvailableDate": "2026-03-16T14:00:00.000Z"
      },
      "totalSubmissions": 2
    },
    {
      "id": "345e6789-e89b-12d3-a456-426614174002",
      "name": "Apple Inc.",
      "domain": "apple.com",
      "linkedinUrl": "https://linkedin.com/company/apple",
      "createdAt": "2026-02-05T09:00:00.000Z",
      "english": {
        "lastSubmittedAt": null,
        "daysRemaining": 0,
        "canSubmit": true,
        "nextAvailableDate": "2026-02-06T10:00:00.000Z"
      },
      "german": {
        "lastSubmittedAt": null,
        "daysRemaining": 0,
        "canSubmit": true,
        "nextAvailableDate": "2026-02-06T10:00:00.000Z"
      },
      "totalSubmissions": 0
    }
  ]
}
```

---

## Queue Statistics

Get current queue status.

### Request

```bash
curl http://localhost:3001/api/queue/stats
```

### Response

```json
{
  "success": true,
  "queue": {
    "size": 0,
    "pending": 0,
    "isPaused": false
  }
}
```

---

## Complete Workflow

Example workflow for processing a new job posting.

### Step 1: Check if CV Can Be Generated

```bash
curl -X POST http://localhost:3001/api/cv/check \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "spotify.com",
    "cvType": "english",
    "companyName": "Spotify"
  }'
```

### Step 2: If `canGenerateCV` is `true`, Generate CV

```bash
# Your CV generation script here
# python generate_cv.py --company "Spotify" --type "english"
```

### Step 3: Record the Submission

```bash
curl -X POST http://localhost:3001/api/cv/submit \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "spotify.com",
    "cvType": "english",
    "companyName": "Spotify",
    "jobTitle": "Backend Developer",
    "jobDescription": "We are looking for..."
  }'
```

### Step 4: Verify in Dashboard

Visit: http://localhost:3000 and refresh to see the new company.

---

## Testing Multiple Concurrent Requests

Test the queue system with multiple parallel requests:

```bash
# Open multiple terminals and run these simultaneously:

# Terminal 1
curl -X POST http://localhost:3001/api/cv/submit \
  -H "Content-Type: application/json" \
  -d '{"domain":"company1.com","cvType":"english","companyName":"Company 1"}'

# Terminal 2
curl -X POST http://localhost:3001/api/cv/submit \
  -H "Content-Type: application/json" \
  -d '{"domain":"company2.com","cvType":"english","companyName":"Company 2"}'

# Terminal 3
curl -X POST http://localhost:3001/api/cv/submit \
  -H "Content-Type: application/json" \
  -d '{"domain":"company3.com","cvType":"english","companyName":"Company 3"}'
```

All requests will be queued and processed one at a time.

---

## Clay Integration Examples

### Clay HTTP API Configuration

**Check Endpoint:**
```
Method: POST
URL: http://your-server.com/api/cv/check
Headers: Content-Type: application/json
Body:
{
  "domain": "{{company_domain}}",
  "linkedinUrl": "{{company_linkedin}}",
  "cvType": "english",
  "companyName": "{{company_name}}"
}
```

**Submit Endpoint:**
```
Method: POST
URL: http://your-server.com/api/cv/submit
Headers: Content-Type: application/json
Body:
{
  "domain": "{{company_domain}}",
  "cvType": "english",
  "companyName": "{{company_name}}",
  "jobTitle": "{{job_title}}",
  "jobDescription": "{{job_description}}"
}
```

### Clay Conditional Logic

1. Add HTTP API column with check endpoint
2. Extract `canGenerateCV` value
3. Add condition:
   - If `canGenerateCV` = `true` → Run CV generation
   - If `canGenerateCV` = `false` → Skip row
4. After CV generation, call submit endpoint

---

## Postman Collection

Import this JSON into Postman:

```json
{
  "info": {
    "name": "CV Submission Tracker",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3001"
    }
  ],
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/health"
      }
    },
    {
      "name": "Check CV Eligibility",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/cv/check",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"domain\": \"example.com\",\n  \"cvType\": \"english\",\n  \"companyName\": \"Example Corp\"\n}"
        }
      }
    },
    {
      "name": "Submit CV",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/cv/submit",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"domain\": \"example.com\",\n  \"cvType\": \"english\",\n  \"companyName\": \"Example Corp\",\n  \"jobTitle\": \"Software Engineer\"\n}"
        }
      }
    },
    {
      "name": "Get All Companies",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/cv/companies"
      }
    },
    {
      "name": "Queue Stats",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/queue/stats"
      }
    }
  ]
}
```

---

## Error Codes Reference

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 201 | Created (submission successful) |
| 400 | Bad Request (validation error) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Tips

1. **Use jq for pretty output**:
   ```bash
   curl http://localhost:3001/api/cv/companies | jq
   ```

2. **Save response to file**:
   ```bash
   curl http://localhost:3001/api/cv/companies > companies.json
   ```

3. **Check response time**:
   ```bash
   curl -w "@-" -o /dev/null -s http://localhost:3001/health <<'EOF'
   \nTime: %{time_total}s\n
   EOF
   ```

4. **Verbose output for debugging**:
   ```bash
   curl -v http://localhost:3001/health
   ```
