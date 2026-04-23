# SUBSTATE — Revenue Intelligence & Content Automation Platform

A full-stack SaaS platform for AI-powered content creation, campaign automation, revenue analytics, and customer lifecycle management.

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| React Router DOM | 7 | Client-side routing |
| Zustand | 5 | Global state management |
| Framer Motion | 12 | Animations & transitions |
| TailwindCSS | 4 | Utility-first styling |
| Radix UI | Latest | Accessible component primitives |
| TipTap | 3 | Rich text editor |
| Recharts | 2.15 | Data visualization charts |
| Axios | 1.15 | HTTP client |
| React Hook Form | 7 | Form state management |
| Zod | 3 | Schema validation |
| Lucide React | Latest | Icon library |
| React Helmet Async | 3 | SEO / document head management |
| Sonner | 1 | Toast notifications |
| TanStack Query | 5 | Server state & caching |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | JavaScript runtime |
| Express | 5 | Web framework |
| MongoDB | — | NoSQL database |
| Mongoose | 9 | MongoDB ODM |
| JWT (jsonwebtoken) | 9 | Authentication tokens |
| Bcryptjs | 3 | Password hashing |
| Nodemailer | 8 | Email delivery (Gmail SMTP) |
| Razorpay | 2.9 | Payment gateway |
| OpenAI SDK | 6 | AI content generation |
| Groq SDK | 1 | Alternative AI provider |
| PDFKit | 0.18 | PDF invoice generation |
| Node-Cron | 4 | Scheduled background tasks |
| CORS | 2 | Cross-origin resource sharing |

### Build & Deployment
| Technology | Purpose |
|---|---|
| Vite 8 | Frontend bundler & dev server |
| Vercel | Hosting & serverless deployment |
| Concurrently | Run frontend + backend together |
| ESBuild | Fast JS bundling |
| PostCSS + Autoprefixer | CSS processing |

---

## Project Structure

```
substate/
├── backend/
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── Article.js
│   │   ├── Campaign.js
│   │   ├── Coupon.js
│   │   ├── EmailVerification.js
│   │   ├── Payment.js
│   │   ├── RiskScore.js
│   │   ├── User.js
│   │   └── WordPressIntegration.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── articles-enhanced.js
│   │   ├── auth.js
│   │   ├── campaigns.js
│   │   ├── coupons.js
│   │   ├── payments.js
│   │   ├── users.js
│   │   └── wordpress.js
│   ├── services/
│   │   ├── ArticleManagementService.js
│   │   ├── CampaignAutomationService.js
│   │   ├── ContentModerationService.js
│   │   ├── CouponService.js
│   │   ├── EmailCampaignService.js
│   │   ├── EmailService.js
│   │   ├── ImageService.js
│   │   ├── RazorpayService.js
│   │   ├── ReceiptService.js
│   │   ├── ReminderService.js
│   │   ├── TokenService.js
│   │   ├── UsageService.js
│   │   ├── WordPressService.js
│   │   └── WordPressSyncService.js
│   └── utils/
│       ├── emailTemplates.js
│       └── validators.js
├── src/
│   ├── api/
│   │   └── client.js
│   ├── components/
│   │   ├── layout/
│   │   │   └── DashboardLayout.jsx
│   │   ├── AdminOverviewModern.jsx
│   │   ├── AdminPaymentManagement.jsx
│   │   ├── AdminRoute.jsx
│   │   ├── AdminUsageStats.jsx
│   │   ├── AdminUsersAndStats.jsx
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
│   │   └── authStore.js
│   ├── styles/
│   │   ├── admin-campaigns.css
│   │   ├── admin-overview-modern.css
│   │   ├── admin-overview.css
│   │   ├── admin-payment-management.css
│   │   ├── admin-users-stats.css
│   │   ├── admin.css
│   │   ├── animations.css
│   │   ├── auth.css
│   │   ├── back-to-home.css
│   │   ├── dashboard-layout.css
│   │   ├── dashboard.css
│   │   ├── footer.css
│   │   ├── globals.css
│   │   ├── landing-pax.css
│   │   ├── modern-dashboard.css
│   │   ├── pages.css
│   │   ├── payment-history-page.css
│   │   ├── payment-management.css
│   │   ├── scroll-to-top.css
│   │   ├── settings.css
│   │   ├── usage-tracker.css
│   │   └── user-details-modal.css
│   └── utils/
│       └── timezoneFormatter.js
├── scripts/
│   ├── add-invoice-numbers.js
│   ├── backup-users.js
│   ├── create-admin.js
│   ├── create-special-coupon.js
│   ├── diagnose-admin-login.js
│   ├── fix-admin-account.js
│   ├── fix-coupons.js
│   ├── generate-jwt-secret.js
│   ├── migrate-subscription-plans.js
│   ├── seed-database.js
│   └── send-coupon-email-professional.js
├── public/
│   ├── hero element.png
│   ├── manifest.json
│   └── substate-icon.svg
├── .env.example
├── index.html
├── package.json
├── server.js
├── vercel.json
└── vite.config.js
```

---

## Components

### `src/components/layout/`

| File | Description |
|---|---|
| `DashboardLayout.jsx` | Main dashboard shell — sidebar navigation, header, and page content wrapper used across all authenticated pages |

### `src/components/`

| File | Description |
|---|---|
| `AdminOverviewModern.jsx` | Modern admin dashboard overview with platform-wide stats and charts |
| `AdminPaymentManagement.jsx` | Admin view of all payments — filter, search, refund management |
| `AdminRoute.jsx` | Route guard that restricts access to admin-only pages |
| `AdminUsageStats.jsx` | Platform-wide usage statistics panel for admins |
| `AdminUsersAndStats.jsx` | User list with stats, search, and management actions for admins |
| `ArticleAnalytics.jsx` | Per-article performance metrics — views, engagement, conversions |
| `ArticleEditor.jsx` | TipTap-powered rich text editor for creating and editing articles |
| `BackToHome.jsx` | Simple navigation helper to return to the landing page |
| `CouponSection.jsx` | Coupon code input, validation, and discount display on checkout |
| `Footer.jsx` | Site-wide footer with links and branding |
| `LoadingSpinner.jsx` | Reusable loading indicator for async states |
| `PaymentManagement.jsx` | User-facing payment history, invoice download, and subscription info |
| `ProtectedRoute.jsx` | Route guard that redirects unauthenticated users to login |
| `ScrollToTop.jsx` | Automatically scrolls to top on route change |
| `UsageTracker.jsx` | Real-time display of campaign/article quota usage with progress bars |
| `UserDetailsModal.jsx` | Modal showing full user profile and subscription details (admin use) |
| `WordPressIntegration.jsx` | UI for connecting and managing WordPress site credentials |
| `WordPressPublisher.jsx` | Interface for selecting a connected site and publishing an article |

---

## Pages

### Auth — `src/pages/auth/`

| File | Route | Description |
|---|---|---|
| `Login.jsx` | `/login` | Email + password login form with remember me, redirects to dashboard on success |
| `Register.jsx` | `/register` | New user registration form |
| `VerifyEmail.jsx` | `/verify-email` | 6-digit OTP email verification after registration |

### Public — `src/pages/`

| File | Route | Description |
|---|---|---|
| `Landing.jsx` | `/` | Homepage with hero, features overview, and CTA |
| `About.jsx` | `/about` | About the platform and team |
| `Features.jsx` | `/features` | Detailed feature showcase |
| `Services.jsx` | `/services` | Services offered |
| `Contact.jsx` | `/contact` | Contact form |
| `Testimonials.jsx` | `/testimonials` | User testimonials |

### Dashboard — `src/pages/dashboard/`

| File | Route | Description |
|---|---|---|
| `Dashboard.jsx` | `/dashboard` | Main user dashboard — usage stats, recent campaigns, recent articles, quick actions |

### Campaigns — `src/pages/campaigns/`

| File | Route | Description |
|---|---|---|
| `Campaigns.jsx` | `/campaigns` | Campaign list with create, filter, and status management |
| `CampaignDashboard.jsx` | `/campaigns/:id` | Individual campaign analytics — articles, milestones, ROI |

### Articles — `src/pages/articles/`

| File | Route | Description |
|---|---|---|
| `ArticleManagementUser.jsx` | `/articles` | User article list with create, edit, publish, and delete actions |

### Payments — `src/pages/payments/`

| File | Route | Description |
|---|---|---|
| `PaymentHistory.jsx` | `/payments` | Full payment history with invoice download |

### Subscription — `src/pages/subscription/`

| File | Route | Description |
|---|---|---|
| `Subscription.jsx` | `/subscription` | Plan comparison, upgrade flow, coupon application, Razorpay checkout |

### Settings — `src/pages/settings/`

| File | Route | Description |
|---|---|---|
| `Settings.jsx` | `/settings` | Account settings — profile, password, notification preferences |
| `WordPressSettings.jsx` | `/settings/wordpress` | Manage connected WordPress sites |

### Admin — `src/pages/admin/`

| File | Route | Description |
|---|---|---|
| `Admin.jsx` | `/admin` | Admin dashboard — user management, payment overview, platform stats |
| `ArticleManagement.jsx` | `/admin/articles` | Admin article moderation — approve, reject, flag content |

---

## Backend Models

### `backend/models/User.js`
Stores user accounts with authentication, profile, subscription, and usage data.

| Field | Type | Notes |
|---|---|---|
| `email` | String | Unique, indexed, lowercase |
| `password` | String | Bcrypt hashed |
| `name` | String | Required |
| `phone`, `company`, `website`, `bio` | String | Optional profile fields |
| `role` | Enum | `USER` / `ADMIN` |
| `emailVerified` | Boolean | Set after OTP verification |
| `subscription` | Enum | `TRIAL` / `PROFESSIONAL` / `ENTERPRISE` |
| `subscriptionStatus` | Enum | `active` / `expired` / `cancelled` |
| `subscriptionStartDate`, `subscriptionEndDate` | Date | Billing period |
| `usageWarnings` | Object | Tracks 75%/100% warning emails sent |
| `refreshToken` | String | Stored for token rotation |
| `emailNotifications` | Object | Notification preferences |

### `backend/models/Campaign.js`
Represents marketing campaigns with automation, moderation, and analytics.

| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId | Ref: User |
| `title`, `description` | String | — |
| `status` | Enum | `DRAFT` / `SCHEDULED` / `RUNNING` / `COMPLETED` / `PAUSED` / `BLOCKED` / `UNDER_REVIEW` |
| `campaignType` | Enum | `EMAIL` / `CONTENT` / `SOCIAL` / `MULTI_CHANNEL` |
| `targetAudience` | Enum | `ALL` / `PREMIUM` / `TRIAL` / `AT_RISK` |
| `startDate`, `endDate` | Date | Campaign schedule |
| `moderationStatus` | Object | Status, violations, risk score, admin notes |
| `articlesGenerated` | Number | Count of AI articles created |
| `analytics` | Object | Views, engagement, social shares |
| `roi` | Object | Investment, revenue, cost per click/conversion |

### `backend/models/Article.js`
Stores AI-generated and manual articles with SEO, moderation, and WordPress sync.

| Field | Type | Notes |
|---|---|---|
| `userId`, `campaignId` | ObjectId | Refs: User, Campaign |
| `title`, `slug`, `content`, `excerpt` | String | Core content fields |
| `status` | Enum | `DRAFT` / `REVIEW` / `PUBLISHED` / `ARCHIVED` |
| `contentType` | Enum | `BLOG` / `NEWSLETTER` / `SOCIAL_POST` / `WHITEPAPER` |
| `aiGenerated` | Boolean | Whether AI created this article |
| `wordCount`, `readTime` | Number | Computed metrics |
| `moderation` | Object | Status, violations, risk score |
| `seo` | Object | Keywords, meta description, SEO score |
| `wordPress` | Object | Post ID, sync status, auto-publish flag |
| `analytics` | Object | Views, likes, shares, conversions, device breakdown |
| `revisionHistory` | Array | Previous versions for rollback |

### `backend/models/Payment.js`
Tracks all payment transactions with Razorpay integration and invoice management.

| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId | Ref: User |
| `invoiceNumber` | String | Unique, auto-generated |
| `amount`, `originalAmount` | Number | Final and pre-discount amounts |
| `currency` | String | Default: `INR` |
| `coupon` | Object | Code, discount amount, coupon ID |
| `paymentMethod` | Enum | `RAZORPAY` / `STRIPE` / `DIRECT` / `FREE` |
| `status` | Enum | `PENDING` / `COMPLETED` / `FAILED` / `REFUNDED` |
| `planType` | Enum | `TRIAL` / `PROFESSIONAL` / `ENTERPRISE` |
| `razorpayOrderId`, `razorpayPaymentId` | String | Razorpay references |

### `backend/models/Coupon.js`
Discount codes with usage limits, plan restrictions, and email targeting.

| Field | Type | Notes |
|---|---|---|
| `code` | String | Unique, uppercase |
| `discountType` | Enum | `PERCENTAGE` / `FIXED` |
| `discountValue` | Number | Amount or percentage |
| `minOrderAmount`, `maxDiscount` | Number | Constraints |
| `validFrom`, `validUntil` | Date | Validity window |
| `usageLimit`, `usedCount` | Number | Quota tracking |
| `applicablePlans` | Array | Which plans can use this coupon |
| `restrictedToEmails` | Array | Optional email whitelist |
| `usedBy` | Array | Usage history with user, date, amounts |

### `backend/models/RiskScore.js`
Customer churn risk assessment with scoring factors and recommended actions.

| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId | Ref: User |
| `score` | Number | 0–100 overall risk |
| `churnRisk`, `paymentFailureRisk`, `inactivityRisk`, `lowEngagementRisk` | Number | Individual risk factors |
| `daysSinceLastLogin`, `daysSinceLastPayment` | Number | Activity metrics |
| `consecutiveFailedPayments` | Number | Payment health |
| `riskTrend` | Enum | `INCREASING` / `STABLE` / `DECREASING` |
| `recommendedAction` | Enum | `NONE` / `OUTREACH` / `OFFER_DISCOUNT` / `PRIORITY_SUPPORT` / `RETENTION_CAMPAIGN` |

### `backend/models/EmailVerification.js`
Temporary OTP records for email verification with auto-expiry.

| Field | Type | Notes |
|---|---|---|
| `email` | String | Indexed |
| `otp` | String | 6-digit code |
| `expiresAt` | Date | TTL index — auto-deleted after 1 hour |
| `attemptCount` | Number | Tracks resend attempts |

### `backend/models/WordPressIntegration.js`
Connected WordPress sites per user with credentials and sync statistics.

| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId | Ref: User |
| `siteName`, `siteUrl` | String | Site identity |
| `username`, `applicationPassword` | String | WP credentials (password encrypted) |
| `isActive`, `isDefault` | Boolean | Connection state |
| `settings` | Object | Default status, categories, auto-publish, sync |
| `stats` | Object | Total posts, successful, failed, last post date |

---

## Backend Services

| File | Responsibility |
|---|---|
| `EmailService.js` | Nodemailer setup, sends OTP, welcome, usage warning, and upgrade reminder emails |
| `ArticleManagementService.js` | Create/update/review articles, SEO scoring, WordPress sync, revision history, analytics |
| `CampaignAutomationService.js` | Cron jobs for scheduled publishing, analytics updates, milestone checks, A/B test tracking |
| `RazorpayService.js` | Create orders, verify HMAC signatures, fetch payments, process refunds |
| `CouponService.js` | Validate coupon codes, calculate discounts, enforce usage limits |
| `ContentModerationService.js` | AI-powered content analysis, violation detection, risk scoring |
| `EmailCampaignService.js` | Automated email campaign delivery and tracking |
| `ReceiptService.js` | PDF invoice generation with unique invoice numbers via PDFKit |
| `ReminderService.js` | Subscription expiry reminders (7-day, 3-day, expired) |
| `TokenService.js` | JWT generation, validation, and refresh token management |
| `UsageService.js` | Track and enforce campaign/article quotas per subscription plan |
| `WordPressService.js` | WordPress REST API integration for publishing articles |
| `WordPressSyncService.js` | Automated sync of article status between platform and WordPress |
| `ImageService.js` | Image upload and processing |

---

## Backend Routes

### Auth — `/api/auth`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Register new user |
| POST | `/verify-email` | Verify email with OTP |
| POST | `/resend-otp` | Resend verification OTP |
| POST | `/login` | Login, returns JWT tokens |
| POST | `/logout` | Logout, invalidates token |
| POST | `/refresh-token` | Refresh access token |
| GET | `/me` | Get current user |
| GET | `/session-status` | Check session validity |

### Users — `/api/users`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/profile` | Get current user profile |
| PATCH | `/profile` | Update profile fields |
| GET | `/subscription` | Get subscription details |
| GET | `/usage/current` | Get current usage stats |
| GET | `/usage/can-create-campaign` | Check campaign quota |
| GET | `/usage/can-create-article` | Check article quota |

### Campaigns — `/api/campaigns`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List all user campaigns |
| POST | `/` | Create new campaign |
| GET | `/:id` | Get campaign by ID |
| PATCH | `/:id` | Update campaign |
| DELETE | `/:id` | Delete campaign |
| GET | `/stats` | Campaign statistics |

### Articles — `/api/articles`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List all user articles |
| POST | `/` | Create new article |
| GET | `/:id` | Get article by ID |
| PATCH | `/:id` | Update article |
| DELETE | `/:id` | Delete article |
| POST | `/generate` | Generate article with AI |
| POST | `/:id/publish` | Publish to WordPress |

### Payments — `/api/payments`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/razorpay-config` | Get Razorpay public key |
| POST | `/create-order` | Create Razorpay order |
| POST | `/verify-payment` | Verify payment signature |
| GET | `/payment/:id` | Get payment details |
| GET | `/history` | Get payment history |
| POST | `/cancel-subscription` | Cancel subscription |
| GET | `/invoice/:id` | Download invoice PDF |

### Coupons — `/api/coupons`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/validate` | Validate coupon code |
| GET | `/available` | Get available coupons |
| POST | `/apply` | Apply coupon to order |
| POST | `/create` | Create coupon (admin) |
| GET | `/:id/stats` | Coupon usage statistics |

### WordPress — `/api/wordpress`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/connect` | Connect a WordPress site |
| GET | `/sites` | List connected sites |
| POST | `/publish` | Publish article to WordPress |
| DELETE | `/disconnect/:id` | Disconnect a site |

### Admin — `/api/admin`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/users` | List all users |
| GET | `/users/:id` | Get user details |
| PATCH | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |
| GET | `/payments` | List all payments |
| GET | `/stats` | Platform-wide statistics |
| POST | `/coupons` | Create coupon |

---

## State Management

### `src/store/authStore.js` (Zustand)

| State / Action | Description |
|---|---|
| `user` | Current user object, persisted in localStorage |
| `accessToken`, `refreshToken` | JWT tokens, persisted in localStorage |
| `isAuthenticated` | Boolean derived from token presence |
| `setUser()` | Store or clear user data |
| `setTokens()` | Store tokens and schedule auto-refresh |
| `logout()` | Clear all auth state and localStorage |
| `refreshAccessToken()` | Call `/auth/refresh-token` and update tokens |
| `setupTokenRefresh()` | Schedule token refresh 2 minutes before expiry |
| `checkSessionStatus()` | Verify session is still valid with server |
| `restoreSession()` | Restore session on app load |

---

## Utilities

| File | Description |
|---|---|
| `src/api/client.js` | Axios instance with base URL, request interceptors for auth headers, and auto-refresh on 401 |
| `src/utils/timezoneFormatter.js` | Format dates with user timezone (US, Canada, Asia, Australia, Europe) |
| `src/hooks/useScrollAnimation.js` | Framer Motion hook for scroll-triggered animations |
| `backend/utils/emailTemplates.js` | HTML email template builders — header, footer, OTP, welcome, coupon emails |
| `backend/utils/validators.js` | Input validation helpers for backend routes |
| `backend/middleware/auth.js` | JWT verification middleware, attaches user to `req.user` |

---

## Subscription Plans

| Plan | Price | Campaigns | Articles/month | WordPress Sites |
|---|---|---|---|---|
| TRIAL | Free (14 days) | 5 | 100 | 1 |
| PROFESSIONAL | ₹10/month | Unlimited | 500 | 5 |
| ENTERPRISE | ₹20/month | Unlimited | Unlimited | Unlimited |

---

## Scripts

| Script | Command | Description |
|---|---|---|
| `seed-database.js` | `pnpm run seed` | Seed initial data |
| `generate-jwt-secret.js` | `pnpm run generate-jwt` | Generate a secure JWT secret |
| `create-admin.js` | `pnpm run create-admin` | Create an admin user interactively |
| `migrate-subscription-plans.js` | `pnpm run migrate-subscription-plans` | Migrate subscription data |
| `backup-users.js` | `pnpm run backup-users` | Export user data to JSON |
| `add-invoice-numbers.js` | `pnpm run add-invoice-numbers` | Backfill invoice numbers on payments |
| `send-coupon-email-professional.js` | `pnpm run send-coupon-professional` | Send promotional coupon emails |
| `create-special-coupon.js` | `pnpm run create-special-coupon` | Create a special coupon code |
| `diagnose-admin-login.js` | `pnpm run diagnose-admin` | Diagnose admin login issues |
| `fix-admin-account.js` | `pnpm run fix-admin` | Fix broken admin account |

---

## Installation

### Prerequisites
- Node.js 18+
- MongoDB (Atlas or local)
- pnpm

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env
# Fill in your credentials in .env

# Generate JWT secret
pnpm run generate-jwt

# (Optional) Seed database
pnpm run seed

# Run development server
pnpm run dev
```

Frontend runs at `http://localhost:3000`, backend at `http://localhost:5000`.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | JWT signing secret (min 32 chars) |
| `EMAIL_USER` | Yes | Gmail address |
| `EMAIL_PASSWORD` | Yes | Gmail app password |
| `RAZORPAY_KEY_ID` | Yes | Razorpay public key |
| `RAZORPAY_KEY_SECRET` | Yes | Razorpay secret key |
| `OPENAI_API_KEY` | No | OpenAI key for AI content generation |
| `GROQ_API_KEY` | No | Groq key (alternative AI provider) |
| `JWT_ACCESS_TOKEN_EXPIRY` | No | Default: `15m` |
| `JWT_REFRESH_TOKEN_EXPIRY` | No | Default: `7d` |
| `VITE_API_URL` | No | Backend URL for frontend, default: `http://localhost:5000` |
| `FRONTEND_URL` | No | Frontend URL, default: `http://localhost:3000` |
| `NODE_ENV` | No | `development` or `production` |

---

## Deployment (Vercel)

1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Set build command: `npm run build`, output: `dist`
4. Add all environment variables in Vercel project settings
5. Deploy — API routes go to `server.js`, frontend served from `dist/`

---

## License

MIT
