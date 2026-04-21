import { Helmet } from 'react-helmet-async'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target,
  Activity,
  Settings,
  CheckCircle,
  XCircle,
  Eye,
  UserCheck,
  UserX,
  Loader2,
  AlertCircle,
  DollarSign,
  Server,
  Gauge,
  Wrench,
  Search,
  Filter,
  Lock,
  Unlock,
  Shield,
  Clock,
  Star,
  Crown
} from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import AdminUsageStats from '../../components/AdminUsageStats'
import { apiClient } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import '../../styles/admin.css'

function Admin() {
  const [activeTab, setActiveTab] = useState('overview')
  const [adminData, setAdminData] = useState({
    totalUsers: 0,
    totalCampaigns: 0,
    totalArticles: 0,
    totalRevenue: 0,
    recentUsers: [],
    recentCampaigns: [],
    systemStats: {}
  })
  const [users, setUsers] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [moderationCampaigns, setModerationCampaigns] = useState([])
  const [moderationStats, setModerationStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [userPage, setUserPage] = useState(1)
  const [userPagination, setUserPagination] = useState({})
  const user = useAuthStore((state) => state.user)

  const tabs = [
    { id: 'overview', name: 'Overview', icon: <BarChart3 size={18} /> },
    { id: 'usage', name: 'Usage Stats', icon: <TrendingUp size={18} /> },
    { id: 'users', name: 'Users', icon: <Users size={18} /> },
    { id: 'campaigns', name: 'Campaigns', icon: <Target size={18} /> },
    { id: 'moderation', name: 'Moderation', icon: <Shield size={18} /> },
    { id: 'analytics', name: 'Analytics', icon: <Activity size={18} /> },
    { id: 'system', name: 'System', icon: <Settings size={18} /> }
  ]

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (activeTab === 'users') {
        fetchAdminData()
      }
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [userSearch, userFilter, userPage])

  const handleUserSearch = (e) => {
    setUserSearch(e.target.value)
    setUserPage(1) // Reset to first page on search
  }

  const handleUserFilter = (e) => {
    setUserFilter(e.target.value)
    setUserPage(1) // Reset to first page on filter
  }

  const getSubscriptionIcon = (subscription) => {
    switch (subscription) {
      case 'TRIAL': return <Clock size={16} />
      case 'BASIC': return <Users size={16} />
      case 'PRO': return <Star size={16} />
      case 'ENTERPRISE': return <Crown size={16} />
      default: return <Users size={16} />
    }
  }

  const getSubscriptionColor = (subscription) => {
    switch (subscription) {
      case 'TRIAL': return '#3b82f6'
      case 'BASIC': return '#10b981'
      case 'PRO': return '#f59e0b'
      case 'ENTERPRISE': return '#8b5cf6'
      default: return '#6b7280'
    }
  }

  const getAccountStatusIcon = (user) => {
    if (user.accountLocked) return <Lock size={16} />
    if (!user.emailVerified) return <AlertCircle size={16} />
    return <CheckCircle size={16} />
  }

  const getAccountStatusColor = (user) => {
    if (user.accountLocked) return '#ef4444'
    if (!user.emailVerified) return '#f59e0b'
    return '#10b981'
  }

  const getAccountStatusText = (user) => {
    if (user.accountLocked) return 'Locked'
    if (!user.emailVerified) return 'Unverified'
    return 'Active'
  }

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      
      if (activeTab === 'overview') {
        const response = await apiClient.get('/admin/overview')
        setAdminData(response.data)
      } else if (activeTab === 'users') {
        const params = new URLSearchParams({
          page: userPage,
          limit: 20,
          ...(userSearch && { search: userSearch }),
          ...(userFilter && { subscription: userFilter })
        })
        const response = await apiClient.get(`/admin/users?${params}`)
        setUsers(response.data.users || [])
        setUserPagination(response.data.pagination || {})
      } else if (activeTab === 'campaigns') {
        const response = await apiClient.get('/admin/campaigns')
        setCampaigns(response.data.campaigns || [])
      } else if (activeTab === 'moderation') {
        const [campaignsResponse, statsResponse] = await Promise.all([
          apiClient.get('/admin/campaigns/moderation'),
          apiClient.get('/admin/moderation/stats')
        ])
        setModerationCampaigns(campaignsResponse.data.campaigns || [])
        setModerationStats(statsResponse.data)
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
      setError('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const handleUserAction = async (userId, action) => {
    try {
      setError('')
      setSuccess('')
      
      const response = await apiClient.patch(`/admin/users/${userId}`, { action })
      
      setSuccess(`User ${action}d successfully`)
      
      // Refresh the users list
      await fetchAdminData()
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('User action error:', error)
      setError(error.response?.data?.error || `Failed to ${action} user`)
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleCampaignModeration = async (campaignId, action, adminNotes = '') => {
    try {
      setError('')
      setSuccess('')
      
      const response = await apiClient.patch(`/admin/campaigns/${campaignId}/moderate`, { 
        action, 
        adminNotes 
      })
      
      setSuccess(`Campaign ${action}ed successfully`)
      
      // Refresh the moderation list
      if (activeTab === 'moderation') {
        await fetchAdminData()
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Campaign moderation error:', error)
      setError(error.response?.data?.error || `Failed to ${action} campaign`)
      setTimeout(() => setError(''), 5000)
    }
  }

  const getModerationStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return '#10b981'
      case 'REJECTED': return '#f59e0b'
      case 'BLOCKED': return '#ef4444'
      case 'UNDER_REVIEW': return '#3b82f6'
      case 'PENDING': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 1: return '#10b981' // Low - Green
      case 2: return '#f59e0b' // Medium - Yellow
      case 3: return '#ef4444' // High - Red
      case 4: return '#dc2626' // Critical - Dark Red
      default: return '#6b7280'
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Check if user has admin privileges
  if (user?.role !== 'ADMIN') {
    return (
      <DashboardLayout>
        <div className="dashboard-container">
          <div className="access-denied">
            <AlertCircle size={80} color="#ef4444" style={{ marginBottom: '32px' }} />
            <h1>Access Denied</h1>
            <p>You don't have permission to access the admin panel.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - SUBSTATE</title>
        <meta name="description" content="Revenue intelligence and user management." />
      </Helmet>

      <DashboardLayout>
        <div className="dashboard-container">
          <div className="dashboard-header">
            <div>
              <h1>Admin Dashboard</h1>
              <p>Manage users, campaigns, and system analytics</p>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          <div className="admin-container">
            {/* Admin Tabs */}
            <div className="admin-sidebar">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-name">{tab.name}</span>
                </button>
              ))}
            </div>

            {/* Admin Content */}
            <div className="admin-content">
              {loading ? (
                <div className="loading-state">
                  <Loader2 size={48} className="loading-spinner" />
                  <p>Loading admin data...</p>
                </div>
              ) : (
                <>
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <motion.div
                      className="admin-section"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="admin-metrics">
                        <div className="metric-card">
                          <div className="metric-icon">
                            <Users size={28} color="white" />
                          </div>
                          <div className="metric-info">
                            <div className="metric-value">{adminData.totalUsers}</div>
                            <div className="metric-label">Total Users</div>
                          </div>
                        </div>

                        <div className="metric-card">
                          <div className="metric-icon">
                            <Target size={28} color="white" />
                          </div>
                          <div className="metric-info">
                            <div className="metric-value">{adminData.totalCampaigns}</div>
                            <div className="metric-label">Total Campaigns</div>
                          </div>
                        </div>

                        <div className="metric-card">
                          <div className="metric-icon">
                            <Activity size={28} color="white" />
                          </div>
                          <div className="metric-info">
                            <div className="metric-value">{adminData.totalArticles}</div>
                            <div className="metric-label">Total Articles</div>
                          </div>
                        </div>

                        <div className="metric-card">
                          <div className="metric-icon">
                            <TrendingUp size={28} color="white" />
                          </div>
                          <div className="metric-info">
                            <div className="metric-value">{formatCurrency(adminData.totalRevenue)}</div>
                            <div className="metric-label">Total Revenue</div>
                          </div>
                        </div>
                      </div>

                      <div className="admin-grid">
                        <div className="admin-card">
                          <h3>Recent Users</h3>
                          <div className="recent-list">
                            {adminData.recentUsers?.length > 0 ? (
                              adminData.recentUsers.map((user) => (
                                <div key={user._id} className="recent-item">
                                  <div className="item-info">
                                    <span className="item-name">{user.name}</span>
                                    <span className="item-meta">{user.email}</span>
                                  </div>
                                  <span className="item-date">{formatDate(user.createdAt)}</span>
                                </div>
                              ))
                            ) : (
                              <p>No recent users</p>
                            )}
                          </div>
                        </div>

                        <div className="admin-card">
                          <h3>Recent Campaigns</h3>
                          <div className="recent-list">
                            {adminData.recentCampaigns?.length > 0 ? (
                              adminData.recentCampaigns.map((campaign) => (
                                <div key={campaign._id} className="recent-item">
                                  <div className="item-info">
                                    <span className="item-name">{campaign.name}</span>
                                    <span className="item-meta">{campaign.status}</span>
                                  </div>
                                  <span className="item-date">{formatDate(campaign.createdAt)}</span>
                                </div>
                              ))
                            ) : (
                              <p>No recent campaigns</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Usage Stats Tab */}
                  {activeTab === 'usage' && (
                    <motion.div
                      className="admin-section"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2>Usage & Reminder Statistics</h2>
                      <AdminUsageStats />
                    </motion.div>
                  )}

                  {/* Users Tab */}
                  {activeTab === 'users' && (
                    <motion.div
                      className="admin-section"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="section-header">
                        <h2>User Management</h2>
                        <div className="section-stats">
                          <span className="stat-item">
                            <Users size={16} />
                            Total: {userPagination.total || 0}
                          </span>
                        </div>
                      </div>

                      {/* Search and Filter Controls */}
                      <div className="admin-controls">
                        <div className="search-control">
                          <Search size={20} className="search-icon" />
                          <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={userSearch}
                            onChange={handleUserSearch}
                            className="search-input"
                          />
                        </div>
                        <div className="filter-control">
                          <Filter size={20} className="filter-icon" />
                          <select
                            value={userFilter}
                            onChange={handleUserFilter}
                            className="filter-select"
                          >
                            <option value="">All Subscriptions</option>
                            <option value="TRIAL">Trial Users</option>
                            <option value="BASIC">Basic Plan</option>
                            <option value="PRO">Pro Plan</option>
                            <option value="ENTERPRISE">Enterprise Plan</option>
                          </select>
                        </div>
                      </div>

                      <div className="admin-table">
                        <div className="table-header">
                          <span>User</span>
                          <span>Email</span>
                          <span>Subscription</span>
                          <span>Account Status</span>
                          <span>Last Login</span>
                          <span>Actions</span>
                        </div>
                        {users.map((user) => (
                          <div key={user._id} className="table-row">
                            <span className="user-info">
                              <div className="user-avatar">
                                {user.name?.charAt(0) || 'U'}
                              </div>
                              <div className="user-details">
                                <strong>{user.name}</strong>
                                <span className="user-meta">ID: {user._id.slice(-8)}</span>
                              </div>
                            </span>
                            <span className="user-email">{user.email}</span>
                            <span className="subscription-info">
                              <div 
                                className="subscription-badge"
                                style={{ 
                                  backgroundColor: getSubscriptionColor(user.subscription),
                                  color: 'white'
                                }}
                              >
                                {getSubscriptionIcon(user.subscription)}
                                {user.subscription}
                              </div>
                            </span>
                            <span className="account-status">
                              <div 
                                className="status-badge"
                                style={{ 
                                  color: getAccountStatusColor(user),
                                  backgroundColor: `${getAccountStatusColor(user)}15`,
                                  border: `1px solid ${getAccountStatusColor(user)}30`
                                }}
                              >
                                {getAccountStatusIcon(user)}
                                {getAccountStatusText(user)}
                              </div>
                            </span>
                            <span className="last-login">
                              {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                            </span>
                            <div className="action-buttons">
                              <button 
                                className="action-btn view"
                                onClick={() => console.log('View user', user._id)}
                                title="View Details"
                              >
                                <Eye size={16} />
                                View
                              </button>
                              {user.accountLocked ? (
                                <button 
                                  className="action-btn approve"
                                  onClick={() => handleUserAction(user._id, 'activate')}
                                  title="Unlock Account"
                                >
                                  <Unlock size={16} />
                                  Unlock
                                </button>
                              ) : (
                                <button 
                                  className="action-btn suspend"
                                  onClick={() => handleUserAction(user._id, 'suspend')}
                                  title="Lock Account"
                                >
                                  <Lock size={16} />
                                  Lock
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination */}
                      {userPagination.pages > 1 && (
                        <div className="pagination">
                          <button
                            className="pagination-btn"
                            disabled={userPage === 1}
                            onClick={() => setUserPage(userPage - 1)}
                          >
                            Previous
                          </button>
                          <span className="pagination-info">
                            Page {userPage} of {userPagination.pages} 
                            ({userPagination.total} total users)
                          </span>
                          <button
                            className="pagination-btn"
                            disabled={userPage === userPagination.pages}
                            onClick={() => setUserPage(userPage + 1)}
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Campaigns Tab */}
                  {activeTab === 'campaigns' && (
                    <motion.div
                      className="admin-section"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2>Campaign Management</h2>
                      <div className="admin-table">
                        <div className="table-header">
                          <span>Campaign</span>
                          <span>Owner</span>
                          <span>Status</span>
                          <span>Articles</span>
                          <span>Created</span>
                          <span>Actions</span>
                        </div>
                        {campaigns.map((campaign) => (
                          <div key={campaign._id} className="table-row">
                            <span className="campaign-info">
                              <strong>{campaign.name}</strong>
                            </span>
                            <span>{campaign.owner?.name || 'Unknown'}</span>
                            <span className={`status-badge ${campaign.status.toLowerCase()}`}>
                              {campaign.status}
                            </span>
                            <span>{campaign.articlesGenerated || 0}</span>
                            <span>{formatDate(campaign.createdAt)}</span>
                            <div className="action-buttons">
                              <button 
                                className="action-btn approve"
                                onClick={() => handleCampaignAction(campaign._id, 'approve')}
                              >
                                <CheckCircle size={16} />
                                Approve
                              </button>
                              <button 
                                className="action-btn reject"
                                onClick={() => handleCampaignAction(campaign._id, 'reject')}
                              >
                                <XCircle size={16} />
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Moderation Tab */}
                  {activeTab === 'moderation' && (
                    <motion.div
                      className="admin-section"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="section-header">
                        <h2>Content Moderation</h2>
                        <div className="section-stats">
                          <span className="stat-item">
                            <AlertCircle size={16} />
                            Pending: {moderationStats?.pendingReview || 0}
                          </span>
                        </div>
                      </div>

                      {/* Moderation Statistics */}
                      {moderationStats && (
                        <div className="moderation-stats">
                          <div className="stat-card">
                            <div className="stat-number">{moderationStats.totalViolations}</div>
                            <div className="stat-label">Total Violations</div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-number">{moderationStats.suspendedUsers}</div>
                            <div className="stat-label">Suspended Users</div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-number">{moderationStats.recentViolations}</div>
                            <div className="stat-label">Recent Violations (30d)</div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-number">{moderationStats.pendingReview}</div>
                            <div className="stat-label">Pending Review</div>
                          </div>
                        </div>
                      )}

                      {/* Campaigns Requiring Review */}
                      <div className="moderation-table">
                        <div className="table-header">
                          <span>Campaign</span>
                          <span>Owner</span>
                          <span>Violations</span>
                          <span>Risk Score</span>
                          <span>Status</span>
                          <span>Actions</span>
                        </div>
                        {moderationCampaigns.map((campaign) => (
                          <div key={campaign._id} className="table-row moderation-row">
                            <span className="campaign-info">
                              <strong>{campaign.name}</strong>
                              <span className="campaign-meta">
                                Created: {formatDate(campaign.createdAt)}
                              </span>
                            </span>
                            <span className="owner-info">
                              <div>{campaign.owner?.name}</div>
                              <div className="owner-violations">
                                Violations: {campaign.owner?.violationCount || 0}
                              </div>
                            </span>
                            <span className="violations-info">
                              {campaign.moderationStatus?.violations?.length > 0 ? (
                                <div className="violations-list">
                                  {campaign.moderationStatus.violations.map((violation, index) => (
                                    <div 
                                      key={index} 
                                      className="violation-badge"
                                      style={{ 
                                        backgroundColor: `${getSeverityColor(violation.severity)}15`,
                                        color: getSeverityColor(violation.severity),
                                        border: `1px solid ${getSeverityColor(violation.severity)}30`
                                      }}
                                    >
                                      {violation.category.replace('_', ' ')}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="no-violations">Manual Review</span>
                              )}
                            </span>
                            <span className="risk-score">
                              <div 
                                className="risk-badge"
                                style={{ 
                                  backgroundColor: `${getSeverityColor(Math.ceil(campaign.moderationStatus?.riskScore / 25))}15`,
                                  color: getSeverityColor(Math.ceil(campaign.moderationStatus?.riskScore / 25))
                                }}
                              >
                                {campaign.moderationStatus?.riskScore || 0}%
                              </div>
                            </span>
                            <span className="moderation-status">
                              <div 
                                className="status-badge"
                                style={{ 
                                  backgroundColor: `${getModerationStatusColor(campaign.moderationStatus?.status)}15`,
                                  color: getModerationStatusColor(campaign.moderationStatus?.status),
                                  border: `1px solid ${getModerationStatusColor(campaign.moderationStatus?.status)}30`
                                }}
                              >
                                {campaign.moderationStatus?.status || 'PENDING'}
                              </div>
                            </span>
                            <div className="action-buttons">
                              <button 
                                className="action-btn approve"
                                onClick={() => handleCampaignModeration(campaign._id, 'approve')}
                                title="Approve Campaign"
                              >
                                <CheckCircle size={16} />
                                Approve
                              </button>
                              <button 
                                className="action-btn reject"
                                onClick={() => handleCampaignModeration(campaign._id, 'reject')}
                                title="Reject Campaign"
                              >
                                <XCircle size={16} />
                                Reject
                              </button>
                              <button 
                                className="action-btn suspend"
                                onClick={() => handleCampaignModeration(campaign._id, 'block', 'Content policy violation')}
                                title="Block Campaign & Warn User"
                              >
                                <Shield size={16} />
                                Block
                              </button>
                            </div>
                          </div>
                        ))}
                        {moderationCampaigns.length === 0 && (
                          <div className="no-data">
                            <CheckCircle size={48} color="#10b981" />
                            <h3>No campaigns pending review</h3>
                            <p>All campaigns have been reviewed and approved.</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Analytics Tab */}
                  {activeTab === 'analytics' && (
                    <motion.div
                      className="admin-section"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2>Analytics & Reports</h2>
                      <div className="analytics-grid">
                        <div className="analytics-card">
                          <div className="analytics-header">
                            <TrendingUp size={24} color="var(--accent-orange)" />
                            <h4>Growth Metrics</h4>
                          </div>
                          <div className="metric-list">
                            <div className="metric-item">
                              <span>New Users (30d)</span>
                              <span className="metric-value positive">+24</span>
                            </div>
                            <div className="metric-item">
                              <span>Active Campaigns</span>
                              <span className="metric-value">12</span>
                            </div>
                            <div className="metric-item">
                              <span>Revenue Growth</span>
                              <span className="metric-value positive">+15.3%</span>
                            </div>
                          </div>
                        </div>

                        <div className="analytics-card">
                          <div className="analytics-header">
                            <DollarSign size={24} color="var(--accent-orange)" />
                            <h4>Revenue Analytics</h4>
                          </div>
                          <div className="metric-list">
                            <div className="metric-item">
                              <span>Monthly Revenue</span>
                              <span className="metric-value">{formatCurrency(2450)}</span>
                            </div>
                            <div className="metric-item">
                              <span>Average Order Value</span>
                              <span className="metric-value">{formatCurrency(89)}</span>
                            </div>
                            <div className="metric-item">
                              <span>Conversion Rate</span>
                              <span className="metric-value">3.2%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* System Tab */}
                  {activeTab === 'system' && (
                    <motion.div
                      className="admin-section"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2>System Management</h2>
                      <div className="system-grid">
                        <div className="system-card">
                          <div className="system-header">
                            <Server size={24} color="var(--accent-orange)" />
                            <h4>Server Status</h4>
                          </div>
                          <div className="status-list">
                            <div className="status-item">
                              <span>API Server</span>
                              <span className="status-indicator online">Online</span>
                            </div>
                            <div className="status-item">
                              <span>Database</span>
                              <span className="status-indicator online">Online</span>
                            </div>
                            <div className="status-item">
                              <span>Email Service</span>
                              <span className="status-indicator online">Online</span>
                            </div>
                          </div>
                        </div>

                        <div className="system-card">
                          <div className="system-header">
                            <Gauge size={24} color="var(--accent-orange)" />
                            <h4>Performance</h4>
                          </div>
                          <div className="performance-list">
                            <div className="performance-item">
                              <span>Response Time</span>
                              <span className="performance-value">245ms</span>
                            </div>
                            <div className="performance-item">
                              <span>Uptime</span>
                              <span className="performance-value">99.9%</span>
                            </div>
                            <div className="performance-item">
                              <span>Error Rate</span>
                              <span className="performance-value">0.1%</span>
                            </div>
                          </div>
                        </div>

                        <div className="system-card">
                          <div className="system-header">
                            <Wrench size={24} color="var(--accent-orange)" />
                            <h4>Quick Actions</h4>
                          </div>
                          <div className="action-list">
                            <button className="system-action-btn">Clear Cache</button>
                            <button className="system-action-btn">Backup Database</button>
                            <button className="system-action-btn">Send Test Email</button>
                            <button className="system-action-btn">Generate Report</button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  )
}

export default Admin
