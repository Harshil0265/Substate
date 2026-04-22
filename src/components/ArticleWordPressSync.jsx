import { useState } from 'react'
import { Globe, Loader2, AlertCircle, CheckCircle, Link2, Unlink } from 'lucide-react'
import { apiClient } from '../api/client'

function ArticleWordPressSync({ article, onUpdate }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showSyncForm, setShowSyncForm] = useState(false)
  const [siteUrl, setSiteUrl] = useState('https://example.com')
  const [autoPublish, setAutoPublish] = useState(false)

  const handleSync = async () => {
    try {
      setLoading(true)
      const response = await apiClient.post(`/articles/${article._id}/wordpress/sync`, {
        siteUrl,
        autoPublish
      })

      setSuccess('Article synced to WordPress successfully')
      onUpdate?.(response.data.article)
      setShowSyncForm(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to sync to WordPress')
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    try {
      setLoading(true)
      const response = await apiClient.post(`/articles/${article._id}/wordpress/publish`)

      setSuccess('Article published to WordPress')
      onUpdate?.(response.data.article)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to publish to WordPress')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect this article from WordPress?')) return

    try {
      setLoading(true)
      const response = await apiClient.post(`/articles/${article._id}/wordpress/disconnect`)

      setSuccess('Article disconnected from WordPress')
      onUpdate?.(response.data.article)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to disconnect from WordPress')
    } finally {
      setLoading(false)
    }
  }

  const isSynced = article?.wordpress?.syncStatus === 'SYNCED'
  const isPublished = article?.wordpress?.status === 'publish'

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '20px'
    }}>
      <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Globe size={18} />
        WordPress Integration
      </h3>

      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#991b1b',
          fontSize: '13px'
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: '#dcfce7',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          color: '#166534',
          fontSize: '13px'
        }}>
          ✓ {success}
        </div>
      )}

      {isSynced ? (
        <div style={{
          padding: '16px',
          background: '#f0fdf4',
          border: '1px solid #dcfce7',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#166534' }}>
            <CheckCircle size={18} />
            <span style={{ fontWeight: '600' }}>Synced to WordPress</span>
          </div>

          <div style={{ fontSize: '13px', color: '#166534', marginBottom: '12px' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>Post ID:</strong> {article.wordpress.postId}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Status:</strong> {article.wordpress.status}
            </div>
            {article.wordpress.url && (
              <div style={{ marginBottom: '8px' }}>
                <strong>URL:</strong>{' '}
                <a
                  href={article.wordpress.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#15803d', textDecoration: 'underline' }}
                >
                  {article.wordpress.url}
                </a>
              </div>
            )}
            <div>
              <strong>Last Synced:</strong> {new Date(article.wordpress.lastSyncedAt).toLocaleString()}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {!isPublished && (
              <button
                onClick={handlePublish}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Publishing...' : 'Publish to WordPress'}
              </button>
            )}
            <button
              onClick={handleDisconnect}
              disabled={loading}
              style={{
                padding: '8px 16px',
                background: '#fee2e2',
                color: '#991b1b',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '13px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Unlink size={14} />
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <div>
          {!showSyncForm ? (
            <button
              onClick={() => setShowSyncForm(true)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#dbeafe',
                color: '#1e40af',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Link2 size={16} />
              Sync to WordPress
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px' }}>
                  WordPress Site URL
                </label>
                <input
                  type="url"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={autoPublish}
                  onChange={(e) => setAutoPublish(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Auto-publish when article is published
              </label>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowSyncForm(false)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSync}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Globe size={14} />}
                  {loading ? 'Syncing...' : 'Sync'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ArticleWordPressSync
