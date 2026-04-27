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
        <div className="modern-auth-container register-container">
          {/* Left Side - Registration Form */}
          <div className="auth-form-section register-form-section">
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
              <h1>Create Account !</h1>
              <p>No team. No manual work. Just content, campaigns, and growth, on autopilot.</p>
            </div>

            <form onSubmit={handleRegister} className="modern-auth-form register-form">
              <div className="form-row">
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
              </div>

              <div className="form-row">
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

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password *</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="modern-auth-button" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

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
