import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Target,
  Activity,
  TrendingUp,
  RefreshCw,
  Download,
  Clock,
  Star,
  Crown,
  CheckCircle,
  XCircle,
  Minus,
  AlertCircle,
  Loader2,
  Server,
  Zap,
  Database
} from 'lucide-react'
import { apiClient } from '../api/client'
import '../styles/admin-overview-modern.css'

function AdminOverviewModern({ onViewAllUsers, onViewAllCampaigns }) {
  const [adminData, setAdminData] = useState({
    totalUsers: 0,
    totalCampaigns: 0,
    totalArticles: 0,
    totalRevenue: 0,
    recentUsers: [],
    recentCampaigns: [],
    systemStats: {}
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(new Date())

  useEffect(() => {
    fetchAdminData()
    const interval = setInterval(fetchAdminData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const fetchAdminData = async () => {
    try {
      setError('')
      const response = await apiClient.get('/admin/overview')
      setAdminData(response.data)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error fetching admin data:', err)
      setError(err.response?.data?.error || 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStateIcon = (state) => {
    switch (state) {
      case 'TRIAL':
        return <Clock size={16} />
      case 'PROFESSIONAL':
        return <Star size={16} />
      case 'ENTERPRISE':
        return <Crown size={16} />
      case 'ACTIVE':
        return <CheckCircle size={16} />
      case 'EXPIRED':
        return <XCircle size={16} />
      case 'CANCELLED':
        return <Minus size={16} />
      default:
        return <Users size={16} />
    }
  }

  const getStateColor = (state) => {
    switch (state) {
      case 'TRIAL':
        return '#3b82f6'
      case 'PROFESSIONAL':
        return '#f59e0b'
      case 'ENTERPRISE':
        return '#8b5cf6'
      case 'ACTIVE':
        return '#10b981'
      case 'EXPIRED':
        return '#ef4444'
      case 'CANCELLED':
        return '#6b7280'
      default:
        return '#6b7280'
    }
  }

  const StatCard = ({ icon: Icon, label, value, subtitle, change, changeType }) => (
    <motion.div
      className="admin-stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="admin-stat-header">
        <div className="admin-stat-icon">
          <Icon size={24} />
        </div>
      </div>
      <div className="admin-stat-label">{label}</div>
      <div className="admin-stat-value">{value}</div>
      {subtitle && <div className="admin-stat-subtitle">{subtitle}</div>}
      {change && (
        <div className={`admin-stat-change ${changeType}`}>
          {changeType === 'positive' && '↑'} {changeType === 'negative' && '↓'} {change}
        </div>
      )}
    </motion.div>
  )

  if (loading) {
    return (
      <div className="admin-overview-container">
        <div className="admin-loading-state">
          <div className="admin-loading-spinner"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-overview-container">
      {/* Header */}
      <motion.div
        className="admin-overview-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="admin-header-content">
          <div className="admin-header-info">
            <h1>Admin Dashboard</h1>
            <p>System overview and key metrics</p>
          </div>
          <div className="admin-header-actions">
            <button
              className="admin-action-btn secondary"
              onClick={fetchAdminData}
              title="Refresh data"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
            <button className="admin-action-btn secondary">
              <Download size={18} />
              Export
            </button>
          </div>
        </div>
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div
          className="admin-error-state"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="admin-error-icon">
            <AlertCircle size={32} />
          </div>
          <div className="admin-error-content">
            <div className="admin-error-title">Error Loading Data</div>
            <div className="admin-error-message">{error}</div>
          </div>
          <button className="admin-error-action" onClick={fetchAdminData}>
            Retry
          </button>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        <StatCard
          icon={Users}
          label="Total Users"
          value={adminData.totalUsers}
          subtitle="Active accounts"
          change="+12% this month"
          changeType="positive"
        />
        <StatCard
          icon={Target}
          label="Total Campaigns"
          value={adminData.totalCampaigns}
          subtitle="All campaigns"
          change="+8% this month"
          changeType="positive"
        />
        <StatCard
          icon={Activity}
          label="Total Articles"
          value={adminData.totalArticles}
          subtitle="Generated content"
          change="+24% this month"
          changeType="positive"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Revenue"
          value={formatCurrency(adminData.totalRevenue)}
          subtitle="Monthly recurring"
          change="+18% this month"
          changeType="positive"
        />
      </div>

      {/* Content Grid */}
      <div className="admin-content-grid">
        {/* User State Distribution */}
        <motion.div
          className="admin-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="admin-card-header">
            <h3>User Distribution</h3>
            <button className="admin-card-header-action">View All</button>
          </div>
          <div className="admin-card-content">
            <div className="user-state-grid">
              {adminData.systemStats?.userStateBreakdown?.map((stat) => (
                <div key={stat._id} className="state-card">
                  <div
                    className="state-card-value"
                    style={{ color: getStateColor(stat._id) }}
                  >
                    {stat.count}
                  </div>
                  <div className="state-card-label">
                    {getStateIcon(stat._id)}
                    <span>{stat._id}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Revenue Breakdown */}
        <motion.div
          className="admin-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="admin-card-header">
            <h3>Revenue by Plan</h3>
            <button className="admin-card-header-action">Details</button>
          </div>
          <div className="admin-card-content">
            <div className="revenue-breakdown">
              {adminData.systemStats?.planDistribution?.map((plan) => {
                const total = adminData.systemStats.planDistribution.reduce(
                  (sum, p) => sum + p.revenue,
                  0
                )
                const percentage = ((plan.revenue / total) * 100).toFixed(1)
                return (
                  <div key={plan._id}>
                    <div className="revenue-item">
                      <span className="revenue-label">{plan._id}</span>
                      <div>
                        <span className="revenue-value">
                          {formatCurrency(plan.revenue)}
                        </span>
                        <span className="revenue-percentage">{percentage}%</span>
                      </div>
                    </div>
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* Recent Users */}
        <motion.div
          className="admin-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <div className="admin-card-header">
            <h3>Recent Users</h3>
            <button 
              className="admin-card-header-action"
              onClick={onViewAllUsers}
            >
              View All
            </button>
          </div>
          <div className="admin-card-content">
            {adminData.recentUsers?.length > 0 ? (
              <div className="recent-items-list">
                {adminData.recentUsers.slice(0, 5).map((user) => (
                  <div key={user._id} className="recent-item-row">
                    <div className="recent-item-info">
                      <div className="recent-item-name">{user.name}</div>
                      <div className="recent-item-meta">
                        <span>{user.email}</span>
                        <span
                          className="recent-item-badge"
                          style={{
                            backgroundColor: `${getStateColor(user.subscription)}15`,
                            color: getStateColor(user.subscription),
                            border: `1px solid ${getStateColor(user.subscription)}30`
                          }}
                        >
                          {getStateIcon(user.subscription)}
                          {user.subscription}
                        </span>
                      </div>
                    </div>
                    <div className="recent-item-date">{formatDate(user.createdAt)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-empty-state">
                <Users size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                <p>No recent users</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Campaigns */}
        <motion.div
          className="admin-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <div className="admin-card-header">
            <h3>Recent Campaigns</h3>
            <button 
              className="admin-card-header-action"
              onClick={onViewAllCampaigns}
            >
              View All
            </button>
          </div>
          <div className="admin-card-content">
            {adminData.recentCampaigns?.length > 0 ? (
              <div className="recent-items-list">
                {adminData.recentCampaigns.slice(0, 5).map((campaign) => (
                  <div key={campaign._id} className="recent-item-row">
                    <div className="recent-item-info">
                      <div className="recent-item-name">{campaign.name}</div>
                      <div className="recent-item-meta">
                        <span>{campaign.status}</span>
                      </div>
                    </div>
                    <div className="recent-item-date">{formatDate(campaign.createdAt)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-empty-state">
                <Target size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                <p>No recent campaigns</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* System Health */}
        <motion.div
          className="admin-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <div className="admin-card-header">
            <h3>System Health</h3>
            <button className="admin-card-header-action">Monitor</button>
          </div>
          <div className="admin-card-content">
            <div className="system-health-grid">
              <div className="health-item">
                <div className="health-indicator healthy"></div>
                <div className="health-info">
                  <div className="health-label">API Server</div>
                  <div className="health-value">Operational</div>
                </div>
              </div>
              <div className="health-item">
                <div className="health-indicator healthy"></div>
                <div className="health-info">
                  <div className="health-label">Database</div>
                  <div className="health-value">Connected</div>
                </div>
              </div>
              <div className="health-item">
                <div className="health-indicator healthy"></div>
                <div className="health-info">
                  <div className="health-label">Email Service</div>
                  <div className="health-value">Active</div>
                </div>
              </div>
              <div className="health-item">
                <div className="health-indicator healthy"></div>
                <div className="health-info">
                  <div className="health-label">Payment Gateway</div>
                  <div className="health-value">Connected</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          className="admin-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <div className="admin-card-header">
            <h3>Quick Stats</h3>
          </div>
          <div className="admin-card-content">
            <div className="revenue-breakdown">
              <div className="revenue-item">
                <span className="revenue-label">Avg Revenue per User</span>
                <span className="revenue-value">
                  {adminData.totalUsers > 0
                    ? formatCurrency(adminData.totalRevenue / adminData.totalUsers)
                    : '₹0'}
                </span>
              </div>
              <div className="revenue-item">
                <span className="revenue-label">Campaigns per User</span>
                <span className="revenue-value">
                  {adminData.totalUsers > 0
                    ? (adminData.totalCampaigns / adminData.totalUsers).toFixed(2)
                    : '0'}
                </span>
              </div>
              <div className="revenue-item">
                <span className="revenue-label">Articles per Campaign</span>
                <span className="revenue-value">
                  {adminData.totalCampaigns > 0
                    ? (adminData.totalArticles / adminData.totalCampaigns).toFixed(2)
                    : '0'}
                </span>
              </div>
              <div className="revenue-item">
                <span className="revenue-label">Last Updated</span>
                <span className="revenue-value">{formatTime(lastUpdated)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AdminOverviewModern
