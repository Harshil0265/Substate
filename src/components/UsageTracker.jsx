import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { apiClient } from '../api/client'

function UsageTracker({ compact = false }) {
  const [usage, setUsage] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsageData()
  }, [])

  const fetchUsageData = async () => {
    try {
      const [usageResponse, alertsResponse] = await Promise.all([
        apiClient.get('/users/usage/current'),
        apiClient.get('/users/usage/alerts')
      ])
      
      setUsage(usageResponse.data)
      setAlerts(alertsResponse.data.alerts || [])
    } catch (error) {
      console.error('Error fetching usage data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUsagePercentage = (used, limit) => {
    if (limit === -1) return 0 // Unlimited
    return Math.min(100, (used / limit) * 100)
  }

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return '#ef4444' // red
    if (percentage >= 75) return '#f59e0b' // amber
    if (percentage >= 50) return '#3b82f6' // blue
    return '#10b981' // green
  }

  const formatLimit = (limit) => {
    return limit === -1 ? '∞' : limit.toLocaleString()
  }

  if (loading) {
    return (
      <div className="usage-tracker loading">
        <div className="loading-spinner"></div>
        <span>Loading usage...</span>
      </div>
    )
  }

  if (!usage) return null

  if (compact) {
    return (
      <div className="usage-tracker compact">
        <div className="usage-summary">
          <div className="usage-item">
            <span className="usage-label">Campaigns:</span>
            <span className="usage-value">
              {usage.usage.campaigns}/{formatLimit(usage.limits.campaigns)}
            </span>
          </div>
          <div className="usage-item">
            <span className="usage-label">Articles:</span>
            <span className="usage-value">
              {usage.usage.articles}/{formatLimit(usage.limits.articles)}
            </span>
          </div>
          {usage.remaining.days > 0 && (
            <div className="usage-item">
              <span className="usage-label">Days left:</span>
              <span className="usage-value">{usage.remaining.days}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="usage-tracker"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="usage-header">
        <h3>Usage & Limits</h3>
        <div className="plan-badge">{usage.subscription.plan}</div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="usage-alerts">
          {alerts.map((alert, index) => (
            <motion.div
              key={index}
              className={`usage-alert ${alert.severity}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="alert-icon">
                {alert.severity === 'critical' && '🚨'}
                {alert.severity === 'high' && '⚠️'}
                {alert.severity === 'medium' && '📊'}
              </div>
              <div className="alert-content">
                <div className="alert-message">{alert.message}</div>
                {alert.category !== 'subscription' && alert.remaining !== -1 && (
                  <div className="alert-remaining">
                    {alert.remaining} remaining
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Usage Metrics */}
      <div className="usage-metrics">
        {/* Campaigns */}
        <div className="usage-metric">
          <div className="metric-header">
            <span className="metric-label">Campaigns</span>
            <span className="metric-count">
              {usage.usage.campaigns} / {formatLimit(usage.limits.campaigns)}
            </span>
          </div>
          {usage.limits.campaigns !== -1 && (
            <div className="metric-progress">
              <div 
                className="progress-bar"
                style={{
                  width: `${getUsagePercentage(usage.usage.campaigns, usage.limits.campaigns)}%`,
                  backgroundColor: getUsageColor(getUsagePercentage(usage.usage.campaigns, usage.limits.campaigns))
                }}
              />
            </div>
          )}
          <div className="metric-remaining">
            {usage.remaining.campaigns === -1 
              ? 'Unlimited remaining' 
              : `${usage.remaining.campaigns} remaining`
            }
          </div>
        </div>

        {/* Articles */}
        <div className="usage-metric">
          <div className="metric-header">
            <span className="metric-label">Articles</span>
            <span className="metric-count">
              {usage.usage.articles} / {formatLimit(usage.limits.articles)}
            </span>
          </div>
          {usage.limits.articles !== -1 && (
            <div className="metric-progress">
              <div 
                className="progress-bar"
                style={{
                  width: `${getUsagePercentage(usage.usage.articles, usage.limits.articles)}%`,
                  backgroundColor: getUsageColor(getUsagePercentage(usage.usage.articles, usage.limits.articles))
                }}
              />
            </div>
          )}
          <div className="metric-remaining">
            {usage.remaining.articles === -1 
              ? 'Unlimited remaining' 
              : `${usage.remaining.articles} remaining`
            }
          </div>
        </div>

        {/* Subscription Time */}
        <div className="usage-metric">
          <div className="metric-header">
            <span className="metric-label">Subscription</span>
            <span className="metric-count">
              {usage.remaining.days} days left
            </span>
          </div>
          <div className="metric-dates">
            <div className="date-item">
              <span className="date-label">Started:</span>
              <span className="date-value">
                {usage.subscription.startDate 
                  ? new Date(usage.subscription.startDate).toLocaleDateString()
                  : 'N/A'
                }
              </span>
            </div>
            <div className="date-item">
              <span className="date-label">Expires:</span>
              <span className="date-value">
                {usage.subscription.endDate 
                  ? new Date(usage.subscription.endDate).toLocaleDateString()
                  : 'N/A'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade CTA */}
      {(usage.subscription.plan === 'TRIAL' || alerts.some(a => a.severity === 'critical')) && (
        <motion.div
          className="upgrade-cta"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="cta-content">
            <h4>Ready to upgrade?</h4>
            <p>Get unlimited access and premium features</p>
          </div>
          <button 
            className="cta-button"
            onClick={() => window.location.href = '/subscription'}
          >
            View Plans
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}

export default UsageTracker