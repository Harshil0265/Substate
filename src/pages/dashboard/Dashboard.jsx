import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { apiClient } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import '../../styles/dashboard.css'

function Dashboard() {
  const [userData, setUserData] = useState(null)
  const [riskData, setRiskData] = useState(null)
  const [loading, setLoading] = useState(true)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await apiClient.get('/users/profile')
        setUserData(response.data.user)
        setRiskData(response.data.riskScore)
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
        <div className="dashboard-container">
          <div className="dashboard-header">
            <h1>Dashboard</h1>
            <p>Welcome back{userData ? `, ${userData.name}` : ''}! Here&apos;s your revenue intelligence summary.</p>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading your dashboard...</p>
            </div>
          ) : (
            <div className="dashboard-grid">
              {/* Metrics Cards */}
              <motion.div
                className="metric-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="metric-label">Subscription Status</div>
                <div className="metric-value">{userData?.subscription || 'TRIAL'}</div>
                <div className="metric-change">Current Plan</div>
              </motion.div>

              <motion.div
                className="metric-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <div className="metric-label">Active Campaigns</div>
                <div className="metric-value">{userData?.campaignCount || 0}</div>
                <div className="metric-change">Campaigns created</div>
              </motion.div>

              <motion.div
                className="metric-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <div className="metric-label">Risk Score</div>
                <div className="metric-value">{riskData?.overallRiskScore || 0}</div>
                <div className={`metric-change ${riskData?.riskTrend === 'DECREASING' ? 'positive' : 'negative'}`}>
                  {riskData?.riskTrend || 'STABLE'}
                </div>
              </motion.div>

              <motion.div
                className="metric-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <div className="metric-label">Published Articles</div>
                <div className="metric-value">{userData?.articleCount || 0}</div>
                <div className="metric-change">Articles created</div>
              </motion.div>
            </div>
          )}

          {/* Recent Activity */}
          <motion.div
            className="dashboard-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <div className="card-header">
              <h2>Recent Activity</h2>
            </div>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-dot"></div>
                <div className="activity-content">
                  <p className="activity-title">Campaign &quot;Summer Sale&quot; approved</p>
                  <p className="activity-time">2 hours ago</p>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-dot"></div>
                <div className="activity-content">
                  <p className="activity-title">10 new articles published</p>
                  <p className="activity-time">5 hours ago</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    </>
  )
}

export default Dashboard
