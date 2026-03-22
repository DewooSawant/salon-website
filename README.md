# Stylo - Salon Marketplace & Management Platform

A full-stack salon marketplace platform that helps salon owners manage their business and customers discover & book salons nearby. Built for the Indian market, starting with Pune.

**Live:** [stylo.sbs](https://stylo.sbs)

![React](https://img.shields.io/badge/React-18-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)
![Redis](https://img.shields.io/badge/Redis-Cache-red)
![Socket.IO](https://img.shields.io/badge/Socket.IO-WebSocket-black)

## What is Stylo?

Stylo is a **Salon Operating System** — not just a booking app. It solves the real problems Indian salon owners face: paper billing, no customer tracking, no revenue visibility, and manual staff management.

### For Salon Owners
- **Walk-in Billing** — Bill customers in 3 taps. Cash, UPI, Card tracked automatically
- **Customer CRM** — Full customer history, visit frequency, spending patterns, VIP tagging
- **Analytics Dashboard** — Revenue trends, top services, peak hours, stylist performance
- **Staff Pay Management** — Salary, commission %, monthly payments, printable salary slips
- **Online Booking Page** — Customers book 24/7 from your salon's dedicated page
- **Real-time Notifications** — Instant alerts via WebSocket when customers book
- **WhatsApp Integration** — Send bill receipts and booking confirmations in one tap
- **Daily Register** — Complete daily report with payment breakdown and insights

### For Customers
- **Discover Salons** — Find salons nearby using location-based search (Haversine formula)
- **Browse & Compare** — View services, prices, ratings, and reviews
- **Book Instantly** — Select services, pick time slot, confirm in seconds
- **Track Bookings** — View booking history, status, and booking codes
- **Phone + OTP Login** — No passwords, login with mobile number

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL |
| **Cache** | Redis (query caching, OTP storage) |
| **Real-time** | Socket.IO (WebSocket notifications) |
| **Auth** | JWT with role-based expiry (7d customer, 24h owner) |
| **OTP** | Pluggable SMS (MSG91, Twilio, Textlocal) with Redis storage |
| **PWA** | Service Worker, installable, offline support, update detection |
| **Deployment** | Vercel (frontend), Railway (backend + PostgreSQL + Redis) |
| **Domain** | Custom domain with SSL (stylo.sbs) |

## Architecture Highlights

- **N+1 Query Prevention** — All list endpoints use JOIN aggregations instead of loops
- **Parallel Query Execution** — Dashboard, analytics, and list pages run all DB queries in `Promise.all`
- **Redis Caching** — Analytics cached for 60s, salon discovery cached by location grid
- **WebSocket Notifications** — Replaced HTTP polling with Socket.IO for instant booking alerts
- **Haversine Distance** — Custom SQL function for nearby salon search without PostGIS dependency
- **Exponential Backoff** — Network failures handled gracefully with retry logic
- **Customer Autocomplete** — Debounced search for returning customers during billing (300ms)
- **Stylist-aware Slot Availability** — Booking slots check per-stylist capacity, not just salon-wide

## Project Structure

```
salon-website/
├── client/                          # React Frontend
│   ├── src/
│   │   ├── components/marketplace/  # Shared components (Navbar, Layout, NotificationBell)
│   │   ├── pages/marketplace/       # All pages (30+ pages)
│   │   ├── context/                 # Auth context (Customer, Admin)
│   │   └── App.jsx                  # Route definitions
│   ├── public/
│   │   ├── screenshots/             # Product screenshots for marketing
│   │   ├── sw.js                    # Service Worker (PWA)
│   │   ├── manifest.json            # PWA manifest
│   │   ├── pitch.html               # Printable business cards & flyers
│   │   └── whatsapp-templates.html  # WhatsApp outreach message templates
│   └── package.json
│
├── server/                          # Node.js Backend
│   ├── routes/
│   │   ├── salon-owner.js           # Salon owner APIs (30+ endpoints)
│   │   ├── salons.js                # Public salon discovery
│   │   ├── marketplace-bookings.js  # Customer booking flow
│   │   ├── otp-auth.js              # Phone + OTP authentication
│   │   └── customers.js             # Customer profile & bookings
│   ├── services/
│   │   ├── socket.js                # Socket.IO setup & room management
│   │   └── otp.js                   # OTP generation, Redis storage, SMS providers
│   ├── middleware/
│   │   └── auth_v2.js               # JWT auth with role-based tokens
│   ├── db/
│   │   ├── config_pg.js             # PostgreSQL connection pool
│   │   ├── redis.js                 # Redis client + cache wrapper
│   │   └── migration_v2_postgres.sql # Full schema
│   └── package.json
└── README.md
```

## Key Pages

| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Hero, search, featured salons, categories |
| Discover | `/discover` | Location-based salon search with filters |
| Salon Profile | `/salon/:slug` | Service menu, booking modal, reviews |
| For Salon Owners | `/for-salon-owners` | Marketing landing page with screenshots |
| Dashboard | `/salon-owner/dashboard` | Stats, quick billing, recent bookings |
| Walk-in Billing | `/salon-owner/walkin` | Full POS with service grid, stylist, payment |
| Analytics | `/salon-owner/analytics` | Revenue charts, top services, peak hours |
| Customers | `/salon-owner/customers` | CRM with segments, history, search |
| Staff Pay | `/salon-owner/staff-pay` | Salary, commission, payment records, slips |
| Bookings | `/salon-owner/bookings` | All bookings with status management |
| Daily Register | `/salon-owner/daily-report` | Daily revenue, payment breakdown, insights |

## API Overview

### Public
- `GET /api/salons/nearby` — Location-based salon search
- `GET /api/salons/:slug` — Salon profile with services, stylists, reviews
- `GET /api/salons/:slug/available-slots/:date` — Time slot availability
- `POST /api/marketplace/bookings` — Create booking
- `POST /api/otp/send` — Send OTP
- `POST /api/otp/verify/customer` — Verify customer OTP

### Salon Owner (30+ endpoints)
- `GET /api/salon-owner/dashboard` — Parallel stats (7 queries in Promise.all)
- `GET /api/salon-owner/analytics` — 9 parallel queries + Redis cache
- `GET /api/salon-owner/customers` — CRM with segments
- `GET /api/salon-owner/customers/search` — Autocomplete for billing
- `POST /api/salon-owner/walkin` — Walk-in billing
- `GET /api/salon-owner/staff-payments` — Staff salary/commission
- `GET /api/salon-owner/notifications` — Real-time via WebSocket

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- Redis

### Setup

```bash
# Clone
git clone https://github.com/DewooSawant/salon-website.git
cd salon-website

# Install dependencies
cd client && npm install && cd ../server && npm install && cd ..

# Set up database
psql -d salon_marketplace -f server/db/migration_v2_postgres.sql
psql -d salon_marketplace -f server/db/migration_staff_pay.sql

# Environment variables (server/.env)
DATABASE_URL=postgresql://user:pass@localhost:5432/salon_marketplace
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key

# Start development
cd server && npm start &
cd client && npm run dev
```

Frontend: http://localhost:3000
Backend: http://localhost:5000

## Deployment

- **Frontend:** Vercel (auto-deploys on push to main)
- **Backend:** Railway (auto-deploys on push to main)
- **Database:** Railway PostgreSQL
- **Cache:** Railway Redis
- **Domain:** stylo.sbs (Hostinger DNS → Vercel + Railway)

## Marketing Kit

- `/pitch.html` — Printable business cards (8/page) + A4 flyers (English & Marathi)
- `/whatsapp-templates.html` — Copy-paste WhatsApp outreach messages
- `/for-salon-owners` — Salon owner landing page with product screenshots

---

Built by [Dewoo Sawant](https://github.com/DewooSawant) | Pune, India
