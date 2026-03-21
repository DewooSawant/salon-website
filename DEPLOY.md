# SalonNear - Deployment Guide

## Architecture
```
[Vercel - FREE]          [Railway - $5/mo]
  Frontend (React)  -->   Backend (Node.js)
                          PostgreSQL
                          Redis
```

## Step 1: Deploy Backend on Railway (~5 min)

1. Go to https://railway.app and sign up (GitHub login)
2. Click "New Project" > "Deploy from GitHub repo"
3. Select your salon-website repo
4. Railway auto-detects the Dockerfile in `/server`
   - Set Root Directory: `server`
5. Add PostgreSQL: Click "+ New" > "Database" > "PostgreSQL"
6. Add Redis: Click "+ New" > "Database" > "Redis"
7. Set environment variables in the server service:
   ```
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_URL=${{Redis.REDIS_URL}}
   JWT_SECRET=your-random-secret-key-here
   FRONTEND_URL=https://your-vercel-url.vercel.app
   ```
8. Deploy! Railway gives you a URL like `salon-api-production.up.railway.app`

### Initialize Database
After first deploy, run in Railway's shell:
```bash
node db/setup_v2_pg.js
```

## Step 2: Deploy Frontend on Vercel (~3 min)

1. Go to https://vercel.com and sign up (GitHub login)
2. Click "New Project" > Import your salon-website repo
3. Set:
   - Root Directory: `client`
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add environment variable:
   ```
   VITE_API_URL=https://your-railway-url.up.railway.app/api
   ```
5. Deploy! Vercel gives you a URL like `salonnear.vercel.app`

## Step 3: Connect Domain (Optional - ~₹800/year)

1. Buy a domain (GoDaddy, Namecheap, or Google Domains)
   - Suggestions: salonnear.in, salonnear.co.in
2. In Vercel: Settings > Domains > Add your domain
3. Update DNS records as shown by Vercel
4. Update Railway FRONTEND_URL to include your domain

## Step 4: Enable SMS for OTP (Optional)

### MSG91 (Cheapest for India)
1. Sign up at https://msg91.com
2. Get Auth Key from Settings
3. Create an OTP template
4. Add to Railway env:
   ```
   SMS_PROVIDER=msg91
   MSG91_AUTH_KEY=your-key
   MSG91_TEMPLATE_ID=your-template
   ```

Without SMS configured, OTPs print to server logs (usable for testing).

## Monthly Costs

| Item | Cost |
|------|------|
| Vercel (frontend) | FREE |
| Railway (backend) | ~$5/mo (~₹400) |
| Domain (.in) | ~₹800/year (~₹67/mo) |
| SMS (MSG91) | ~₹150/1000 OTPs |
| **Total** | **~₹500-600/month** |

## Update Process

```bash
# Make changes locally
git add . && git commit -m "your changes"
git push origin main
# Both Vercel and Railway auto-deploy on push!
```
