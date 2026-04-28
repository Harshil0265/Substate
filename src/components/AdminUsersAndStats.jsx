import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Clock,
  AlertTriangle,
  Zap,
  Calendar,
  Search,
  Filter,
  Eye,
  Lock,
  Unlock,
  Shield,
  RefreshCw,
  AlertCircle,
  Loader2,
  Clock as ClockIcon,
  Star,
  Crown,
  CheckCircle,
  XCircle,
  Minus
} from 'lucide-react'
import { apiClient } from '../api/client'
import '../styles/admin-users-stats.css'

function AdminUsersAndStats({ onUserView }) {
  // Usage Stats State
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)

  // User Management State
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [userPage, setUserPage] = useState(1)
  const [userPagination, setUserPagination] = useState({})
  const [selectedUser, setSelectedUser] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const userStates = [
    { state: 'TRIAL', color: '#3b82f6', icon: 'Clock' },
    { state: 'PROFESSIONAL', color: '#f59e0b', icon: 'Star' },
    { state: 'ENTERPRISE', color: '#8b5cf6', icon: 'Crown' },
    { state: 'ACTIVE', color: '#10b981', icon: 'CheckCircle' },
    { state: 'EXPIRED', color: '#ef4444', icon: 'XCircle' },
    { state: 'CANCELLED', color: '#6b7280', icon: 'Minus' },
    { state: 'SUSPENDED', color: '#f59e0b', icon: 'AlertTriangle' },
    { state: 'LOCKED', color: '#dc2626', icon: 'Lock' }
  ]

  const PROTECTED_USERS = [
    'barotashokbhai03044@gmail.com',
    'barotharshil070@gmail.com'
  ]

  useEffect(() => {
    fetchStats()
    fetchUsers()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers()
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [userSearch, userFilter, userPage])

  const fetchStats = async () => {
    try {
      if (!refreshing) setStatsLoading(true)
      const response = await apiClient.get('/users/usage/reminder-stats')
      setStats(response.data)
      setLastUpdated(new Date())
      setStatsError('')
    } catch (error) {
      console.error('Error fetching stats:', error)
      setStatsError('Failed to load statistics')
    } finally {
      setStatsLoading(false)
      setRefreshing(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setUsersLoading(true)
      const params = new URLSearchParams({
        page: userPage,
        limit: 12,
        ...(userSearch && { search: userSearch }),
        ...(userFilter && { subscription: userFilter })
      })
      const response = await apiClient.get(`/admin/users?${params}`)
      setUsers(response.data.users || [])
      setUserPagination(response.data.pagination || {})
      setUsersError('')
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsersError('Failed to load users')
    } finally {
      setUsersLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchStats()
  }

  const handleUserAction = async (userId, action) => {
    try {
      setActionLoading(true)
      await apiClient.patch(`/admin/users/${userId}`, { action })
      await fetchUsers()
    } catch (error) {
      console.error('User action error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const getStateConfig = (state) => {
    return userStates.find(s => s.state === state) || { color: '#6b7280', icon: 'Users' }
  }

  const getStateIcon = (state) => {
    const config = getStateConfig(state)
    switch (config.icon) {
      case 'Clock': return <ClockIcon size={16} />
      case 'Star': return <Star size={16} />
      case 'Crown': return <Crown size={16} />
      case 'CheckCircle': return <CheckCircle size={16} />
      case 'XCircle': return <XCircle size={16} />
      case 'Minus': return <Minus size={16} />
      case 'AlertTriangle': return <AlertTriangle size={16} />
      case 'Lock': return <Lock size={16} />
      default: return <Users size={16} />
    }
  }

  const getUserDisplayState = (user) => {
    if (user.role === 'ADMIN') {
      return { state: 'ADMIN', type: 'role', color: '#8b5cf6' }
    }
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
    if (user.subscriptionStatus === 'ACTIVE') {
      return { state: user.subscription, type: 'subscription' }
    }
    return { state: 'ACTIVE', type: 'status' }
  }

  const isProtectedUser = (email) => {
    return PROTECTED_USERS.includes(email.toLowerCase())
  }

  const formatLastUpdated = () => {
    const now = new Date()
    const diff = Math.floor((now - lastUpdated) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="users-stats-container">
      {/* Main Header - Matching Overview Style */}
      <motion.div
        className="admin-overview-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ marginBottom: '24px' }}
      >
        <div className="admin-header-content">
          <div className="admin-header-info">
            <h1>Usage & Subscription Status</h1>
            <p>Real-time monitoring of user subscriptions and expiration alerts</p>
          </div>
          <div className="admin-header-actions">
            <button
              onClick={handleRefresh}
              className="admin-action-btn secondary"
              disabled={refreshing}
              title="Refresh data"
            >
              <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </motion.div>

      {/* Usage Statistics Section */}
      <motion.div
        className="stats-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="section-header" style={{ marginBottom: '16px' }}>
          <div className="header-content">
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>Subscription Overview</h3>
          </div>
          <div className="header-actions">
            <span className="last-updated" style={{ fontSize: '13px', color: '#6b7280' }}>
              Last updated: <strong>{formatLastUpdated()}</strong>
            </span>
          </div>
        </div>

        {statsError && (
          <div className="error-box">
            <AlertCircle size={20} />
            <span>{statsError}</span>
          </div>
        )}

        {statsLoading ? (
          <div className="loading-box">
            <Loader2 size={32} className="spinner" />
            <p>Loading statistics...</p>
          </div>
        ) : stats ? (
          <div className="stats-grid-pro">
            <motion.div
              className="stat-card-pro primary"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.05 }}
            >
              <div className="stat-icon-pro">
                <Users size={20} strokeWidth={2.5} />
              </div>
              <div className="stat-content-pro">
                <div className="stat-number-pro">{stats.totalActiveUsers}</div>
                <div className="stat-label-pro">Total Active Users</div>
              </div>
            </motion.div>

            <motion.div
              className="stat-card-pro warning"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <div className="stat-icon-pro">
                <Calendar size={20} strokeWidth={2.5} />
              </div>
              <div className="stat-content-pro">
                <div className="stat-number-pro">{stats.expiringIn7Days}</div>
                <div className="stat-label-pro">Expiring in 7 Days</div>
              </div>
            </motion.div>

            <motion.div
              className="stat-card-pro critical"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.15 }}
            >
              <div className="stat-icon-pro">
                <Clock size={20} strokeWidth={2.5} />
              </div>
              <div className="stat-content-pro">
                <div className="stat-number-pro">{stats.expiringIn3Days}</div>
                <div className="stat-label-pro">Expiring in 3 Days</div>
              </div>
            </motion.div>

            <motion.div
              className="stat-card-pro urgent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.2 }}
            >
              <div className="stat-icon-pro">
                <AlertTriangle size={20} strokeWidth={2.5} />
              </div>
              <div className="stat-content-pro">
                <div className="stat-number-pro">{stats.expiringToday}</div>
                <div className="stat-label-pro">Expiring Today</div>
              </div>
            </motion.div>

            <motion.div
              className="stat-card-pro trial"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.25 }}
            >
              <div className="stat-icon-pro">
                <Zap size={20} strokeWidth={2.5} />
              </div>
              <div className="stat-content-pro">
                <div className="stat-number-pro">{stats.trialUsers}</div>
                <div className="stat-label-pro">Trial Users</div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </motion.div>

      {/* User Management Section */}
      <motion.div
        className="users-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{ marginTop: '40px' }}
      >
        <div className="section-header" style={{ marginBottom: '24px' }}>
          <div className="header-content">
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>User Management</h3>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Manage user accounts, subscriptions, and access control</p>
          </div>
          <div className="header-stats">
            <span className="stat-badge" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              padding: '8px 16px',
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              <Users size={16} />
              Total: {userPagination.total || 0}
            </span>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="controls-bar">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value)
                setUserPage(1)
              }}
            />
          </div>
          <div className="filter-box">
            <Filter size={20} />
            <select
              value={userFilter}
              onChange={(e) => {
                setUserFilter(e.target.value)
                setUserPage(1)
              }}
            >
              <option value="">All Users</option>
              <optgroup label="Subscription Plans">
                <option value="TRIAL">Trial Users</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="ENTERPRISE">Enterprise</option>
              </optgroup>
              <optgroup label="Account Status">
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="LOCKED">Locked</option>
              </optgroup>
            </select>
          </div>
        </div>

        {usersError && (
          <div className="error-box">
            <AlertCircle size={20} />
            <span>{usersError}</span>
          </div>
        )}

        {usersLoading ? (
          <div className="loading-box">
            <Loader2 size={32} className="spinner" />
            <p>Loading users...</p>
          </div>
        ) : users.length > 0 ? (
          <>
            <div className="users-grid">
              {users.map((user) => {
                const displayState = getUserDisplayState(user)
                const stateConfig = getStateConfig(displayState.state)
                const isProtected = isProtectedUser(user.email)

                return (
                  <motion.div
                    key={user._id}
                    className="professional-user-card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Card Header with Avatar and Name */}
                    <div className="card-header-pro">
                      <div className="user-avatar-pro">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="user-identity">
                        <div className="user-name-pro">
                          {user.name}
                          {user.role === 'ADMIN' && (
                            <span className="role-badge admin-role">
                              <Crown size={12} />
                              ADMIN
                            </span>
                          )}
                          {isProtected && user.role !== 'ADMIN' && (
                            <span className="role-badge protected-role">
                              <Shield size={12} />
                            </span>
                          )}
                        </div>
                        <div className="user-email-pro">{user.email}</div>
                      </div>
                    </div>

                    {/* Card Body with Details */}
                    <div className="card-body-pro">
                      <div className="info-row-pro">
                        <span className="info-label">Subscription</span>
                        {user.role === 'ADMIN' ? (
                          <span className="info-badge" style={{ 
                            backgroundColor: '#8b5cf615',
                            color: '#8b5cf6',
                            border: '1px solid #8b5cf630'
                          }}>
                            <Crown size={14} />
                            ADMIN ACCESS
                          </span>
                        ) : (
                          <span className="info-badge" style={{ 
                            backgroundColor: `${getStateConfig(user.subscription).color}15`,
                            color: getStateConfig(user.subscription).color,
                            border: `1px solid ${getStateConfig(user.subscription).color}30`
                          }}>
                            {getStateIcon(user.subscription)}
                            {user.subscription}
                          </span>
                        )}
                      </div>
                      
                      <div className="info-row-pro">
                        <span className="info-label">Status</span>
                        <span className="info-badge" style={{ 
                          backgroundColor: `${stateConfig.color}15`,
                          color: stateConfig.color,
                          border: `1px solid ${stateConfig.color}30`
                        }}>
                          {getStateIcon(displayState.state)}
                          {displayState.state}
                        </span>
                      </div>

                      <div className="info-row-pro">
                        <span className="info-label">Joined</span>
                        <span className="info-value">{formatDate(user.createdAt)}</span>
                      </div>
                      
                      <div className="info-row-pro">
                        <span className="info-label">Last Login</span>
                        <span className="info-value">
                          {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                        </span>
                      </div>
                    </div>

                    {/* Card Footer with Actions */}
                    <div className="card-footer-pro">
                      <button 
                        className="action-btn-pro view-btn"
                        onClick={() => onUserView && onUserView(user)}
                        title="View Details"
                      >
                        <Eye size={14} />
                        View
                      </button>
                      
                      {user.role !== 'ADMIN' && (
                        <>
                          {user.subscriptionStatus !== 'SUSPENDED' && !isProtected && (
                            <button 
                              className="action-btn-pro suspend-btn"
                              onClick={() => handleUserAction(user._id, 'suspend')}
                              disabled={actionLoading}
                              title="Suspend Account"
                            >
                              <AlertTriangle size={14} />
                              Suspend
                            </button>
                          )}
                          
                          {user.subscriptionStatus === 'SUSPENDED' && (
                            <button 
                              className="action-btn-pro activate-btn"
                              onClick={() => handleUserAction(user._id, 'reactivate')}
                              disabled={actionLoading}
                              title="Reactivate Account"
                            >
                              <CheckCircle size={14} />
                              Activate
                            </button>
                          )}
                          
                          {!user.accountLocked && !isProtected && (
                            <button 
                              className="action-btn-pro lock-btn"
                              onClick={() => handleUserAction(user._id, 'lock')}
                              disabled={actionLoading}
                              title="Lock Account"
                            >
                              <Lock size={14} />
                              Lock
                            </button>
                          )}
                          
                          {user.accountLocked && (
                            <button 
                              className="action-btn-pro unlock-btn"
                              onClick={() => handleUserAction(user._id, 'unlock')}
                              disabled={actionLoading}
                              title="Unlock Account"
                            >
                              <Unlock size={14} />
                              Unlock
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Pagination Controls */}
            {userPagination.pages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setUserPage(Math.max(1, userPage - 1))}
                  disabled={userPage === 1}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {userPage} of {userPagination.pages}
                </span>
                <button
                  className="pagination-btn"
                  onClick={() => setUserPage(Math.min(userPagination.pages, userPage + 1))}
                  disabled={userPage === userPagination.pages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <Users size={48} />
            <p>No users found</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default AdminUsersAndStats
