import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
      <div className="admin-stats loading">
        <div className="loading-spinner"></div>
        <p>Loading statistics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-stats error">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <motion.div
      className="admin-stats"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="stats-header">
        <h2>Usage & Reminder Statistics</h2>
        <button onClick={fetchStats} className="refresh-button">
          🔄 Refresh
        </button>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.totalActiveUsers}</div>
            <div className="stat-label">Total Active Users</div>
          </div>

          <div className="stat-card warning">
            <div className="stat-number">{stats.expiringIn7Days}</div>
            <div className="stat-label">Expiring in 7 Days</div>
          </div>

          <div className="stat-card critical">
            <div className="stat-number">{stats.expiringIn3Days}</div>
            <div className="stat-label">Expiring in 3 Days</div>
          </div>

          <div className="stat-card urgent">
            <div className="stat-number">{stats.expiringToday}</div>
            <div className="stat-label">Expiring Today</div>
          </div>

          <div className="stat-card trial">
            <div className="stat-number">{stats.trialUsers}</div>
            <div className="stat-label">Trial Users</div>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-stats {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          margin-bottom: 24px;
        }

        .admin-stats.loading,
        .admin-stats.error {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 40px;
          color: #6b7280;
        }

        .stats-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .stats-header h2 {
          margin: 0;
          color: #1f2937;
          font-size: 20px;
          font-weight: 600;
        }

        .refresh-button {
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .refresh-button:hover {
          background: #e5e7eb;
          transform: translateY(-1px);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .stat-card {
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          transition: all 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .stat-card.warning {
          border-color: #f59e0b;
          background: #fffbeb;
        }

        .stat-card.critical {
          border-color: #ef4444;
          background: #fef2f2;
        }

        .stat-card.urgent {
          border-color: #dc2626;
          background: #fef2f2;
          animation: pulse 2s infinite;
        }

        .stat-card.trial {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .stat-number {
          font-size: 32px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #e5e7eb;
          border-top: 2px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        @media (max-width: 768px) {
          .stats-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </motion.div>
  )
}

export default AdminUsageStats