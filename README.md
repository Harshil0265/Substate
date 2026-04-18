# SUBSTATE - Revenue Intelligence & Content Automation Platform

A modern, production-ready SaaS application for managing campaigns, articles, and revenue intelligence with real-time analytics.

## Tech Stack

### Frontend
- **React 18** with Vite (Fast build tool, instant HMR)
- **React Router v6** for navigation
- **Zustand** for state management
- **TanStack Query** for server state
- **Framer Motion** for animations
- **Axios** for API calls
- **React Helmet Async** for SEO meta tags
- **Tailwind CSS** for styling

### Backend
- **Express.js** - Node.js web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM with schema validation
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

## Project Structure

```
project-root/
├── src/                          # Frontend source (React)
│   ├── pages/                   # Page components
│   │   ├── auth/               # Login, Register
│   │   ├── dashboard/          # Dashboard page
│   │   ├── campaigns/          # Campaign management
│   │   ├── articles/           # Article management
│   │   ├── subscription/       # Subscription page
│   │   ├── admin/              # Admin panel
│   │   ├── settings/           # Settings page
│   │   └── Landing.jsx         # Landing page
│   ├── components/             # Reusable components
│   │   └── layout/            # Layout components
│   ├── store/                  # Zustand stores
│   ├── api/                    # API client configuration
│   ├── styles/                 # CSS styles
│   ├── App.jsx                 # Main app with routes
│   └── main.jsx                # Vite entry point
├── backend/                     # Backend source (Express)
│   ├── models/                 # Mongoose models
│   │   ├── User.js
│   │   ├── Campaign.js
│   │   ├── Article.js
│   │   ├── Payment.js
│   │   └── RiskScore.js
│   ├── routes/                 # API routes
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── campaigns.js
│   │   └── articles.js
│   └── middleware/             # Express middleware
│       └── auth.js
├── scripts/                     # Utility scripts
│   └── seed-database.js        # Database seeding script
├── server.js                    # Express server entry point
├── vite.config.js              # Vite configuration
├── index.html                  # HTML entry point
├── package.json                # Dependencies
└── .env.example                # Environment variables template
```

## Getting Started

### Prerequisites
- Node.js 16+ and npm/pnpm
- MongoDB (local or Atlas cloud)

### Installation

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/substate
   PORT=5000
   JWT_SECRET=your-secret-key
   VITE_API_URL=http://localhost:5000
   ```

3. **Seed the database (creates 500+ users with realistic data):**
   ```bash
   pnpm seed
   ```

### Running the Application

**Option 1: Run Frontend & Backend Separately (Development)**

Terminal 1 - Frontend (Vite dev server):
```bash
pnpm dev
```
The frontend will be available at `http://localhost:5173`

Terminal 2 - Backend (Express API):
```bash
pnpm server
```
The API will be available at `http://localhost:5000`

**Option 2: Run Both in One Terminal**
```bash
concurrently "pnpm dev" "pnpm server"
```
(Requires `npm install -D concurrently`)

### Building for Production

```bash
pnpm build
```

This creates an optimized build in the `dist/` directory.

## Key Features

### 🔐 Advanced Authentication & Security
- **Email Verification with OTP**: 6-digit code sent to email (10-minute expiration)
- **Strong Password Requirements**: Uppercase, lowercase, number, special character, min 8 chars
- **Name Validation**: Only letters allowed, no numbers or invalid characters
- **Real Email Validation**: Blocks temporary/disposable email services
- **Rate Limiting**: Prevents brute force attacks (5 attempts per 15 minutes)
- **Account Lockout**: Automatic 30-minute lock after 5 failed login attempts
- **Secure Password Hashing**: bcrypt with 10 salt rounds
- **JWT Authentication**: 30-day token expiration
- **Input Sanitization**: XSS protection and HTML tag removal
- **Failed Attempt Tracking**: Shows remaining login attempts
- **Email Service**: Beautiful HTML emails with OTP codes and welcome messages
- **Development Mode**: Emails log to console (no SMTP needed for testing)

### Dashboard
- Real-time metrics and analytics
- Revenue intelligence with risk scoring
- Campaign performance tracking
- Article statistics and engagement metrics

### Campaign Management
- Create, update, and delete campaigns
- Campaign templates for different channels
- Automation and scheduling
- Real-time engagement tracking

### Content Management
- AI-powered article generation (ready for OpenAI integration)
- Rich text editing
- Article status workflow (Draft → Review → Published)
- SEO optimization and metadata

### Admin Panel
- User management and risk assessment
- Revenue intelligence and churn prediction
- Analytics and reporting
- Bulk actions and interventions

### Database

**500+ Synthetic Users** generated with realistic data:
- Mixed subscription states (ACTIVE, TRIAL, FAILED, SUSPENDED)
- Varied last login dates (active to inactive)
- Realistic usage patterns (articles, campaigns)
- Calculated risk scores based on activity and payment history

**1500+ Campaigns** created with:
- Different campaign types (EMAIL, CONTENT, SOCIAL, MULTI_CHANNEL)
- Various statuses and engagement metrics
- Associated articles and content

**5000+ Articles** with:
- Different content types and categories
- SEO scores and engagement metrics
- Draft to published workflow
- User attribution and campaign linking

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires token)

### Users
- `GET /api/users/profile` - Get user profile with risk score
- `PUT /api/users/profile` - Update profile
- `GET /api/users/list` - Get all users (paginated)
- `GET /api/users/:userId` - Get specific user with analytics

### Campaigns
- `GET /api/campaigns` - List user's campaigns (paginated)
- `POST /api/campaigns` - Create new campaign
- `GET /api/campaigns/:campaignId` - Get campaign details
- `PUT /api/campaigns/:campaignId` - Update campaign
- `DELETE /api/campaigns/:campaignId` - Delete campaign

### Articles
- `GET /api/articles` - List user's articles (paginated)
- `POST /api/articles` - Create new article
- `GET /api/articles/:identifier` - Get article by ID or slug
- `PUT /api/articles/:articleId` - Update article
- `DELETE /api/articles/:articleId` - Delete article

## Design

### Notion-Inspired UI
- Clean, minimal aesthetic similar to Notion
- Sidebar navigation with collapsible sections
- Database-style views with sorting and filtering
- Rich text editing capabilities
- Toggle blocks and expandable sections
- Professional color scheme with accent colors

### Professional SaaS Fonts
- **Inter** (headings and body) - Clean, modern font
- **JetBrains Mono** (code) - Monospace for technical content
- Self-hosted WOFF2 for optimal performance and privacy

### Responsive Design
- Mobile-first approach
- Adaptive layouts for all screen sizes
- Touch-friendly interface
- Optimized for desktop, tablet, and mobile

## SEO Optimization

- Semantic HTML structure
- Dynamic meta tags per page (via React Helmet)
- Sitemap support
- robots.txt configuration
- Open Graph tags for social sharing
- Schema.org structured data
- Keyword-rich landing page
- Image optimization and lazy loading

## Contributing

This is a production SaaS template. Feel free to customize:
- Add your own branding and colors
- Integrate with your payment processor (Razorpay, Stripe)
- Connect your own AI/OpenAI API
- Customize the dashboard metrics
- Add additional features

## License

MIT License - feel free to use this template for your projects.

---

**Built with ❤️ using modern web technologies**
