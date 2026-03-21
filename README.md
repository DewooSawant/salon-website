# ✂️ Glamour Cuts - Premium Hair Salon Website

A modern, full-stack website for **Glamour Cuts** salon located in Keshav Nagar, Pune. Built with React and Node.js.

![Glamour Cuts](https://img.shields.io/badge/Glamour%20Cuts-Premium%20Salon-gold)
![React](https://img.shields.io/badge/React-18.2-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)

## 🌟 Features

### Customer Features
- 📱 **Responsive Design** - Beautiful on all devices
- 📅 **Online Booking** - Easy appointment scheduling
- 💈 **Service Catalog** - Browse all services with pricing
- 👥 **Team Showcase** - Meet our expert stylists
- 🖼️ **Gallery** - View our work
- ⭐ **Testimonials** - Read customer reviews
- 💬 **WhatsApp Integration** - Quick contact
- 📍 **Location & Contact** - Easy to find us

### Technical Features
- ⚡ **Fast & Modern** - Built with Vite + React
- 🎨 **Stunning UI** - Tailwind CSS + Framer Motion animations
- 🗄️ **SQLite Database** - Simple, file-based database
- 🔒 **Form Validation** - Secure input handling
- 📊 **Booking Management** - Track all appointments

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone or download the project**
   ```bash
   cd salon-website
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Start development servers**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📁 Project Structure

```
salon-website/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── assets/         # Images, fonts
│   │   ├── App.jsx         # Main app component
│   │   └── index.css       # Global styles
│   ├── public/             # Static files
│   └── package.json
│
├── server/                 # Node.js Backend
│   ├── routes/             # API routes
│   ├── db/                 # Database files
│   ├── index.js            # Server entry
│   └── package.json
│
├── package.json            # Root package
└── README.md
```

## 🎨 Customization Guide

### Update Salon Information

1. **Contact Details** - Edit `client/src/components/Contact.jsx`
   - Address
   - Phone numbers
   - Email
   - Working hours

2. **Services & Pricing** - Edit `client/src/components/Services.jsx` and `Pricing.jsx`
   - Service names
   - Prices
   - Durations

3. **Team Members** - Edit `client/src/components/Team.jsx`
   - Staff names
   - Roles
   - Experience

4. **WhatsApp Number** - Edit `client/src/components/WhatsAppButton.jsx`
   ```javascript
   const phoneNumber = '91XXXXXXXXXX' // Your WhatsApp number
   ```

### Change Colors & Theme

Edit `client/tailwind.config.js`:
```javascript
colors: {
  gold: {
    // Your brand colors
    500: '#c9a03e',
  }
}
```

## 🔌 API Endpoints

### Bookings
- `GET /api/bookings` - List all bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/:id` - Get booking details
- `PATCH /api/bookings/:id/status` - Update status
- `GET /api/bookings/available-slots/:date` - Get available slots

### Services
- `GET /api/services` - List all services
- `GET /api/services/stylists` - List all stylists

### Contact
- `POST /api/contact` - Submit contact form
- `GET /api/contact` - List messages (admin)

## 📱 Deployment

### Option 1: Simple Hosting (Recommended for shop owners)

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Deploy to hosting**
   - Upload `client/dist` folder to any static hosting
   - Popular options: Netlify, Vercel, Hostinger

3. **Backend hosting**
   - Deploy server folder to Railway, Render, or DigitalOcean

### Option 2: VPS Deployment

1. SSH into your server
2. Clone the repository
3. Install dependencies
4. Use PM2 to run the server:
   ```bash
   pm2 start server/index.js --name "salon-api"
   ```

## 💡 Tips for Shop Owners

1. **Update photos regularly** - Add real photos of your work
2. **Keep prices updated** - Sync with your actual pricing
3. **Check bookings daily** - Respond to appointments promptly
4. **Share on social media** - Use the website link everywhere

## 🤝 Support

For any questions or customization help, contact the developer or check the documentation.

---

Made with ❤️ for Glamour Cuts, Keshav Nagar, Pune

© 2024 Glamour Cuts. All rights reserved.

