# SUBSTATE - Deployment Guide

Complete guide for deploying SUBSTATE to production environments.

## Prerequisites

- Docker (optional, for containerization)
- Git account (GitHub, GitLab, or Bitbucket)
- Production database (MongoDB Atlas recommended)
- CDN (optional, for static assets)

## Environment Setup

### Production Environment Variables

Update your `.env.production`:

```env
# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/substate

# Server
PORT=5000
NODE_ENV=production

# JWT
JWT_SECRET=generate-a-strong-random-secret-key-here

# API
VITE_API_URL=https://your-api-domain.com

# Third-party Services
OPENAI_API_KEY=sk-your-production-key
RAZORPAY_KEY_ID=your-razorpay-production-key
RAZORPAY_KEY_SECRET=your-razorpay-production-secret
```

## Deployment Options

### Option 1: Vercel (Recommended for Frontend)

Vercel provides zero-config deployment for React/Vite apps with excellent performance.

**Steps:**

1. Push code to GitHub:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. Connect to Vercel:
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Select "Vite" as framework

3. Set environment variables:
   - In Vercel dashboard: Settings → Environment Variables
   - Add `VITE_API_URL=https://your-api-domain.com`

4. Deploy by merging to main branch (automatic)

**Vercel URL Example:** `https://substate.vercel.app`

### Option 2: Netlify (Alternative Frontend)

**Steps:**

1. Connect GitHub repository
2. Build settings:
   - Build command: `pnpm build`
   - Publish directory: `dist`

3. Add environment variables in Netlify UI

4. Deploy automatically on push to main

### Option 3: Railway (Full Stack - Recommended)

Railway allows deploying both frontend and backend from single repo.

**Steps:**

1. Create Railway project
2. Connect GitHub repository
3. Add MongoDB service (or use Atlas URI)
4. Deploy environment variables:

```bash
# For backend
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
```

5. Railway automatically detects and deploys both services

**Railway URL:** `https://substate.up.railway.app`

### Option 4: Render.com (Backend)

Good option for Express backend hosting.

**Steps:**

1. Create new Web Service on Render
2. Connect GitHub repository
3. Configuration:
   - Build command: `pnpm install`
   - Start command: `pnpm server`
   - Environment: Node
   - Node version: 18

4. Set environment variables in dashboard

5. Deploy

**Render URL:** `https://substate.onrender.com`

### Option 5: Docker + Cloud Run / ECS

For containerized deployment (Google Cloud Run, AWS ECS, etc.).

**Dockerfile:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

# Build frontend
COPY . .
RUN pnpm build

# Expose ports
EXPOSE 5000

# Start backend
CMD ["pnpm", "server"]
```

**Build and push:**

```bash
# For Google Cloud Run
gcloud builds submit --tag gcr.io/PROJECT_ID/substate
gcloud run deploy substate --image gcr.io/PROJECT_ID/substate

# For Docker Hub
docker build -t yourusername/substate .
docker push yourusername/substate
```

## Database Setup

### MongoDB Atlas (Recommended)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster (M0 free tier is sufficient for testing)
3. Create database user with strong password
4. Whitelist IP addresses (or allow all: 0.0.0.0)
5. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/substate`
6. Update `MONGODB_URI` in `.env`
7. Run seeding in production environment:

```bash
pnpm seed
```

### Self-Hosted MongoDB

1. Install MongoDB on server
2. Configure authentication
3. Create database: `substate`
4. Update `MONGODB_URI` to connection string
5. Run seeding script

## Performance Optimization

### Frontend Optimization

1. **Code splitting:**
   - Vite automatically code-splits route components
   - Lazy load heavy components with React.lazy()

2. **Image optimization:**
   - Use WebP format
   - Lazy load with `loading="lazy"`
   - Compress with ImageOptim or TinyPNG

3. **Caching:**
   - Set cache headers: `Cache-Control: max-age=31536000` for assets
   - CDN configuration for static files

4. **Minification:**
   - Run `pnpm build` (Vite auto-minifies)
   - Verify bundle size: `npm install -g vite && vite build --report`

### Backend Optimization

1. **Database indexing:**
   - Already included in Mongoose models
   - Monitor query performance with MongoDB Atlas

2. **API rate limiting:**
   - Add express-rate-limit for production

3. **Compression:**
   - Add gzip compression middleware

```javascript
import compression from 'compression'
app.use(compression())
```

4. **Caching:**
   - Implement Redis for session/data caching
   - Add response caching middleware

### Add Caching Middleware

```javascript
// backend/middleware/cache.js
export const cacheMiddleware = (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=3600')
  next()
}
```

## Security Checklist

- [ ] Set strong `JWT_SECRET` (32+ characters)
- [ ] Enable HTTPS only (SSL/TLS certificate)
- [ ] Set CORS to only allow your domain
- [ ] Enable rate limiting on API
- [ ] Use environment variables for secrets
- [ ] Validate all user inputs
- [ ] Enable CSRF protection
- [ ] Set security headers (HSTS, CSP)
- [ ] Regular security audits with `npm audit`
- [ ] Monitor for vulnerabilities

### Security Headers

Add to Express middleware:

```javascript
import helmet from 'helmet'
app.use(helmet())
```

### Input Validation

```javascript
import { body, validationResult } from 'express-validator'

app.post('/api/articles', 
  body('title').trim().isLength({ min: 5 }),
  body('content').trim().isLength({ min: 20 }),
  (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors })
    }
    // Process request
  }
)
```

## Monitoring & Logging

### Error Tracking

**Sentry Integration:**

```bash
pnpm add @sentry/react @sentry/node
```

**Frontend:**
```javascript
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
})
```

**Backend:**
```javascript
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
})
```

### Analytics

**PostHog or Google Analytics:**

```javascript
import posthog from 'posthog-js'

posthog.init('your-api-key', {
  api_host: 'https://app.posthog.com',
})
```

### Logging

**Winston Logger:**

```bash
pnpm add winston
```

```javascript
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
})
```

## CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build
        run: pnpm build
      
      - name: Run tests
        run: pnpm test
      
      - name: Deploy frontend
        run: pnpm run deploy:frontend
      
      - name: Deploy backend
        run: pnpm run deploy:backend
```

## Backup & Disaster Recovery

1. **Database backups:**
   - MongoDB Atlas: Automatic daily backups
   - Enable point-in-time recovery

2. **Code backups:**
   - Use GitHub with protected main branch
   - Regular local backups

3. **Version control:**
   - Tag releases: `git tag v1.0.0`
   - Maintain changelog

## Cost Estimation (Monthly)

- Vercel Frontend: Free - $20/month
- Railway Backend: Free - $25/month
- MongoDB Atlas M0: Free
- **Total: Free - $45/month** for reasonable traffic

## Scaling Considerations

### Horizontal Scaling

1. Load balancer (distribute traffic)
2. Multiple backend instances
3. Session management (Redis/MongoDB)
4. Database replication

### Vertical Scaling

1. Increase server resources
2. Database optimization
3. Caching strategies
4. CDN for assets

## Monitoring Checklist

- [ ] Set up error tracking (Sentry)
- [ ] Enable performance monitoring
- [ ] Create uptime alerts
- [ ] Monitor database performance
- [ ] Track API response times
- [ ] Monitor server resources (CPU, memory)
- [ ] Review logs regularly
- [ ] Set up automated backups

## Post-Deployment

1. Verify all features work
2. Run load testing with k6 or Apache JMeter
3. Check SEO with Google Search Console
4. Test on mobile devices
5. Verify analytics tracking
6. Set up customer support channels
7. Create runbook for incidents
8. Schedule regular reviews

---

**Ready to deploy? Start with Vercel + Railway for easiest setup!**
