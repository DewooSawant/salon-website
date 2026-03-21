# Glamour Cuts - Production Deployment Guide

## Quick Overview

This guide will help you deploy the Salon Website for your clients. You can either:
1. **Self-hosted** - Deploy on a VPS (DigitalOcean, AWS, Linode) - ₹500-1500/month
2. **Managed hosting** - Use Railway, Render, or Vercel - ₹0-1000/month

---

## Option 1: Self-Hosted VPS Deployment (Recommended for Business)

### Step 1: Get a VPS Server

Recommended providers:
- **DigitalOcean** - $6/month (₹500) - [digitalocean.com](https://digitalocean.com)
- **Hostinger VPS** - ₹299/month - [hostinger.in](https://hostinger.in)
- **AWS Lightsail** - $5/month - [aws.amazon.com/lightsail](https://aws.amazon.com/lightsail)

Choose **Ubuntu 22.04 LTS** with at least:
- 1 GB RAM
- 25 GB SSD
- 1 CPU

### Step 2: Get a Domain Name

Buy a domain from:
- **GoDaddy** - ₹99/year for .in domains
- **Namecheap** - Affordable .com domains
- **Google Domains** - Easy DNS management

Example: `glamourcuts.in` or `clientsalonname.com`

### Step 3: Server Setup

SSH into your server:
```bash
ssh root@YOUR_SERVER_IP
```

Run these commands:
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Install MySQL
apt install -y mysql-server
mysql_secure_installation

# Install Nginx
apt install -y nginx

# Install PM2 (process manager)
npm install -g pm2

# Install Certbot for SSL
apt install -y certbot python3-certbot-nginx
```

### Step 4: Setup MySQL Database

```bash
# Login to MySQL
mysql -u root -p

# Create database and user
CREATE DATABASE glamour_salon;
CREATE USER 'salon_user'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON glamour_salon.* TO 'salon_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 5: Deploy the Application

```bash
# Create app directory
mkdir -p /var/www/salon
cd /var/www/salon

# Clone your repository (or upload files via SFTP)
git clone https://github.com/YOUR_USERNAME/salon-website.git .

# Install dependencies
cd server && npm install --production
cd ../client && npm install && npm run build

# Setup environment variables
cd ../server
nano .env
```

Add to `.env`:
```env
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com

DB_HOST=localhost
DB_PORT=3306
DB_USER=salon_user
DB_PASSWORD=YOUR_STRONG_PASSWORD
DB_NAME=glamour_salon

JWT_SECRET=generate-a-long-random-string-here
JWT_EXPIRES_IN=7d

ADMIN_EMAIL=owner@salon.com
ADMIN_PASSWORD=change-this-password
SALON_WHATSAPP_NUMBER=91XXXXXXXXXX
```

```bash
# Initialize database
npm run setup

# Start the server with PM2
pm2 start index.js --name "salon-api"
pm2 save
pm2 startup
```

### Step 6: Configure Nginx

```bash
nano /etc/nginx/sites-available/salon
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend (React build)
    location / {
        root /var/www/salon/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/salon /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 7: Setup SSL (HTTPS)

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Step 8: Point Domain to Server

In your domain registrar's DNS settings:
- Add an **A Record**: `@` → `YOUR_SERVER_IP`
- Add an **A Record**: `www` → `YOUR_SERVER_IP`

Wait 5-30 minutes for DNS propagation.

---

## Option 2: Easy Deployment with Railway (Recommended for Beginners)

### Step 1: Push to GitHub

```bash
cd /path/to/salon-website
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/salon-website.git
git push -u origin main
```

### Step 2: Deploy on Railway

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub Repo"
4. Select your salon-website repository
5. Add a **MySQL** service from "Add Service"
6. Configure environment variables (see Step 5 above)
7. Railway auto-deploys on every push!

Cost: Free tier available, ~$5-10/month for production

---

## Option 3: Vercel (Frontend) + PlanetScale (Database) + Railway (Backend)

This is a hybrid approach for better performance:

1. **Frontend on Vercel** (free): Fast CDN, auto SSL
2. **Database on PlanetScale** (free tier): Managed MySQL
3. **Backend on Railway** ($5/month): Node.js API

---

## For Each New Client

When you sell to a new salon owner:

### 1. Create a New Database
```sql
CREATE DATABASE client_salon_name;
```

### 2. Update Environment Variables
- Change `DB_NAME` to the new database
- Update `SALON_WHATSAPP_NUMBER`
- Set new `ADMIN_EMAIL` and `ADMIN_PASSWORD`

### 3. Run Database Setup
```bash
npm run setup
```

### 4. Client Customization
Have the client login to `/admin` and update:
- Salon name and tagline
- Contact details (phone, WhatsApp, email)
- Address and location
- Working hours
- Services and pricing
- Team members (stylists)

---

## Maintenance Commands

```bash
# View logs
pm2 logs salon-api

# Restart server
pm2 restart salon-api

# Update application
cd /var/www/salon
git pull
cd client && npm run build
cd ../server && npm install
pm2 restart salon-api

# Database backup
mysqldump -u salon_user -p glamour_salon > backup_$(date +%Y%m%d).sql
```

---

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong MySQL password
- [ ] Enable firewall (`ufw allow 22,80,443`)
- [ ] Keep server updated (`apt update && apt upgrade`)
- [ ] Setup automatic backups
- [ ] Use HTTPS everywhere

---

## Pricing Suggestions for Clients

| Plan | Setup Fee | Monthly | Includes |
|------|-----------|---------|----------|
| Basic | ₹5,000 | ₹500 | Website, Admin Panel, Basic Support |
| Standard | ₹10,000 | ₹1,000 | + WhatsApp Notifications, Priority Support |
| Premium | ₹20,000 | ₹2,000 | + Custom Domain, SEO, Google My Business |

---

## Support

For technical issues, check:
- Server logs: `pm2 logs salon-api`
- Nginx logs: `tail -f /var/log/nginx/error.log`
- MySQL status: `systemctl status mysql`


