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

      <div className="auth-wrapper">
        <div className="auth-container">
          <div className="auth-content">
            <div className="auth-header">
              <h1>Welcome Back</h1>
              <p>Sign in to access your revenue intelligence dashboard</p>
            </div>

            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                  />
                  <span className="checkmark"></span>
                  Remember me for 30 days
                </label>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Don&apos;t have an account?{' '}
                <Link to="/register">Create one</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Login
