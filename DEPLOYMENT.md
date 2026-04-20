# 🚀 Deployment Guide

Complete guide to deploy SUBSTATE to GitHub and Vercel.

## 📋 Prerequisites

- GitHub account
- Vercel account (sign up at vercel.com)
- MongoDB Atlas account (for production database)
- Git installed on your machine

## 🔧 Step 1: Prepare for Deployment

### 1.1 Check Environment Variables

Ensure your `.env.example` file is up to date:

```bash
# Check if .env.example exists and has all required variables
cat .env.example
```

### 1.2 Build Test

Test if the project builds successfully:

```bash
pnpm run build
```

If successful, you should see a `dist` folder created.

## 📦 Step 2: Push to GitHub

### 2.1 Initialize Git (if not already done)

```bash
git init
```

### 2.2 Add All Files

```bash
git add .
```

### 2.3 Commit Changes

```bash
git commit -m "Initial commit - SUBSTATE platform ready for deployment"
```

### 2.4 Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click "New repository"
3. Name it: `substate` (or your preferred name)
4. Don't initialize with README (we already have one)
5. Click "Create repository"

### 2.5 Push to GitHub

```bash
# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/substate.git

# Push to main branch
git branch -M main
git push -u origin main
```

## 🌐 Step 3: Deploy to Vercel

### 3.1 Import Project

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Select the `substate` repository

### 3.2 Configure Project

**Framework Preset:** Vite
**Root Directory:** ./
**Build Command:** `npm run build`
**Output Directory:** `dist`
**Install Command:** `npm install`

### 3.3 Add Environment Variables

Click "Environment Variables" and add these:

#### Required Variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/substate
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
JWT_REMEMBER_ME_EXPIRY=30d
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@substate.com
NODE_ENV=production
PORT=5000
```

#### Optional Variables (for full functionality):

```
OPENAI_API_KEY=sk-your-openai-key
RAZORPAY_KEY_ID=rzp_live_your_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

**Note:** Razorpay is configured with LIVE keys for production payments. Ensure you're using the correct keys for your environment.

### 3.4 Deploy

Click "Deploy" and wait for the build to complete (usually 2-3 minutes).

## 🗄️ Step 4: Setup MongoDB Atlas

### 4.1 Create Cluster

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Choose a cloud provider and region
4. Create cluster (takes 3-5 minutes)

### 4.2 Create Database User

1. Go to "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create username and strong password
5. Set role to "Read and write to any database"
6. Click "Add User"

### 4.3 Whitelist IP Address

1. Go to "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for Vercel)
4. Or add: `0.0.0.0/0`
5. Click "Confirm"

### 4.4 Get Connection String

1. Go to "Database" → "Connect"
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `<dbname>` with `substate`

Example:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/substate?retryWrites=true&w=majority
```

### 4.5 Update Vercel Environment Variable

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Update `MONGODB_URI` with your Atlas connection string
5. Click "Save"

## 📧 Step 5: Setup Email Service

### Option A: Gmail (Recommended for testing)

1. Enable 2-Factor Authentication on your Google account
2. Generate App Password:
   - Go to Google Account → Security
   - Click "2-Step Verification"
   - Scroll to "App passwords"
   - Generate password for "Mail"
3. Use this password in `EMAIL_PASS`

### Option B: SendGrid (Recommended for production)

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create API key
3. Update email configuration in code to use SendGrid

## 🔄 Step 6: Redeploy

After adding all environment variables:

1. Go to Vercel Dashboard
2. Click "Deployments"
3. Click "Redeploy" on the latest deployment
4. Or push a new commit to trigger automatic deployment

## ✅ Step 7: Verify Deployment

### 7.1 Check Deployment Status

1. Wait for deployment to complete
2. Click "Visit" to open your live site
3. Your app should be live at: `https://your-project.vercel.app`

### 7.2 Test Core Features

1. **Homepage**: Should load without errors
2. **Registration**: Try creating a new account
3. **Email Verification**: Check if OTP email is received
4. **Login**: Test login functionality
5. **Dashboard**: Access dashboard after login
6. **Campaigns**: Create a test campaign
7. **Subscription**: Try upgrading subscription
8. **Payment**: Test Razorpay payment flow with ₹10 or ₹20
9. **Payment Verification**: Ensure subscription activates after payment

### 7.3 Check Logs

If something doesn't work:

1. Go to Vercel Dashboard
2. Click "Deployments" → Latest deployment
3. Click "View Function Logs"
4. Check for errors

## 🔧 Troubleshooting

### Build Fails

**Error: Module not found**
```bash
# Solution: Ensure all dependencies are in package.json
pnpm install
git add package.json pnpm-lock.yaml
git commit -m "Update dependencies"
git push
```

**Error: Build timeout**
```bash
# Solution: Increase build timeout in vercel.json
# Already configured in the project
```

### Database Connection Issues

**Error: MongoServerError: Authentication failed**
- Check username and password in connection string
- Ensure database user has correct permissions
- Verify IP whitelist includes 0.0.0.0/0

**Error: Connection timeout**
- Check if MongoDB Atlas cluster is running
- Verify network access settings
- Ensure connection string is correct

### Email Not Sending

**Gmail: "Less secure app access"**
- Use App Password instead of regular password
- Enable 2-Factor Authentication first

**SendGrid: Emails not received**
- Verify sender email
- Check spam folder
- Verify API key is correct

### Environment Variables Not Working

1. Ensure variables are added in Vercel Dashboard
2. Redeploy after adding variables
3. Check variable names match exactly (case-sensitive)
4. No quotes needed in Vercel environment variables

## 🔄 Continuous Deployment

### Automatic Deployments

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Your commit message"
git push origin main

# Vercel will automatically deploy
```

### Preview Deployments

Create a new branch for testing:

```bash
git checkout -b feature/new-feature
# Make changes
git push origin feature/new-feature
```

Vercel creates a preview deployment for each branch!

## 🎯 Post-Deployment Tasks

### 1. Custom Domain (Optional)

1. Go to Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Wait for DNS propagation (up to 48 hours)

### 2. Setup Analytics

1. Enable Vercel Analytics in dashboard
2. Monitor performance and usage

### 3. Setup Monitoring

1. Configure error tracking (Sentry, LogRocket)
2. Setup uptime monitoring
3. Configure alerts

### 4. Seed Production Database

```bash
# Connect to production database
MONGODB_URI=your-production-uri node scripts/seed-database.js
```

### 5. Create Admin User

```bash
# Create admin account
MONGODB_URI=your-production-uri node scripts/create-admin.js
```

## 📊 Monitoring

### Check Application Health

- **Vercel Dashboard**: Monitor deployments and function logs
- **MongoDB Atlas**: Monitor database performance
- **Application Logs**: Check for errors in Vercel function logs

### Performance Optimization

1. Enable Vercel Edge Network
2. Configure caching headers
3. Optimize images and assets
4. Monitor Core Web Vitals

## 🔐 Security Checklist

- [ ] All environment variables are set
- [ ] JWT_SECRET is strong and unique (min 32 characters)
- [ ] MongoDB IP whitelist is configured
- [ ] Email credentials are secure
- [ ] Razorpay LIVE keys are properly configured
- [ ] Payment signature verification is working
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Input validation is working
- [ ] HTTPS is enforced

## 🎉 Success!

Your SUBSTATE platform is now live! 🚀

**Live URL**: `https://your-project.vercel.app`

### Next Steps:

1. Share the URL with your team
2. Test all features thoroughly
3. Monitor logs for any issues
4. Set up custom domain (optional)
5. Configure analytics and monitoring
6. Start using the platform!

## 📞 Need Help?

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **MongoDB Atlas Docs**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **GitHub Issues**: Create an issue in your repository

---

Happy Deploying! 🎊
