import { useState } from 'react'
import { Copy, Download, Pause, Play, Trash2, Settings, BarChart3, AlertCircle } from 'lucide-react'
import { apiClient } from '../api/client'

function CampaignActions({ campaign, onUpdate, onDelete }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCloneModal, setShowCloneModal] = useState(false)
  const [cloneTitle, setCloneTitle] = useState(`${campaign.title} (Copy)`)

  const handlePauseResume = async () => {
    try {
      setLoading(true)
      const response = await apiClient.patch(`/campaigns/${campaign._id}/pause-resume`)
      setSuccess(`Campaign ${response.data.message}`)
      onUpdate?.(response.data.campaign)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update campaign')
    } finally {
      setLoading(false)
    }
  }

  const handleClone = async () => {
    try {
      setLoading(true)
      const response = await apiClient.post(`/campaigns/${campaign._id}/clone`, {
        title: cloneTitle
      })
      setSuccess('Campaign cloned successfully')
      setShowCloneModal(false)
      onUpdate?.(response.data.campaign)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to clone campaign')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format = 'json') => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/campaigns/${campaign._id}/export?format=${format}`, {
        responseType: format === 'csv' ? 'blob' : 'json'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${campaign.title}-export.${format}`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)

      setSuccess(`Campaign exported as ${format.toUpperCase()}`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to export campaign')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return
    }

    try {
      setLoading(true)
      await apiClient.delete(`/campaigns/${campaign._id}`)
      setSuccess('Campaign deleted successfully')
      onDelete?.()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete campaign')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#991b1b',
          fontSize: '14px'
        }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: '#dcfce7',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          padding: '12px 16px',
          color: '#166534',
          fontSize: '14px'
        }}>
          ✓ {success}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        {/* Pause/Resume */}
        <button
          onClick={handlePauseResume}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 16px',
            background: campaign.status === 'RUNNING' ? '#fef3c7' : '#dbeafe',
            color: campaign.status === 'RUNNING' ? '#92400e' : '#1e40af',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            fontSize: '14px'
          }}
        >
          {campaign.status === 'RUNNING' ? (
            <>
              <Pause size={18} />
              Pause
            </>
          ) : (
            <>
              <Play size={18} />
              Resume
            </>
          )}
        </button>

        {/* Clone */}
        <button
          onClick={() => setShowCloneModal(true)}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 16px',
            background: '#e0e7ff',
            color: '#3730a3',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            fontSize: '14px'
          }}
        >
          <Copy size={18} />
          Clone
        </button>

        {/* Analytics */}
        <button
          onClick={() => window.location.href = `/dashboard/campaigns/${campaign._id}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 16px',
            background: '#f0fdf4',
            color: '#166534',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          <BarChart3 size={18} />
          Analytics
        </button>

        {/* Export JSON */}
        <button
          onClick={() => handleExport('json')}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 16px',
            background: '#f3e8ff',
            color: '#6b21a8',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            fontSize: '14px'
          }}
        >
          <Download size={18} />
          Export JSON
        </button>

        {/* Export CSV */}
        <button
          onClick={() => handleExport('csv')}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 16px',
            background: '#fef3c7',
            color: '#92400e',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            fontSize: '14px'
          }}
        >
          <Download size={18} />
          Export CSV
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 16px',
            background: '#fee2e2',
            color: '#991b1b',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            fontSize: '14px'
          }}
        >
          <Trash2 size={18} />
          Delete
        </button>
      </div>

      {/* Clone Modal */}
      {showCloneModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Clone Campaign</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                New Campaign Title
              </label>
              <input
                type="text"
                value={cloneTitle}
                onChange={(e) => setCloneTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowCloneModal(false)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleClone}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: '#F97316',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Cloning...' : 'Clone Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CampaignActions
