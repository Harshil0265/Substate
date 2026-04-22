import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Target, 
  FileText, 
  CreditCard, 
  Settings, 
  LogOut,
  Menu,
  X,
  Shield
} from 'lucide-react'
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
  useEffect(() => {
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
      {/* Overlay - shows when sidebar is open on mobile OR when hovering minimized sidebar on desktop */}
      {sidebarOpen && window.innerWidth <= 768 && (
        <div className="mobile-overlay" onClick={handleOverlayClick}></div>
      )}

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          {sidebarOpen ? (
            <>
              <div className="sidebar-logo">
                <img src="/substate-icon.svg" alt="Substate" className="logo-image" />
                <span className="logo-text">SUBSTATE</span>
              </div>
              <button
                className="sidebar-toggle"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <X size={18} />
              </button>
            </>
          ) : (
            <button
              className="sidebar-toggle-minimized"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {/* Admin users - Only show Admin Panel */}
          {user?.role === 'ADMIN' ? (
            <div className="nav-section">
              <span className="nav-section-title">ADMIN</span>
              <Link
                to="/admin"
                className={`nav-item ${isActive('/admin') ? 'active' : ''}`}
                onClick={() => window.innerWidth <= 768 && setSidebarOpen(false)}
              >
                <Shield size={20} className="nav-icon" />
                <span className="nav-label">Admin Panel</span>
              </Link>
            </div>
          ) : (
            /* Regular users - Show all options */
            <>
              <div className="nav-section">
                <span className="nav-section-title">MAIN</span>
                <Link
                  to="/dashboard"
                  className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
                  onClick={() => window.innerWidth <= 768 && setSidebarOpen(false)}
                >
                  <LayoutDashboard size={20} className="nav-icon" />
                  <span className="nav-label">Dashboard</span>
                </Link>

                <Link
                  to="/dashboard/campaigns"
                  className={`nav-item ${isActive('/dashboard/campaigns') || location.pathname.startsWith('/dashboard/campaigns') ? 'active' : ''}`}
                  onClick={() => window.innerWidth <= 768 && setSidebarOpen(false)}
                >
                  <Target size={20} className="nav-icon" />
                  <span className="nav-label">Campaigns</span>
                </Link>

                <Link
                  to="/dashboard/articles"
                  className={`nav-item ${isActive('/dashboard/articles') || location.pathname.startsWith('/dashboard/articles') ? 'active' : ''}`}
                  onClick={() => window.innerWidth <= 768 && setSidebarOpen(false)}
                >
                  <FileText size={20} className="nav-icon" />
                  <span className="nav-label">Articles</span>
                </Link>
              </div>

              <div className="nav-section">
                <span className="nav-section-title">FEATURES</span>
                <Link
                  to="/dashboard/subscription"
                  className={`nav-item ${isActive('/dashboard/subscription') || location.pathname.startsWith('/dashboard/subscription') ? 'active' : ''}`}
                  onClick={() => window.innerWidth <= 768 && setSidebarOpen(false)}
                >
                  <CreditCard size={20} className="nav-icon" />
                  <span className="nav-label">Subscription</span>
                </Link>
              </div>

              <div className="nav-section">
                <span className="nav-section-title">TOOLS</span>
                <Link
                  to="/dashboard/settings"
                  className={`nav-item ${isActive('/dashboard/settings') || location.pathname.startsWith('/dashboard/settings') ? 'active' : ''}`}
                  onClick={() => window.innerWidth <= 768 && setSidebarOpen(false)}
                >
                  <Settings size={20} className="nav-icon" />
                  <span className="nav-label">Settings</span>
                </Link>
              </div>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              <span>{user?.name?.charAt(0) || 'U'}</span>
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name || 'User'}</div>
              <div className="user-plan">
                {user?.role === 'ADMIN' ? 'ADMIN' : (user?.subscription || 'PRO')}
              </div>
            </div>
          </div>
          <button 
            onClick={() => {
              useAuthStore.getState().logout()
              window.location.href = '/login'
            }}
            className="logout-button"
          >
            <LogOut size={18} className="logout-icon" />
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
            <Menu size={20} />
          </button>
          <div className="mobile-logo">
            <img src="/substate-icon.svg" alt="Substate" className="logo-image" />
            <span className="logo-text">SUBSTATE</span>
          </div>
          <div className="mobile-user">
            <div className="user-avatar small">
              <span>{user?.name?.charAt(0) || 'U'}</span>
            </div>
            {user?.role === 'ADMIN' && (
              <span className="admin-badge-mobile">ADMIN</span>
            )}
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

export default DashboardLayout
