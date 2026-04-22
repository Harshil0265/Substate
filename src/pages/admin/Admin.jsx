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
  Crown,
  RefreshCw,
  Minus
} from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import AdminUsageStats from '../../components/AdminUsageStats'
import UserDetailsModal from '../../components/UserDetailsModal'
import { apiClient } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import '../../styles/admin.css'
import '../../styles/user-details-modal.css'

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
  const [payments, setPayments] = useState([])
  const [paymentStats, setPaymentStats] = useState(null)
  const [failedPayments, setFailedPayments] = useState([])
  const [paymentFilter, setPaymentFilter] = useState('ALL')
  const [paymentPage, setPaymentPage] = useState(1)
  const [paymentPagination, setPaymentPagination] = useState({})
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [refundReason, setRefundReason] = useState('')
  const [refundLoading, setRefundLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [userPage, setUserPage] = useState(1)
  const [userPagination, setUserPagination] = useState({})
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const user = useAuthStore((state) => state.user)

  const tabs = [
    { id: 'overview', name: 'Overview', icon: <BarChart3 size={18} /> },
    { id: 'usage', name: 'Usage Stats', icon: <TrendingUp size={18} /> },
    { id: 'users', name: 'Users', icon: <Users size={18} /> },
    { id: 'campaigns', name: 'Campaigns', icon: <Target size={18} /> },
    { id: 'moderation', name: 'Moderation', icon: <Shield size={18} /> },
    { id: 'payments', name: 'Payments', icon: <DollarSign size={18} /> },
    { id: 'analytics', name: 'Analytics', icon: <Activity size={18} /> },
    { id: 'system', name: 'System', icon: <Settings size={18} /> }
  ]

  useEffect(() => {
    fetchAdminData()
  }, [activeTab])

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

  // Protected users - NEVER suspend, block, or lock these accounts
  const PROTECTED_USERS = [
    'barotashokbhai03044@gmail.com', // Admin user
    'barotharshil070@gmail.com'      // Active user
  ];

  // User State Management - 8 comprehensive states + ADMIN
  const userStates = [
    { state: 'TRIAL', color: '#3b82f6', icon: 'Clock', type: 'subscription' },
    { state: 'PROFESSIONAL', color: '#f59e0b', icon: 'Star', type: 'subscription' },
    { state: 'ENTERPRISE', color: '#8b5cf6', icon: 'Crown', type: 'subscription' },
    { state: 'ADMIN', color: '#8b5cf6', icon: 'Crown', type: 'role' },
    { state: 'ACTIVE', color: '#10b981', icon: 'CheckCircle', type: 'status' },
    { state: 'EXPIRED', color: '#ef4444', icon: 'XCircle', type: 'status' },
    { state: 'CANCELLED', color: '#6b7280', icon: 'Minus', type: 'status' },
    { state: 'SUSPENDED', color: '#f59e0b', icon: 'AlertTriangle', type: 'status' },
    { state: 'LOCKED', color: '#dc2626', icon: 'Lock', type: 'status' }
  ]

  const getStateConfig = (state) => {
    return userStates.find(s => s.state === state) || { color: '#6b7280', icon: 'Users' }
  }

  const getStateIcon = (state) => {
    const config = getStateConfig(state)
    switch (config.icon) {
      case 'Clock': return <Clock size={16} />
      case 'Star': return <Star size={16} />
      case 'Crown': return <Crown size={16} />
      case 'CheckCircle': return <CheckCircle size={16} />
      case 'XCircle': return <XCircle size={16} />
      case 'Minus': return <Minus size={16} />
      case 'AlertTriangle': return <AlertCircle size={16} />
      case 'Lock': return <Lock size={16} />
      default: return <Users size={16} />
    }
  }

  const isProtectedUser = (email) => {
    return PROTECTED_USERS.includes(email.toLowerCase());
  }

  const getUserDisplayState = (user) => {
    // Admin users are above the subscription system
    if (user.role === 'ADMIN') {
      return { state: 'ADMIN', type: 'role', color: '#8b5cf6', icon: 'Crown' }
    }
    
    // Priority: Account locked > Subscription status > Email verification
    if (user.accountLocked || user.subscriptionStatus === 'LOCKED') {
      return { state: 'LOCKED', type: 'status' }
    }
    if (user.subscriptionStatus === 'SUSPENDED') {
      return { state: 'SUSPENDED', type: 'status' }
    }
    if (user.subscriptionStatus === 'EXPIRED') {
      return { state: 'EXPIRED', type: 'status' }
    }
    if (user.subscriptionStatus === 'CANCELLED') {
      return { state: 'CANCELLED', type: 'status' }
    }
    if (!user.emailVerified) {
      return { state: 'UNVERIFIED', type: 'status', color: '#f59e0b', icon: 'AlertCircle' }
    }
    if (user.subscriptionStatus === 'ACTIVE') {
      return { state: user.subscription, type: 'subscription' }
    }
    return { state: 'ACTIVE', type: 'status' }
  }

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      setError('') // Clear previous errors
      
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
        try {
          const [campaignsResponse, statsResponse] = await Promise.all([
            apiClient.get('/admin/campaigns/moderation'),
            apiClient.get('/admin/moderation/stats')
          ])
          setModerationCampaigns(campaignsResponse.data.campaigns || [])
          setModerationStats(statsResponse.data)
        } catch (moderationError) {
          console.warn('Moderation endpoints not available:', moderationError)
          // Set empty data for moderation if endpoints don't exist yet
          setModerationCampaigns([])
          setModerationStats({
            totalViolations: 0,
            suspendedUsers: 0,
            recentViolations: 0,
            pendingReview: 0
          })
        }
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
      
      // Check if it's a network error (server not running)
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        setError('Backend server is not running. Please start the server with "npm run server"')
      } else if (error.response?.status === 403) {
        setError('Access denied. Admin privileges required.')
      } else if (error.response?.status === 401) {
        setError('Authentication failed. Please login again.')
      } else {
        setError(`Failed to load admin data: ${error.response?.data?.error || error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUserView = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleUserModalClose = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const handleUserUpdate = () => {
    // Refresh the users list when user is updated
    fetchAdminData();
  };

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
              <div className="error-content">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
              <button 
                className="retry-button"
                onClick={() => {
                  setError('')
                  fetchAdminData()
                }}
              >
                <RefreshCw size={16} />
                Retry
              </button>
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
                        {/* User State Statistics */}
                        <div className="admin-card">
                          <h3>User State Distribution</h3>
                          <div className="user-state-stats">
                            {adminData.systemStats?.userStateBreakdown?.map((stat) => {
                              const stateConfig = getStateConfig(stat._id)
                              return (
                                <div key={stat._id} className="state-stat-card">
                                  <div 
                                    className="state-stat-number"
                                    style={{ color: stateConfig.color }}
                                  >
                                    {stat.count}
                                  </div>
                                  <div className="state-stat-label">
                                    {getStateIcon(stat._id)} {stat._id}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        <div className="admin-card">
                          <h3>Recent Users</h3>
                          <div className="recent-list">
                            {adminData.recentUsers?.length > 0 ? (
                              adminData.recentUsers.map((user) => {
                                const displayState = getUserDisplayState(user)
                                const stateConfig = getStateConfig(displayState.state)
                                return (
                                  <div key={user._id} className="recent-item">
                                    <div className="item-info">
                                      <span className="item-name">{user.name}</span>
                                      <span className="item-meta">
                                        {user.email}
                                        <span 
                                          className="state-badge"
                                          style={{ 
                                            color: stateConfig.color || displayState.color,
                                            backgroundColor: `${stateConfig.color || displayState.color}15`,
                                            marginLeft: '8px',
                                            fontSize: '10px',
                                            padding: '2px 6px'
                                          }}
                                        >
                                          {displayState.state === 'UNVERIFIED' ? <AlertCircle size={12} /> : getStateIcon(displayState.state)}
                                          {displayState.state}
                                        </span>
                                      </span>
                                    </div>
                                    <span className="item-date">{formatDate(user.createdAt)}</span>
                                  </div>
                                )
                              })
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
                            <option value="">All Users</option>
                            <optgroup label="Subscription Plans">
                              <option value="TRIAL">Trial Users</option>
                              <option value="PROFESSIONAL">Professional Plan</option>
                              <option value="ENTERPRISE">Enterprise Plan</option>
                            </optgroup>
                            <optgroup label="Account Status">
                              <option value="ACTIVE">Active Users</option>
                              <option value="EXPIRED">Expired Subscriptions</option>
                              <option value="CANCELLED">Cancelled Subscriptions</option>
                              <option value="SUSPENDED">Suspended Accounts</option>
                              <option value="LOCKED">Locked Accounts</option>
                            </optgroup>
                          </select>
                        </div>
                      </div>

                      <div className="admin-table">
                        <div className="table-header">
                          <span>User</span>
                          <span>Email</span>
                          <span>Subscription Plan</span>
                          <span>Account Status</span>
                          <span>User State</span>
                          <span>Last Login</span>
                          <span>Actions</span>
                        </div>
                        {users.map((user) => {
                          const displayState = getUserDisplayState(user)
                          const stateConfig = getStateConfig(displayState.state)
                          const isProtected = isProtectedUser(user.email)
                          
                          return (
                            <div key={user._id} className="table-row">
                              <span className="user-info">
                                <div className="user-avatar">
                                  {user.name?.charAt(0) || 'U'}
                                </div>
                                <div className="user-details">
                                  <strong>
                                    {user.name}
                                    {user.role === 'ADMIN' && (
                                      <span 
                                        className="admin-badge"
                                        style={{ 
                                          marginLeft: '8px',
                                          padding: '2px 6px',
                                          backgroundColor: '#8b5cf615',
                                          color: '#8b5cf6',
                                          border: '1px solid #8b5cf630',
                                          borderRadius: '4px',
                                          fontSize: '10px',
                                          fontWeight: '600'
                                        }}
                                        title="Administrator - Unlimited Access"
                                      >
                                        👑 ADMIN
                                      </span>
                                    )}
                                    {isProtected && user.role !== 'ADMIN' && (
                                      <span 
                                        className="protected-badge"
                                        style={{ 
                                          marginLeft: '8px',
                                          padding: '2px 6px',
                                          backgroundColor: '#10b98115',
                                          color: '#10b981',
                                          border: '1px solid #10b98130',
                                          borderRadius: '4px',
                                          fontSize: '10px',
                                          fontWeight: '600'
                                        }}
                                        title="Protected Account - Cannot be suspended or locked"
                                      >
                                        🛡️ PROTECTED
                                      </span>
                                    )}
                                  </strong>
                                  <span className="user-meta">ID: {user._id.slice(-8)}</span>
                                </div>
                              </span>
                              <span className="user-email">{user.email}</span>
                              
                              {/* Subscription Plan - Show "ADMIN ACCESS" for admin users */}
                              <span className="subscription-info">
                                {user.role === 'ADMIN' ? (
                                  <div 
                                    className="subscription-badge"
                                    style={{ 
                                      backgroundColor: '#8b5cf6',
                                      color: 'white'
                                    }}
                                  >
                                    <Crown size={16} />
                                    ADMIN ACCESS
                                  </div>
                                ) : (
                                  <div 
                                    className="subscription-badge"
                                    style={{ 
                                      backgroundColor: getStateConfig(user.subscription).color,
                                      color: 'white'
                                    }}
                                  >
                                    {getStateIcon(user.subscription)}
                                    {user.subscription}
                                  </div>
                                )}
                              </span>
                              
                              {/* Account Status */}
                              <span className="account-status">
                                <div 
                                  className="status-badge"
                                  style={{ 
                                    color: getStateConfig(user.subscriptionStatus).color,
                                    backgroundColor: `${getStateConfig(user.subscriptionStatus).color}15`,
                                    border: `1px solid ${getStateConfig(user.subscriptionStatus).color}30`
                                  }}
                                >
                                  {getStateIcon(user.subscriptionStatus)}
                                  {user.subscriptionStatus}
                                </div>
                              </span>
                              
                              {/* Overall User State */}
                              <span className="user-state">
                                <div 
                                  className="state-badge"
                                  style={{ 
                                    color: stateConfig.color || displayState.color,
                                    backgroundColor: `${stateConfig.color || displayState.color}15`,
                                    border: `1px solid ${stateConfig.color || displayState.color}30`
                                  }}
                                >
                                  {displayState.state === 'UNVERIFIED' ? <AlertCircle size={16} /> : getStateIcon(displayState.state)}
                                  {displayState.state}
                                </div>
                              </span>
                              
                              <span className="last-login">
                                {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                              </span>
                              
                              <div className="action-buttons">
                                <button 
                                  className="action-btn view"
                                  onClick={() => handleUserView(user)}
                                  title="View Details"
                                >
                                  <Eye size={16} />
                                  View
                                </button>
                                
                                {/* Admin users cannot be modified */}
                                {user.role === 'ADMIN' ? (
                                  <span 
                                    className="admin-notice"
                                    style={{ 
                                      fontSize: '12px',
                                      color: '#8b5cf6',
                                      fontWeight: '600',
                                      padding: '8px 12px'
                                    }}
                                  >
                                    👑 Unlimited Access
                                  </span>
                                ) : (
                                  <>
                                    {/* Lock/Unlock Actions - Disabled for protected users */}
                                    {user.accountLocked || user.subscriptionStatus === 'LOCKED' ? (
                                      <button 
                                        className="action-btn approve"
                                        onClick={() => handleUserAction(user._id, 'activate')}
                                        title="Unlock Account"
                                        disabled={isProtected}
                                      >
                                        <Unlock size={16} />
                                        Unlock
                                      </button>
                                    ) : (
                                      <button 
                                        className="action-btn suspend"
                                        onClick={() => handleUserAction(user._id, 'suspend')}
                                        title={isProtected ? "Cannot lock protected account" : "Lock Account"}
                                        disabled={isProtected}
                                      >
                                        <Lock size={16} />
                                        Lock
                                      </button>
                                    )}
                                    
                                    {/* Subscription Actions - Disabled for protected users */}
                                    {user.subscriptionStatus === 'SUSPENDED' ? (
                                      <button 
                                        className="action-btn approve"
                                        onClick={() => handleUserAction(user._id, 'reactivate')}
                                        title="Reactivate Account"
                                        disabled={isProtected}
                                      >
                                        <CheckCircle size={16} />
                                        Reactivate
                                      </button>
                                    ) : user.subscriptionStatus === 'ACTIVE' && !isProtected ? (
                                      <button 
                                        className="action-btn warning"
                                        onClick={() => handleUserAction(user._id, 'suspend-subscription')}
                                        title="Suspend Subscription"
                                      >
                                        <AlertCircle size={16} />
                                        Suspend
                                      </button>
                                    ) : null}
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        })}
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

                  {/* Payments Tab */}
                  {activeTab === 'payments' && (
                    <motion.div
                      className="admin-section"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2>Payment & Revenue Management</h2>
                      
                      {/* Payment Summary Cards */}
                      <div className="payment-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Total Revenue</div>
                          <div style={{ fontSize: '28px', fontWeight: '800', color: '#F97316' }}>₹{adminData.totalRevenue?.toLocaleString() || '0'}</div>
                        </div>
                        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Completed Payments</div>
                          <div style={{ fontSize: '28px', fontWeight: '800', color: '#10b981' }}>0</div>
                        </div>
                        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Failed Payments</div>
                          <div style={{ fontSize: '28px', fontWeight: '800', color: '#ef4444' }}>0</div>
                        </div>
                        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Success Rate</div>
                          <div style={{ fontSize: '28px', fontWeight: '800', color: '#3b82f6' }}>0%</div>
                        </div>
                      </div>

                      {/* Payment History Table */}
                      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '28px' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111827' }}>Payment History</h3>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#6b7280', fontSize: '12px' }}>Date</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#6b7280', fontSize: '12px' }}>User</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#6b7280', fontSize: '12px' }}>Plan</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#6b7280', fontSize: '12px' }}>Amount</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#6b7280', fontSize: '12px' }}>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td colSpan="5" style={{ padding: '40px 16px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                                  No payment data available
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Subscription Analytics */}
                      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700', color: '#111827' }}>Subscription Analytics</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                          <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#9ca3af', marginBottom: '8px' }}>Active Subscriptions</div>
                            <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981' }}>0</div>
                          </div>
                          <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#9ca3af', marginBottom: '8px' }}>Cancelled</div>
                            <div style={{ fontSize: '24px', fontWeight: '800', color: '#ef4444' }}>0</div>
                          </div>
                          <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#9ca3af', marginBottom: '8px' }}>Churn Rate</div>
                            <div style={{ fontSize: '24px', fontWeight: '800', color: '#f59e0b' }}>0%</div>
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

      {/* User Details Modal */}
      <UserDetailsModal
        user={selectedUser}
        isOpen={showUserModal}
        onClose={handleUserModalClose}
        onUserUpdate={handleUserUpdate}
      />
    </>
  )
}

export default Admin
