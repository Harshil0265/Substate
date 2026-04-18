import { Helmet } from 'react-helmet-async'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { apiClient } from '../../api/client'
import { useAuthStore } from '../../store/authStore'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const user = useAuthStore((state) => state.user)

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'users', name: 'Users', icon: '👥' },
    { id: 'campaigns', name: 'Campaigns', icon: '📈' },
    { id: 'analytics', name: 'Analytics', icon: '📉' },
    { id: 'system', name: 'System', icon: '⚙️' }
  ]

  useEffect(() => {
    fetchAdminData()
  }, [activeTab])

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      
      if (activeTab === 'overview') {
        const response = await apiClient.get('/admin/overview')
        setAdminData(response.data)
      } else if (activeTab === 'users') {
        const response = await apiClient.get('/admin/users')
        setUsers(response.data.users || [])
      } else if (activeTab === 'campaigns') {
        const response = await apiClient.get('/admin/campaigns')
        setCampaigns(response.data.campaigns || [])
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
      await apiClient.patch(`/admin/users/${userId}`, { action })
      setSuccess(`User ${action} successfully`)
      fetchAdminData()
    } catch (error) {
      setError(`Failed to ${action} user`)
    }
  }

  const handleCampaignAction = async (campaignId, action) => {
    try {
      await apiClient.patch(`/admin/campaigns/${campaignId}`, { action })
      setSuccess(`Campaign ${action} successfully`)
      fetchAdminData()
    } catch (error) {
      setError(`Failed to ${action} campaign`)
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
            <h1>🚫 Access Denied</h1>
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
            <div className="error-message" style={{ marginBottom: '20px' }}>
              {error}
            </div>
          )}

          {success && (
            <div className="success-message" style={{ marginBottom: '20px' }}>
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
                  <div className="loading-spinner"></div>
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
                          <div className="metric-icon">👥</div>
                          <div className="metric-info">
                            <div className="metric-value">{adminData.totalUsers}</div>
                            <div className="metric-label">Total Users</div>
                          </div>
                        </div>

                        <div className="metric-card">
                          <div className="metric-icon">📊</div>
                          <div className="metric-info">
                            <div className="metric-value">{adminData.totalCampaigns}</div>
                            <div className="metric-label">Total Campaigns</div>
                          </div>
                        </div>

                        <div className="metric-card">
                          <div className="metric-icon">📝</div>
                          <div className="metric-info">
                            <div className="metric-value">{adminData.totalArticles}</div>
                            <div className="metric-label">Total Articles</div>
                          </div>
                        </div>

                        <div className="metric-card">
                          <div className="metric-icon">💰</div>
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

                  {/* Users Tab */}
                  {activeTab === 'users' && (
                    <motion.div
                      className="admin-section"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2>User Management</h2>
                      <div className="admin-table">
                        <div className="table-header">
                          <span>User</span>
                          <span>Email</span>
                          <span>Subscription</span>
                          <span>Status</span>
                          <span>Joined</span>
                          <span>Actions</span>
                        </div>
                        {users.map((user) => (
                          <div key={user._id} className="table-row">
                            <span className="user-info">
                              <strong>{user.name}</strong>
                            </span>
                            <span>{user.email}</span>
                            <span className="subscription-badge">{user.subscription}</span>
                            <span className={`status-badge ${user.emailVerified ? 'verified' : 'pending'}`}>
                              {user.emailVerified ? 'Verified' : 'Pending'}
                            </span>
                            <span>{formatDate(user.createdAt)}</span>
                            <div className="action-buttons">
                              <button 
                                className="action-btn view"
                                onClick={() => console.log('View user', user._id)}
                              >
                                View
                              </button>
                              <button 
                                className="action-btn suspend"
                                onClick={() => handleUserAction(user._id, 'suspend')}
                              >
                                Suspend
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
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
                          <span>Budget</span>
                          <span>Status</span>
                          <span>Created</span>
                          <span>Actions</span>
                        </div>
                        {campaigns.map((campaign) => (
                          <div key={campaign._id} className="table-row">
                            <span className="campaign-info">
                              <strong>{campaign.name}</strong>
                            </span>
                            <span>{campaign.owner?.name || 'Unknown'}</span>
                            <span>{formatCurrency(campaign.budget)}</span>
                            <span className={`status-badge ${campaign.status.toLowerCase()}`}>
                              {campaign.status}
                            </span>
                            <span>{formatDate(campaign.createdAt)}</span>
                            <div className="action-buttons">
                              <button 
                                className="action-btn approve"
                                onClick={() => handleCampaignAction(campaign._id, 'approve')}
                              >
                                Approve
                              </button>
                              <button 
                                className="action-btn reject"
                                onClick={() => handleCampaignAction(campaign._id, 'reject')}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
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
                          <h4>📈 Growth Metrics</h4>
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
                          <h4>💰 Revenue Analytics</h4>
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
                          <h4>🖥️ Server Status</h4>
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
                          <h4>📊 Performance</h4>
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
                          <h4>🔧 Quick Actions</h4>
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
