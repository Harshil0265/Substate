import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

function ProtectedRoute({ children }) {
  const { accessToken, isAuthenticated, restoreSession, checkSessionStatus } = useAuthStore()
  const navigate = useNavigate()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      if (!accessToken || !isAuthenticated) {
        console.log('❌ No access token, redirecting to login');
        navigate('/login', { replace: true })
        setIsChecking(false)
        return
      }

      try {
        // Try to restore session first
        const restored = await restoreSession()
        
        if (restored) {
          console.log('✅ Session restored successfully');
          // Check session status
          await checkSessionStatus()
          setIsChecking(false)
        } else {
          console.log('❌ Session restore failed, redirecting to login');
          navigate('/login', { replace: true })
          setIsChecking(false)
        }
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/login', { replace: true })
        setIsChecking(false)
      }
    }

    checkAuth()
  }, []) // Only run once on mount

  if (isChecking) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #f3f4f6',
          borderTop: '3px solid #f97316',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#6b7280' }}>Verifying session...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (!accessToken || !isAuthenticated) {
    return null // Will redirect via useEffect
  }

  return children
}

export default ProtectedRoute