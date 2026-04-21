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
  AlertCircle
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const user = useAuthStore((state) => state.user)

  const tabs = [
    { id: 'overview', name: 'Overview', icon: <BarChart3 size={18} /> },
    { id: 'usage', name: 'Usage Stats', icon: <TrendingUp size={18} /> },
    { id: 'users', name: 'Users', icon: <Users size={18} /> },
    { id: 'campaigns', name: 'Campaigns', icon: <Target size={18} /> },
    { id: 'analytics', name: 'Analytics', icon: <Activity size={18} /> },
    { id: 'system', name: 'System', icon: <Settings size={18} /> }
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

  const handleCampaignAction = async (campaignId, action) => {
    try {
      setError('')
      setSuccess('')
      
      const response = await apiClient.patch(`/admin/campaigns/${campaignId}`, { action })
      
      setSuccess(`Campaign ${action}d successfully`)
      
      // Refresh the campaigns list
      await fetchAdminData()
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Campaign action error:', error)
      setError(error.response?.data?.error || `Failed to ${action} campaign`)
      setTimeout(() => setError(''), 5000)
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
          <div className="access-denied" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 20px',
            textAlign: 'center'
          }}>
            <AlertCircle size={64} color="#ef4444" style={{ marginBottom: '24px' }} />
            <h1 style={{ fontSize: '32px', marginBottom: '12px' }}>Access Denied</h1>
            <p style={{ color: '#6b7280', fontSize: '16px' }}>You don't have permission to access the admin panel.</p>
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
                <div className="loading-state" style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: '60px 20px',
                  gap: '16px'
                }}>
                  <Loader2 size={40} className="loading-spinner" style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading admin data...</p>
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
                          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                            <Users size={24} color="white" />
                          </div>
                          <div className="metric-info">
                            <div className="metric-value">{adminData.totalUsers}</div>
                            <div className="metric-label">Total Users</div>
                          </div>
                        </div>

                        <div className="metric-card">
                          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                            <Target size={24} color="white" />
                          </div>
                          <div className="metric-info">
                            <div className="metric-value">{adminData.totalCampaigns}</div>
                            <div className="metric-label">Total Campaigns</div>
                          </div>
                        </div>

                        <div className="metric-card">
                          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                            <Activity size={24} color="white" />
                          </div>
                          <div className="metric-info">
                            <div className="metric-value">{adminData.totalArticles}</div>
                            <div className="metric-label">Total Articles</div>
                          </div>
                        </div>

                        <div className="metric-card">
                          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                            <TrendingUp size={24} color="white" />
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
                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                              >
                                <Eye size={16} />
                                View
                              </button>
                              {user.accountLocked ? (
                                <button 
                                  className="action-btn approve"
                                  onClick={() => handleUserAction(user._id, 'activate')}
                                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                  <UserCheck size={16} />
                                  Activate
                                </button>
                              ) : (
                                <button 
                                  className="action-btn suspend"
                                  onClick={() => handleUserAction(user._id, 'suspend')}
                                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                  <UserX size={16} />
                                  Suspend
                                </button>
                              )}
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
                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                              >
                                <CheckCircle size={16} />
                                Approve
                              </button>
                              <button 
                                className="action-btn reject"
                                onClick={() => handleCampaignAction(campaign._id, 'reject')}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
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
