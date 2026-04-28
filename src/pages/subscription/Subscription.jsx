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
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [refundReason, setRefundReason] = useState('')
  const [refundLoading, setRefundLoading] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState('PROFESSIONAL')
  const [retryingPayment, setRetryingPayment] = useState(null)
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
      id: 'PROFESSIONAL',
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
    setSelectedPlanId(planId)
    setUpgrading(true)
    setError('')
    setSuccess('')

    try {
      console.log('🚀 Initiating upgrade to plan:', planId)
      
      // For trial plan, activate directly
      if (planId === 'TRIAL') {
        const response = await apiClient.post('/payments/create-order', {
          planId: planId
        })

        console.log('Trial activation response:', response.data)

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

      // For paid plans, prepare coupon data if available
      let couponData = null
      if (appliedCoupon) {
        couponData = {
          id: appliedCoupon.coupon.id,
          code: appliedCoupon.coupon.code,
          discountAmount: appliedCoupon.discount.amount
        }
        console.log('💰 Coupon applied:', couponData)
      }

      // For paid plans, create Razorpay order
      const orderResponse = await apiClient.post('/payments/create-order', {
        planId: planId,
        coupon: couponData
      })

      console.log('Order created:', orderResponse.data)

      if (!orderResponse.data.success) {
        throw new Error('Failed to create payment order')
      }

      const { orderId, amount, currency, keyId, paymentId, subscription: subDetails, user: userDetails } = orderResponse.data

      // Load Razorpay script if not already loaded
      const loadRazorpayScript = () => {
        return new Promise((resolve, reject) => {
          // Check if Razorpay is already loaded
          if (window.Razorpay) {
            console.log('✅ Razorpay already loaded')
            resolve();
            return;
          }

          // Check if script is already being loaded
          const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
          if (existingScript) {
            console.log('⏳ Razorpay script already loading, waiting...')
            // Wait for it to load
            const checkInterval = setInterval(() => {
              if (window.Razorpay) {
                clearInterval(checkInterval)
                resolve()
              }
            }, 100)
            // Timeout after 10 seconds
            setTimeout(() => {
              clearInterval(checkInterval)
              reject(new Error('Razorpay script loading timeout'))
            }, 10000)
            return
          }

          const script = document.createElement('script')
          script.src = 'https://checkout.razorpay.com/v1/checkout.js'
          script.async = true
          
          script.onload = () => {
            console.log('✅ Razorpay script loaded successfully')
            resolve()
          }
          
          script.onerror = () => {
            console.error('❌ Failed to load Razorpay script')
            reject(new Error('Failed to load Razorpay script'))
          }
          
          document.body.appendChild(script)
        })
      }

      try {
        await loadRazorpayScript()
      } catch (scriptError) {
        console.error('❌ Script loading error:', scriptError)
        setError('Failed to load payment gateway. Please check your internet connection.')
        setUpgrading(false)
        return
      }

      // Now open Razorpay modal
      const openRazorpayModal = () => {
        try {
          if (!window.Razorpay) {
            throw new Error('Razorpay is not loaded');
          }

          // Track payment start time for cancellation analytics
          window.paymentStartTime = Date.now();

          const options = {
            key: keyId,
            amount: amount,
            currency: currency,
            name: 'SUBSTATE',
            description: `${subDetails.planName} Subscription${couponData ? ` (${couponData.code} Applied)` : ''}`,
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

                console.log('Payment verified:', verifyResponse.data)

                if (verifyResponse.data.success) {
                  const savingsMessage = couponData ? ` You saved ₹${appliedCoupon.savings} with coupon ${couponData.code}!` : ''
                  setSuccess(`🎉 Payment successful! Welcome to ${planId} plan!${savingsMessage}`)
                  
                  // Apply coupon if used
                  if (couponData) {
                    try {
                      await apiClient.post('/coupons/apply', {
                        couponId: couponData.id,
                        orderAmount: subDetails.originalAmount,
                        discountAmount: couponData.discountAmount
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
                  
                  // Clear applied coupon after successful payment
                  setAppliedCoupon(null)
                  
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
                
                // Track payment cancellation
                const trackCancellation = async () => {
                  try {
                    await apiClient.post('/payments/track-cancellation', {
                      paymentId: paymentId, // Include paymentId to update payment status
                      planType: planId,
                      billingPeriod: 'MONTHLY',
                      amount: amount / 100, // Convert from paise to rupees
                      originalAmount: subDetails.originalAmount,
                      coupon: couponData,
                      reason: 'USER_CANCELLED',
                      stage: 'PAYMENT_GATEWAY',
                      timeSpent: Math.floor((Date.now() - window.paymentStartTime) / 1000), // Time in seconds
                      razorpayOrderId: orderId,
                      returnUrl: window.location.href
                    })
                    console.log('📊 Payment cancellation tracked successfully')
                  } catch (trackingError) {
                    console.error('❌ Failed to track payment cancellation:', trackingError)
                    // Don't show error to user for tracking failure
                  }
                }
                
                trackCancellation()
                setError('Payment cancelled. Please try again.')
                setUpgrading(false)
              }
            }
          }

          console.log('🎯 Opening Razorpay modal with options:', {
            key: keyId,
            amount: amount,
            currency: currency,
            orderId: orderId
          })

          const razorpay = new window.Razorpay(options)
          razorpay.open()

          razorpay.on('payment.failed', function (response) {
            console.error('❌ Payment failed:', response.error)
            
            // Track payment failure
            const trackFailure = async () => {
              try {
                await apiClient.post('/payments/track-cancellation', {
                  paymentId: paymentId, // Include paymentId to update payment status
                  planType: planId,
                  billingPeriod: 'MONTHLY',
                  amount: amount / 100,
                  originalAmount: subDetails.originalAmount,
                  coupon: couponData,
                  reason: 'PAYMENT_FAILED',
                  stage: 'PROCESSING',
                  timeSpent: Math.floor((Date.now() - window.paymentStartTime) / 1000),
                  razorpayOrderId: orderId,
                  errorMessage: response.error.description,
                  metadata: {
                    errorCode: response.error.code,
                    errorSource: response.error.source,
                    errorStep: response.error.step,
                    errorReason: response.error.reason
                  }
                })
                console.log('📊 Payment failure tracked successfully')
              } catch (trackingError) {
                console.error('❌ Failed to track payment failure:', trackingError)
              }
            }
            
            trackFailure()
            setError(`Payment failed: ${response.error.description}`)
            setUpgrading(false)
          })
        } catch (modalError) {
          console.error('❌ Error opening Razorpay modal:', modalError)
          setError(`Failed to open payment modal: ${modalError.message}`)
          setUpgrading(false)
        }
      }

      // Open the Razorpay modal
      openRazorpayModal()

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

  const handleRetryPayment = async (paymentId) => {
    setRetryingPayment(paymentId)
    setError('')
    setSuccess('')

    try {
      console.log('🔄 Retrying payment:', paymentId)
      
      const response = await apiClient.post(`/payments/retry/${paymentId}`)
      
      if (!response.data.success) {
        throw new Error('Failed to retry payment')
      }

      const { orderId, amount, currency, keyId, paymentId: newPaymentId, subscription: subDetails, user: userDetails } = response.data

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.async = true
        await new Promise((resolve, reject) => {
          script.onload = resolve
          script.onerror = reject
          document.body.appendChild(script)
        })
      }

      // Track payment start time
      window.paymentStartTime = Date.now()

      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'SUBSTATE',
        description: `${subDetails.planName} Subscription (Retry)`,
        order_id: orderId,
        prefill: {
          name: userDetails.name,
          email: userDetails.email
        },
        theme: {
          color: '#6366f1'
        },
        handler: async function (razorpayResponse) {
          try {
            console.log('💳 Payment successful:', razorpayResponse)
            setSuccess('Payment successful! Verifying...')

            const verifyResponse = await apiClient.post('/payments/verify-payment', {
              razorpay_order_id: razorpayResponse.razorpay_order_id,
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_signature: razorpayResponse.razorpay_signature,
              paymentId: newPaymentId
            })

            if (verifyResponse.data.success) {
              setSuccess(`🎉 Payment successful! Welcome to ${subDetails.plan} plan!`)
              
              // Update auth store
              const updatedUser = {
                ...user,
                subscription: subDetails.plan,
                subscriptionStatus: 'ACTIVE',
                subscriptionStartDate: verifyResponse.data.subscription.startDate,
                subscriptionEndDate: verifyResponse.data.subscription.endDate
              }
              useAuthStore.getState().setUser(updatedUser)
              
              // Refresh data
              await fetchSubscriptionData()
              await fetchPaymentHistory()
            } else {
              setError('Payment verification failed. Please contact support.')
            }
          } catch (verifyError) {
            console.error('❌ Payment verification error:', verifyError)
            setError('Payment verification failed. Please contact support.')
          } finally {
            setRetryingPayment(null)
          }
        },
        modal: {
          ondismiss: function() {
            console.log('Payment cancelled by user')
            
            // Track cancellation
            const trackCancellation = async () => {
              try {
                await apiClient.post('/payments/track-cancellation', {
                  paymentId: newPaymentId,
                  planType: subDetails.plan,
                  billingPeriod: 'MONTHLY',
                  amount: amount / 100,
                  originalAmount: subDetails.originalAmount,
                  reason: 'USER_CANCELLED',
                  stage: 'PAYMENT_GATEWAY',
                  timeSpent: Math.floor((Date.now() - window.paymentStartTime) / 1000),
                  razorpayOrderId: orderId,
                  returnUrl: window.location.href
                })
              } catch (trackingError) {
                console.error('❌ Failed to track cancellation:', trackingError)
              }
            }
            
            trackCancellation()
            setError('Payment cancelled. Please try again.')
            setRetryingPayment(null)
          }
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()

      razorpay.on('payment.failed', function (response) {
        console.error('❌ Payment failed:', response.error)
        
        // Track failure
        const trackFailure = async () => {
          try {
            await apiClient.post('/payments/track-cancellation', {
              paymentId: newPaymentId,
              planType: subDetails.plan,
              billingPeriod: 'MONTHLY',
              amount: amount / 100,
              originalAmount: subDetails.originalAmount,
              reason: 'PAYMENT_FAILED',
              stage: 'PROCESSING',
              timeSpent: Math.floor((Date.now() - window.paymentStartTime) / 1000),
              razorpayOrderId: orderId,
              errorMessage: response.error.description,
              metadata: {
                errorCode: response.error.code,
                errorSource: response.error.source,
                errorStep: response.error.step,
                errorReason: response.error.reason
              }
            })
          } catch (trackingError) {
            console.error('❌ Failed to track failure:', trackingError)
          }
        }
        
        trackFailure()
        setError(`Payment failed: ${response.error.description}`)
        setRetryingPayment(null)
      })

    } catch (error) {
      console.error('❌ Retry payment error:', error)
      setError(error.response?.data?.error || 'Failed to retry payment. Please try again.')
      setRetryingPayment(null)
    }
  }

  const getDiscountedPrice = (originalPrice) => {
    if (!appliedCoupon) return originalPrice
    
    // Calculate discounted price based on coupon
    if (appliedCoupon.coupon.discountType === 'PERCENTAGE') {
      const discountAmount = (originalPrice * appliedCoupon.coupon.discountValue) / 100
      return Math.max(0, originalPrice - discountAmount)
    } else if (appliedCoupon.coupon.discountType === 'FIXED') {
      return Math.max(0, originalPrice - appliedCoupon.coupon.discountValue)
    }
    
    return originalPrice
  }

  const formatPriceDisplay = (plan) => {
    if (!appliedCoupon || plan.id === 'TRIAL') {
      return {
        originalPrice: plan.priceINR,
        discountedPrice: null,
        showDiscount: false
      }
    }

    const discountedPrice = getDiscountedPrice(plan.priceINR)
    const hasDiscount = discountedPrice < plan.priceINR

    return {
      originalPrice: plan.priceINR,
      discountedPrice: hasDiscount ? discountedPrice : null,
      showDiscount: hasDiscount
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

  // Use actual subscription dates from backend
  const currentSubscription = subscriptionData?.subscription || user?.subscription || 'TRIAL'
  const startDate = subscriptionData?.subscriptionStartDate || user?.subscriptionStartDate
  const endDate = subscriptionData?.subscriptionEndDate || user?.subscriptionEndDate

  return (
    <>
      <Helmet>
        <title>Subscription - SUBSTATE</title>
        <meta name="description" content="Manage your subscription and billing." />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </Helmet>

      <DashboardLayout>
        <div className="dashboard-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
          <div className="dashboard-header" style={{ marginBottom: '28px' }}>
            <div>
              <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: '28px', fontWeight: '800', color: '#111827', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                Subscription
              </h1>
              <p style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '15px', color: '#6b7280', marginBottom: 0 }}>
                Manage your subscription and billing preferences
              </p>
            </div>
          </div>

          {error && (
            <div className="error-message" style={{ marginBottom: '20px', padding: '14px 18px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: '500' }}>
              {error}
            </div>
          )}

          {success && (
            <div className="success-message" style={{ marginBottom: '20px', padding: '14px 18px', background: '#d1fae5', border: '1px solid #a7f3d0', borderRadius: '8px', color: '#065f46', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: '500' }}>
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
                style={{ marginBottom: '28px' }}
              >
                <div className="status-card" style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}>
                  <div className="status-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', paddingBottom: '20px', borderBottom: '2px solid #f3f4f6' }}>
                    <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 }}>
                      Current Plan
                    </h2>
                    <div className="plan-badge" style={{ background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)', color: 'white', padding: '8px 20px', borderRadius: '20px', fontWeight: '700', textTransform: 'uppercase', fontSize: '12px', fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px', boxShadow: '0 4px 14px rgba(249, 115, 22, 0.25)' }}>
                      {currentSubscription}
                    </div>
                  </div>
                  
                  <div className="status-details" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: currentSubscription === 'TRIAL' ? '24px' : 0 }}>
                    <div className="detail-item" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                      <span className="label" style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Status</span>
                      <span className="value active" style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: '700', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={18} />
                        Active
                      </span>
                    </div>
                    <div className="detail-item" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                      <span className="label" style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Started</span>
                      <span className="value" style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '13px', fontWeight: '500', color: '#111827' }}>
                        {formatDateTime(startDate)}
                      </span>
                    </div>
                    <div className="detail-item" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                      <span className="label" style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Expires</span>
                      <span className="value" style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '13px', fontWeight: '500', color: '#111827' }}>
                        {formatDateTime(endDate)}
                      </span>
                    </div>
                    <div className="detail-item" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(249, 115, 22, 0.04) 100%)', borderRadius: '12px', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
                      <span className="label" style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Days Remaining</span>
                      <span className="value highlight" style={{ fontFamily: 'Inter, sans-serif', fontSize: '24px', fontWeight: '800', color: '#F97316', letterSpacing: '-0.5px' }}>
                        {calculateDaysRemaining(endDate)} days
                      </span>
                    </div>
                  </div>

                  {currentSubscription === 'TRIAL' && (
                    <div className="trial-warning" style={{ marginTop: '24px', padding: '20px', background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(249, 115, 22, 0.04) 100%)', borderRadius: '12px', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
                      <div className="trial-info" style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                        <div style={{ background: 'rgba(249, 115, 22, 0.15)', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Sparkles size={24} style={{ color: '#F97316', flexShrink: 0 }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 10px 0', fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: '700', color: '#111827' }}>Trial Period Active</h4>
                          <p style={{ margin: '0 0 6px 0', fontFamily: 'Share Tech Mono, monospace', fontSize: '13px', color: '#6b7280', lineHeight: '1.6' }}>
                            Started: {formatDateTime(startDate)}<br/>
                            Expires: {formatDateTime(endDate)}
                          </p>
                          <p className="trial-countdown" style={{ margin: '10px 0 0 0', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: '600', color: '#F97316' }}>
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
                    planPrice={plans.find(p => p.id === selectedPlanId)?.priceINR || 10}
                    planId={selectedPlanId}
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
                style={{ marginBottom: '32px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 }}>
                    Available Plans
                  </h2>
                  {appliedCoupon && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)', padding: '8px 16px', borderRadius: '20px', border: '1px solid #F97316' }}>
                      <CheckCircle2 size={16} style={{ color: '#F97316' }} />
                      <span style={{ color: '#ea580c', fontWeight: '600', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>
                        {appliedCoupon.coupon.code} Applied - {appliedCoupon.coupon.discountValue}% OFF
                      </span>
                    </div>
                  )}
                </div>
                <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'stretch' }}>
                  {plans
                    .filter(plan => {
                      // Hide trial plan if user has already upgraded to a paid plan
                      if (plan.id === 'TRIAL' && currentSubscription !== 'TRIAL') {
                        return false;
                      }
                      return true;
                    })
                    .map((plan, index) => (
                    <motion.div
                      key={plan.id}
                      className={`plan-card ${plan.popular ? 'popular' : ''} ${
                        currentSubscription === plan.id ? 'current' : ''
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 * index }}
                      style={{
                        background: '#ffffff',
                        border: plan.popular ? '2px solid #F97316' : currentSubscription === plan.id ? '2px solid #F97316' : '2px solid #F97316',
                        borderRadius: '16px',
                        padding: '28px',
                        position: 'relative',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        boxShadow: plan.popular ? '0 8px 24px rgba(249, 115, 22, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      {plan.popular && (
                        <div className="popular-badge" style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#F97316', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>
                          Most Popular
                        </div>
                      )}
                      {currentSubscription === plan.id && (
                        <div className="current-badge" style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#F97316', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>
                          Current Plan
                        </div>
                      )}
                      
                      <div className="plan-header" style={{ textAlign: 'center', marginBottom: '24px', paddingBottom: '20px', borderBottom: '2px solid #f3f4f6' }}>
                        <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '20px', fontWeight: '700', color: '#111827', margin: '0 0 16px 0' }}>
                          {plan.name}
                        </h3>
                        <div className="plan-price" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '4px', flexDirection: 'column' }}>
                          {(() => {
                            const priceDisplay = formatPriceDisplay(plan)
                            return (
                              <>
                                {priceDisplay.showDiscount ? (
                                  <>
                                    {/* Discounted Price */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '4px' }}>
                                      <span className="currency" style={{ fontSize: '20px', fontWeight: '700', color: '#F97316', marginTop: '8px', fontFamily: 'Inter, sans-serif' }}>₹</span>
                                      <span className="amount" style={{ fontSize: '48px', fontWeight: '800', color: '#F97316', letterSpacing: '-2px', fontFamily: 'Inter, sans-serif' }}>{priceDisplay.discountedPrice}</span>
                                      <span className="period" style={{ fontSize: '14px', color: '#6b7280', marginTop: '20px', fontWeight: '500', fontFamily: 'Share Tech Mono, monospace' }}>/{plan.duration}</span>
                                    </div>
                                    {/* Original Price (Strikethrough) */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
                                      <span style={{ fontSize: '18px', color: '#9ca3af', textDecoration: 'line-through', fontFamily: 'Inter, sans-serif', fontWeight: '600' }}>₹{priceDisplay.originalPrice}</span>
                                      <span style={{ background: '#F97316', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', fontFamily: 'Inter, sans-serif' }}>
                                        {appliedCoupon.coupon.discountType === 'PERCENTAGE' ? `${appliedCoupon.coupon.discountValue}% OFF` : `₹${appliedCoupon.coupon.discountValue} OFF`}
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  /* Regular Price */
                                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '4px' }}>
                                    <span className="currency" style={{ fontSize: '20px', fontWeight: '700', color: '#6b7280', marginTop: '8px', fontFamily: 'Inter, sans-serif' }}>₹</span>
                                    <span className="amount" style={{ fontSize: '48px', fontWeight: '800', color: '#111827', letterSpacing: '-2px', fontFamily: 'Inter, sans-serif' }}>{plan.priceINR}</span>
                                    <span className="period" style={{ fontSize: '14px', color: '#6b7280', marginTop: '20px', fontWeight: '500', fontFamily: 'Share Tech Mono, monospace' }}>/{plan.duration}</span>
                                  </div>
                                )}
                              </>
                            )
                          })()}
                        </div>
                      </div>

                      <ul className="plan-features" style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', flex: 1 }}>
                        {plan.features.map((feature, i) => (
                          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 0', fontFamily: 'Share Tech Mono, monospace', fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
                            <CheckCircle2 size={18} style={{ color: '#F97316', flexShrink: 0, marginTop: '2px' }} />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="plan-action" style={{ textAlign: 'center', marginTop: 'auto' }}>
                        {currentSubscription === plan.id ? (
                          <button className="plan-button current" disabled style={{ width: '100%', padding: '14px 24px', borderRadius: '10px', fontWeight: '600', cursor: 'not-allowed', border: 'none', background: '#F97316', color: 'white', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
                            Current Plan
                          </button>
                        ) : (
                          <button
                            className={`plan-button ${plan.popular ? 'primary' : 'secondary'}`}
                            onClick={() => handleUpgrade(plan.id)}
                            disabled={upgrading}
                            style={{
                              width: '100%',
                              padding: '14px 24px',
                              borderRadius: '10px',
                              fontWeight: '600',
                              cursor: upgrading ? 'not-allowed' : 'pointer',
                              border: plan.popular ? 'none' : '2px solid #e5e7eb',
                              background: plan.popular ? 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' : '#ffffff',
                              color: plan.popular ? 'white' : '#374151',
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '14px',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              boxShadow: plan.popular ? '0 4px 14px rgba(249, 115, 22, 0.25)' : 'none'
                            }}
                          >
                            {upgrading ? (
                              <>
                                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                                Processing...
                              </>
                            ) : (
                              (() => {
                                const priceDisplay = formatPriceDisplay(plan)
                                const displayPrice = priceDisplay.showDiscount ? priceDisplay.discountedPrice : plan.priceINR
                                return plan.priceINR === 0 ? 'Start Trial' : `Upgrade - ₹${displayPrice}`
                              })()
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
                <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
                  Billing History
                </h2>
                <div className="billing-table" style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}>
                  <div className="table-header" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr', gap: '16px', padding: '18px 24px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontWeight: '700', color: '#111827', fontFamily: 'Inter, sans-serif', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    <span>Date</span>
                    <span>Description</span>
                    <span>Amount</span>
                    <span>Status</span>
                    <span>Actions</span>
                  </div>
                  
                  {/* Trial start entry */}
                  <div className="table-row" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr', gap: '16px', padding: '18px 24px', borderBottom: '1px solid #f3f4f6', color: '#6b7280', fontFamily: 'Share Tech Mono, monospace', fontSize: '13px', alignItems: 'center', transition: 'background 0.2s ease' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111827', fontWeight: '500' }}>
                      <Calendar size={16} style={{ color: '#6b7280' }} />
                      {formatDate(startDate)}
                    </span>
                    <span style={{ color: '#111827', fontWeight: '500' }}>Trial Started</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111827', fontWeight: '600' }}>
                      <CreditCard size={16} style={{ color: '#6b7280' }} />
                      ₹0.00
                    </span>
                    <span className="status-badge success" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#d1fae5', color: '#065f46', padding: '6px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px', width: 'fit-content' }}>
                      <CheckCircle2 size={14} />
                      Completed
                    </span>
                    <span style={{ color: '#9ca3af', fontSize: '12px' }}>—</span>
                  </div>
                  
                  {/* Payment history */}
                  {paymentHistory.length > 0 ? (
                    paymentHistory.map((payment) => (
                      <div key={payment._id} className="table-row" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr', gap: '16px', padding: '18px 24px', borderBottom: '1px solid #f3f4f6', color: '#6b7280', fontFamily: 'Share Tech Mono, monospace', fontSize: '13px', alignItems: 'center', transition: 'background 0.2s ease' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111827', fontWeight: '500' }}>
                          <Calendar size={16} style={{ color: '#6b7280' }} />
                          {formatDate(payment.createdAt)}
                        </span>
                        <span style={{ color: '#111827', fontWeight: '500' }}>{payment.description}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111827', fontWeight: '600' }}>
                          <CreditCard size={16} style={{ color: '#6b7280' }} />
                          ₹{payment.amount.toFixed(2)}
                        </span>
                        <span className={`status-badge ${
                          payment.status === 'COMPLETED' ? 'success' : 
                          payment.status === 'CANCELLED' ? 'cancelled' :
                          'failed'
                        }`} style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: payment.status === 'COMPLETED' ? '#d1fae5' : 
                                     payment.status === 'CANCELLED' ? '#fee2e2' : '#fee2e2',
                          color: payment.status === 'COMPLETED' ? '#065f46' : 
                                 payment.status === 'CANCELLED' ? '#991b1b' : '#991b1b',
                          padding: '6px 12px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          fontFamily: 'Inter, sans-serif',
                          letterSpacing: '0.5px',
                          width: 'fit-content'
                        }}>
                          <CheckCircle2 size={14} />
                          {payment.status}
                        </span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {payment.status === 'FAILED' && (
                            <button
                              onClick={() => handleRetryPayment(payment._id)}
                              disabled={retryingPayment === payment._id}
                              style={{
                                background: retryingPayment === payment._id ? '#9ca3af' : 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '600',
                                fontFamily: 'Inter, sans-serif',
                                cursor: retryingPayment === payment._id ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 4px rgba(249, 115, 22, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                              onMouseOver={(e) => {
                                if (retryingPayment !== payment._id) {
                                  e.currentTarget.style.transform = 'translateY(-1px)'
                                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(249, 115, 22, 0.3)'
                                }
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(249, 115, 22, 0.2)'
                              }}
                            >
                              {retryingPayment === payment._id ? (
                                <>
                                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                  Processing...
                                </>
                              ) : (
                                '🔄 Retry Payment'
                              )}
                            </button>
                          )}
                          {payment.status === 'COMPLETED' && (
                            <span style={{ color: '#10b981', fontSize: '12px', fontWeight: '500', fontFamily: 'Inter, sans-serif' }}>
                              ✓ Paid
                            </span>
                          )}
                          {payment.status === 'CANCELLED' && (
                            <span style={{ color: '#991b1b', fontSize: '12px', fontWeight: '500', fontFamily: 'Inter, sans-serif' }}>
                              ✗ Cancelled by user
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-row" style={{ padding: '40px 24px', textAlign: 'center', color: '#9ca3af', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: '500' }}>
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
