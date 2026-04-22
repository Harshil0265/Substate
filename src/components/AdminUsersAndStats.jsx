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

function AdminUsersAndStats() {
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
        limit: 10,
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
      {/* Usage Statistics Section */}
      <motion.div
        className="stats-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="section-header">
          <div className="header-content">
            <h3>Usage & Subscription Status</h3>
            <p>Real-time monitoring of user subscriptions and expiration alerts</p>
          </div>
          <div className="header-actions">
            <span className="last-updated">
              Last updated: <strong>{formatLastUpdated()}</strong>
            </span>
            <button
              onClick={handleRefresh}
              className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
              disabled={refreshing}
            >
              <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
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
          <div className="stats-grid">
            <motion.div
              className="stat-card primary"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="stat-icon">
                <Users size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.totalActiveUsers}</div>
                <div className="stat-label">Total Active Users</div>
              </div>
            </motion.div>

            <motion.div
              className="stat-card warning"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div className="stat-icon">
                <Calendar size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.expiringIn7Days}</div>
                <div className="stat-label">Expiring in 7 Days</div>
              </div>
            </motion.div>

            <motion.div
              className="stat-card critical"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <div className="stat-icon">
                <Clock size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.expiringIn3Days}</div>
                <div className="stat-label">Expiring in 3 Days</div>
              </div>
            </motion.div>

            <motion.div
              className="stat-card urgent"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <div className="stat-icon">
                <AlertTriangle size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.expiringToday}</div>
                <div className="stat-label">Expiring Today</div>
              </div>
            </motion.div>

            <motion.div
              className="stat-card trial"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <div className="stat-icon">
                <Zap size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-number">{stats.trialUsers}</div>
                <div className="stat-label">Trial Users</div>
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
      >
        <div className="section-header">
          <div className="header-content">
            <h3>User Management</h3>
            <p>Manage user accounts, subscriptions, and access control</p>
          </div>
          <div className="header-stats">
            <span className="stat-badge">
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
                    className="user-card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Card Header */}
                    <div className="card-header">
                      <div className="user-avatar">
                        {user.name?.charAt(0) || 'U'}
                      </div>
                      <div className="user-basic-info">
                        <div className="user-name">
                          {user.name}
                          {user.role === 'ADMIN' && (
                            <span className="badge admin-badge">👑 ADMIN</span>
                          )}
                          {isProtected && user.role !== 'ADMIN' && (
                            <span className="badge protected-badge">🛡️ PROTECTED</span>
                          )}
                        </div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="card-body">
                      <div className="info-row">
                        <span className="label">Subscription:</span>
                        <span
                          className="badge subscription-badge"
                          style={{
                            backgroundColor: stateConfig.color,
                            color: 'white'
                          }}
                        >
                          {getStateIcon(user.subscription)}
                          {user.subscription}
                        </span>
                      </div>

                      <div className="info-row">
                        <span className="label">Status:</span>
                        <span
                          className="badge status-badge"
                          style={{
                            backgroundColor: `${stateConfig.color}15`,
                            color: stateConfig.color,
                            border: `1px solid ${stateConfig.color}30`
                          }}
                        >
                          {getStateIcon(displayState.state)}
                          {displayState.state}
                        </span>
                      </div>

                      <div className="info-row">
                        <span className="label">Joined:</span>
                        <span className="value">{formatDate(user.createdAt)}</span>
                      </div>

                      {user.lastLogin && (
                        <div className="info-row">
                          <span className="label">Last Login:</span>
                          <span className="value">{formatDate(user.lastLogin)}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Footer - Actions */}
                    <div className="card-footer">
                      <button
                        className="action-btn view-btn"
                        onClick={() => setSelectedUser(user)}
                        title="View details"
                      >
                        <Eye size={16} />
                        View
                      </button>
                      {!isProtected && user.role !== 'ADMIN' && (
                        <>
                          {user.subscriptionStatus !== 'SUSPENDED' && (
                            <button
                              className="action-btn suspend-btn"
                              onClick={() => handleUserAction(user._id, 'suspend')}
                              disabled={actionLoading}
                              title="Suspend account"
                            >
                              <AlertTriangle size={16} />
                              Suspend
                            </button>
                          )}
                          {user.subscriptionStatus === 'SUSPENDED' && (
                            <button
                              className="action-btn unsuspend-btn"
                              onClick={() => handleUserAction(user._id, 'unsuspend')}
                              disabled={actionLoading}
                              title="Unsuspend account"
                            >
                              <CheckCircle size={16} />
                              Unsuspend
                            </button>
                          )}
                          {!user.accountLocked && (
                            <button
                              className="action-btn lock-btn"
                              onClick={() => handleUserAction(user._id, 'lock')}
                              disabled={actionLoading}
                              title="Lock account"
                            >
                              <Lock size={16} />
                              Lock
                            </button>
                          )}
                          {user.accountLocked && (
                            <button
                              className="action-btn unlock-btn"
                              onClick={() => handleUserAction(user._id, 'unlock')}
                              disabled={actionLoading}
                              title="Unlock account"
                            >
                              <Unlock size={16} />
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

            {/* Pagination */}
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
