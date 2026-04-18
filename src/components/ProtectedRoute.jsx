import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

function ProtectedRoute({ children }) {
  const { accessToken, isAuthenticated, checkSessionStatus } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!accessToken || !isAuthenticated) {
      navigate('/login')
    } else {
      // Check session status when component mounts
      checkSessionStatus()
    }
  }, [accessToken, isAuthenticated, navigate, checkSessionStatus])

  if (!accessToken || !isAuthenticated) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}>
        <div>Redirecting to login...</div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute