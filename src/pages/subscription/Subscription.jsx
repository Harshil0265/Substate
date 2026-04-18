import { Helmet } from 'react-helmet-async'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { apiClient } from '../../api/client'
import { useAuthStore } from '../../store/authStore'

function Subscription() {
  const [subscriptionData, setSubscriptionData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [upgrading, setUpgrading] = useState(false)
  const user = useAuthStore((state) => state.user)

  const plans = [
    {
      id: 'TRIAL',
      name: 'Trial',
      price: 0,
      duration: '14 days',
      features: [
        '5 Campaigns',
        '10 Articles',
        'Basic Analytics',
        'Email Support'
      ],
      current: true
    },
    {
      id: 'BASIC',
      name: 'Basic',
      price: 29,
      duration: 'month',
      features: [
        '25 Campaigns',
        '50 Articles',
        'Advanced Analytics',
        'Priority Support',
        'AI Content Generation'
      ],
      popular: true
    },
    {
      id: 'PRO',
      name: 'Pro',
      price: 79,
      duration: 'month',
      features: [
        'Unlimited Campaigns',
        'Unlimited Articles',
        'Advanced Analytics',
        'Priority Support',
        'AI Content Generation',
        'Custom Integrations',
        'Team Collaboration'
      ]
    },
    {
      id: 'ENTERPRISE',
      name: 'Enterprise',
      price: 199,
      duration: 'month',
      features: [
        'Everything in Pro',
        'Dedicated Account Manager',
        'Custom Development',
        'SLA Guarantee',
        'Advanced Security',
        'White-label Solution'
      ]
    }
  ]

  useEffect(() => {
    fetchSubscriptionData()
  }, [])

  const fetchSubscriptionData = async () => {
    try {
      const response = await apiClient.get('/users/subscription')
      setSubscriptionData(response.data)
    } catch (error) {
      console.error('Error fetching subscription:', error)
      setError('Failed to load subscription data')
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (planId) => {
    setUpgrading(true)
    setError('')
    setSuccess('')

    try {
      const response = await apiClient.post('/payments/create-subscription', {
        planId: planId
      })

      // In a real app, you'd redirect to payment gateway
      // For demo, we'll simulate success
      setSuccess(`Upgrade to ${planId} plan initiated! Redirecting to payment...`)
      
      // Simulate payment success after 2 seconds
      setTimeout(() => {
        setSubscriptionData({
          ...subscriptionData,
          subscription: planId,
          subscriptionStartDate: new Date(),
          subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        })
        setSuccess('Subscription upgraded successfully!')
      }, 2000)

    } catch (error) {
      setError(error.response?.data?.error || 'Failed to upgrade subscription')
    } finally {
      setUpgrading(false)
    }
  }

  const calculateDaysRemaining = (endDate) => {
    if (!endDate) return 0
    const now = new Date()
    const end = new Date(endDate)
    const diffTime = end - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const formatDate = (date) => {
    if (!date) return 'Not set'
    return new Date(date).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatDateTime = (date) => {
    if (!date) return 'Not set'
    return new Date(date).toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  // Generate realistic trial dates based on current date
  const generateTrialDates = () => {
    const startDate = new Date('2026-04-18T22:39:00') // Today at 22:39
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 14) // 14 days trial
    
    return {
      startDate,
      endDate
    }
  }

  const trialDates = generateTrialDates()
  const currentSubscription = subscriptionData?.subscription || user?.subscription || 'TRIAL'
  const startDate = subscriptionData?.subscriptionStartDate || user?.subscriptionStartDate || trialDates.startDate
  const endDate = subscriptionData?.subscriptionEndDate || user?.subscriptionEndDate || trialDates.endDate

  return (
    <>
      <Helmet>
        <title>Subscription - SUBSTATE</title>
        <meta name="description" content="Manage your subscription and billing." />
      </Helmet>

      <DashboardLayout>
        <div className="dashboard-container">
          <div className="dashboard-header">
            <div>
              <h1>Subscription</h1>
              <p>Manage your subscription and billing preferences</p>
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

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading subscription data...</p>
            </div>
          ) : (
            <>
              {/* Current Subscription Status */}
              <motion.div
                className="subscription-status"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="status-card">
                  <div className="status-header">
                    <h2>Current Plan</h2>
                    <div className="plan-badge">
                      {currentSubscription}
                    </div>
                  </div>
                  
                  <div className="status-details">
                    <div className="detail-item">
                      <span className="label">Status</span>
                      <span className="value active">Active</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Started</span>
                      <span className="value">
                        {formatDateTime(startDate)}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Expires</span>
                      <span className="value">
                        {formatDateTime(endDate)}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Days Remaining</span>
                      <span className="value highlight">
                        {calculateDaysRemaining(endDate)} days
                      </span>
                    </div>
                  </div>

                  {currentSubscription === 'TRIAL' && (
                    <div className="trial-warning">
                      <div className="trial-info">
                        <h4>🚀 Trial Period Active</h4>
                        <p>
                          Started: {formatDateTime(startDate)}<br/>
                          Expires: {formatDateTime(endDate)}
                        </p>
                        <p className="trial-countdown">
                          <strong>{calculateDaysRemaining(endDate)} days remaining</strong> in your free trial
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Available Plans */}
              <motion.div
                className="plans-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <h2>Available Plans</h2>
                <div className="plans-grid">
                  {plans.map((plan, index) => (
                    <motion.div
                      key={plan.id}
                      className={`plan-card ${plan.popular ? 'popular' : ''} ${
                        currentSubscription === plan.id ? 'current' : ''
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 * index }}
                    >
                      {plan.popular && <div className="popular-badge">Most Popular</div>}
                      {currentSubscription === plan.id && (
                        <div className="current-badge">Current Plan</div>
                      )}
                      
                      <div className="plan-header">
                        <h3>{plan.name}</h3>
                        <div className="plan-price">
                          <span className="currency">$</span>
                          <span className="amount">{plan.price}</span>
                          <span className="period">/{plan.duration}</span>
                        </div>
                      </div>

                      <ul className="plan-features">
                        {plan.features.map((feature, i) => (
                          <li key={i}>
                            <span className="checkmark">✓</span>
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <div className="plan-action">
                        {currentSubscription === plan.id ? (
                          <button className="plan-button current" disabled>
                            Current Plan
                          </button>
                        ) : (
                          <button
                            className={`plan-button ${plan.popular ? 'primary' : 'secondary'}`}
                            onClick={() => handleUpgrade(plan.id)}
                            disabled={upgrading}
                          >
                            {upgrading ? 'Processing...' : 
                             plan.price === 0 ? 'Start Trial' : 'Upgrade Now'}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Billing History */}
              <motion.div
                className="billing-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <h2>Billing History</h2>
                <div className="billing-table">
                  <div className="table-header">
                    <span>Date</span>
                    <span>Description</span>
                    <span>Amount</span>
                    <span>Status</span>
                  </div>
                  <div className="table-row">
                    <span>{formatDate(startDate)}</span>
                    <span>Trial Started</span>
                    <span>$0.00</span>
                    <span className="status-badge success">Completed</span>
                  </div>
                  <div className="empty-row">
                    <span>No billing history available</span>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </DashboardLayout>
    </>
  )
}

export default Subscription
