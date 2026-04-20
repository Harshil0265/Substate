# SUBSTATE - Revenue Intelligence & Content Automation Platform

A comprehensive SaaS platform for tracking revenue intelligence, automating content creation, and optimizing customer lifecycle management.

## 🚀 Features

- **Revenue Intelligence**: Real-time analytics on customer value and churn risk scoring
- **Content Automation**: AI-powered content generation and campaign automation
- **Campaign Management**: Create and manage marketing campaigns with status tracking
- **Article Generation**: Automated article creation with AI assistance
- **Subscription Management**: Multi-tier subscription plans (₹10 PRO, ₹20 ENTERPRISE)
- **Payment Processing**: Integrated Razorpay payment gateway with live transactions
- **User Authentication**: Secure JWT-based authentication with email verification
- **Dashboard Analytics**: Comprehensive analytics and reporting

## 🛠️ Tech Stack

### Frontend
- React 19
- React Router DOM
- Framer Motion (animations)
- Zustand (state management)
- Axios (API client)
- Radix UI (component library)
- TailwindCSS

### Backend
- Node.js & Express
- MongoDB & Mongoose
- JWT Authentication
- Nodemailer (email service)
- OpenAI Integration
- Razorpay (payment gateway)

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
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens (min 32 characters)
- `EMAIL_USER` - Email service username
- `EMAIL_PASS` - Email service password/app password
- `OPENAI_API_KEY` - OpenAI API key (optional)
- `RAZORPAY_KEY_ID` - Razorpay live key ID (rzp_live_...)
- `RAZORPAY_KEY_SECRET` - Razorpay secret key

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

- `pnpm run dev` - Run both frontend and backend
- `pnpm run build` - Build for production
- `pnpm run preview` - Preview production build
- `pnpm run seed` - Seed database with sample data
- `pnpm run create-admin` - Create admin user
- `pnpm run check-user <email>` - Check user details
- `pnpm run test-razorpay` - Test Razorpay integration
- `pnpm run generate-jwt` - Generate JWT secret

## 🌐 Deployment

### Deploy to Vercel

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Deploy to Vercel**
- Go to [vercel.com](https://vercel.com)
- Import your GitHub repository
- Add environment variables from `.env`
- Deploy!

### Environment Variables for Vercel

Add these in Vercel Dashboard → Settings → Environment Variables:
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_ACCESS_TOKEN_EXPIRY`
- `JWT_REFRESH_TOKEN_EXPIRY`
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_FROM`
- `OPENAI_API_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `NODE_ENV=production`

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-email` - Verify email with OTP
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh-token` - Refresh access token

### Campaigns
- `GET /api/campaigns` - Get all campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/:id` - Get campaign by ID
- `PATCH /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign

### Articles
- `GET /api/articles` - Get all articles
- `POST /api/articles` - Create article
- `GET /api/articles/:id` - Get article by ID
- `PATCH /api/articles/:id` - Update article
- `DELETE /api/articles/:id` - Delete article

### Payments
- `GET /api/payments/razorpay-config` - Get Razorpay configuration
- `POST /api/payments/create-order` - Create Razorpay order for subscription
- `POST /api/payments/verify-payment` - Verify payment and activate subscription
- `GET /api/payments/payment/:id` - Get payment status
- `GET /api/payments/history` - Get payment history
- `POST /api/payments/cancel-subscription` - Cancel subscription

### Users
- `GET /api/users/me` - Get current user
- `GET /api/users/subscription` - Get subscription data
- `PATCH /api/users/profile` - Update profile

## 💳 Subscription Plans

- **TRIAL (Starter)**: ₹0 for 14 days
  - Up to 5 campaigns
  - 100 AI-generated articles
  - Basic revenue analytics
  
- **PRO (Professional)**: ₹10/month
  - Unlimited campaigns
  - 500 AI articles/month
  - Advanced revenue intelligence
  - Priority support
  
- **ENTERPRISE**: ₹20/month
  - Unlimited everything
  - Custom AI models
  - White-label platform
  - 24/7 phone support
  - API access

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Email verification with OTP
- Razorpay payment signature verification
- Rate limiting
- CORS protection
- Input validation and sanitization
- Secure session management

## 📊 Database Models

- **User** - User accounts and authentication
- **Campaign** - Marketing campaigns
- **Article** - Content articles
- **Payment** - Payment transactions
- **EmailVerification** - Email OTP verification
- **RiskScore** - Customer churn risk scoring

## 🎨 UI Components

Built with Radix UI and custom components:
- Dashboard Layout
- Campaign Cards
- Article Editor
- Subscription Plans
- Payment Forms
- Analytics Charts

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- React team for the amazing framework
- Vercel for hosting
- MongoDB for the database
- All contributors and supporters

## 📞 Support

For support, email support@substate.com or join our Slack channel.

---

Made with ❤️ by SUBSTATE Team
