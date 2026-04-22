import { useState, useEffect } from 'react'
import { AlertCircle, Save, Eye, Settings } from 'lucide-react'
import { apiClient } from '../api/client'

function ArticleEditor({ article, onSave, onUpdate }) {
  const [title, setTitle] = useState(article?.title || '')
  const [content, setContent] = useState(article?.content || '')
  const [excerpt, setExcerpt] = useState(article?.excerpt || '')
  const [status, setStatus] = useState(article?.status || 'DRAFT')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showSeoPanel, setShowSeoPanel] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [readTime, setReadTime] = useState(0)

  useEffect(() => {
    // Calculate word count and read time
    const words = content.split(/\s+/).filter(w => w.length > 0).length
    setWordCount(words)
    setReadTime(Math.ceil(words / 200))
  }, [content])

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required')
      return
    }

    try {
      setLoading(true)
      const response = await apiClient.put(`/articles/${article._id}`, {
        title,
        content,
        excerpt,
        status
      })

      setSuccess('Article saved successfully')
      onUpdate?.(response.data)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save article')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      setLoading(true)
      const response = await apiClient.patch(`/articles/${article._id}/status`, {
        status: newStatus
      })

      setStatus(newStatus)
      setSuccess(`Article status changed to ${newStatus}`)
      onUpdate?.(response.data.article)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#991b1b'
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
          color: '#166534'
        }}>
          ✓ {success}
        </div>
      )}

      {/* Editor Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        background: '#f9fafb',
        borderRadius: '8px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Article Editor</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
            {wordCount} words • {readTime} min read
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowSeoPanel(!showSeoPanel)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px'
            }}
          >
            <Settings size={16} />
            SEO
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: '#F97316',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              opacity: loading ? 0.6 : 1
            }}
          >
            <Save size={16} />
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Title Input */}
      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
          Article Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter article title"
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Excerpt Input */}
      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
          Excerpt (Optional)
        </label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Brief summary of the article"
          rows="2"
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            boxSizing: 'border-box',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Content Editor */}
      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
          Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your article content here..."
          rows="15"
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            boxSizing: 'border-box',
            fontFamily: 'monospace',
            lineHeight: '1.6'
          }}
        />
      </div>

      {/* Status & Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
            Status
          </label>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            <option value="DRAFT">Draft</option>
            <option value="REVIEW">Review</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
            Moderation Status
          </label>
          <div style={{
            padding: '10px 12px',
            background: '#f9fafb',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: article?.moderation?.status === 'APPROVED' ? '#10b981' : 
                         article?.moderation?.status === 'REJECTED' ? '#ef4444' :
                         article?.moderation?.status === 'FLAGGED' ? '#f59e0b' : '#6b7280'
            }} />
            {article?.moderation?.status || 'PENDING'}
          </div>
        </div>
      </div>

      {/* SEO Panel */}
      {showSeoPanel && (
        <ArticleSeoPanel article={article} onUpdate={onUpdate} />
      )}
    </div>
  )
}

function ArticleSeoPanel({ article, onUpdate }) {
  const [focusKeyword, setFocusKeyword] = useState(article?.seo?.focusKeyword || '')
  const [metaDescription, setMetaDescription] = useState(article?.seo?.metaDescription || '')
  const [metaTitle, setMetaTitle] = useState(article?.seo?.metaTitle || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSaveSeo = async () => {
    try {
      setLoading(true)
      const response = await apiClient.patch(`/articles/${article._id}/seo`, {
        focusKeyword,
        metaDescription,
        metaTitle
      })

      setSuccess('SEO settings saved')
      onUpdate?.(response.data.article)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save SEO settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '20px'
    }}>
      <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>SEO Settings</h3>

      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          color: '#991b1b',
          fontSize: '13px'
        }}>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
            Focus Keyword
          </label>
          <input
            type="text"
            value={focusKeyword}
            onChange={(e) => setFocusKeyword(e.target.value)}
            placeholder="Main keyword for this article"
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

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
            Meta Title
          </label>
          <input
            type="text"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder="SEO title (50-60 characters)"
            maxLength="60"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
          <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
            {metaTitle.length}/60 characters
          </small>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
            Meta Description
          </label>
          <textarea
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="SEO description (120-160 characters)"
            rows="3"
            maxLength="160"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box',
              fontFamily: 'inherit'
            }}
          />
          <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
            {metaDescription.length}/160 characters
          </small>
        </div>

        <button
          onClick={handleSaveSeo}
          disabled={loading}
          style={{
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
          {loading ? 'Saving...' : 'Save SEO Settings'}
        </button>
      </div>
    </div>
  )
}

export default ArticleEditor
