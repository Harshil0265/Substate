import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { Suspense, lazy } from 'react'

// Components that are used immediately
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import ScrollToTop from './components/ScrollToTop'

// Lazy load pages for code splitting
const Landing = lazy(() => import('./pages/Landing'))
const Features = lazy(() => import('./pages/Features'))
const Services = lazy(() => import('./pages/Services'))
const Testimonials = lazy(() => import('./pages/Testimonials'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'))
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'))
const Campaigns = lazy(() => import('./pages/campaigns/Campaigns'))
const CampaignDashboard = lazy(() => import('./pages/campaigns/CampaignDashboard'))
const ArticleManagementUser = lazy(() => import('./pages/articles/ArticleManagementUser'))
const Subscription = lazy(() => import('./pages/subscription/Subscription'))
const PaymentHistory = lazy(() => import('./pages/payments/PaymentHistory'))
const Admin = lazy(() => import('./pages/admin/Admin'))
const Settings = lazy(() => import('./pages/settings/Settings'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
})

// Loading component
const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    flexDirection: 'column',
    gap: '16px'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid #f3f4f6',
      borderTop: '3px solid #f97316',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
    <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading...</p>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
)

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/features" element={<Features />} />
              <Route path="/services" element={<Services />} />
              <Route path="/testimonials" element={<Testimonials />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
              <Route path="/dashboard/campaigns/:campaignId" element={<ProtectedRoute><CampaignDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/articles" element={<ProtectedRoute><ArticleManagementUser /></ProtectedRoute>} />
              <Route path="/dashboard/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
              <Route path="/dashboard/payments" element={<ProtectedRoute><PaymentHistory /></ProtectedRoute>} />
              <Route path="/dashboard/admin" element={<AdminRoute><Admin /></AdminRoute>} />
              <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              {/* Legacy routes for backward compatibility */}
              <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
              <Route path="/articles" element={<ProtectedRoute><ArticleManagementUser /></ProtectedRoute>} />
              <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
              <Route path="/payments" element={<ProtectedRoute><PaymentHistory /></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </Router>
      </QueryClientProvider>
    </HelmetProvider>
  )
}

export default App
