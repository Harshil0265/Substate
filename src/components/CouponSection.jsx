import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
        <h3>🎟️ Have a Coupon Code?</h3>
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
              <span className="error-icon">❌</span>
              {error}
            </div>
          )}

          {availableCoupons.length > 0 && (
            <div className="available-coupons-section">
              <button
                className="show-coupons-btn"
                onClick={() => setShowAvailable(!showAvailable)}
              >
                <span className="coupon-icon">🏷️</span>
                View Available Coupons ({availableCoupons.length})
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
            <div className="success-icon">✅</div>
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
            ✕
          </button>
        </motion.div>
      )}

      <style jsx>{`
        .coupon-section {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 2px solid #f59e0b;
          border-radius: 16px;
          padding: 24px;
          margin: 24px 0;
        }

        .coupon-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .coupon-header h3 {
          font-size: 20px;
          font-weight: 700;
          color: #92400e;
          margin: 0 0 8px 0;
        }

        .coupon-header p {
          color: #92400e;
          font-size: 14px;
          margin: 0;
          opacity: 0.8;
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
          padding: 12px 16px;
          border: 2px solid #f59e0b;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          background: white;
          color: #92400e;
        }

        .coupon-input:focus {
          outline: none;
          border-color: #d97706;
          box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.1);
        }

        .coupon-input::placeholder {
          text-transform: none;
          color: #a3a3a3;
          font-weight: 400;
        }

        .apply-coupon-btn {
          padding: 12px 24px;
          background: #f59e0b;
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 100px;
          justify-content: center;
        }

        .apply-coupon-btn:hover:not(:disabled) {
          background: #d97706;
          transform: translateY(-2px);
        }

        .apply-coupon-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .coupon-error {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #dc2626;
          font-size: 14px;
          font-weight: 500;
          background: rgba(220, 38, 38, 0.1);
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid rgba(220, 38, 38, 0.2);
        }

        .available-coupons-section {
          margin-top: 16px;
        }

        .show-coupons-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid #f59e0b;
          border-radius: 8px;
          color: #92400e;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .show-coupons-btn:hover {
          background: rgba(255, 255, 255, 0.8);
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
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          transition: all 0.2s ease;
        }

        .coupon-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .coupon-info {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }

        .coupon-code-badge {
          background: #f59e0b;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 1px;
        }

        .coupon-details {
          flex: 1;
        }

        .coupon-title {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .coupon-discount {
          color: #059669;
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 2px;
        }

        .coupon-condition {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 2px;
        }

        .coupon-expiry {
          font-size: 12px;
          color: #6b7280;
        }

        .use-coupon-btn {
          padding: 8px 16px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .use-coupon-btn:hover:not(:disabled) {
          background: #059669;
          transform: translateY(-1px);
        }

        .use-coupon-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .applied-coupon {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: white;
          border: 2px solid #10b981;
          border-radius: 12px;
          padding: 20px;
        }

        .applied-coupon-content {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }

        .success-icon {
          font-size: 24px;
        }

        .applied-coupon-code {
          font-weight: 700;
          color: #10b981;
          font-size: 16px;
          margin-bottom: 4px;
        }

        .applied-coupon-description {
          color: #374151;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .savings-info {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .original-price {
          text-decoration: line-through;
          color: #6b7280;
          font-size: 14px;
        }

        .discount-amount {
          color: #dc2626;
          font-weight: 600;
          font-size: 14px;
        }

        .final-price {
          color: #10b981;
          font-weight: 700;
          font-size: 16px;
        }

        .savings-badge {
          background: #dcfce7;
          color: #166534;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .remove-coupon-btn {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          color: #6b7280;
          width: 32px;
          height: 32px;
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