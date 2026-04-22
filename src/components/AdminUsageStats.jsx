import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Users, Clock, AlertTriangle, Zap, Calendar, TrendingUp } from 'lucide-react'
import { apiClient } from '../api/client'

function AdminUsageStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchStats()
    // Auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      if (!refreshing) setLoading(true)
      const response = await apiClient.get('/users/usage/reminder-stats')
      setStats(response.data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching stats:', error)
      setError('Failed to load statistics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchStats()
  }

  const sendTestReminder = async (userId) => {
    try {
      const response = await apiClient.post(`/users/usage/test-reminder/${userId}`)
      if (response.data.success) {
        alert('Test reminder sent successfully!')
      } else {
        alert('Failed to send test reminder: ' + response.data.error)
      }
    } catch (error) {
      console.error('Error sending test reminder:', error)
      alert('Failed to send test reminder')
    }
  }

  const formatLastUpdated = () => {
    const now = new Date()
    const diff = Math.floor((now - lastUpdated) / 1000)
    
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="usage-stats-container loading">
        <div className="loading-content">
          <div className="loading-spinner">
            <RefreshCw size={32} className="spin-animation" />
          </div>
          <p>Loading usage statistics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="usage-stats-container error">
        <div className="error-content">
          <AlertTriangle size={32} color="#ef4444" />
          <p>{error}</p>
          <button onClick={fetchStats} className="retry-button">
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="usage-stats-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="stats-header">
        <div className="header-content">
          <h3>Usage & Reminder Statistics</h3>
          <p>Monitor user activity and subscription status</p>
        </div>
        <div className="header-actions">
          <div className="last-updated">
            Last updated: <span>{formatLastUpdated()}</span>
          </div>
          <button 
            onClick={handleRefresh} 
            className={`refresh-button ${refreshing ? 'refreshing' : ''}`}
            disabled={refreshing}
          >
            <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {stats && (
        <div className="stats-grid">
          <motion.div 
            className="stat-card primary"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="stat-icon">
              <Users size={28} color="white" />
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
              <Calendar size={28} color="white" />
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
              <Clock size={28} color="white" />
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
              <AlertTriangle size={28} color="white" />
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
              <Zap size={28} color="white" />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.trialUsers}</div>
              <div className="stat-label">Trial Users</div>
            </div>
          </motion.div>
        </div>
      )}

      <style jsx>{`
        .usage-stats-container {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          border: 1px solid #e5e7eb;
          margin-bottom: 32px;
          font-family: 'Inter', sans-serif;
        }

        .usage-stats-container.loading,
        .usage-stats-container.error {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 80px 60px;
        }

        .loading-content,
        .error-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          text-align: center;
        }

        .loading-spinner {
          color: #f97316;
        }

        .spin-animation {
          animation: spin 1s linear infinite;
        }

        .error-content p {
          color: #6b7280;
          font-size: 16px;
          font-weight: 500;
        }

        .retry-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
        }

        .retry-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
        }

        .stats-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid #f3f4f6;
          flex-wrap: wrap;
          gap: 20px;
        }

        .header-content h3 {
          margin: 0;
          color: #111827;
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin-bottom: 8px;
        }

        .header-content p {
          margin: 0;
          color: #6b7280;
          font-size: 15px;
          font-weight: 500;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .last-updated {
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
          padding: 8px 12px;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .last-updated span {
          color: #111827;
          font-weight: 600;
        }

        .refresh-button {
          display: flex;
          align-items: center;
          gap: 10px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Inter', sans-serif;
        }

        .refresh-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          color: white;
          border-color: #f97316;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
        }

        .refresh-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .refresh-button.refreshing svg {
          animation: spin 1s linear infinite;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
        }

        .stat-card {
          background: white;
          border-radius: 14px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: all 0.3s ease;
          border: 1px solid #e5e7eb;
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          border-color: #f97316;
        }

        .stat-card.primary::before {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
        }

        .stat-card.primary:hover {
          box-shadow: 0 8px 24px rgba(249, 115, 22, 0.15);
        }

        .stat-card.warning::before {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }

        .stat-card.warning:hover {
          box-shadow: 0 8px 24px rgba(245, 158, 11, 0.15);
        }

        .stat-card.critical::before {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }

        .stat-card.critical:hover {
          box-shadow: 0 8px 24px rgba(239, 68, 68, 0.15);
        }

        .stat-card.urgent::before {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        }

        .stat-card.urgent:hover {
          box-shadow: 0 8px 24px rgba(220, 38, 38, 0.15);
        }

        .stat-card.urgent {
          animation: pulse-urgent 3s infinite;
        }

        .stat-card.trial::before {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        }

        .stat-card.trial:hover {
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
        }

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .stat-card.primary .stat-icon {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          color: white;
        }

        .stat-card.warning .stat-icon {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
        }

        .stat-card.critical .stat-icon {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }

        .stat-card.urgent .stat-icon {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white;
        }

        .stat-card.trial .stat-icon {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
        }

        .stat-content {
          flex: 1;
        }

        .stat-number {
          font-size: 40px;
          font-weight: 800;
          color: #111827;
          margin-bottom: 4px;
          letter-spacing: -1.5px;
        }

        .stat-label {
          font-size: 14px;
          color: #6b7280;
          font-weight: 600;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse-urgent {
          0%, 100% { 
            opacity: 1; 
            transform: scale(1);
          }
          50% { 
            opacity: 0.95; 
            transform: scale(1.01);
          }
        }

        @media (max-width: 768px) {
          .stats-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }

          .header-actions {
            width: 100%;
            flex-direction: column;
          }

          .refresh-button {
            width: 100%;
            justify-content: center;
          }

          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
          }

          .stat-card {
            padding: 20px;
          }

          .stat-number {
            font-size: 32px;
          }

          .usage-stats-container {
            padding: 24px;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .stat-card {
            flex-direction: row;
            align-items: center;
            padding: 16px;
          }

          .stat-icon {
            width: 48px;
            height: 48px;
          }

          .stat-number {
            font-size: 28px;
          }

          .usage-stats-container {
            padding: 16px;
          }

          .header-content h3 {
            font-size: 22px;
          }
        }
      `}</style>
    </motion.div>
  )
}

export default AdminUsageStats