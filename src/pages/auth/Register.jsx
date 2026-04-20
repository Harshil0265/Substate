import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { apiClient } from '../../api/client'
import '../../styles/auth.css'

function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)

    try {
      const response = await apiClient.post('/auth/register', { 
        name, 
        email, 
        password 
      })
      
      if (response.data.requiresVerification) {
        // Redirect to verification page
        navigate('/verify-email', { state: { email: response.data.email } })
      } else if (response.data.accessToken) {
        // Handle new JWT token structure (shouldn't happen in register, but just in case)
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
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
      console.error('[v0] Register error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Register - SUBSTATE</title>
        <meta name="description" content="Create a SUBSTATE account and start tracking revenue intelligence." />
      </Helmet>

      <div className="modern-auth-wrapper">
        <div className="modern-auth-container">
          {/* Left Side - Registration Form */}
          <div className="auth-form-section">
            <div className="auth-brand">
              <div className="brand-icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M16 2L20 10L28 6L24 14L32 16L24 18L28 26L20 22L16 30L12 22L4 26L8 18L0 16L8 14L4 6L12 10L16 2Z" fill="currentColor"/>
                </svg>
              </div>
              <span className="brand-text">SUBSTATE</span>
            </div>

            <div className="auth-header">
              <h1>Create Account !</h1>
              <p>Join SUBSTATE to get unlimited access to data & information.</p>
            </div>

            <form onSubmit={handleRegister} className="modern-auth-form">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your mail address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <div className="password-input-wrapper">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="modern-auth-button" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="auth-divider">
              <span>Or, Sign up with</span>
            </div>

            <button className="google-auth-button" type="button">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with google
            </button>

            <div className="auth-footer">
              <p>
                Already have an account ? <Link to="/login">Login here</Link>
              </p>
            </div>
          </div>

          {/* Right Side - Register Page Image */}
          <div className="auth-graphics-section">
            <div className="auth-image-container">
              <img 
                src="/Register Page.png" 
                alt="SUBSTATE Registration" 
                className="auth-background-image"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Register
