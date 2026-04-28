# Vercel Deployment Guide - SUBSTATE

## Overview
This guide will help you deploy both frontend and backend to Vercel.

## Prerequisites
- Vercel account (https://vercel.com)
- Vercel CLI installed: `npm i -g vercel`
- MongoDB Atlas account for production database

## Configuration Files
✅ `vercel.json` - Already configured for serverless deployment
✅ `server.js` - Updated to export for Vercel

## Step-by-Step Deployment

### 1. Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Set Environment Variables in Vercel Dashboard

Go to your Vercel project settings and add these environment variables:

**Required Variables:**
- `MONGODB_URI` - Your MongoDB Atlas connection string
- `JWT_SECRET` - Your JWT secret key
- `RAZORPAY_KEY_ID` - Razorpay API key
- `RAZORPAY_KEY_SECRET` - Razorpay secret
- `SMTP_HOST` - Email SMTP host
- `SMTP_PORT` - Email SMTP port
- `SMTP_USER` - Email username
- `SMTP_PASS` - Email password
- `SMTP_FROM` - From email address
- `GOOGLE_API_KEY` - Google API key (for images)
- `OPENAI_API_KEY` - OpenAI API key
- `NODE_ENV` - Set to `production`

### 4. Deploy to Vercel

**Option A: Deploy via CLI**
```bash
# From project root
vercel

# For production deployment
vercel --prod
```

**Option B: Deploy via Git Integration**
1. Push your code to GitHub
2. Import project in Vercel dashboard
3. Connect your GitHub repository
4. Vercel will auto-deploy on every push to main branch

### 5. Verify Deployment

After deployment, test these endpoints:

- **Frontend**: `https://your-project.vercel.app`
- **API Health**: `https://your-project.vercel.app/api/health`
- **API Routes**: `https://your-project.vercel.app/api/*`

## Important Notes

### Serverless Functions
- Backend runs as serverless functions on Vercel
- Each API request creates a new function instance
- Functions have a 30-second timeout (configured in vercel.json)

### Database Connection
- Use MongoDB Atlas (cloud) for production
- Local MongoDB won't work on Vercel
- Connection pooling is handled automatically

### Scheduled Tasks
⚠️ **Important**: Vercel serverless functions don't support long-running processes or cron jobs.

For scheduled tasks (ReminderService, CampaignAutomationService, ArticleCleanupService):
- Use Vercel Cron Jobs (https://vercel.com/docs/cron-jobs)
- Or use external services like:
  - Vercel Cron (recommended)
  - GitHub Actions
  - Render Cron Jobs
  - EasyCron
  - Cron-job.org

### File Uploads
- Vercel has a 4.5MB request body limit
- For larger files, use external storage (AWS S3, Cloudinary, etc.)

### Environment Variables
- Set all environment variables in Vercel dashboard
- Never commit `.env` files to Git
- Use `.env.example` as a template

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
vercel --force
```

### API Routes Not Working
- Check vercel.json routes configuration
- Ensure all API routes start with `/api/`
- Check function logs in Vercel dashboard

### Database Connection Issues
- Verify MongoDB Atlas connection string
- Check IP whitelist in MongoDB Atlas (allow all: 0.0.0.0/0)
- Ensure database user has correct permissions

### Environment Variables Not Loading
- Redeploy after adding new environment variables
- Check variable names match exactly (case-sensitive)

## Monitoring

### View Logs
```bash
vercel logs
```

### View in Dashboard
- Go to Vercel dashboard
- Select your project
- Click "Functions" tab to see serverless function logs

## Updating Deployment

### Update Code
```bash
git add .
git commit -m "Update message"
git push origin main
# Vercel auto-deploys if Git integration is enabled
```

### Manual Deploy
```bash
vercel --prod
```

## Cost Considerations

**Vercel Free Tier Includes:**
- 100GB bandwidth per month
- Serverless function executions
- Automatic HTTPS
- Global CDN

**Paid Plans:**
- Pro: $20/month (more bandwidth, faster builds)
- Enterprise: Custom pricing

## Alternative: Separate Backend Hosting

If you need long-running processes or cron jobs, consider:
- **Render.com** - Free tier with cron jobs
- **Railway.app** - $5/month with persistent processes
- **Heroku** - $7/month with worker dynos
- **DigitalOcean App Platform** - $5/month

Keep frontend on Vercel, host backend separately, and update API URLs in frontend.

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel Discord: https://vercel.com/discord
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com

---

**Last Updated**: April 28, 2026
**Project**: SUBSTATE - AI Content Generation Platform
