import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

function AdminRoute({ children }) {
  const { accessToken, isAuthenticated, user, checkSessionStatus } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!accessToken || !isAuthenticated) {
      navigate('/login')
    } else if (user?.role !== 'ADMIN') {
      navigate('/dashboard')
    } else {
      checkSessionStatus()
    }
  }, [accessToken, isAuthenticated, user, navigate, checkSessionStatus])

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

  if (user?.role !== 'ADMIN') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}>
        <div>Access denied. Redirecting...</div>
      </div>
    )
  }

  return children
}

export default AdminRoute
