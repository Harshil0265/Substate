import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import '../../styles/dashboard-layout.css'

function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768)
  const location = useLocation()
  const user = useAuthStore((state) => state.user)

  const isActive = (path) => location.pathname === path

  // Close sidebar on mobile when clicking outside
  const handleOverlayClick = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false)
    }
  }

  // Handle window resize
  useState(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="dashboard-layout">
      {/* Mobile Overlay */}
      {sidebarOpen && window.innerWidth <= 768 && (
        <div className="mobile-overlay" onClick={handleOverlayClick}></div>
      )}

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">🚀</span>
            <span className="logo-text">SUBSTATE</span>
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? '✕' : '☰'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <span className="nav-section-title">MAIN</span>
            <Link
              to="/dashboard"
              className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
              onClick={() => window.innerWidth <= 768 && setSidebarOpen(false)}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-label">Dashboard</span>
            </Link>

            <Link
              to="/campaigns"
              className={`nav-item ${isActive('/campaigns') ? 'active' : ''}`}
              onClick={() => window.innerWidth <= 768 && setSidebarOpen(false)}
            >
              <span className="nav-icon">🎯</span>
              <span className="nav-label">Campaigns</span>
            </Link>

            <Link
              to="/articles"
              className={`nav-item ${isActive('/articles') ? 'active' : ''}`}
              onClick={() => window.innerWidth <= 768 && setSidebarOpen(false)}
            >
              <span className="nav-icon">📝</span>
              <span className="nav-label">Articles</span>
            </Link>
          </div>

          <div className="nav-section">
            <span className="nav-section-title">FEATURES</span>
            <Link
              to="/subscription"
              className={`nav-item ${isActive('/subscription') ? 'active' : ''}`}
              onClick={() => window.innerWidth <= 768 && setSidebarOpen(false)}
            >
              <span className="nav-icon">💳</span>
              <span className="nav-label">Subscription</span>
            </Link>

            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                className={`nav-item ${isActive('/admin') ? 'active' : ''}`}
                onClick={() => window.innerWidth <= 768 && setSidebarOpen(false)}
              >
                <span className="nav-icon">⚙️</span>
                <span className="nav-label">Admin</span>
              </Link>
            )}
          </div>

          <div className="nav-section">
            <span className="nav-section-title">TOOLS</span>
            <Link
              to="/settings"
              className={`nav-item ${isActive('/settings') ? 'active' : ''}`}
              onClick={() => window.innerWidth <= 768 && setSidebarOpen(false)}
            >
              <span className="nav-icon">⚡</span>
              <span className="nav-label">Settings</span>
            </Link>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              <span>{user?.name?.charAt(0) || 'U'}</span>
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name || 'User'}</div>
              <div className="user-plan">{user?.subscription || 'TRIAL'}</div>
            </div>
          </div>
          <button 
            onClick={() => {
              useAuthStore.getState().logout()
              window.location.href = '/login'
            }}
            className="logout-button"
          >
            <span className="logout-icon">🚪</span>
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Mobile Header */}
        <div className="mobile-header">
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <div className="mobile-logo">
            <span className="logo-icon">🚀</span>
            <span className="logo-text">SUBSTATE</span>
          </div>
          <div className="mobile-user">
            <div className="user-avatar small">
              <span>{user?.name?.charAt(0) || 'U'}</span>
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

export default DashboardLayout
