import { Helmet } from 'react-helmet-async'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { apiClient } from '../../api/client'
import '../../styles/auth.css'

function VerifyEmail() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const { setTokens, setUser } = useAuthStore()
  
  const email = location.state?.email || ''

  useEffect(() => {
    if (!email) {
      navigate('/register')
    }
  }, [email, navigate])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return // Only allow numbers
    
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1) // Only take last character
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newOtp = [...otp]
    
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i]
    }
    
    setOtp(newOtp)
    
    // Focus last filled input or first empty
    const nextIndex = Math.min(pastedData.length, 5)
    document.getElementById(`otp-${nextIndex}`)?.focus()
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')

    const otpCode = otp.join('')
    
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }

    setLoading(true)

    try {
      const response = await apiClient.post('/auth/verify-otp', { 
        email, 
        otp: otpCode 
      })
      
      if (response.data.accessToken) {
        setTokens({
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          expiresIn: response.data.expiresIn,
          sessionInfo: response.data.sessionInfo
        })
        setUser(response.data.user)
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.')
      setOtp(['', '', '', '', '', ''])
      document.getElementById('otp-0')?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    
    setResending(true)
    setError('')

    try {
      await apiClient.post('/auth/resend-otp', { email })
      setCountdown(60)
      setOtp(['', '', '', '', '', ''])
      document.getElementById('otp-0')?.focus()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend code. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Verify Email - SUBSTATE</title>
        <meta name="description" content="Verify your email address to complete registration" />
      </Helmet>

      <div className="auth-wrapper">
        <div className="auth-container">
          <div className="auth-content">
            <div className="auth-header">
              <div className="verify-icon">📧</div>
              <h1>Verify Your Email</h1>
              <p>We've sent a 6-digit verification code to</p>
              <p className="email-display">{email}</p>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <form onSubmit={handleVerify} className="auth-form">
              <div className="otp-container">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    className="otp-input"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={loading}
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <button 
                type="submit" 
                className="auth-button"
                disabled={loading || otp.join('').length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>

              <div className="resend-section">
                <p>Didn't receive the code?</p>
                <button
                  type="button"
                  className="resend-button"
                  onClick={handleResend}
                  disabled={resending || countdown > 0}
                >
                  {resending ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                </button>
              </div>

              <div className="info-box">
                <p>⏱️ Code expires in 10 minutes</p>
                <p>🔒 Never share this code with anyone</p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default VerifyEmail
