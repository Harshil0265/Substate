import { Helmet } from 'react-helmet-async'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { apiClient } from '../../api/client'
import { useAuthStore } from '../../store/authStore'

function Subscription() {
  const [subscriptionData, setSubscriptionData] = useState(null)
  const [paymentHistory, setPaymentHistory] = useState([])
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
    fetchPaymentHistory()
  }, [])

  const fetchPaymentHistory = async () => {
    try {
      const response = await apiClient.get('/payments/history')
      setPaymentHistory(response.data.payments || [])
    } catch (error) {
      console.error('Error fetching payment history:', error)
      // Don't show error for payment history as it's not critical
      setPaymentHistory([])
    }
  }

  const fetchSubscriptionData = async () => {
    try {
      const response = await apiClient.get('/users/subscription')
      setSubscriptionData(response.data)
      setError('') // Clear any previous errors
    } catch (error) {
      console.error('Error fetching subscription:', error)
      // Don't show error if we have user data from auth store
      if (!user) {
        setError('Failed to load subscription data')
      }
      // Use user data from auth store as fallback
      setSubscriptionData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (planId) => {
    setUpgrading(true)
    setError('')
    setSuccess('')

    try {
      console.log('🚀 Initiating upgrade to plan:', planId)
      
      const response = await apiClient.post('/payments/create-subscription', {
        planId: planId
      })

      console.log('✅ Upgrade response:', response.data)

      if (planId === 'TRIAL') {
        // Trial activation is immediate
        setSuccess(`Trial activated successfully!`)
        
        // Update local state immediately
        setSubscriptionData({
          subscription: planId,
          subscriptionStatus: 'ACTIVE',
          subscriptionStartDate: response.data.subscription.startDate,
          subscriptionEndDate: response.data.subscription.endDate
        })
        
        // Update auth store
        const updatedUser = {
          ...user,
          subscription: planId,
          subscriptionStatus: 'ACTIVE',
          subscriptionStartDate: response.data.subscription.startDate,
          subscriptionEndDate: response.data.subscription.endDate
        }
        useAuthStore.getState().setUser(updatedUser)
        
      } else {
        // Paid plan - show payment processing message
        setSuccess(`Payment initiated for ${planId} plan! Processing payment...`)
        
        // Poll for payment completion
        const paymentId = response.data.paymentId
        let attempts = 0
        const maxAttempts = 10
        
        const checkPaymentStatus = async () => {
          try {
            attempts++
            console.log(`🔍 Checking payment status (attempt ${attempts}/${maxAttempts})`)
            
            const statusResponse = await apiClient.get(`/payments/payment/${paymentId}`)
            console.log('💳 Payment status:', statusResponse.data.status)
            
            if (statusResponse.data.status === 'COMPLETED') {
              setSuccess(`🎉 Payment successful! Welcome to ${planId} plan!`)
              
              // Refresh subscription data
              await fetchSubscriptionData()
              await fetchPaymentHistory()
              
              // Update auth store
              const updatedUser = {
                ...user,
                subscription: planId,
                subscriptionStatus: 'ACTIVE'
              }
              useAuthStore.getState().setUser(updatedUser)
              
            } else if (statusResponse.data.status === 'FAILED') {
              setError('Payment failed. Please try again or contact support.')
            } else if (attempts < maxAttempts) {
              // Still processing, check again in 1 second
              setTimeout(checkPaymentStatus, 1000)
            } else {
              setError('Payment is taking longer than expected. Please check your payment history or contact support.')
            }
          } catch (statusError) {
            console.error('Error checking payment status:', statusError)
            if (attempts < maxAttempts) {
              setTimeout(checkPaymentStatus, 1000)
            } else {
              setError('Unable to verify payment status. Please check your payment history.')
            }
          }
        }
        
        // Start checking payment status after 1 second
        setTimeout(checkPaymentStatus, 1000)
      }

    } catch (error) {
      console.error('❌ Upgrade error:', error)
      
      let errorMessage = 'Failed to upgrade subscription'
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid plan selection. Please try again.'
      } else if (error.response?.status === 401) {
        errorMessage = 'Please log in again to continue.'
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your connection and try again.'
      }
      
      setError(errorMessage)
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
                            {upgrading ? (
                              <>
                                <span className="loading-spinner-small"></span>
                                Processing...
                              </>
                            ) : (
                              plan.price === 0 ? 'Start Trial' : `Upgrade to ${plan.name}`
                            )}
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
                  
                  {/* Trial start entry */}
                  <div className="table-row">
                    <span>{formatDate(startDate)}</span>
                    <span>Trial Started</span>
                    <span>$0.00</span>
                    <span className="status-badge success">Completed</span>
                  </div>
                  
                  {/* Payment history */}
                  {paymentHistory.length > 0 ? (
                    paymentHistory.map((payment) => (
                      <div key={payment._id} className="table-row">
                        <span>{formatDate(payment.createdAt)}</span>
                        <span>{payment.description}</span>
                        <span>${payment.amount.toFixed(2)}</span>
                        <span className={`status-badge ${
                          payment.status === 'COMPLETED' ? 'success' : 
                          payment.status === 'PENDING' ? 'pending' : 
                          'failed'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="empty-row">
                      <span>No payment history available</span>
                    </div>
                  )}
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
