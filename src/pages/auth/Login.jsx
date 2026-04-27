import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { apiClient } from '../../api/client'
import '../../styles/auth.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await apiClient.post('/auth/login', { 
        email, 
        password, 
        rememberMe 
      })
      
      // Handle new JWT token structure
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
      const errorData = err.response?.data
      
      // Handle unverified email
      if (errorData?.requiresVerification) {
        navigate('/verify-email', { state: { email: errorData.email || email } })
        return
      }
      
      setError(errorData?.error || 'Login failed. Please try again.')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Login - SUBSTATE</title>
        <meta name="description" content="Sign in to SUBSTATE and manage your revenue intelligence." />
      </Helmet>

      <div className="modern-auth-wrapper">
        <div className="modern-auth-container">
          {/* Left Side - Login Form */}
          <div className="auth-form-section">
            <Link to="/" className="back-link">
              ← Back to Home
            </Link>
            
            <div className="auth-brand">
              <div className="brand-icon">
                <img src="/substate-icon.svg" alt="SUBSTATE" width="40" height="40" />
              </div>
              <span className="brand-text">SUBSTATE</span>
            </div>

            <div className="auth-header">
              <h1>Welcome back!</h1>
              <p>Let's keep your growth engine running.</p>
            </div>

            <form onSubmit={handleLogin} className="modern-auth-form">
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
                <input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-options">
                <label className="remember-checkbox">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                  />
                  <span className="checkmark"></span>
                  Remember me
                </label>
                <Link to="/forgot-password" className="forgot-link">
                  Forgot your password ?
                </Link>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="modern-auth-button" disabled={loading}>
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Don't have an account ? <Link to="/register">Register here</Link>
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

export default Login
