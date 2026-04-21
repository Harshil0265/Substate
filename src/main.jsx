import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import './styles/animations.css'

// Preload critical resources
const preloadCriticalResources = () => {
  // Preload fonts if any
  const fontPreloads = [
    // Add any custom fonts here
  ]
  
  fontPreloads.forEach(font => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'font'
    link.type = 'font/woff2'
    link.crossOrigin = 'anonymous'
    link.href = font
    document.head.appendChild(link)
  })
}

function Root() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Preload critical resources
    preloadCriticalResources()
    
    // Reduced initial load time for better UX
    const timer = setTimeout(() => {
      setLoading(false)
    }, 150)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
        zIndex: 9999
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #f97316',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <div style={{
          color: '#6b7280',
          fontSize: '16px',
          fontWeight: '500'
        }}>
          Loading SUBSTATE...
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return <App />
}

// Use concurrent features for better performance
const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
