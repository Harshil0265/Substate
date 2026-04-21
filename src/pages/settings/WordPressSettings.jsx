import { Helmet } from 'react-helmet-async'
import { lazy, Suspense } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'

// Lazy load WordPress Integration component
const WordPressIntegration = lazy(() => import('../../components/WordPressIntegration'))

function WordPressSettings() {
  return (
    <>
      <Helmet>
        <title>WordPress Integration - SUBSTATE</title>
        <meta name="description" content="Connect and manage your WordPress sites for automatic publishing." />
      </Helmet>

      <DashboardLayout>
        <Suspense fallback={
          <div style={{ 
            padding: '60px 20px', 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
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
            <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading WordPress Integration...</p>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        }>
          <WordPressIntegration />
        </Suspense>
      </DashboardLayout>
    </>
  )
}

export default WordPressSettings