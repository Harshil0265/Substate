# SUBSTATE - Quick Start Guide

## One-Time Setup

### 1. Install MongoDB

**Option A: Local MongoDB**
```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Linux (Ubuntu)
sudo apt-get install -y mongodb
sudo systemctl start mongodb

# Windows
# Download from https://www.mongodb.com/try/download/community
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a cluster
4. Copy connection string: `mongodb+srv://user:password@cluster.mongodb.net/substate`
5. Update `MONGODB_URI` in `.env`

### 2. Install Node Dependencies
```bash
pnpm install
# or: npm install
```

### 3. Seed Database (500+ users, 1500+ campaigns, 5000+ articles)
```bash
pnpm seed
```

## Running the Application

### Quick Start (2 Terminals)

**Terminal 1 - Frontend**
```bash
pnpm dev
# Visit http://localhost:5173
```

**Terminal 2 - Backend**
```bash
pnpm server
# API runs on http://localhost:5000
```

## Test Login Credentials

After seeding, use any email format to login:
- Email: `user0_123456789@gmail.com` (or any user0-user499)
- Password: `password123`

## What's Included

✅ Complete React + Vite frontend with:
- Landing page (SEO-optimized)
- Login & Register pages
- Dashboard with real metrics
- Campaign management
- Article editor
- Subscription management
- Admin panel
- Settings page

✅ Complete Express backend with:
- JWT authentication
- User management
- Campaign CRUD operations
- Article management
- Risk scoring system
- 500+ synthetic users
- 1500+ campaigns
- 5000+ articles

✅ Professional UI Design:
- Notion-inspired components
- Dark mode aesthetic
- Responsive layouts
- Smooth animations
- Professional SaaS fonts

✅ SEO Optimization:
- Meta tags management
- Structured data
- Semantic HTML
- Mobile-friendly
- Fast performance

## Directory Structure

```
src/                # React frontend code
backend/            # Express backend code
scripts/            # Utility scripts
vite.config.js      # Vite configuration
server.js           # Express server
package.json        # Dependencies & scripts
.env               # Environment configuration
```

## Common Commands

```bash
# Development
pnpm dev            # Run Vite dev server
pnpm server         # Run Express server
pnpm build          # Build for production

# Database
pnpm seed           # Seed 500+ users

# Utilities
pnpm preview        # Preview production build
```

## Architecture Overview

```
┌─────────────────────────┐
│   React Frontend        │
│  (Vite + TailwindCSS)   │
└────────────┬────────────┘
             │ Axios API calls
             │ (JWT auth in headers)
┌────────────▼────────────┐
│  Express.js Backend     │
│  (/api routes)          │
└────────────┬────────────┘
             │ Mongoose queries
┌────────────▼────────────┐
│  MongoDB Database       │
│  (5 main collections)   │
└─────────────────────────┘
```

## Data Models

### User
- Email, name, password hash
- Subscription status (TRIAL, ACTIVE, FAILED, SUSPENDED)
- Article & campaign counts
- Risk score

### Campaign
- Title, description, status
- Campaign type & target audience
- Engagement metrics
- Associated articles

### Article
- Title, content, slug
- Status (DRAFT, REVIEW, PUBLISHED, ARCHIVED)
- SEO score & keywords
- Views, likes, shares

### Payment
- Transaction ID & amount
- Payment method (Razorpay, Stripe, etc.)
- Plan type & billing period
- Status tracking

### RiskScore
- Overall churn risk
- Payment failure risk
- Inactivity risk
- Recommended actions

## Next Steps

1. **Customize branding:**
   - Update colors in `src/styles/globals.css`
   - Replace logos in `public/`
   - Update copy in pages

2. **Add integrations:**
   - OpenAI for content generation
   - Razorpay for payments
   - WordPress integration
   - Email service (SendGrid, Mailgun)

3. **Deploy:**
   - Frontend: Vercel, Netlify
   - Backend: Render, Railway, Fly.io
   - Database: MongoDB Atlas

4. **Monitoring:**
   - Add error tracking (Sentry)
   - Analytics (PostHog, Mixpanel)
   - Performance monitoring

## Troubleshooting

**Port 5173 already in use:**
```bash
# Change port in vite.config.js
export default {
  server: {
    port: 3000  // Use different port
  }
}
```

**MongoDB connection error:**
- Ensure MongoDB is running: `brew services list`
- Check MONGODB_URI in `.env`
- For Atlas: verify IP whitelist allows your IP

**API not responding:**
- Check backend is running: `pnpm server`
- Verify VITE_API_URL in `.env`
- Check CORS configuration in `server.js`

**Authentication failing:**
- Clear localStorage: DevTools → Application → Storage → Local Storage
- Check JWT_SECRET is set
- Verify token is sent in request headers

## Support

For issues or questions:
1. Check logs in terminal
2. Verify environment variables in `.env`
3. Ensure both frontend and backend are running
4. Check MongoDB connection

Happy building! 🚀
