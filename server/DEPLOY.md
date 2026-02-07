# Deployment Guide - CV Lookup Server

## Prerequisites

Before deploying, ensure you have:

1. A **Supabase** project with the database schema applied (`database/schema.sql`)
2. Your Supabase **Project URL** and **Anon/Public API key**
3. The **client URL** (where your Next.js frontend will be hosted) for CORS

## Environment Variables

All platforms require these environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port (most platforms set this automatically) | `3001` |
| `SUPABASE_URL` | Your Supabase project URL | `https://abc123.supabase.co` |
| `SUPABASE_KEY` | Your Supabase anon/public key | `eyJhbGciOi...` |
| `CLIENT_URL` | Frontend URL for CORS | `https://your-app.vercel.app` |
| `NODE_ENV` | Environment mode | `production` |

## Important Notes

- The server uses **ES Modules** (`"type": "module"` in package.json) - make sure your platform supports Node.js 18+
- The start command is `npm start` which runs `node index.js`
- No build step is required - it's plain Node.js/Express
- The server binds to `process.env.PORT` which most platforms set automatically

---

## Option 1: Render (Recommended - Free Tier Available)

Render is the simplest option for deploying Node.js servers.

### Rate Limits
- **Free tier**: Services spin down after 15 minutes of inactivity. First request after spin-down takes ~30-60 seconds (cold start)
- **Free tier**: 750 hours/month of running time
- **No request rate limits** on paid plans
- **Outbound bandwidth**: 100 GB/month on free tier

### Steps

1. Push your code to a GitHub repository

2. Go to [render.com](https://render.com) and create a new **Web Service**

3. Connect your GitHub repo and configure:
   - **Name**: `cv-lookup-server`
   - **Region**: Choose closest to your users (e.g. Frankfurt for EU)
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or Starter $7/mo for no cold starts)

4. Add environment variables in the Render dashboard:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-key
   CLIENT_URL=https://your-frontend-url.vercel.app
   NODE_ENV=production
   ```

5. Click **Create Web Service** - Render will build and deploy automatically

6. Your server URL will be: `https://cv-lookup-server.onrender.com`

### Auto-Deploy
Render automatically redeploys when you push to your connected branch.

---

## Option 2: Heroku

### Rate Limits
- **Eco dynos** ($5/mo): Sleep after 30 minutes of inactivity, 1000 dyno hours/month shared across all eco apps
- **Basic dynos** ($7/mo): Never sleep
- **No request rate limits** from Heroku itself
- **Request timeout**: 30 seconds per request (H12 error if exceeded)
- **Concurrent connections**: ~50 per dyno recommended

### Steps

1. Install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)

2. Login and create the app:
   ```bash
   heroku login
   heroku create cv-lookup-server
   ```

3. Set the root directory to `server` (since server is a subdirectory):
   ```bash
   # Option A: Use a monorepo buildpack
   heroku buildpacks:add -a cv-lookup-server https://github.com/lstoll/heroku-buildpack-monorepo
   heroku buildpacks:add -a cv-lookup-server heroku/nodejs
   heroku config:set APP_BASE=server

   # Option B: Or deploy just the server folder using subtree push
   git subtree push --prefix server heroku main
   ```

4. Set environment variables:
   ```bash
   heroku config:set SUPABASE_URL=https://your-project.supabase.co
   heroku config:set SUPABASE_KEY=your-anon-key
   heroku config:set CLIENT_URL=https://your-frontend-url.vercel.app
   heroku config:set NODE_ENV=production
   ```

5. Create a `Procfile` in the `server/` directory:
   ```
   web: node index.js
   ```

6. Deploy:
   ```bash
   git push heroku main
   # Or if using subtree:
   git subtree push --prefix server heroku main
   ```

7. Your server URL will be: `https://cv-lookup-server-xxxx.herokuapp.com`

### Useful Commands
```bash
heroku logs --tail           # View live logs
heroku ps                    # Check dyno status
heroku restart               # Restart the server
```

---

## Option 3: AWS (EC2 or Elastic Beanstalk)

### Rate Limits
- **No request rate limits** from AWS itself (you control the infrastructure)
- **EC2**: Limited by instance size and network bandwidth
- **Elastic Beanstalk**: Auto-scales based on your configuration
- **AWS Free Tier**: 750 hours/month of t2.micro (or t3.micro) for 12 months

### Option 3A: AWS Elastic Beanstalk (Easier)

1. Install the [AWS CLI](https://aws.amazon.com/cli/) and [EB CLI](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install.html):
   ```bash
   pip install awsebcli
   ```

2. Navigate to the server directory and initialize:
   ```bash
   cd server
   eb init cv-lookup-server --platform node.js --region eu-central-1
   ```

3. Create the environment:
   ```bash
   eb create cv-lookup-production --single --instance-types t3.micro
   ```

4. Set environment variables:
   ```bash
   eb setenv SUPABASE_URL=https://your-project.supabase.co \
     SUPABASE_KEY=your-anon-key \
     CLIENT_URL=https://your-frontend-url.vercel.app \
     NODE_ENV=production
   ```

5. Deploy:
   ```bash
   eb deploy
   ```

6. Open the app:
   ```bash
   eb open
   ```

### Option 3B: AWS EC2 (Manual)

1. Launch an EC2 instance (t3.micro for free tier, Amazon Linux 2023)

2. SSH into the instance and install Node.js:
   ```bash
   ssh -i your-key.pem ec2-user@your-ec2-ip

   # Install Node.js 20
   curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
   sudo yum install -y nodejs git
   ```

3. Clone your repo and install:
   ```bash
   git clone https://github.com/your-user/your-repo.git
   cd your-repo/server
   npm install --production
   ```

4. Create the `.env` file:
   ```bash
   cat > .env << 'EOF'
   PORT=3001
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-key
   CLIENT_URL=https://your-frontend-url.vercel.app
   NODE_ENV=production
   EOF
   ```

5. Use PM2 to keep the server running:
   ```bash
   sudo npm install -g pm2
   pm2 start index.js --name cv-lookup-server
   pm2 startup    # Auto-start on reboot
   pm2 save
   ```

6. Set up a reverse proxy with Nginx (optional but recommended):
   ```bash
   sudo yum install -y nginx
   ```

   Create `/etc/nginx/conf.d/cv-lookup.conf`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   sudo systemctl start nginx
   sudo systemctl enable nginx
   ```

7. Open port 80 (and 443 for HTTPS) in your EC2 security group

### Useful PM2 Commands
```bash
pm2 status                   # Check server status
pm2 logs cv-lookup-server    # View logs
pm2 restart cv-lookup-server # Restart
pm2 monit                    # Live monitoring
```

---

## Option 4: Cloudflare Workers (Not Recommended)

Cloudflare Workers uses a V8 isolate runtime, **not Node.js**. This server uses Node.js-specific packages (`express`, `dotenv`, `p-queue`) that are **not compatible** with Workers.

### If You Still Want Cloudflare

You have two alternatives:

#### 4A: Rewrite as a Cloudflare Worker (Significant Effort)
This would require rewriting the entire server using the Workers API (no Express, no `dotenv`, use `itty-router` or Hono instead). Not recommended unless you have a specific reason.

#### 4B: Use a VPS on Cloudflare's Network (Cloudflare Tunnel)
Run the server on any VPS and expose it through Cloudflare Tunnel for DDoS protection and CDN benefits:

1. Deploy the server on any VPS (EC2, DigitalOcean, etc.)
2. Install `cloudflared`:
   ```bash
   # On the VPS
   curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
   chmod +x cloudflared
   sudo mv cloudflared /usr/local/bin/
   ```
3. Authenticate and create a tunnel:
   ```bash
   cloudflared tunnel login
   cloudflared tunnel create cv-lookup
   cloudflared tunnel route dns cv-lookup api.yourdomain.com
   ```
4. Create config (`~/.cloudflared/config.yml`):
   ```yaml
   tunnel: <tunnel-id>
   credentials-file: /root/.cloudflared/<tunnel-id>.json

   ingress:
     - hostname: api.yourdomain.com
       service: http://localhost:3001
     - service: http_status:404
   ```
5. Run the tunnel:
   ```bash
   cloudflared tunnel run cv-lookup
   ```

### Cloudflare Rate Limits
- **Workers free tier**: 100,000 requests/day, 10ms CPU time per request
- **Workers paid** ($5/mo): 10 million requests/month, 50ms CPU time
- **Cloudflare Tunnel**: No request limits (depends on your origin server)

---

## Option 5: Railway

### Rate Limits
- **Trial**: $5 free credit, no credit card required
- **Hobby** ($5/mo): 8 GB RAM, 8 vCPU, 100 GB bandwidth
- **No request rate limits** from Railway itself
- Containers do not sleep on paid plans

### Steps

1. Go to [railway.app](https://railway.app) and connect your GitHub repo

2. Create a new project and select your repo

3. Configure:
   - **Root Directory**: `server`
   - **Start Command**: `npm start`

4. Add environment variables in the Railway dashboard:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-key
   CLIENT_URL=https://your-frontend-url.vercel.app
   NODE_ENV=production
   ```

5. Railway auto-detects Node.js, installs dependencies, and deploys

6. Go to **Settings > Networking > Generate Domain** to get your public URL

---

## Option 6: DigitalOcean App Platform

### Rate Limits
- **Starter** ($5/mo): 1 container, auto-sleep after 30 min of inactivity
- **Basic** ($7/mo): Always-on container
- **No request rate limits** from DigitalOcean itself
- **Bandwidth**: 1 TB/month included

### Steps

1. Go to [cloud.digitalocean.com/apps](https://cloud.digitalocean.com/apps) and create a new app

2. Connect your GitHub repo and configure:
   - **Source Directory**: `server`
   - **Run Command**: `npm start`
   - **HTTP Port**: `3001`

3. Add environment variables in the app settings

4. Deploy

---

## Post-Deployment Checklist

After deploying to any platform:

1. **Verify health check**: `curl https://your-server-url/health`

2. **Update CLIENT_URL**: Set it to your actual frontend URL for CORS to work

3. **Update frontend API URL**: In your Next.js client, set `NEXT_PUBLIC_API_URL` to point to your deployed server URL

4. **Add RLS delete policies** (if not already done - required for delete functionality):
   ```sql
   CREATE POLICY "Allow public delete access on companies"
     ON companies FOR DELETE USING (true);
   CREATE POLICY "Allow public delete access on cv_submissions"
     ON cv_submissions FOR DELETE USING (true);
   ```

5. **Seed initial companies** (optional):
   ```bash
   curl -X POST https://your-server-url/api/cv/seed \
     -H "Content-Type: application/json" \
     -d '{
       "companies": [
         {"name": "Google", "domain": "google.com"},
         {"name": "SAP", "domain": "sap.com"},
         {"name": "Siemens", "domain": "siemens.com"}
       ]
     }'
   ```

6. **Test all endpoints**:
   ```bash
   # Check eligibility
   curl -X POST https://your-server-url/api/cv/check \
     -H "Content-Type: application/json" \
     -d '{"domain":"google.com","cvType":"english"}'

   # Get all companies
   curl https://your-server-url/api/cv/companies
   ```

## Supabase Production Considerations

- **RLS Policies**: The current schema uses open RLS policies (anyone can read/write/delete). For production, consider restricting access using Supabase auth or API key validation middleware
- **Supabase Free Tier**: 500 MB database, 2 GB bandwidth, 50,000 monthly active users, 500 MB file storage
- **Supabase Pro** ($25/mo): 8 GB database, 250 GB bandwidth, unlimited API requests
- **Connection Pooling**: Supabase JS client handles this automatically via the REST API
- **Backups**: Free tier has no backups. Pro has daily backups with 7-day retention
