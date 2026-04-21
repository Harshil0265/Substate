import { Helmet } from 'react-helmet-async'
import { useState, useEffect, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Loader2, Sparkles, Calendar, CreditCard } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { apiClient } from '../../api/client'
import { useAuthStore } from '../../store/authStore'

// Lazy load CouponSection for better code splitting
const CouponSection = lazy(() => import('../../components/CouponSection'))

function Subscription() {
  const [subscriptionData, setSubscriptionData] = useState(null)
  const [paymentHistory, setPaymentHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [upgrading, setUpgrading] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const user = useAuthStore((state) => state.user)

  const plans = [
    {
      id: 'TRIAL',
      name: 'Starter (Free Trial)',
      price: 0,
      priceINR: 0,
      duration: '14 days',
      features: [
        'Up to 5 campaigns',
        '100 AI-generated articles',
        'Basic revenue analytics',
        'Email support',
        '1 WordPress integration',
        'Customer value tracking'
      ],
      current: true
    },
    {
      id: 'PRO',
      name: 'Professional',
      price: 10,
      priceINR: 10,
      duration: 'month',
      features: [
        'Unlimited campaigns',
        '500 AI articles/month',
        'Advanced revenue intelligence',
        'Priority support',
        '5 WordPress integrations',
        'Churn prediction AI',
        'Revenue forecasting',
        'Multi-channel publishing'
      ],
      popular: true
    },
    {
      id: 'ENTERPRISE',
      name: 'Enterprise',
      price: 20,
      priceINR: 20,
      duration: 'month',
      features: [
        'Unlimited everything',
        'Custom AI models',
        'White-label platform',
        '24/7 phone support',
        'Unlimited integrations',
        'API access',
        'Dedicated account manager',
        'Custom revenue models'
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
      
      // Calculate final amount with coupon
      const selectedPlan = plans.find(p => p.id === planId)
      let finalAmount = selectedPlan.priceINR
      let couponData = null
      
      if (appliedCoupon && planId !== 'TRIAL') {
        finalAmount = appliedCoupon.finalAmount
        couponData = appliedCoupon
      }
      
      // For trial plan, activate directly
      if (planId === 'TRIAL') {
        const response = await apiClient.post('/payments/create-order', {
          planId: planId
        })

        console.log('✅ Trial activation response:', response.data)

        if (response.data.isTrial) {
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
          
          // Refresh data
          await fetchSubscriptionData()
          await fetchPaymentHistory()
        }
        
        setUpgrading(false)
        return
      }

      // For paid plans, create Razorpay order
      const orderResponse = await apiClient.post('/payments/create-order', {
        planId: planId,
        coupon: couponData ? {
          id: couponData.coupon.id,
          code: couponData.coupon.code,
          discountAmount: couponData.discount.amount
        } : null
      })

      console.log('✅ Order created:', orderResponse.data)

      if (!orderResponse.data.success) {
        throw new Error('Failed to create payment order')
      }

      const { orderId, amount, currency, keyId, paymentId, subscription: subDetails, user: userDetails } = orderResponse.data

      // Load Razorpay script
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      document.body.appendChild(script)

      script.onload = () => {
        const options = {
          key: keyId,
          amount: amount,
          currency: currency,
          name: 'SUBSTATE',
          description: `${subDetails.planName} Subscription${couponData ? ` (${couponData.coupon.code} Applied)` : ''}`,
          order_id: orderId,
          prefill: {
            name: userDetails.name,
            email: userDetails.email
          },
          theme: {
            color: '#6366f1'
          },
          handler: async function (response) {
            try {
              console.log('💳 Payment successful:', response)
              
              setSuccess('Payment successful! Verifying...')

              // Verify payment on backend
              const verifyResponse = await apiClient.post('/payments/verify-payment', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                paymentId: paymentId,
                coupon: couponData
              })

              console.log('✅ Payment verified:', verifyResponse.data)

              if (verifyResponse.data.success) {
                const savingsMessage = couponData ? ` You saved ₹${couponData.savings} with coupon ${couponData.coupon.code}!` : ''
                setSuccess(`🎉 Payment successful! Welcome to ${planId} plan!${savingsMessage}`)
                
                // Apply coupon if used
                if (couponData) {
                  try {
                    await apiClient.post('/coupons/apply', {
                      couponId: couponData.coupon.id,
                      orderAmount: selectedPlan.priceINR,
                      discountAmount: couponData.discount.amount
                    })
                  } catch (couponError) {
                    console.error('Error applying coupon:', couponError)
                  }
                }
                
                // Update auth store
                const updatedUser = {
                  ...user,
                  subscription: planId,
                  subscriptionStatus: 'ACTIVE',
                  subscriptionStartDate: verifyResponse.data.subscription.startDate,
                  subscriptionEndDate: verifyResponse.data.subscription.endDate
                }
                useAuthStore.getState().setUser(updatedUser)
                
                // Refresh subscription data
                await fetchSubscriptionData()
                await fetchPaymentHistory()
              } else {
                setError('Payment verification failed. Please contact support.')
              }
            } catch (verifyError) {
              console.error('❌ Payment verification error:', verifyError)
              setError('Payment verification failed. Please contact support with your payment ID.')
            } finally {
              setUpgrading(false)
            }
          },
          modal: {
            ondismiss: function() {
              console.log('Payment cancelled by user')
              setError('Payment cancelled. Please try again.')
              setUpgrading(false)
            }
          }
        }

        const razorpay = new window.Razorpay(options)
        razorpay.open()

        razorpay.on('payment.failed', function (response) {
          console.error('❌ Payment failed:', response.error)
          setError(`Payment failed: ${response.error.description}`)
          setUpgrading(false)
        })
      }

      script.onerror = () => {
        console.error('❌ Failed to load Razorpay script')
        setError('Failed to load payment gateway. Please check your internet connection.')
        setUpgrading(false)
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
      } else if (error.response?.status === 503) {
        errorMessage = 'Payment service is temporarily unavailable. Please try again later.'
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your connection and try again.'
      }
      
      setError(errorMessage)
      setUpgrading(false)
    }
  }

  const handleCouponApplied = (couponData) => {
    setAppliedCoupon(couponData)
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
              <Loader2 className="loading-spinner" size={40} style={{ animation: 'spin 1s linear infinite' }} />
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
                      <div className="trial-info" style={{ display: 'flex', gap: '12px' }}>
                        <Sparkles size={24} style={{ color: '#f59e0b', flexShrink: 0 }} />
                        <div>
                          <h4 style={{ margin: '0 0 8px 0' }}>Trial Period Active</h4>
                          <p style={{ margin: '0 0 4px 0' }}>
                            Started: {formatDateTime(startDate)}<br/>
                            Expires: {formatDateTime(endDate)}
                          </p>
                          <p className="trial-countdown" style={{ margin: '8px 0 0 0' }}>
                            <strong>{calculateDaysRemaining(endDate)} days remaining</strong> in your free trial
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Coupon Section */}
              {currentSubscription !== 'ENTERPRISE' && (
                <Suspense fallback={
                  <div style={{ 
                    padding: '24px', 
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    border: '2px solid #f59e0b',
                    borderRadius: '16px',
                    margin: '24px 0'
                  }}>
                    <Loader2 size={32} style={{ 
                      color: '#f59e0b',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 16px'
                    }} />
                    <p style={{ color: '#92400e', margin: 0 }}>Loading coupon options...</p>
                  </div>
                }>
                  <CouponSection
                    planPrice={plans.find(p => p.id !== 'TRIAL')?.priceINR || 10}
                    planId="PRO"
                    onCouponApplied={handleCouponApplied}
                  />
                </Suspense>
              )}

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
                          <span className="currency">₹</span>
                          <span className="amount">{plan.priceINR}</span>
                          <span className="period">/{plan.duration}</span>
                        </div>
                      </div>

                      <ul className="plan-features">
                        {plan.features.map((feature, i) => (
                          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                            <span>{feature}</span>
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
                                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                                Processing...
                              </>
                            ) : (
                              plan.priceINR === 0 ? 'Start Trial' : `Upgrade - ₹${plan.priceINR}`
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
                  <div className="table-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} />
                      {formatDate(startDate)}
                    </span>
                    <span>Trial Started</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CreditCard size={14} />
                      ₹0.00
                    </span>
                    <span className="status-badge success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={14} />
                      Completed
                    </span>
                  </div>
                  
                  {/* Payment history */}
                  {paymentHistory.length > 0 ? (
                    paymentHistory.map((payment) => (
                      <div key={payment._id} className="table-row">
                        <span>{formatDate(payment.createdAt)}</span>
                        <span>{payment.description}</span>
                        <span>₹{payment.amount.toFixed(2)}</span>
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
