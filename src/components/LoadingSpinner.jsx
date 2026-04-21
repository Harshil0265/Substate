import { memo } from 'react'

const LoadingSpinner = memo(({ 
  size = 40, 
  color = '#f97316', 
  backgroundColor = '#f3f4f6',
  message = 'Loading...',
  className = '',
  style = {}
}) => {
  return (
    <div 
      className={`loading-spinner-container ${className}`}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: '16px',
        padding: '40px 20px',
        ...style
      }}
    >
      <div 
        className="loading-spinner"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          border: `3px solid ${backgroundColor}`,
          borderTop: `3px solid ${color}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      {message && (
        <p style={{ 
          color: '#6b7280', 
          fontSize: '16px', 
          margin: 0,
          textAlign: 'center'
        }}>
          {message}
        </p>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
})

LoadingSpinner.displayName = 'LoadingSpinner'

export default LoadingSpinner