import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Users, Clock, AlertTriangle, Zap, Calendar } from 'lucide-react'
import { apiClient } from '../api/client'

function AdminUsageStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/users/usage/reminder-stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
      setError('Failed to load statistics')
    } finally {
      setLoading(false)
    }
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
        <button onClick={fetchStats} className="refresh-button">
          <RefreshCw size={18} />
          Refresh Data
        </button>
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
          background: var(--bg-primary);
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
          border: 2px solid var(--border-color);
          margin-bottom: 32px;
          font-family: 'Inter', sans-serif;
        }

        .usage-stats-container.loading,
        .usage-stats-container.error {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px;
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
          color: var(--accent-orange);
        }

        .spin-animation {
          animation: spin 1s linear infinite;
        }

        .error-content p {
          color: var(--text-secondary);
          font-size: 16px;
          font-weight: 500;
        }

        .retry-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: var(--accent-orange);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(249, 115, 22, 0.3);
        }

        .retry-button:hover {
          background: var(--accent-orange-dark);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
        }

        .stats-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 2px solid var(--border-color);
        }

        .header-content h3 {
          margin: 0;
          color: var(--text-primary);
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin-bottom: 8px;
        }

        .header-content p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 15px;
          font-weight: 500;
        }

        .refresh-button {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--bg-secondary);
          border: 2px solid var(--border-color);
          border-radius: 12px;
          padding: 12px 20px;
          font-size: 15px;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Inter', sans-serif;
        }

        .refresh-button:hover {
          background: var(--accent-orange);
          color: white;
          border-color: var(--accent-orange);
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(249, 115, 22, 0.3);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }

        .stat-card {
          background: var(--bg-primary);
          border-radius: 20px;
          padding: 28px;
          display: flex;
          align-items: center;
          gap: 20px;
          transition: all 0.3s ease;
          border: 2px solid var(--border-color);
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
        }

        .stat-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
        }

        .stat-card.primary::before {
          background: linear-gradient(135deg, var(--accent-orange) 0%, var(--accent-orange-dark) 100%);
        }

        .stat-card.primary:hover {
          border-color: var(--accent-orange-light);
          box-shadow: 0 16px 48px rgba(249, 115, 22, 0.2);
        }

        .stat-card.warning::before {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }

        .stat-card.warning:hover {
          border-color: #f59e0b;
          box-shadow: 0 16px 48px rgba(245, 158, 11, 0.2);
        }

        .stat-card.critical::before {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }

        .stat-card.critical:hover {
          border-color: #ef4444;
          box-shadow: 0 16px 48px rgba(239, 68, 68, 0.2);
        }

        .stat-card.urgent::before {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        }

        .stat-card.urgent:hover {
          border-color: #dc2626;
          box-shadow: 0 16px 48px rgba(220, 38, 38, 0.2);
        }

        .stat-card.urgent {
          animation: pulse-urgent 3s infinite;
        }

        .stat-card.trial::before {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        }

        .stat-card.trial:hover {
          border-color: #3b82f6;
          box-shadow: 0 16px 48px rgba(59, 130, 246, 0.2);
        }

        .stat-icon {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .stat-card.primary .stat-icon {
          background: linear-gradient(135deg, var(--accent-orange) 0%, var(--accent-orange-dark) 100%);
        }

        .stat-card.warning .stat-icon {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }

        .stat-card.critical .stat-icon {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }

        .stat-card.urgent .stat-icon {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        }

        .stat-card.trial .stat-icon {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        }

        .stat-content {
          flex: 1;
        }

        .stat-number {
          font-size: 36px;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 8px;
          letter-spacing: -1px;
        }

        .stat-label {
          font-size: 15px;
          color: var(--text-secondary);
          font-weight: 600;
          letter-spacing: 0.3px;
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
            opacity: 0.9; 
            transform: scale(1.02);
          }
        }

        @media (max-width: 768px) {
          .stats-header {
            flex-direction: column;
            gap: 20px;
            align-items: flex-start;
            text-align: left;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .stat-card {
            padding: 24px;
          }

          .stat-number {
            font-size: 28px;
          }

          .usage-stats-container {
            padding: 24px;
          }
        }

        @media (max-width: 480px) {
          .stat-card {
            flex-direction: column;
            text-align: center;
            padding: 20px;
          }

          .stat-icon {
            width: 56px;
            height: 56px;
          }

          .stat-number {
            font-size: 24px;
          }

          .usage-stats-container {
            padding: 20px;
          }
        }
      `}</style>
    </motion.div>
  )
}

export default AdminUsageStats