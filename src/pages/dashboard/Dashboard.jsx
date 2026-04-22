import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Target, 
  FileText, 
  Link2, 
  Star, 
  BarChart3, 
  TrendingUp,
  Calendar,
  Activity,
  Loader2,
  AlertCircle,
  ArrowRight
} from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { apiClient } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import '../../styles/dashboard.css'
import '../../styles/modern-dashboard.css'

function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState(null)
  const [usageData, setUsageData] = useState(null)
  const [recentCampaigns, setRecentCampaigns] = useState([])
  const [recentArticles, setRecentArticles] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    // Redirect admin users to admin panel
    if (user?.role === 'ADMIN') {
      navigate('/admin')
      return
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch user profile
        const profileResponse = await apiClient.get('/users/profile')
        setUserData(profileResponse.data.user)
        
        // Fetch usage statistics
        console.log('🔄 Fetching usage data...');
        const usageResponse = await apiClient.get('/users/usage/current')
        console.log('📊 Usage data received:', usageResponse.data);
        setUsageData(usageResponse.data)
        
        // Fetch recent campaigns
        const campaignsResponse = await apiClient.get('/campaigns?page=1&limit=5')
        setRecentCampaigns(campaignsResponse.data.campaigns || [])
        
        // Fetch recent articles
        const articlesResponse = await apiClient.get('/articles?page=1&limit=5')
        setRecentArticles(articlesResponse.data.articles || [])
        
        // Set last updated timestamp
        setLastUpdated(new Date())
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user])

  // Calculate days remaining
  const getDaysRemaining = () => {
    if (!userData?.subscriptionEndDate) return 0
    const endDate = new Date(userData.subscriptionEndDate)
    const today = new Date()
    const diffTime = endDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  // Get plan color
  const getPlanColor = (plan) => {
    switch (plan) {
      case 'TRIAL': return '#f59e0b'
      case 'PRO': return '#111827'
      case 'ENTERPRISE': return '#374151'
      default: return '#6b7280'
    }
  }

  // Calculate usage percentage
  const getUsagePercentage = (used, limit) => {
    if (limit === -1) return 0 // Unlimited
    return Math.min(100, (used / limit) * 100)
  }

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
      case 'RUNNING':
      case 'PUBLISHED':
      case 'COMPLETED':
        return 'success'
      case 'DRAFT':
      case 'SCHEDULED':
      case 'PAUSED':
        return 'warning'
      case 'CANCELLED':
      case 'FAILED':
        return 'error'
      default:
        return 'default'
    }
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Time ago
  const timeAgo = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now - date) / 1000)
    
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return formatDate(dateString)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading-state-modern">
          <Loader2 className="loading-spinner-modern" size={48} style={{ animation: 'spin 1s linear infinite' }} />
          <p>Loading your dashboard...</p>
        </div>
      </DashboardLayout>
    )
  }

  const daysRemaining = getDaysRemaining()
  const campaignUsagePercent = usageData ? getUsagePercentage(usageData.usage.campaigns, usageData.limits.campaigns) : 0
  const articleUsagePercent = usageData ? getUsagePercentage(usageData.usage.articles, usageData.limits.articles) : 0

  return (
    <>
      <Helmet>
        <title>Dashboard - SUBSTATE</title>
        <meta name="description" content="View your content generation and campaign metrics in real-time." />
      </Helmet>

      <DashboardLayout>
        <div className="modern-dashboard">
          {/* Dashboard Header */}
          <div className="dashboard-header-modern">
            <div className="header-content">
              <div className="header-info">
                <h1>Dashboard</h1>
                <p>Welcome back, {userData?.name || 'User'}! Here's your content generation summary.</p>
              </div>
              <div className="header-actions">
                {lastUpdated && (
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#6b7280', 
                    marginRight: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Activity size={14} />
                    <span>Updated: {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
                <button className="action-btn secondary" onClick={() => navigate('/dashboard/campaigns')}>
                  <Target size={20} />
                  <span>New Campaign</span>
                </button>
                <button className="action-btn secondary" onClick={() => navigate('/dashboard/articles')}>
                  <FileText size={20} />
                  <span>Generate Article</span>
                </button>
                <button className="action-btn primary" onClick={() => navigate('/dashboard/subscription')}>
                  <Star size={20} />
                  <span>Upgrade Plan</span>
                </button>
              </div>
            </div>
          </div>

          {/* Subscription Status Banner */}
          {userData?.subscription === 'TRIAL' && daysRemaining <= 7 && (
            <motion.div
              className="alert-banner warning"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginBottom: '24px', padding: '16px 24px', background: '#fff3cd', borderRadius: '12px', border: '1px solid #ffc107', display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              <AlertCircle size={24} style={{ color: '#856404', flexShrink: 0 }} />
              <span style={{ color: '#856404', fontWeight: '500', flex: 1 }}>
                Your trial expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}. 
                <button 
                  onClick={() => navigate('/dashboard/subscription')}
                  style={{ marginLeft: '12px', color: '#111827', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  Upgrade Now <ArrowRight size={16} />
                </button>
              </span>
            </motion.div>
          )}

          {/* Main Stats Grid */}
          <div className="stats-grid-modern">
            {/* Current Plan Card */}
            <motion.div
              className="stat-card-modern primary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{ borderLeft: `4px solid ${getPlanColor(userData?.subscription)}` }}
            >
              <div className="stat-header">
                <span className="stat-label">Current Plan</span>
                <span className={`stat-badge ${userData?.subscriptionStatus === 'ACTIVE' ? 'success' : 'error'}`}>
                  {userData?.subscriptionStatus || 'INACTIVE'}
                </span>
              </div>
              <div className="stat-value" style={{ color: '#1f2937' }}>
                {userData?.subscription || 'TRIAL'}
              </div>
              <div className="stat-subtitle">
                {userData?.subscriptionEndDate ? (
                  <>Expires on {formatDate(userData.subscriptionEndDate)} ({daysRemaining} days left)</>
                ) : (
                  'No expiry date set'
                )}
              </div>
            </motion.div>

            {/* Campaigns Usage Card */}
            <motion.div
              className="stat-card-modern"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="stat-header">
                <span className="stat-label">Campaigns</span>
                <span className={`stat-change ${campaignUsagePercent >= 90 ? 'negative' : campaignUsagePercent >= 75 ? 'warning' : 'positive'}`}>
                  {campaignUsagePercent.toFixed(0)}%
                </span>
              </div>
              <div className="stat-value">
                {usageData?.usage.campaigns || 0}
                <span style={{ fontSize: '18px', color: '#6b7280', fontWeight: '400' }}>
                  {usageData?.limits.campaigns === -1 ? ' / ∞' : ` / ${usageData?.limits.campaigns || 0}`}
                </span>
              </div>
              <div className="stat-subtitle">
                {usageData?.limits.campaigns === -1 
                  ? 'Unlimited campaigns' 
                  : `${usageData?.remaining.campaigns || 0} remaining`
                }
              </div>
              {usageData?.limits.campaigns !== -1 && (
                <div className="progress-bar-container" style={{ marginTop: '12px' }}>
                  <div 
                    className="progress-bar-fill" 
                    style={{ 
                      width: `${campaignUsagePercent}%`,
                      background: campaignUsagePercent >= 90 ? '#ef4444' : campaignUsagePercent >= 75 ? '#f59e0b' : '#10b981'
                    }}
                  ></div>
                </div>
              )}
            </motion.div>

            {/* Articles Usage Card */}
            <motion.div
              className="stat-card-modern"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="stat-header">
                <span className="stat-label">Articles</span>
                <span className={`stat-change ${articleUsagePercent >= 90 ? 'negative' : articleUsagePercent >= 75 ? 'warning' : 'positive'}`}>
                  {articleUsagePercent.toFixed(0)}%
                </span>
              </div>
              <div className="stat-value">
                {usageData?.usage.articles || 0}
                <span style={{ fontSize: '18px', color: '#6b7280', fontWeight: '400' }}>
                  {usageData?.limits.articles === -1 ? ' / ∞' : ` / ${usageData?.limits.articles || 0}`}
                </span>
              </div>
              <div className="stat-subtitle">
                {usageData?.limits.articles === -1 
                  ? 'Unlimited articles' 
                  : `${usageData?.remaining.articles || 0} remaining`
                }
              </div>
              {usageData?.limits.articles !== -1 && (
                <div className="progress-bar-container" style={{ marginTop: '12px' }}>
                  <div 
                    className="progress-bar-fill" 
                    style={{ 
                      width: `${articleUsagePercent}%`,
                      background: articleUsagePercent >= 90 ? '#ef4444' : articleUsagePercent >= 75 ? '#f59e0b' : '#10b981'
                    }}
                  ></div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Main Content Grid */}
          <div className="dashboard-grid-modern">
            {/* Quick Actions Card */}
            <motion.div
              className="dashboard-card-modern"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <div className="card-header-modern" style={{ padding: '20px 20px 0 20px', borderBottom: 'none' }}>
                <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: '700', color: '#111827', margin: '0 0 16px 0' }}>
                  Quick Actions
                </h3>
              </div>
              <div className="quick-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', padding: '0 20px 20px 20px' }}>
                <button 
                  className="quick-action-card"
                  onClick={() => navigate('/dashboard/campaigns')}
                  style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <Target size={32} style={{ color: '#1f2937', marginBottom: '8px' }} />
                  <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>New Campaign</div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>Create marketing campaign</div>
                </button>

                <button 
                  className="quick-action-card"
                  onClick={() => navigate('/dashboard/articles')}
                  style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <FileText size={32} style={{ color: '#1f2937', marginBottom: '8px' }} />
                  <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>Generate Article</div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>AI-powered content</div>
                </button>

                <button 
                  className="quick-action-card"
                  onClick={() => navigate('/dashboard/settings/wordpress')}
                  style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <Link2 size={32} style={{ color: '#1f2937', marginBottom: '8px' }} />
                  <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>WordPress</div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>Connect & publish</div>
                </button>

                <button 
                  className="quick-action-card upgrade-plan-card"
                  onClick={() => navigate('/dashboard/subscription')}
                  style={{ 
                    padding: '20px', 
                    background: 'var(--accent-orange)', 
                    border: 'none', 
                    borderRadius: '12px', 
                    cursor: 'pointer', 
                    transition: 'all 0.2s', 
                    color: 'white', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(249, 115, 22, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.3)'
                  }}
                >
                  <Star size={32} style={{ marginBottom: '8px' }} />
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>Upgrade Plan</div>
                  <div style={{ fontSize: '13px', opacity: 0.9 }}>Unlock more features</div>
                </button>
              </div>
            </motion.div>

            {/* Performance Metrics Card */}
            <motion.div
              className="dashboard-card-modern"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <div className="card-header-modern" style={{ padding: '20px 20px 0 20px', borderBottom: 'none' }}>
                <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: '700', color: '#111827', margin: '0 0 16px 0' }}>
                  Performance Metrics
                </h3>
              </div>
              <div style={{ padding: '0 20px 20px 20px' }}>
                <div className="performance-metrics-grid">
                  <div className="metric-row">
                    <div className="metric-item-left">
                      <span className="metric-label">Total Campaigns</span>
                      <span className="metric-value-large">{usageData?.usage.campaigns || 0}</span>
                    </div>
                    <div className="metric-item-right">
                      <span className="metric-label">Total Articles</span>
                      <span className="metric-value-large">{usageData?.usage.articles || 0}</span>
                    </div>
                  </div>
                  
                  <div className="metric-row">
                    <div className="metric-item-left">
                      <span className="metric-label">Account Age</span>
                      <span className="metric-value-large">
                        {userData?.createdAt ? Math.floor((new Date() - new Date(userData.createdAt)) / (1000 * 60 * 60 * 24)) : 0} days
                      </span>
                    </div>
                    <div className="metric-item-right">
                      <span className="metric-label">Last Activity</span>
                      <span className="metric-value-large">
                        {userData?.lastActivityDate ? timeAgo(userData.lastActivityDate) : 'Just now'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pro-tip-card">
                  <div className="pro-tip-header">
                    <TrendingUp size={20} style={{ color: '#111827' }} />
                    <span className="pro-tip-title">Pro Tip</span>
                  </div>
                  <div className="pro-tip-content">
                    Connect WordPress to auto-publish your AI-generated content!
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Recent Activity Section */}
          <div className="dashboard-grid-modern" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {/* Recent Campaigns */}
            <motion.div
              className="dashboard-card-modern"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <div className="card-header-modern" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
                <h3>Recent Campaigns</h3>
                <button 
                  onClick={() => navigate('/dashboard/campaigns')}
                  className="view-all-button"
                >
                  View All <ArrowRight size={16} />
                </button>
              </div>
              <div style={{ padding: '20px' }}>
                {recentCampaigns.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                    <Target size={48} style={{ color: '#9ca3af', margin: '0 auto 12px' }} />
                    <div style={{ fontSize: '14px' }}>No campaigns yet</div>
                    <button 
                      onClick={() => navigate('/dashboard/campaigns')}
                      style={{ marginTop: '16px', padding: '8px 16px', background: '#111827', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Target size={16} />
                      Create Your First Campaign
                    </button>
                  </div>
                ) : (
                  <div>
                    {recentCampaigns.map((campaign) => (
                      <div 
                        key={campaign._id} 
                        style={{ padding: '12px', marginBottom: '8px', background: '#f9fafb', borderRadius: '8px', cursor: 'pointer' }}
                        onClick={() => navigate(`/dashboard/campaigns`)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '4px' }}>
                          <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>{campaign.title}</div>
                          <span className={`status-badge ${getStatusColor(campaign.status)}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                            {campaign.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{timeAgo(campaign.createdAt)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Recent Articles */}
            <motion.div
              className="dashboard-card-modern"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <div className="card-header-modern" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
                <h3>Recent Articles</h3>
                <button 
                  onClick={() => navigate('/dashboard/articles')}
                  className="view-all-button"
                >
                  View All <ArrowRight size={16} />
                </button>
              </div>
              <div style={{ padding: '20px' }}>
                {recentArticles.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                    <FileText size={48} style={{ color: '#9ca3af', margin: '0 auto 12px' }} />
                    <div style={{ fontSize: '14px' }}>No articles yet</div>
                    <button 
                      onClick={() => navigate('/dashboard/articles')}
                      style={{ marginTop: '16px', padding: '8px 16px', background: '#111827', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <FileText size={16} />
                      Generate Your First Article
                    </button>
                  </div>
                ) : (
                  <div>
                    {recentArticles.map((article) => (
                      <div 
                        key={article._id} 
                        style={{ padding: '12px', marginBottom: '8px', background: '#f9fafb', borderRadius: '8px', cursor: 'pointer' }}
                        onClick={() => navigate(`/dashboard/articles`)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '4px' }}>
                          <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>{article.title}</div>
                          <span className={`status-badge ${getStatusColor(article.status)}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                            {article.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{timeAgo(article.createdAt)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </DashboardLayout>
    </>
  )
}

export default Dashboard
