import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Ticket, Tag, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { apiClient } from '../api/client'

function CouponSection({ planPrice, planId, onCouponApplied }) {
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [availableCoupons, setAvailableCoupons] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAvailable, setShowAvailable] = useState(false)

  useEffect(() => {
    fetchAvailableCoupons()
  }, [])

  const fetchAvailableCoupons = async () => {
    try {
      const response = await apiClient.get('/coupons/available')
      setAvailableCoupons(response.data.coupons || [])
    } catch (error) {
      console.error('Error fetching available coupons:', error)
    }
  }

  const validateCoupon = async (code) => {
    if (!code.trim()) {
      setError('Please enter a coupon code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await apiClient.post('/coupons/validate', {
        code: code.trim(),
        orderAmount: planPrice,
        planType: planId
      })

      if (response.data.valid) {
        setAppliedCoupon(response.data)
        onCouponApplied(response.data)
        setError('')
      } else {
        setError(response.data.reason)
        setAppliedCoupon(null)
        onCouponApplied(null)
      }
    } catch (error) {
      console.error('Error validating coupon:', error)
      setError('Failed to validate coupon')
      setAppliedCoupon(null)
      onCouponApplied(null)
    } finally {
      setLoading(false)
    }
  }

  const removeCoupon = () => {
    setCouponCode('')
    setAppliedCoupon(null)
    setError('')
    onCouponApplied(null)
  }

  const applyCouponFromList = (coupon) => {
    setCouponCode(coupon.code)
    validateCoupon(coupon.code)
    setShowAvailable(false)
  }

  const formatDiscount = (coupon) => {
    if (coupon.discountType === 'PERCENTAGE') {
      return `${coupon.discountValue}% OFF${coupon.maxDiscount ? ` (Max ₹${coupon.maxDiscount})` : ''}`
    } else {
      return `₹${coupon.discountValue} OFF`
    }
  }

  return (
    <motion.div
      className="coupon-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="coupon-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
          <Ticket size={24} style={{ color: '#F97316' }} />
          <h3>Have a Coupon Code?</h3>
        </div>
        <p>Apply your discount code to save on your subscription</p>
      </div>

      {!appliedCoupon ? (
        <div className="coupon-input-section">
          <div className="coupon-input-group">
            <input
              type="text"
              placeholder="Enter coupon code (e.g., SAVE20)"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              className="coupon-input"
              disabled={loading}
            />
            <button
              onClick={() => validateCoupon(couponCode)}
              disabled={loading || !couponCode.trim()}
              className="apply-coupon-btn"
            >
              {loading ? (
                <>
                  <span className="loading-spinner-small"></span>
                  Checking...
                </>
              ) : (
                'Apply'
              )}
            </button>
          </div>

          {error && (
            <div className="coupon-error">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {availableCoupons.length > 0 && (
            <div className="available-coupons-section">
              <button
                className="show-coupons-btn"
                onClick={() => setShowAvailable(!showAvailable)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Tag size={18} style={{ color: '#F97316' }} />
                  <span>View Available Coupons ({availableCoupons.length})</span>
                </div>
                <span className={`arrow ${showAvailable ? 'up' : 'down'}`}>
                  {showAvailable ? '▲' : '▼'}
                </span>
              </button>

              {showAvailable && (
                <motion.div
                  className="available-coupons-list"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {availableCoupons.map((coupon) => (
                    <div key={coupon._id} className="coupon-card">
                      <div className="coupon-info">
                        <div className="coupon-code-badge">{coupon.code}</div>
                        <div className="coupon-details">
                          <div className="coupon-title">{coupon.description}</div>
                          <div className="coupon-discount">{formatDiscount(coupon)}</div>
                          {coupon.minOrderAmount > 0 && (
                            <div className="coupon-condition">
                              Min. order: ₹{coupon.minOrderAmount}
                            </div>
                          )}
                          <div className="coupon-expiry">
                            Valid until: {new Date(coupon.validUntil).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <button
                        className="use-coupon-btn"
                        onClick={() => applyCouponFromList(coupon)}
                        disabled={planPrice < coupon.minOrderAmount}
                      >
                        Use Code
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          )}
        </div>
      ) : (
        <motion.div
          className="applied-coupon"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="applied-coupon-content">
            <div className="success-icon">
              <CheckCircle2 size={24} style={{ color: '#F97316' }} />
            </div>
            <div className="applied-coupon-info">
              <div className="applied-coupon-code">{appliedCoupon.coupon.code}</div>
              <div className="applied-coupon-description">
                {appliedCoupon.coupon.description}
              </div>
              <div className="savings-info">
                <span className="original-price">₹{appliedCoupon.originalAmount}</span>
                <span className="discount-amount">-₹{appliedCoupon.discount.amount}</span>
                <span className="final-price">₹{appliedCoupon.finalAmount}</span>
              </div>
              <div className="savings-badge">
                You saved ₹{appliedCoupon.savings}! ({appliedCoupon.discount.percentage}% off)
              </div>
            </div>
          </div>
          <button className="remove-coupon-btn" onClick={removeCoupon}>
            <X size={18} />
          </button>
        </motion.div>
      )}

      <style jsx>{`
        .coupon-section {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 28px;
          margin: 24px 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .coupon-header {
          text-align: center;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 2px solid #f3f4f6;
        }

        .coupon-header h3 {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 8px 0;
          font-family: 'Inter', sans-serif;
        }

        .coupon-header p {
          color: #6b7280;
          font-size: 14px;
          margin: 0;
          font-family: 'Share Tech Mono', monospace;
        }

        .coupon-input-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .coupon-input-group {
          display: flex;
          gap: 12px;
        }

        .coupon-input {
          flex: 1;
          padding: 14px 18px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          background: #f9fafb;
          color: #111827;
          font-family: 'Share Tech Mono', monospace;
          transition: all 0.2s ease;
        }

        .coupon-input:focus {
          outline: none;
          border-color: #F97316;
          background: white;
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
        }

        .coupon-input::placeholder {
          text-transform: none;
          color: #9ca3af;
          font-weight: 400;
        }

        .apply-coupon-btn {
          padding: 14px 28px;
          background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 110px;
          justify-content: center;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          letter-spacing: 0.3px;
          box-shadow: 0 4px 14px rgba(249, 115, 22, 0.25);
        }

        .apply-coupon-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(249, 115, 22, 0.35);
        }

        .apply-coupon-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .coupon-error {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #dc2626;
          font-size: 13px;
          font-weight: 600;
          background: #fee2e2;
          padding: 14px 18px;
          border-radius: 10px;
          border: 1px solid #fecaca;
          font-family: 'Inter', sans-serif;
        }

        .available-coupons-section {
          margin-top: 20px;
        }

        .show-coupons-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          color: #111827;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
        }

        .show-coupons-btn:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }

        .coupon-icon {
          font-size: 16px;
        }

        .arrow {
          font-size: 12px;
          transition: transform 0.2s ease;
        }

        .available-coupons-list {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .coupon-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 18px;
          transition: all 0.2s ease;
        }

        .coupon-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          border-color: #d1d5db;
        }

        .coupon-info {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }

        .coupon-code-badge {
          background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
          color: white;
          padding: 8px 14px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 1px;
          font-family: 'Share Tech Mono', monospace;
          box-shadow: 0 2px 8px rgba(249, 115, 22, 0.25);
        }

        .coupon-details {
          flex: 1;
        }

        .coupon-title {
          font-weight: 600;
          color: #111827;
          margin-bottom: 6px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
        }

        .coupon-discount {
          color: #F97316;
          font-weight: 700;
          font-size: 14px;
          margin-bottom: 4px;
          font-family: 'Inter', sans-serif;
        }

        .coupon-condition {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
          font-family: 'Share Tech Mono', monospace;
        }

        .coupon-expiry {
          font-size: 12px;
          color: #6b7280;
          font-family: 'Share Tech Mono', monospace;
        }

        .use-coupon-btn {
          padding: 10px 20px;
          background: #F97316;
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Inter', sans-serif;
          letter-spacing: 0.3px;
        }

        .use-coupon-btn:hover:not(:disabled) {
          background: #ea580c;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
        }

        .use-coupon-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .applied-coupon {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
          border: 2px solid #F97316;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 14px rgba(249, 115, 22, 0.15);
        }

        .applied-coupon-content {
          display: flex;
          align-items: center;
          gap: 18px;
          flex: 1;
        }

        .success-icon {
          background: white;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(249, 115, 22, 0.2);
        }

        .applied-coupon-code {
          font-weight: 700;
          color: #ea580c;
          font-size: 18px;
          margin-bottom: 6px;
          font-family: 'Share Tech Mono', monospace;
          letter-spacing: 1px;
        }

        .applied-coupon-description {
          color: #ea580c;
          font-size: 14px;
          margin-bottom: 10px;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
        }

        .savings-info {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .original-price {
          text-decoration: line-through;
          color: #6b7280;
          font-size: 15px;
          font-family: 'Share Tech Mono', monospace;
        }

        .discount-amount {
          color: #dc2626;
          font-weight: 700;
          font-size: 15px;
          font-family: 'Inter', sans-serif;
        }

        .final-price {
          color: #ea580c;
          font-weight: 800;
          font-size: 20px;
          font-family: 'Inter', sans-serif;
          letter-spacing: -0.5px;
        }

        .savings-badge {
          background: white;
          color: #ea580c;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          font-family: 'Inter', sans-serif;
          box-shadow: 0 2px 6px rgba(249, 115, 22, 0.15);
        }

        .remove-coupon-btn {
          background: white;
          border: 2px solid #d1d5db;
          color: #6b7280;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .remove-coupon-btn:hover {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
          transform: scale(1.1);
        }

        .loading-spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .coupon-section {
            padding: 20px;
            margin: 16px 0;
          }

          .coupon-input-group {
            flex-direction: column;
          }

          .apply-coupon-btn {
            width: 100%;
          }

          .coupon-card {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .coupon-info {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .use-coupon-btn {
            align-self: center;
          }

          .applied-coupon-content {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .savings-info {
            justify-content: center;
          }
        }
      `}</style>
    </motion.div>
  )
}

export default CouponSection