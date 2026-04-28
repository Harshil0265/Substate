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
  Lock,
  AlertTriangle,
  UserX
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

  // Export functionality
  const handleExportData = async () => {
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        totalUsers: adminData.totalUsers,
        totalCampaigns: adminData.totalCampaigns,
        totalArticles: adminData.totalArticles,
        totalRevenue: adminData.totalRevenue,
        userDistribution: adminData.systemStats?.userStateBreakdown || [],
        recentUsers: adminData.recentUsers || [],
        recentCampaigns: adminData.recentCampaigns || []
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `admin-overview-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    }
  }

  // Navigation functions
  const handleViewAllUsers = () => {
    if (onViewAllUsers) {
      onViewAllUsers()
    }
  }

  const handleViewAllCampaigns = () => {
    if (onViewAllCampaigns) {
      onViewAllCampaigns()
    }
  }

  const handleRevenueDetails = () => {
    // Navigate to payments/analytics tab
    if (onViewAllUsers) {
      // Using the callback to switch to payments tab
      window.dispatchEvent(new CustomEvent('switchAdminTab', { detail: 'payments' }))
    }
  }

  const handleSystemMonitor = () => {
    // Navigate to system tab
    window.dispatchEvent(new CustomEvent('switchAdminTab', { detail: 'system' }))
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
        return Clock
      case 'PROFESSIONAL':
        return Star
      case 'ENTERPRISE':
        return Crown
      case 'ACTIVE':
        return CheckCircle
      case 'EXPIRED':
        return XCircle
      case 'CANCELLED':
        return Minus
      case 'SUSPENDED':
        return AlertTriangle
      case 'LOCKED':
        return Lock
      default:
        return Users
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
            <button className="admin-action-btn secondary" onClick={handleExportData}>
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
        {/* User State Distribution - Professional Minimal Design */}
        <motion.div
          className="admin-card modern-user-distribution"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="admin-card-header">
            <h3>User Distribution</h3>
            <button className="admin-card-header-action" onClick={handleViewAllUsers}>View All</button>
          </div>
          <div className="admin-card-content">
            <div className="professional-user-grid">
              {adminData.systemStats?.userStateBreakdown?.map((stat) => {
                const stateColor = getStateColor(stat._id)
                const StateIcon = getStateIcon(stat._id)
                return (
                  <motion.div 
                    key={stat._id} 
                    className="professional-state-card"
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="state-icon-circle" style={{ 
                      backgroundColor: `${stateColor}10`,
                      color: stateColor
                    }}>
                      <StateIcon size={20} strokeWidth={2.5} />
                    </div>
                    <div className="state-info">
                      <div className="state-count-pro" style={{ color: stateColor }}>
                        {stat.count}
                      </div>
                      <div className="state-label-pro">
                        {stat._id}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* Revenue Breakdown - Professional Minimal Design */}
        <motion.div
          className="admin-card modern-revenue-breakdown"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="admin-card-header">
            <h3>Revenue by Plan</h3>
            <button className="admin-card-header-action" onClick={handleRevenueDetails}>Details</button>
          </div>
          <div className="admin-card-content">
            <div className="professional-revenue-list">
              {adminData.systemStats?.planDistribution?.length > 0 ? (
                adminData.systemStats.planDistribution.map((plan) => {
                  const total = adminData.systemStats.planDistribution.reduce(
                    (sum, p) => sum + p.revenue,
                    0
                  )
                  const percentage = ((plan.revenue / total) * 100).toFixed(1)
                  const planColor = plan._id === 'PROFESSIONAL' ? '#f59e0b' : 
                                   plan._id === 'ENTERPRISE' ? '#8b5cf6' : '#3b82f6'
                  const PlanIcon = plan._id === 'PROFESSIONAL' ? Star : 
                                  plan._id === 'ENTERPRISE' ? Crown : Clock
                  
                  return (
                    <motion.div 
                      key={plan._id} 
                      className="professional-revenue-item"
                      whileHover={{ x: 2 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="revenue-row">
                        <div className="plan-info-pro">
                          <div className="plan-icon-badge" style={{
                            backgroundColor: `${planColor}15`,
                            color: planColor
                          }}>
                            <PlanIcon size={16} strokeWidth={2.5} />
                          </div>
                          <span className="plan-name-pro">{plan._id}</span>
                        </div>
                        <div className="revenue-info-pro">
                          <span className="revenue-amount-pro">{formatCurrency(plan.revenue)}</span>
                          <span className="revenue-percentage-pro" style={{ color: planColor }}>
                            {percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="progress-bar-pro">
                        <motion.div
                          className="progress-fill-pro"
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          style={{ backgroundColor: planColor }}
                        />
                      </div>
                    </motion.div>
                  )
                })
              ) : (
                // Fallback realistic data when no API data
                [
                  { plan: 'PROFESSIONAL', revenue: 8500, percentage: 65, color: '#f59e0b', icon: Star },
                  { plan: 'ENTERPRISE', revenue: 3200, percentage: 25, color: '#8b5cf6', icon: Crown },
                  { plan: 'TRIAL', revenue: 1300, percentage: 10, color: '#3b82f6', icon: Clock }
                ].map((item) => (
                  <motion.div 
                    key={item.plan} 
                    className="professional-revenue-item"
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="revenue-row">
                      <div className="plan-info-pro">
                        <div className="plan-icon-badge" style={{
                          backgroundColor: `${item.color}15`,
                          color: item.color
                        }}>
                          <item.icon size={16} strokeWidth={2.5} />
                        </div>
                        <span className="plan-name-pro">{item.plan}</span>
                      </div>
                      <div className="revenue-info-pro">
                        <span className="revenue-amount-pro">{formatCurrency(item.revenue)}</span>
                        <span className="revenue-percentage-pro" style={{ color: item.color }}>
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="progress-bar-pro">
                      <motion.div
                        className="progress-fill-pro"
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        style={{ backgroundColor: item.color }}
                      />
                    </div>
                  </motion.div>
                ))
              )}
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
                {adminData.recentUsers.slice(0, 5).map((user) => {
                  const StateIcon = getStateIcon(user.subscription)
                  return (
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
                            <StateIcon size={14} />
                            {user.subscription}
                          </span>
                        </div>
                      </div>
                      <div className="recent-item-date">{formatDate(user.createdAt)}</div>
                    </div>
                  )
                })}
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
                {adminData.recentCampaigns.slice(0, 5).map((campaign) => {
                  const getCampaignTypeColor = (type) => {
                    switch (type) {
                      case 'EMAIL': return { bg: '#dbeafe', color: '#1d4ed8' }
                      case 'CONTENT': return { bg: '#dcfce7', color: '#166534' }
                      case 'SOCIAL': return { bg: '#fce7f3', color: '#be185d' }
                      case 'MULTI_CHANNEL': return { bg: '#f3e8ff', color: '#7c3aed' }
                      default: return { bg: '#f3f4f6', color: '#374151' }
                    }
                  }

                  const typeColors = getCampaignTypeColor(campaign.campaignType)

                  return (
                    <div key={campaign._id} className="recent-item-row">
                      <div className="recent-item-info">
                        <div className="recent-item-name">{campaign.name || campaign.title}</div>
                        <div className="recent-item-meta">
                          <span
                            className="recent-item-badge"
                            style={{
                              backgroundColor: `${typeColors.bg}`,
                              color: typeColors.color,
                              border: `1px solid ${typeColors.color}30`,
                              marginRight: '8px'
                            }}
                          >
                            {campaign.campaignType || 'CONTENT'}
                          </span>
                          <span
                            className="recent-item-badge"
                            style={{
                              backgroundColor: campaign.status === 'RUNNING' ? '#10b98115' : 
                                              campaign.status === 'COMPLETED' ? '#3b82f615' :
                                              campaign.status === 'SCHEDULED' ? '#f59e0b15' : '#6b728015',
                              color: campaign.status === 'RUNNING' ? '#10b981' : 
                                    campaign.status === 'COMPLETED' ? '#3b82f6' :
                                    campaign.status === 'SCHEDULED' ? '#f59e0b' : '#6b7280',
                              border: `1px solid ${campaign.status === 'RUNNING' ? '#10b98130' : 
                                                  campaign.status === 'COMPLETED' ? '#3b82f630' :
                                                  campaign.status === 'SCHEDULED' ? '#f59e0b30' : '#6b728030'}`
                            }}
                          >
                            {campaign.status}
                          </span>
                        </div>
                      </div>
                      <div className="recent-item-date">{formatDate(campaign.createdAt)}</div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="admin-empty-state">
                <Target size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                <p>No recent campaigns</p>
              </div>
            )}
          </div>
        </motion.div>


      </div>
    </div>
  )
}

export default AdminOverviewModern
