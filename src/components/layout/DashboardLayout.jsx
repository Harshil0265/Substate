import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import '../../styles/dashboard-layout.css'

function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">SUBSTATE</div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? '✕' : '☰'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/dashboard"
            className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Dashboard</span>
          </Link>

          <Link
            to="/campaigns"
            className={`nav-item ${isActive('/campaigns') ? 'active' : ''}`}
          >
            <span className="nav-icon">🎯</span>
            <span className="nav-label">Campaigns</span>
          </Link>

          <Link
            to="/articles"
            className={`nav-item ${isActive('/articles') ? 'active' : ''}`}
          >
            <span className="nav-icon">📝</span>
            <span className="nav-label">Articles</span>
          </Link>

          <Link
            to="/subscription"
            className={`nav-item ${isActive('/subscription') ? 'active' : ''}`}
          >
            <span className="nav-icon">💳</span>
            <span className="nav-label">Subscription</span>
          </Link>

          <Link
            to="/admin"
            className={`nav-item ${isActive('/admin') ? 'active' : ''}`}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">Admin</span>
          </Link>

          <Link
            to="/settings"
            className={`nav-item ${isActive('/settings') ? 'active' : ''}`}
          >
            <span className="nav-icon">⚡</span>
            <span className="nav-label">Settings</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button 
            onClick={() => {
              useAuthStore.getState().logout()
              window.location.href = '/login'
            }}
            className="logout-button"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {children}
      </div>
    </div>
  )
}

export default DashboardLayout
