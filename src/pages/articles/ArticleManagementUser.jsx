import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FileText, Plus, Eye, Edit, Trash2, AlertCircle, Loader2, Search, ExternalLink, Globe, X } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import ArticleEditor from '../../components/ArticleEditor'
import ArticleAnalytics from '../../components/ArticleAnalytics'
import WordPressPublisher from '../../components/WordPressPublisher'
import { apiClient } from '../../api/client'

// Shared badge styles
const BADGE_STYLES = {
  moderation: {
    PENDING: { bg: '#f3f4f6', color: '#6b7280', text: 'Pending' },
    APPROVED: { bg: '#f0fdf4', color: '#10b981', text: 'Approved' },
    REJECTED: { bg: '#fee2e2', color: '#ef4444', text: 'Rejected' },
    FLAGGED: { bg: '#fef3c7', color: '#f59e0b', text: 'Flagged' },
    UNDER_REVIEW: { bg: '#dbeafe', color: '#3b82f6', text: 'Under Review' }
  },
  status: {
    DRAFT: { bg: '#dbeafe', color: '#1e40af', text: 'Draft' },
    REVIEW: { bg: '#fef3c7', color: '#92400e', text: 'In Review' },
    PUBLISHED: { bg: '#f0fdf4', color: '#166534', text: 'Published' },
    ARCHIVED: { bg: '#f3f4f6', color: '#6b7280', text: 'Archived' }
  }
}

function ArticleManagementUser() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [viewMode, setViewMode] = useState('list') // list, edit, analytics
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newArticleTitle, setNewArticleTitle] = useState('')
  const [wpPublishArticle, setWpPublishArticle] = useState(null)

  useEffect(() => {
    fetchArticles()
  }, [filterStatus, page])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      const params = {
        page,
        limit: 20
      }
      if (filterStatus !== 'ALL') {
        params.status = filterStatus
      }

      const response = await apiClient.get('/articles', { params })
      setArticles(response.data.articles)
      setTotalPages(response.data.pagination.pages)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load articles')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateArticle = async () => {
    if (!newArticleTitle.trim()) {
      setError('Article title is required')
      return
    }

    try {
      const response = await apiClient.post('/articles', {
        title: newArticleTitle,
        content: '',
        status: 'DRAFT'
      })

      setArticles([response.data, ...articles])
      setSuccess('Article created successfully')
      setNewArticleTitle('')
      setShowCreateModal(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create article')
    }
  }

  const handleDeleteArticle = async (articleId) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return

    try {
      await apiClient.delete(`/articles/${articleId}`)
      setArticles(articles.filter(a => a._id !== articleId))
      setSuccess('Article deleted successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete article')
    }
  }

  const getModerationBadge = (status) => BADGE_STYLES.moderation[status] || BADGE_STYLES.moderation.PENDING
  const getStatusBadge = (status) => BADGE_STYLES.status[status] || BADGE_STYLES.status.DRAFT

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (viewMode === 'edit' && selectedArticle) {
    return (
      <>
        <Helmet>
          <title>Edit Article - SUBSTATE</title>
        </Helmet>
        <DashboardLayout>
          <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <button
              onClick={() => {
                setViewMode('list')
                setSelectedArticle(null)
              }}
              style={{
                marginBottom: '20px',
                padding: '8px 16px',
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              ← Back to Articles
            </button>
            <ArticleEditor
              article={selectedArticle}
              onUpdate={(updated) => {
                setArticles(articles.map(a => a._id === updated._id ? updated : a))
                setSelectedArticle(updated)
              }}
            />
          </div>
        </DashboardLayout>
      </>
    )
  }

  if (viewMode === 'analytics' && selectedArticle) {
    return (
      <>
        <Helmet>
          <title>Article Analytics - SUBSTATE</title>
        </Helmet>
        <DashboardLayout>
          <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <button
              onClick={() => {
                setViewMode('list')
                setSelectedArticle(null)
              }}
              style={{
                marginBottom: '20px',
                padding: '8px 16px',
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              ← Back to Articles
            </button>
            <h1 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '700' }}>
              {selectedArticle.title}
            </h1>
            <ArticleAnalytics articleId={selectedArticle._id} />
          </div>
        </DashboardLayout>
      </>
    )
  }

  return (
    <>
      <Helmet>
        <title>My Articles - SUBSTATE</title>
        <meta name="description" content="Manage your articles" />
      </Helmet>

      <DashboardLayout>
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '28px'
          }}>
            <div>
              <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: '28px', fontWeight: '800', color: '#111827', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                My Articles
              </h1>
              <p style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '15px', color: '#6b7280' }}>
                Create, edit, and manage your articles
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <Plus size={20} />
              New Article
            </button>
          </div>

          {error && (
            <div style={{
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
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
              marginBottom: '20px',
              color: '#166534'
            }}>
              ✓ {success}
            </div>
          )}

          {/* Filters */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '200px' }}>
              <Search size={18} style={{ color: '#6b7280' }} />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setPage(1)
              }}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Articles</option>
              <option value="DRAFT">Draft</option>
              <option value="REVIEW">In Review</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          {/* Articles Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading articles...</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center'
            }}>
              <FileText size={48} style={{ color: '#d1d5db', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                No articles found
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '20px' }}>
                {searchTerm ? 'Try adjusting your search' : 'Create your first article to get started'}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  padding: '10px 20px',
                  background: '#F97316',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Create Article
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {filteredArticles.map((article, index) => {
                const statusBadge = getStatusBadge(article.status)
                const modBadge = getModerationBadge(article.moderation?.status)

                return (
                  <motion.div
                    key={article._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                        {article.title}
                      </h3>
                      <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                        {article.wordCount || 0} words • {article.readTime || 0} min read
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <div style={{
                        background: statusBadge.bg,
                        color: statusBadge.color,
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        {statusBadge.text}
                      </div>
                      <div style={{
                        background: modBadge.bg,
                        color: modBadge.color,
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        {modBadge.text}
                      </div>
                      {/* WordPress sync status badge */}
                      <div style={{
                        background: article.wordpress?.syncStatus === 'SYNCED' ? '#fff7ed' : '#f3f4f6',
                        color: article.wordpress?.syncStatus === 'SYNCED' ? '#c2410c' : '#9ca3af',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Globe size={10} />
                        {article.wordpress?.syncStatus === 'SYNCED' ? 'On WordPress' : 'Not on WordPress'}
                      </div>
                    </div>

                    {article.moderation?.violations?.length > 0 && (
                      <div style={{
                        background: '#fee2e2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        color: '#991b1b'
                      }}>
                        ⚠️ {article.moderation.violations.length} violation{article.moderation.violations.length !== 1 ? 's' : ''}
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      marginTop: 'auto',
                      flexDirection: 'column'
                    }}>
                      {/* View on WordPress — only if already synced */}
                      {article.wordpress?.url && (
                        <a
                          href={article.wordpress.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: '#fff7ed',
                            border: '1px solid #fed7aa',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '13px',
                            color: '#c2410c',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            textDecoration: 'none',
                            boxSizing: 'border-box'
                          }}
                        >
                          <ExternalLink size={14} />
                          View on WordPress
                        </a>
                      )}

                      {/* Publish to WordPress button — always visible */}
                      <button
                        onClick={() => setWpPublishArticle(article)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: article.wordpress?.syncStatus === 'SYNCED' ? '#f0fdf4' : '#f9fafb',
                          border: `1px solid ${article.wordpress?.syncStatus === 'SYNCED' ? '#bbf7d0' : '#e5e7eb'}`,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '13px',
                          color: article.wordpress?.syncStatus === 'SYNCED' ? '#166534' : '#374151',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxSizing: 'border-box'
                        }}
                      >
                        <Globe size={14} />
                        {article.wordpress?.syncStatus === 'SYNCED' ? 'Re-publish to WordPress' : 'Publish to WordPress'}
                      </button>

                      <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          setSelectedArticle(article)
                          setViewMode('edit')
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: '#f3f4f6',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setSelectedArticle(article)
                          setViewMode('analytics')
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: '#f3f4f6',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <Eye size={14} />
                        Analytics
                      </button>
                      <button
                        onClick={() => handleDeleteArticle(article._id)}
                        style={{
                          padding: '8px 12px',
                          background: '#fee2e2',
                          border: '1px solid #fecaca',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: '#991b1b',
                          fontWeight: '600',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* WordPress Publish Modal */}
          {wpPublishArticle && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, padding: '20px'
            }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
                <button
                  onClick={() => setWpPublishArticle(null)}
                  style={{
                    position: 'absolute', top: '12px', right: '12px',
                    background: 'white', border: '1px solid #e5e7eb',
                    borderRadius: '50%', width: '32px', height: '32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', zIndex: 10
                  }}
                >
                  <X size={16} />
                </button>
                <WordPressPublisher
                  article={wpPublishArticle}
                  onPublishSuccess={(wpPost) => {
                    // wpPost = { id, url, status, title, publishedAt }
                    setArticles(articles.map(a =>
                      a._id === wpPublishArticle._id
                        ? { ...a, wordpress: { ...a.wordpress, url: wpPost.url, syncStatus: 'SYNCED', postId: wpPost.id } }
                        : a
                    ))
                    setWpPublishArticle(null)
                    setSuccess(`"${wpPublishArticle.title}" published to WordPress! ✓`)
                    setTimeout(() => setSuccess(''), 5000)
                  }}
                />
              </div>
            </div>
          )}

          {/* Create Article Modal */}
          {showCreateModal && (
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
                <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600' }}>
                  Create New Article
                </h2>

                <input
                  type="text"
                  value={newArticleTitle}
                  onChange={(e) => setNewArticleTitle(e.target.value)}
                  placeholder="Article title"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    marginBottom: '16px',
                    boxSizing: 'border-box'
                  }}
                />

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateArticle}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: '#F97316',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  )
}

export default ArticleManagementUser
