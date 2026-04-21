import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import UsageTracker from '../../components/UsageTracker'
import { apiClient } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import '../../styles/dashboard.css'
import '../../styles/usage-tracker.css'
import '../../styles/modern-dashboard.css'

function Dashboard() {
  const [userData, setUserData] = useState(null)
  const [riskData, setRiskData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [chartData, setChartData] = useState([])
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await apiClient.get('/users/profile')
        setUserData(response.data.user)
        setRiskData(response.data.riskScore)
        
        // Generate sample chart data
        const sampleData = Array.from({ length: 12 }, (_, i) => ({
          month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
          revenue: Math.floor(Math.random() * 5000) + 1000,
          campaigns: Math.floor(Math.random() * 20) + 5,
          articles: Math.floor(Math.random() * 100) + 20
        }))
        setChartData(sampleData)
      } catch (error) {
        console.error('[v0] Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const quickActions = [
    { id: 'campaign', label: 'New Campaign', icon: '🎯', color: 'orange' },
    { id: 'article', label: 'Generate Article', icon: '✍️', color: 'blue' },
    { id: 'analytics', label: 'View Analytics', icon: '📊', color: 'green' },
    { id: 'upgrade', label: 'Upgrade Plan', icon: '⭐', color: 'purple' }
  ]

  const recentActivities = [
    { id: 1, type: 'campaign', title: 'Summer Sale Campaign', status: 'Active', time: '2 hours ago', amount: '$1,250' },
    { id: 2, type: 'article', title: 'AI Content Strategy Guide', status: 'Published', time: '5 hours ago', amount: null },
    { id: 3, type: 'payment', title: 'Pro Plan Subscription', status: 'Completed', time: '1 day ago', amount: '$10.00' },
    { id: 4, type: 'campaign', title: 'Product Launch Campaign', status: 'Draft', time: '2 days ago', amount: '$890' }
  ]

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active': case 'completed': case 'published': return 'success'
      case 'draft': case 'pending': return 'warning'
      case 'failed': case 'cancelled': return 'error'
      default: return 'default'
    }
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await apiClient.get('/users/profile')
        setUserData(response.data.user)
        setRiskData(response.data.riskScore)
        
        // Generate sample chart data
        const sampleData = Array.from({ length: 12 }, (_, i) => ({
          month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
          revenue: Math.floor(Math.random() * 5000) + 1000,
          campaigns: Math.floor(Math.random() * 20) + 5,
          articles: Math.floor(Math.random() * 100) + 20
        }))
        setChartData(sampleData)
      } catch (error) {
        console.error('[v0] Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user])

  return (
    <>
      <Helmet>
        <title>Dashboard - SUBSTATE</title>
        <meta name="description" content="View your revenue intelligence and campaign metrics in real-time." />
      </Helmet>

      <DashboardLayout>
        <div className="modern-dashboard">
          {/* Dashboard Header */}
          <div className="dashboard-header-modern">
            <div className="header-content">
              <div className="header-info">
                <h1>Dashboard</h1>
                <p>Welcome back{userData ? `, ${userData.name}` : ''}! Here's your revenue intelligence summary.</p>
              </div>
              <div className="header-actions">
                <button className="action-btn secondary">
                  <span className="btn-icon">📊</span>
                  Manage Balance
                </button>
                <button className="action-btn secondary">
                  <span className="btn-icon">📤</span>
                  Export
                </button>
                <button className="action-btn primary">
                  <span className="btn-icon">💳</span>
                  New Payment
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading-state-modern">
              <div className="loading-spinner-modern"></div>
              <p>Loading your dashboard...</p>
            </div>
          ) : (
            <>
              {/* Main Stats Cards */}
              <div className="stats-grid-modern">
                <motion.div
                  className="stat-card-modern primary"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="stat-header">
                    <span className="stat-label">Total Revenue</span>
                    <span className="stat-change positive">+18%</span>
                  </div>
                  <div className="stat-value">$19,270.56</div>
                  <div className="stat-subtitle">Monthly growth</div>
                </motion.div>

                <motion.div
                  className="stat-card-modern"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <div className="stat-header">
                    <span className="stat-label">Total Saving</span>
                    <span className="stat-change positive">+8%</span>
                  </div>
                  <div className="stat-value">$19,270.56</div>
                  <div className="stat-subtitle">Cost optimization</div>
                </motion.div>

                <motion.div
                  className="stat-card-modern"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <div className="stat-header">
                    <span className="stat-label">Monthly Expense</span>
                    <span className="stat-change positive">+6%</span>
                  </div>
                  <div className="stat-value">$19,270.56</div>
                  <div className="stat-subtitle">Operating costs</div>
                </motion.div>
              </div>

              {/* Main Content Grid */}
              <div className="dashboard-grid-modern">
                {/* Cash Flow Chart */}
                <motion.div
                  className="dashboard-card-modern chart-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <div className="card-header-modern">
                    <div className="header-left">
                      <h3>Cash Flow</h3>
                      <span className="card-value">$19,270.56</span>
                    </div>
                    <div className="header-right">
                      <div className="chart-tabs">
                        <button className={`tab-btn ${activeTab === 'income' ? 'active' : ''}`} onClick={() => setActiveTab('income')}>Income</button>
                        <button className={`tab-btn ${activeTab === 'expense' ? 'active' : ''}`} onClick={() => setActiveTab('expense')}>Expense</button>
                        <button className={`tab-btn ${activeTab === 'saving' ? 'active' : ''}`} onClick={() => setActiveTab('saving')}>Saving</button>
                      </div>
                      <select className="time-selector">
                        <option>Weekly</option>
                        <option>Monthly</option>
                        <option>Yearly</option>
                      </select>
                    </div>
                  </div>
                  <div className="chart-container">
                    <div className="chart-placeholder">
                      <div className="chart-bars">
                        {Array.from({ length: 12 }, (_, i) => (
                          <div 
                            key={i} 
                            className={`chart-bar ${i === 6 ? 'highlighted' : ''}`}
                            style={{ height: `${Math.random() * 80 + 20}%` }}
                          ></div>
                        ))}
                      </div>
                      <div className="chart-highlight">
                        <span className="highlight-value">$16,251</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Credit Card */}
                <motion.div
                  className="dashboard-card-modern card-widget"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <div className="credit-card">
                    <div className="card-header-credit">
                      <div className="card-type">
                        <span className="card-icon">💳</span>
                        <span>Credit</span>
                      </div>
                      <div className="card-actions">
                        <button className="card-action-btn">Debit</button>
                      </div>
                    </div>
                    <div className="card-number">
                      <span className="card-signal">📶</span>
                      <span className="number">•••• •••• •••• 6541</span>
                    </div>
                    <div className="card-info">
                      <div className="card-holder">
                        <span className="label">Card Holder Name</span>
                        <span className="name">{userData?.name || 'Anjuman Sharear'}</span>
                      </div>
                      <div className="card-brand">
                        <span className="visa">VISA</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="quick-actions-section">
                    <h4>Quick Action</h4>
                    <div className="quick-actions">
                      <button className="quick-action-btn">
                        <span className="action-icon">⬆️</span>
                        Top up
                      </button>
                      <button className="quick-action-btn">
                        <span className="action-icon">🔄</span>
                        Transfers
                      </button>
                      <button className="quick-action-btn">
                        <span className="action-icon">📋</span>
                        Request
                      </button>
                    </div>
                  </div>

                  <div className="daily-limit-section">
                    <div className="limit-header">
                      <span>Daily Limit</span>
                      <span className="add-btn">+</span>
                    </div>
                    <div className="limit-amount">
                      <span className="amount">$1200 used</span>
                      <span className="total">from $2,000 limit</span>
                    </div>
                    <div className="limit-progress">
                      <div className="progress-bar" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                </motion.div>

                {/* Spending Limits */}
                <motion.div
                  className="dashboard-card-modern spending-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  <h4>Smart Spending Limits</h4>
                  <div className="spending-items">
                    <div className="spending-item">
                      <div className="item-info">
                        <span className="item-color orange"></span>
                        <span className="item-label">Shopping (27%)</span>
                      </div>
                    </div>
                    <div className="spending-item">
                      <div className="item-info">
                        <span className="item-color dark"></span>
                        <span className="item-label">Subscriptions (35%)</span>
                      </div>
                    </div>
                    <div className="spending-item">
                      <div className="item-info">
                        <span className="item-color orange"></span>
                        <span className="item-label">Dining Out (18%)</span>
                      </div>
                    </div>
                    <div className="spending-item">
                      <div className="item-info">
                        <span className="item-color dark"></span>
                        <span className="item-label">Other (20%)</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Bill & Payment */}
                <motion.div
                  className="dashboard-card-modern bill-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                >
                  <div className="bill-header">
                    <h4>Bill & Payment</h4>
                    <button className="add-bill-btn">+</button>
                  </div>
                  <div className="bill-item">
                    <div className="bill-info">
                      <div className="bill-icon netflix">N</div>
                      <div className="bill-details">
                        <span className="bill-name">Netflix Subscription</span>
                        <span className="bill-date">Jul 24, 2025</span>
                      </div>
                    </div>
                    <div className="bill-actions">
                      <span className="bill-amount">$25.30</span>
                      <button className="bill-status scheduled">Scheduled</button>
                    </div>
                  </div>
                  <button className="view-all-btn">View All</button>
                </motion.div>
              </div>

              {/* Transactions Table */}
              <motion.div
                className="dashboard-card-modern transactions-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.7 }}
              >
                <div className="transactions-header">
                  <div className="header-left">
                    <h3>Recent Activities</h3>
                  </div>
                  <div className="header-right">
                    <button className="export-btn">
                      <span className="btn-icon">📤</span>
                      Export
                    </button>
                  </div>
                </div>
                <div className="transactions-table">
                  <div className="table-header">
                    <div className="th">
                      <input type="checkbox" />
                    </div>
                    <div className="th">Activity ID</div>
                    <div className="th">User</div>
                    <div className="th">Total Amount</div>
                    <div className="th">Activity Period</div>
                    <div className="th">Status</div>
                  </div>
                  {recentActivities.map((activity, index) => (
                    <div key={activity.id} className="table-row">
                      <div className="td">
                        <input type="checkbox" />
                      </div>
                      <div className="td">
                        <span className="activity-id">ACT-{activity.id.toString().padStart(6, '0')}</span>
                      </div>
                      <div className="td">
                        <div className="user-info">
                          <div className="user-avatar">
                            <span>{userData?.name?.charAt(0) || 'U'}</span>
                          </div>
                          <span className="user-name">{userData?.name || 'User'}</span>
                        </div>
                      </div>
                      <div className="td">
                        <span className="amount">{activity.amount || 'N/A'}</span>
                      </div>
                      <div className="td">
                        <span className="period">{activity.time}</span>
                      </div>
                      <div className="td">
                        <span className={`status-badge ${getStatusColor(activity.status)}`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Usage Tracker */}
              <UsageTracker />
            </>
          )}
        </div>
      </DashboardLayout>
    </>
  )
}

export default Dashboard
