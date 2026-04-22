# 🚀 SUBSTATE - Revenue Intelligence & Content Automation Platform

> A comprehensive SaaS platform for tracking revenue intelligence, automating content creation, and optimizing customer lifecycle management with AI-powered tools.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-19-blue)](https://reactjs.org/)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Development](#-development)
- [Available Scripts](#-available-scripts)
- [API Documentation](#-api-documentation)
- [Database Models](#-database-models)
- [Email Templates](#-email-templates)
- [Subscription Plans](#-subscription-plans)
- [Security Features](#-security-features)
- [Deployment](#-deployment)
- [Environment Variables](#-environment-variables)
- [Contributing](#-contributing)
- [License](#-license)

## 🚀 Features

### Core Features
- **Revenue Intelligence**: Real-time analytics on customer value, churn prediction, and revenue forecasting
- **Content Automation**: AI-powered content generation using OpenAI/Groq integration
- **Campaign Management**: Create, manage, and track marketing campaigns with status monitoring
- **Article Generation**: Automated article creation with AI assistance and WordPress integration
- **Subscription Management**: Multi-tier subscription plans with automated billing
- **Payment Processing**: Integrated Razorpay payment gateway with live transactions
- **User Authentication**: Secure JWT-based authentication with email verification (OTP)
- **Dashboard Analytics**: Comprehensive analytics, usage tracking, and reporting
- **WordPress Integration**: Direct publishing to WordPress sites
- **Email Notifications**: Automated email campaigns with professional templates
- **Coupon System**: Discount codes and promotional campaigns
- **Usage Tracking**: Monitor API usage, campaigns, and article limits
- **Admin Panel**: Complete admin dashboard for user and payment management

### Advanced Features
- **Risk Scoring**: Customer churn risk assessment
- **Email Campaigns**: Automated email marketing campaigns
- **Content Moderation**: AI-powered content review
- **Invoice Generation**: Automated PDF invoice creation
- **Backup System**: Automated user data backups
- **Reminder Service**: Subscription renewal reminders
- **Token Management**: Secure JWT token refresh mechanism

## 🛠️ Tech Stack

### Frontend
- **React 19** - Latest React with concurrent features
- **React Router DOM 7** - Client-side routing
- **Framer Motion 12** - Advanced animations
- **Zustand 5** - Lightweight state management
- **Axios 1.15** - HTTP client
- **Radix UI** - Accessible component library
- **TailwindCSS 4** - Utility-first CSS framework
- **Lucide React** - Icon library
- **React Hook Form** - Form validation
- **Zod** - Schema validation
- **TipTap** - Rich text editor
- **Recharts** - Data visualization
- **React Helmet Async** - SEO management
- **Sonner** - Toast notifications

### Backend
- **Node.js 18+** - JavaScript runtime
- **Express 5** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose 9** - MongoDB ODM
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Nodemailer 8** - Email service
- **OpenAI SDK** - AI content generation
- **Groq SDK** - Alternative AI provider
- **Razorpay 2.9** - Payment gateway
- **PDFKit** - PDF generation
- **Node-Cron** - Scheduled tasks
- **CORS** - Cross-origin resource sharing

### Development Tools
- **Vite 8** - Build tool and dev server
- **Concurrently** - Run multiple commands
- **ESBuild** - Fast JavaScript bundler
- **TypeScript 5.7** - Type checking
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

## 📁 Project Structure

```
substate/
├── backend/
│   ├── middleware/
│   │   └── auth.js                    # JWT authentication middleware
│   ├── models/
│   │   ├── Article.js                 # Article schema
│   │   ├── Campaign.js                # Campaign schema
│   │   ├── Coupon.js                  # Coupon schema
│   │   ├── EmailVerification.js      # Email OTP schema
│   │   ├── Payment.js                 # Payment transaction schema
│   │   ├── RiskScore.js               # Churn risk schema
│   │   ├── User.js                    # User schema
│   │   └── WordPressIntegration.js   # WordPress config schema
│   ├── routes/
│   │   ├── admin.js                   # Admin routes
│   │   ├── articles.js                # Article CRUD routes
│   │   ├── auth.js                    # Authentication routes
│   │   ├── campaigns.js               # Campaign routes
│   │   ├── coupons.js                 # Coupon routes
│   │   ├── payments.js                # Payment routes
│   │   ├── users.js                   # User routes
│   │   └── wordpress.js               # WordPress integration routes
│   ├── services/
│   │   ├── ArticleManagementService.js
│   │   ├── CampaignAutomationService.js
│   │   ├── ContentModerationService.js
│   │   ├── CouponService.js
│   │   ├── EmailCampaignService.js
│   │   ├── EmailService.js            # Email templates & sending
│   │   ├── ImageService.js
│   │   ├── RazorpayService.js
│   │   ├── ReceiptService.js
│   │   ├── ReminderService.js
│   │   ├── TokenService.js
│   │   ├── UsageService.js
│   │   ├── WordPressService.js
│   │   └── WordPressSyncService.js
│   └── utils/
│       └── validators.js              # Input validation
├── src/
│   ├── api/
│   │   └── client.js                  # Axios configuration
│   ├── components/
│   │   ├── layout/
│   │   │   └── DashboardLayout.jsx
│   │   ├── AdminPaymentManagement.jsx
│   │   ├── AdminRoute.jsx
│   │   ├── AdminUsageStats.jsx
│   │   ├── ArticleAnalytics.jsx
│   │   ├── ArticleEditor.jsx
│   │   ├── BackToHome.jsx
│   │   ├── CouponSection.jsx
│   │   ├── Footer.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── PaymentManagement.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── ScrollToTop.jsx
│   │   ├── UsageTracker.jsx
│   │   ├── UserDetailsModal.jsx
│   │   ├── WordPressIntegration.jsx
│   │   └── WordPressPublisher.jsx
│   ├── hooks/
│   │   └── useScrollAnimation.js
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── Admin.jsx
│   │   │   └── ArticleManagement.jsx
│   │   ├── articles/
│   │   │   └── ArticleManagementUser.jsx
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── VerifyEmail.jsx
│   │   ├── campaigns/
│   │   │   ├── CampaignDashboard.jsx
│   │   │   └── Campaigns.jsx
│   │   ├── dashboard/
│   │   │   └── Dashboard.jsx
│   │   ├── payments/
│   │   │   └── PaymentHistory.jsx
│   │   ├── settings/
│   │   │   ├── Settings.jsx
│   │   │   └── WordPressSettings.jsx
│   │   ├── subscription/
│   │   │   └── Subscription.jsx
│   │   ├── About.jsx
│   │   ├── Contact.jsx
│   │   ├── Features.jsx
│   │   ├── Landing.jsx
│   │   ├── Services.jsx
│   │   └── Testimonials.jsx
│   ├── store/
│   │   └── authStore.js               # Zustand auth store
│   ├── styles/
│   │   ├── admin-payment-management.css
│   │   ├── admin.css
│   │   ├── animations.css
│   │   ├── auth.css
│   │   ├── dashboard-layout.css
│   │   ├── dashboard.css
│   │   ├── footer.css
│   │   ├── globals.css
│   │   ├── landing-pax.css
│   │   ├── pages.css
│   │   ├── payment-history-page.css
│   │   ├── payment-management.css
│   │   ├── settings.css
│   │   ├── usage-tracker.css
│   │   └── user-details-modal.css
│   ├── App.jsx
│   └── main.jsx
├── scripts/
│   ├── add-invoice-numbers.js         # Add invoice numbers to payments
│   ├── backup-users.js                # Backup user data
│   ├── create-admin.js                # Create admin user
│   ├── create-special-coupon.js       # Create promotional coupons
│   ├── generate-jwt-secret.js         # Generate JWT secret
│   ├── migrate-subscription-plans.js  # Migrate subscription data
│   ├── seed-database.js               # Seed initial data
│   └── send-coupon-email-professional.js # Send coupon emails
├── public/
│   ├── hero element.png               # Landing page hero image
│   ├── manifest.json                  # PWA manifest
│   └── substate-icon.svg              # Logo
├── .env.example                       # Environment variables template
├── .gitignore
├── index.html
├── package.json
├── server.js                          # Express server entry point
├── vercel.json                        # Vercel deployment config
└── vite.config.js                     # Vite configuration
```

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB
- pnpm (recommended) or npm

### Setup

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd substate
```

2. **Install dependencies**
```bash
pnpm install
# or
npm install
```

3. **Environment Setup**

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/substate

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# Email Service (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=SUBSTATE <noreply@substate.com>

# AI Services (Optional)
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk_...

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Frontend URL
VITE_API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173

# Environment
NODE_ENV=development
```

4. **Generate JWT Secret**
```bash
pnpm run generate-jwt
```

5. **Seed Database (Optional)**
```bash
pnpm run seed
```

## 🚀 Development

### Run Development Server
```bash
pnpm run dev
```

This will start:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

### Run Frontend Only
```bash
pnpm run client
```

### Run Backend Only
```bash
pnpm run server
```

## 📝 Available Scripts

### Development
- `pnpm run dev` - Run both frontend and backend concurrently
- `pnpm run client` - Run frontend only (Vite dev server)
- `pnpm run server` - Run backend only (Express server)
- `pnpm run build` - Build frontend for production
- `pnpm run preview` - Preview production build locally

### Database & Setup
- `pnpm run seed` - Seed database with sample data
- `pnpm run generate-jwt` - Generate secure JWT secret
- `pnpm run create-admin` - Create admin user interactively
- `pnpm run migrate-subscription-plans` - Migrate subscription data
- `pnpm run backup-users` - Backup user data to JSON

### Utilities
- `pnpm run add-invoice-numbers` - Add invoice numbers to payments
- `pnpm run send-coupon-professional` - Send promotional coupon emails

### Production
- `pnpm start` - Start production server
- `pnpm run vercel-build` - Build for Vercel deployment

## 🌐 Deployment

### Vercel Deployment (Recommended)

1. **Prepare Repository**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Deploy to Vercel**
- Visit [vercel.com](https://vercel.com)
- Click "New Project"
- Import your GitHub repository
- Configure project:
  - Framework Preset: Vite
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Install Command: `npm install`

3. **Add Environment Variables**
Go to Project Settings → Environment Variables and add all variables from `.env`:

```env
MONGODB_URI=<your-mongodb-uri>
JWT_SECRET=<your-jwt-secret>
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
EMAIL_SERVICE=gmail
EMAIL_USER=<your-email>
EMAIL_PASSWORD=<your-app-password>
EMAIL_FROM=SUBSTATE <noreply@substate.com>
OPENAI_API_KEY=<your-openai-key>
GROQ_API_KEY=<your-groq-key>
RAZORPAY_KEY_ID=<your-razorpay-key>
RAZORPAY_KEY_SECRET=<your-razorpay-secret>
VITE_API_URL=https://your-domain.vercel.app
FRONTEND_URL=https://your-domain.vercel.app
NODE_ENV=production
```

4. **Deploy**
- Click "Deploy"
- Wait for build to complete
- Your app will be live at `https://your-project.vercel.app`

### Manual Deployment

1. **Build Frontend**
```bash
pnpm run build
```

2. **Start Production Server**
```bash
NODE_ENV=production pnpm start
```

3. **Use Process Manager (PM2)**
```bash
npm install -g pm2
pm2 start server.js --name substate
pm2 save
pm2 startup
```

### MongoDB Atlas Setup

1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create new cluster
3. Add database user
4. Whitelist IP addresses (0.0.0.0/0 for all)
5. Get connection string
6. Replace `<password>` and `<dbname>` in connection string

### Razorpay Setup

1. Sign up at [razorpay.com](https://razorpay.com)
2. Complete KYC verification
3. Go to Settings → API Keys
4. Generate Live API Keys
5. Copy Key ID and Key Secret
6. Add to environment variables

### Gmail App Password Setup

1. Enable 2-Factor Authentication on Gmail
2. Go to Google Account → Security
3. Click "App passwords"
4. Generate new app password for "Mail"
5. Copy 16-character password
6. Use in `EMAIL_PASSWORD` environment variable

## 🔧 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | `your-super-secret-key-min-32-characters` |
| `EMAIL_USER` | Gmail address | `your-email@gmail.com` |
| `EMAIL_PASSWORD` | Gmail app password | `abcd efgh ijkl mnop` |
| `RAZORPAY_KEY_ID` | Razorpay public key | `rzp_live_xxxxxxxxxxxxx` |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key | `xxxxxxxxxxxxxxxxxxxxx` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for content generation | - |
| `GROQ_API_KEY` | Groq API key (alternative AI) | - |
| `JWT_ACCESS_TOKEN_EXPIRY` | Access token expiration | `15m` |
| `JWT_REFRESH_TOKEN_EXPIRY` | Refresh token expiration | `7d` |
| `EMAIL_SERVICE` | Email service provider | `gmail` |
| `EMAIL_FROM` | Email sender name | `SUBSTATE <noreply@substate.com>` |
| `VITE_API_URL` | Backend API URL | `http://localhost:5000` |
| `FRONTEND_URL` | Frontend URL | `http://localhost:5173` |
| `NODE_ENV` | Environment mode | `development` |

## 📚 API Documentation

### Authentication Endpoints
```
POST   /api/auth/register          - Register new user
POST   /api/auth/verify-email      - Verify email with OTP
POST   /api/auth/resend-otp        - Resend verification OTP
POST   /api/auth/login             - Login user
POST   /api/auth/logout            - Logout user
POST   /api/auth/refresh-token     - Refresh access token
GET    /api/auth/me                - Get current user
```

### Campaign Endpoints
```
GET    /api/campaigns              - Get all user campaigns
POST   /api/campaigns              - Create new campaign
GET    /api/campaigns/:id          - Get campaign by ID
PATCH  /api/campaigns/:id          - Update campaign
DELETE /api/campaigns/:id          - Delete campaign
GET    /api/campaigns/stats        - Get campaign statistics
```

### Article Endpoints
```
GET    /api/articles               - Get all user articles
POST   /api/articles               - Create new article
GET    /api/articles/:id           - Get article by ID
PATCH  /api/articles/:id           - Update article
DELETE /api/articles/:id           - Delete article
POST   /api/articles/generate      - Generate AI article
POST   /api/articles/:id/publish   - Publish to WordPress
```

### Payment Endpoints
```
GET    /api/payments/razorpay-config    - Get Razorpay public key
POST   /api/payments/create-order       - Create Razorpay order
POST   /api/payments/verify-payment     - Verify payment signature
GET    /api/payments/payment/:id        - Get payment details
GET    /api/payments/history            - Get payment history
POST   /api/payments/cancel-subscription - Cancel subscription
GET    /api/payments/invoice/:id        - Download invoice PDF
```

### User Endpoints
```
GET    /api/users/me                    - Get current user profile
PATCH  /api/users/profile               - Update user profile
GET    /api/users/subscription          - Get subscription details
GET    /api/users/usage/current         - Get current usage stats
GET    /api/users/usage/can-create-campaign - Check campaign limit
GET    /api/users/usage/can-create-article  - Check article limit
```

### Coupon Endpoints
```
POST   /api/coupons/validate            - Validate coupon code
GET    /api/coupons/available           - Get available coupons
POST   /api/coupons/apply               - Apply coupon to order
POST   /api/coupons/create              - Create coupon (admin)
GET    /api/coupons/:id/stats           - Get coupon statistics
```

### WordPress Endpoints
```
POST   /api/wordpress/connect           - Connect WordPress site
GET    /api/wordpress/sites             - Get connected sites
POST   /api/wordpress/publish           - Publish article to WordPress
DELETE /api/wordpress/disconnect/:id    - Disconnect site
```

### Admin Endpoints
```
GET    /api/admin/users                 - Get all users
GET    /api/admin/users/:id             - Get user details
PATCH  /api/admin/users/:id             - Update user
DELETE /api/admin/users/:id             - Delete user
GET    /api/admin/payments              - Get all payments
GET    /api/admin/stats                 - Get platform statistics
POST   /api/admin/coupons               - Create coupon
```

## 💳 Subscription Plans

### TRIAL (Starter) - ₹0
**14-Day Free Trial**
- ✅ Up to 5 campaigns
- ✅ 100 AI-generated articles/month
- ✅ Basic revenue analytics
- ✅ Email support
- ✅ 1 WordPress integration
- ✅ Customer value tracking

### PRO (Professional) - ₹10/month
**Most Popular**
- ✅ Unlimited campaigns
- ✅ 500 AI articles/month
- ✅ Advanced revenue intelligence
- ✅ Priority support
- ✅ 5 WordPress integrations
- ✅ Churn prediction AI
- ✅ Revenue forecasting
- ✅ Multi-channel publishing

### ENTERPRISE - ₹20/month
**For Large Teams**
- ✅ Unlimited everything
- ✅ Unlimited AI articles
- ✅ Custom AI models
- ✅ White-label platform
- ✅ 24/7 phone support
- ✅ Unlimited WordPress integrations
- ✅ API access
- ✅ Dedicated account manager
- ✅ Custom revenue models
- ✅ Advanced analytics

### Usage Limits
- **Campaigns**: TRIAL (5), PRO (Unlimited), ENTERPRISE (Unlimited)
- **Articles**: TRIAL (100/month), PRO (500/month), ENTERPRISE (Unlimited)
- **WordPress Sites**: TRIAL (1), PRO (5), ENTERPRISE (Unlimited)

### Notifications
- 75% usage warning email
- 100% limit reached email
- 7-day subscription expiry reminder
- 3-day subscription expiry reminder
- Subscription expired notification

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens**: Access tokens (15min) + Refresh tokens (7 days)
- **Password Hashing**: Bcrypt with salt rounds
- **Email Verification**: 6-digit OTP with 10-minute expiration
- **Role-Based Access**: User and Admin roles
- **Protected Routes**: Middleware authentication checks

### Payment Security
- **Razorpay Integration**: PCI DSS compliant payment gateway
- **Signature Verification**: HMAC SHA256 signature validation
- **Secure Webhooks**: Payment verification before activation
- **Invoice Generation**: Automated PDF invoices with unique numbers

### Data Protection
- **CORS Configuration**: Restricted cross-origin requests
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Mongoose parameterized queries
- **XSS Protection**: Input sanitization
- **Rate Limiting**: API request throttling
- **Secure Headers**: Helmet.js security headers

### Session Management
- **HTTP-Only Cookies**: Refresh tokens in secure cookies
- **Token Rotation**: Automatic token refresh
- **Logout Mechanism**: Token invalidation
- **Session Expiry**: Automatic timeout

### Email Security
- **App Passwords**: Gmail app-specific passwords
- **TLS Encryption**: Secure email transmission
- **OTP Expiration**: Time-limited verification codes
- **Anti-Phishing**: Security notices in emails

## 📊 Database Models

### User Model
```javascript
{
  name: String,
  email: String (unique, indexed),
  password: String (hashed),
  role: String (user/admin),
  subscription: String (TRIAL/PRO/ENTERPRISE),
  subscriptionStatus: String (active/expired/cancelled),
  subscriptionStartDate: Date,
  subscriptionEndDate: Date,
  isEmailVerified: Boolean,
  usageWarnings: Object,
  refreshToken: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Campaign Model
```javascript
{
  userId: ObjectId (ref: User),
  name: String,
  type: String (email/content/social),
  status: String (draft/active/paused/completed),
  targetAudience: String,
  content: String,
  schedule: Date,
  metrics: {
    sent: Number,
    opened: Number,
    clicked: Number,
    converted: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Article Model
```javascript
{
  userId: ObjectId (ref: User),
  title: String,
  content: String,
  excerpt: String,
  status: String (draft/published),
  publishedAt: Date,
  wordPressPostId: String,
  tags: [String],
  category: String,
  aiGenerated: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Payment Model
```javascript
{
  userId: ObjectId (ref: User),
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  amount: Number,
  currency: String,
  status: String (pending/completed/failed),
  plan: String,
  invoiceNumber: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Coupon Model
```javascript
{
  code: String (unique, uppercase),
  description: String,
  discountType: String (percentage/fixed),
  discountValue: Number,
  minOrderAmount: Number,
  maxDiscount: Number,
  validFrom: Date,
  validUntil: Date,
  usageLimit: Number,
  usedCount: Number,
  applicablePlans: [String],
  restrictedToEmails: [String],
  isActive: Boolean,
  createdBy: ObjectId (ref: User),
  usedBy: [{
    userId: ObjectId,
    usedAt: Date,
    orderAmount: Number,
    discountAmount: Number
  }]
}
```

### EmailVerification Model
```javascript
{
  email: String (indexed),
  otp: String,
  expiresAt: Date (indexed, TTL),
  createdAt: Date
}
```

### RiskScore Model
```javascript
{
  userId: ObjectId (ref: User),
  score: Number (0-100),
  factors: {
    engagementRate: Number,
    paymentHistory: Number,
    usageFrequency: Number,
    supportTickets: Number
  },
  prediction: String (low/medium/high),
  lastCalculated: Date
}
```

### WordPressIntegration Model
```javascript
{
  userId: ObjectId (ref: User),
  siteUrl: String,
  username: String,
  applicationPassword: String (encrypted),
  isActive: Boolean,
  lastSync: Date,
  createdAt: Date
}
```

## 📧 Email Templates

The platform includes professional email templates with orange, white, and black theme:

### 1. Verification Email (OTP)
- Clean, minimal design
- 6-digit OTP code
- 10-minute expiration notice
- Security warnings
- SubState logo integration

### 2. Welcome Email
- Congratulations message
- 14-day trial activation notice
- Feature highlights (4 cards)
- Dashboard access button
- Social links

### 3. Coupon Email
- Professional discount offer
- Promo code display
- Available plans (Professional/Enterprise)
- Step-by-step redemption guide
- Important terms and conditions
- Footer with help links

All templates are:
- Mobile responsive
- Email client compatible
- Branded with SubState colors (#f97316 orange, #ffffff white, #111827 black)
- Include proper spacing and typography

## 🎨 UI Components

### Layout Components
- **DashboardLayout** - Main dashboard wrapper with sidebar
- **ProtectedRoute** - Authentication guard for routes
- **AdminRoute** - Admin-only route protection
- **Footer** - Site footer with links
- **BackToHome** - Navigation helper
- **ScrollToTop** - Scroll restoration

### Feature Components
- **ArticleEditor** - Rich text editor with TipTap
- **ArticleAnalytics** - Article performance metrics
- **WordPressPublisher** - WordPress publishing interface
- **WordPressIntegration** - WordPress site connection
- **CouponSection** - Coupon code input and validation
- **UsageTracker** - Real-time usage statistics
- **PaymentManagement** - Payment history and invoices
- **AdminPaymentManagement** - Admin payment dashboard
- **AdminUsageStats** - Platform-wide statistics
- **UserDetailsModal** - User information modal
- **LoadingSpinner** - Loading state indicator

### Styling
- **TailwindCSS 4** - Utility-first CSS
- **Custom CSS Modules** - Component-specific styles
- **Framer Motion** - Smooth animations
- **Responsive Design** - Mobile-first approach
- **Dark Mode Ready** - Theme support prepared

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the Repository**
```bash
git clone https://github.com/your-username/substate.git
cd substate
```

2. **Create Feature Branch**
```bash
git checkout -b feature/AmazingFeature
```

3. **Make Changes**
- Write clean, documented code
- Follow existing code style
- Add tests if applicable
- Update documentation

4. **Commit Changes**
```bash
git add .
git commit -m 'Add some AmazingFeature'
```

5. **Push to Branch**
```bash
git push origin feature/AmazingFeature
```

6. **Open Pull Request**
- Describe your changes
- Link related issues
- Request review

### Code Style Guidelines
- Use ES6+ features
- Follow React best practices
- Use functional components with hooks
- Write descriptive variable names
- Add comments for complex logic
- Keep functions small and focused

### Commit Message Format
```
type(scope): subject

body

footer
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat(auth): add email verification with OTP

- Implement OTP generation
- Add email sending service
- Create verification endpoint

Closes #123
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **SUBSTATE Team** - Initial work and maintenance

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [Express](https://expressjs.com/) - Backend framework
- [MongoDB](https://www.mongodb.com/) - Database
- [Razorpay](https://razorpay.com/) - Payment gateway
- [OpenAI](https://openai.com/) - AI content generation
- [Vercel](https://vercel.com/) - Hosting platform
- [Radix UI](https://www.radix-ui.com/) - Component library
- [TailwindCSS](https://tailwindcss.com/) - CSS framework
- [Framer Motion](https://www.framer.com/motion/) - Animation library

## 📞 Support

### Get Help
- 📧 Email: support@substate.com
- 💬 Discord: [Join our community](https://discord.gg/substate)
- 📚 Documentation: [docs.substate.com](https://docs.substate.com)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/substate/issues)

### Useful Links
- [Live Demo](https://substate.vercel.app)
- [API Documentation](https://docs.substate.com/api)
- [Changelog](CHANGELOG.md)
- [Roadmap](ROADMAP.md)

## 🚀 Roadmap

### Upcoming Features
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Team collaboration features
- [ ] Mobile app (React Native)
- [ ] Webhook integrations
- [ ] Custom domain support
- [ ] Advanced AI models
- [ ] Social media scheduling
- [ ] Email marketing automation
- [ ] A/B testing framework

### In Progress
- [x] Email templates redesign
- [x] Coupon system
- [x] Usage tracking
- [x] Admin dashboard

### Completed
- [x] User authentication
- [x] Payment integration
- [x] Campaign management
- [x] Article generation
- [x] WordPress integration
- [x] Email notifications

---

<div align="center">

**Made with ❤️ by SUBSTATE Team**

[Website](https://substate.com) • [Documentation](https://docs.substate.com) • [Twitter](https://twitter.com/substate) • [LinkedIn](https://linkedin.com/company/substate)

⭐ Star us on GitHub — it helps!

</div>
