import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FileText, Plus, Eye, Edit, Trash2, AlertCircle, Loader2, Search, ExternalLink, Globe, X, Sparkles } from 'lucide-react'
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
  const [viewMode, setViewMode] = useState('list') // list, edit, analytics, trash
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newArticleTitle, setNewArticleTitle] = useState('')
  const [newArticleDescription, setNewArticleDescription] = useState('')
  const [newArticleKeywords, setNewArticleKeywords] = useState('')
  const [generatingAI, setGeneratingAI] = useState(false)
  const [regeneratingArticle, setRegeneratingArticle] = useState(null)
  const [wpPublishArticle, setWpPublishArticle] = useState(null)
  const [usageData, setUsageData] = useState(null)
  const [trashedArticles, setTrashedArticles] = useState([])
  const [trashPage, setTrashPage] = useState(1)
  const [trashTotalPages, setTrashTotalPages] = useState(1)
  const [trashLoading, setTrashLoading] = useState(false)

  useEffect(() => {
    fetchUsageData()
    fetchArticles()
  }, [filterStatus, page])

  useEffect(() => {
    if (viewMode === 'trash') {
      fetchTrash()
    }
  }, [viewMode, trashPage])

  const fetchUsageData = async () => {
    try {
      const response = await apiClient.get('/users/usage/current')
      setUsageData(response.data)
    } catch (error) {
      console.error('Error fetching usage data:', error)
    }
  }

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

      const newArticle = response.data.article || response.data
      setArticles([newArticle, ...articles])
      
      // Instantly update usage count
      if (usageData) {
        setUsageData({
          ...usageData,
          usage: {
            ...usageData.usage,
            articles: usageData.usage.articles + 1
          }
        })
      }
      
      setSuccess('Article created successfully')
      setNewArticleTitle('')
      setNewArticleDescription('')
      setNewArticleKeywords('')
      setShowCreateModal(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create article')
    }
  }

  const handleGenerateWithAI = async () => {
    if (!newArticleTitle.trim()) {
      setError('Article title is required for AI generation')
      return
    }

    try {
      setGeneratingAI(true)
      setError('')

      console.log('🤖 Generating article with AI:', newArticleTitle)

      // Generate content with AI - this endpoint creates the article automatically
      const response = await apiClient.post('/articles/generate-content', {
        title: newArticleTitle,
        category: 'General',
        keywords: newArticleKeywords || newArticleTitle
      })

      console.log('✅ Article generated:', response.data)

      // The article is already created by the backend
      const newArticle = response.data.article
      
      // Add to articles list
      setArticles([newArticle, ...articles])
      
      // Instantly update usage count
      if (usageData) {
        setUsageData({
          ...usageData,
          usage: {
            ...usageData.usage,
            articles: usageData.usage.articles + 1
          }
        })
      }
      
      setSuccess(`Article "${newArticleTitle}" generated successfully with ${newArticle.wordCount} words!`)
      setNewArticleTitle('')
      setNewArticleDescription('')
      setNewArticleKeywords('')
      setShowCreateModal(false)
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      console.error('❌ Error generating article:', err)
      const errorMessage = err.response?.data?.error || err.response?.data?.details || 'Failed to generate article with AI'
      setError(errorMessage)
    } finally {
      setGeneratingAI(false)
    }
  }

  const handleRegenerateArticle = async (article) => {
    if (!window.confirm(`Regenerate "${article.title}" with fresh research data and authentic content? This will replace the current content with professional-grade content.`)) {
      return
    }

    try {
      setRegeneratingArticle(article._id)
      setError('')

      console.log('🔄 Starting professional regeneration for:', article.title)
      console.log('📝 Current word count:', article.wordCount)

      // Use the professional regeneration endpoint
      console.log('🔬 Calling Professional Research API...')
      const response = await apiClient.post(`/articles-authentic/${article._id}/regenerate-research`, {
        requirements: {
          researchDepth: 'comprehensive',
          targetLength: 2500,
          includeStatistics: true,
          includeCitations: true
        }
      })

      console.log('✅ Professional regeneration response:', {
        success: response.data.success,
        wordCount: response.data.article?.wordCount,
        sourcesUsed: response.data.researchQuality?.sourcesUsed,
        dataPoints: response.data.researchQuality?.dataPoints,
        authenticity: response.data.researchQuality?.authenticity
      })

      if (response.data.success) {
        // Update the articles list with the regenerated article
        setArticles(articles.map(a => 
          a._id === article._id 
            ? { 
                ...a, 
                content: response.data.article.content || a.content,
                excerpt: response.data.article.excerpt || a.excerpt,
                wordCount: response.data.article.wordCount || a.wordCount,
                readTime: response.data.article.readTime || a.readTime,
                metadata: response.data.article.metadata || a.metadata,
                moderation: response.data.article.moderation || a.moderation,
                updatedAt: response.data.article.updatedAt || new Date(),
                regeneratedAt: new Date()
              }
            : a
        ))

        const finalWordCount = response.data.article.wordCount || 0
        const sourcesUsed = response.data.researchQuality?.sourcesUsed || 0
        const dataPoints = response.data.researchQuality?.dataPoints || 0
        
        console.log('📊 Professional regeneration stats:', {
          wordCount: finalWordCount,
          sourcesUsed,
          dataPoints,
          authenticity: response.data.researchQuality?.authenticity
        })

        setSuccess(`"${article.title}" regenerated successfully with professional content! ${finalWordCount} words, ${sourcesUsed} sources, ${dataPoints} data points.`)
        setTimeout(() => setSuccess(''), 7000)

        // Refresh the articles list after a short delay to ensure database consistency
        setTimeout(() => {
          console.log('🔄 Refreshing articles list...')
          fetchArticles()
        }, 1000)
      } else {
        throw new Error(response.data.message || 'Professional regeneration failed')
      }

    } catch (err) {
      console.error('❌ Professional regeneration error:', err)
      setError(err.response?.data?.message || 'Failed to regenerate article with professional content')
    } finally {
      setRegeneratingArticle(null)
    }
  }

  const handleDeleteArticle = async (articleId) => {
    // Validate articleId before proceeding
    if (!articleId || articleId === 'undefined' || articleId === 'null') {
      console.error('❌ Invalid article ID:', articleId);
      setError('Invalid article ID. Please refresh the page and try again.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this article?')) return

    try {
      console.log('🗑️ Deleting article:', articleId);
      await apiClient.delete(`/articles/${articleId}`, {
        data: { reason: 'User deleted' }
      })
      
      // Instantly update articles list
      setArticles(articles.filter(a => a._id !== articleId))
      
      // Instantly update usage count
      if (usageData) {
        setUsageData({
          ...usageData,
          usage: {
            ...usageData.usage,
            articles: Math.max(0, usageData.usage.articles - 1)
          }
        })
      }
      
      setSuccess('Article moved to trash successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('❌ Delete error:', err)
      console.error('   Article ID:', articleId);
      console.error('   Error response:', err.response?.data);
      setError(err.response?.data?.error || 'Failed to delete article')
    }
  }

  const fetchTrash = async () => {
    try {
      setTrashLoading(true)
      setError('')
      console.log('🗑️ Fetching trash, page:', trashPage);
      
      const response = await apiClient.get('/articles/trash/list', {
        params: {
          page: trashPage,
          limit: 20
        }
      })
      
      console.log('✅ Trash response:', response.data);
      setTrashedArticles(response.data.articles || [])
      setTrashTotalPages(response.data.pagination?.pages || 1)
    } catch (err) {
      console.error('❌ Trash error:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load trash'
      setError(errorMsg)
      setTrashedArticles([])
    } finally {
      setTrashLoading(false)
    }
  }

  const handleRestoreArticle = async (articleId) => {
    // Validate articleId
    if (!articleId || articleId === 'undefined' || articleId === 'null') {
      console.error('❌ Invalid article ID:', articleId);
      setError('Invalid article ID. Please refresh the page and try again.');
      return;
    }

    try {
      console.log('♻️ Restoring article:', articleId);
      await apiClient.post(`/articles/${articleId}/restore`)
      
      // Remove from trash
      setTrashedArticles(trashedArticles.filter(a => a._id !== articleId))
      
      // Add back to articles
      fetchArticles()
      
      // Update usage count
      if (usageData) {
        setUsageData({
          ...usageData,
          usage: {
            ...usageData.usage,
            articles: usageData.usage.articles + 1
          }
        })
      }
      
      setSuccess('Article restored successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('❌ Restore error:', err);
      console.error('   Article ID:', articleId);
      setError(err.response?.data?.error || 'Failed to restore article')
    }
  }

  const handlePermanentDelete = async (articleId) => {
    // Validate articleId
    if (!articleId || articleId === 'undefined' || articleId === 'null') {
      console.error('❌ Invalid article ID:', articleId);
      setError('Invalid article ID. Please refresh the page and try again.');
      return;
    }

    if (!window.confirm('Are you sure you want to permanently delete this article? This cannot be undone.')) return

    try {
      console.log('🗑️ Permanently deleting article:', articleId);
      await apiClient.delete(`/articles/${articleId}/permanent`)
      
      // Remove from trash
      setTrashedArticles(trashedArticles.filter(a => a._id !== articleId))
      
      setSuccess('Article permanently deleted')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to permanently delete article')
    }
  }

  const handleEmptyTrash = async () => {
    if (!window.confirm('Are you sure you want to permanently delete all articles in trash? This cannot be undone.')) return

    try {
      await apiClient.delete('/articles/trash/empty')
      
      // Clear trash
      setTrashedArticles([])
      
      setSuccess('Trash emptied successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to empty trash')
    }
  }

  const getModerationBadge = (status) => BADGE_STYLES.moderation[status] || BADGE_STYLES.moderation.PENDING
  const getStatusBadge = (status) => BADGE_STYLES.status[status] || BADGE_STYLES.status.DRAFT

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'ALL' || article.status === filterStatus
    return matchesSearch && matchesStatus
  })

  if (viewMode === 'trash') {
    return (
      <>
        <Helmet>
          <title>Trash - SUBSTATE</title>
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
                  Trash
                </h1>
                <p style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '15px', color: '#6b7280' }}>
                  Articles in trash for 15+ days will be automatically deleted
                </p>
              </div>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '12px 24px',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ← Back to Articles
              </button>
            </div>

            {error && (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '20px',
                color: '#991b1b'
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
                marginBottom: '20px',
                color: '#166534'
              }}>
                ✓ {success}
              </div>
            )}

            {trashedArticles.length > 0 && (
              <button
                onClick={handleEmptyTrash}
                style={{
                  marginBottom: '20px',
                  padding: '10px 20px',
                  background: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  color: '#991b1b',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Empty Trash
              </button>
            )}

            {trashLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading trash...</p>
              </div>
            ) : trashedArticles.length === 0 ? (
              <div style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '40px',
                textAlign: 'center'
              }}>
                <FileText size={48} style={{ color: '#d1d5db', margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                  Trash is empty
                </h3>
                <p style={{ color: '#6b7280' }}>
                  Deleted articles will appear here
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px'
              }}>
                {trashedArticles.map((article) => {
                  // Calculate days in trash and days until permanent deletion
                  const daysInTrash = Math.floor((new Date() - new Date(article.deletedAt)) / (1000 * 60 * 60 * 24))
                  const daysUntilDeletion = Math.max(0, 15 - daysInTrash)
                  const willBeDeletedSoon = daysUntilDeletion <= 3 && daysUntilDeletion > 0
                  const readyForDeletion = daysUntilDeletion === 0

                  return (
                  <motion.div
                    key={article._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: '#ffffff',
                      border: willBeDeletedSoon || readyForDeletion ? '2px solid #fbbf24' : '1px solid #e5e7eb',
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
                        Deleted {new Date(article.deletedAt).toLocaleDateString()}
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>
                        {daysInTrash} {daysInTrash === 1 ? 'day' : 'days'} in trash
                      </p>
                    </div>

                    {/* Deletion Warning */}
                    {willBeDeletedSoon && (
                      <div style={{
                        background: '#fef3c7',
                        border: '1px solid #fbbf24',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        color: '#92400e',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <AlertCircle size={14} />
                        <span>Will be permanently deleted in {daysUntilDeletion} {daysUntilDeletion === 1 ? 'day' : 'days'}</span>
                      </div>
                    )}

                    {readyForDeletion && (
                      <div style={{
                        background: '#fee2e2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        color: '#991b1b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <AlertCircle size={14} />
                        <span>Ready for permanent deletion</span>
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      marginTop: 'auto'
                    }}>
                      <button
                        onClick={() => handleRestoreArticle(article._id)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '13px',
                          color: '#166534'
                        }}
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(article._id)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: '#fee2e2',
                          border: '1px solid #fecaca',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '13px',
                          color: '#991b1b'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {trashTotalPages > 1 && (
              <div style={{ marginTop: '24px', textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button
                  onClick={() => setTrashPage(Math.max(1, trashPage - 1))}
                  disabled={trashPage === 1}
                  style={{
                    padding: '8px 16px',
                    background: trashPage === 1 ? '#f3f4f6' : '#ffffff',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: trashPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: trashPage === 1 ? 0.5 : 1
                  }}
                >
                  Previous
                </button>
                <span style={{ padding: '8px 16px', color: '#6b7280' }}>
                  Page {trashPage} of {trashTotalPages}
                </span>
                <button
                  onClick={() => setTrashPage(Math.min(trashTotalPages, trashPage + 1))}
                  disabled={trashPage === trashTotalPages}
                  style={{
                    padding: '8px 16px',
                    background: trashPage === trashTotalPages ? '#f3f4f6' : '#ffffff',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: trashPage === trashTotalPages ? 'not-allowed' : 'pointer',
                    opacity: trashPage === trashTotalPages ? 0.5 : 1
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </DashboardLayout>
      </>
    )
  }

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
              onClick={() => {
                // Check if user has reached limit
                if (usageData && usageData.limits.articles !== -1 && usageData.usage.articles >= usageData.limits.articles) {
                  setError(`You've reached your article limit (${usageData.limits.articles}). Please upgrade your plan to create more articles.`)
                  // Scroll to top to show error
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                } else {
                  setShowCreateModal(true)
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: usageData && usageData.limits.articles !== -1 && usageData.usage.articles >= usageData.limits.articles ? '#d1d5db' : 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: usageData && usageData.limits.articles !== -1 && usageData.usage.articles >= usageData.limits.articles ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: usageData && usageData.limits.articles !== -1 && usageData.usage.articles >= usageData.limits.articles ? 0.6 : 1
              }}
              disabled={usageData && usageData.limits.articles !== -1 && usageData.usage.articles >= usageData.limits.articles}
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

          {/* Usage Stats Row with Trash Button */}
          {usageData && (
            <div style={{ 
              marginBottom: '24px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              justifyContent: 'space-between'
            }}>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '8px 16px',
                background: usageData.usage.articles >= usageData.limits.articles && usageData.limits.articles !== -1 ? '#fee2e2' : usageData.limits.articles === -1 ? '#d1fae5' : '#fff7ed',
                border: `1px solid ${usageData.usage.articles >= usageData.limits.articles && usageData.limits.articles !== -1 ? '#fecaca' : usageData.limits.articles === -1 ? '#a7f3d0' : '#fed7aa'}`,
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                color: usageData.usage.articles >= usageData.limits.articles && usageData.limits.articles !== -1 ? '#991b1b' : usageData.limits.articles === -1 ? '#065f46' : '#ea580c',
                fontFamily: 'Inter, sans-serif'
              }}>
                <FileText size={16} />
                <span>
                  {usageData.usage.articles} / {usageData.limits.articles === -1 ? '∞' : usageData.limits.articles} articles used
                  {usageData.limits.articles === -1 && ' (Unlimited)'}
                </span>
              </div>
              <button
                onClick={() => setViewMode('trash')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                <Trash2 size={18} />
                Trash
              </button>
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

                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      marginTop: 'auto',
                      flexDirection: 'column'
                    }}>
                      {/* View on WordPress — only if already synced */}
                      {article.wordpress?.url && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                            onError={(e) => {
                              // If main URL fails, try alternative URLs
                              if (article.wordpress?.alternativeUrls?.directLink) {
                                e.target.href = article.wordpress.alternativeUrls.directLink;
                              }
                            }}
                          >
                            <ExternalLink size={14} />
                            View on WordPress
                          </a>
                          
                          {/* Show status-specific message */}
                          {article.wordpress.status === 'draft' && (
                            <small style={{ 
                              fontSize: '11px', 
                              color: '#6b7280', 
                              textAlign: 'center',
                              fontStyle: 'italic'
                            }}>
                              Draft - may require login to view
                            </small>
                          )}
                          
                          {article.wordpress.status === 'private' && (
                            <small style={{ 
                              fontSize: '11px', 
                              color: '#6b7280', 
                              textAlign: 'center',
                              fontStyle: 'italic'
                            }}>
                              Private post - requires permissions
                            </small>
                          )}
                        </div>
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

                      {/* Regenerate with AI button */}
                      <button
                        onClick={() => handleRegenerateArticle(article)}
                        disabled={regeneratingArticle === article._id}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: regeneratingArticle === article._id ? '#fb923c' : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: regeneratingArticle === article._id ? 'not-allowed' : 'pointer',
                          fontWeight: '600',
                          fontSize: '13px',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxSizing: 'border-box',
                          opacity: regeneratingArticle === article._id ? 0.7 : 1,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {regeneratingArticle === article._id ? (
                          <>
                            <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                            Regenerating...
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} />
                            Regenerate with Research
                          </>
                        )}
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
                        ? { 
                            ...a, 
                            wordpress: { 
                              ...a.wordpress, 
                              url: wpPost.url, 
                              syncStatus: 'SYNCED', 
                              postId: wpPost.id,
                              status: wpPost.status,
                              lastSyncedAt: new Date(),
                              publishedAt: wpPost.publishedAt
                            } 
                          }
                        : a
                    ))
                    setWpPublishArticle(null)
                    setSuccess(`"${wpPublishArticle.title}" published to WordPress! ✓`)
                    setTimeout(() => setSuccess(''), 5000)
                    
                    // Refresh articles list to ensure sync status is properly loaded
                    setTimeout(() => {
                      fetchArticles()
                    }, 1000)
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
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateArticle()}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    marginBottom: '12px',
                    boxSizing: 'border-box'
                  }}
                />

                <textarea
                  value={newArticleDescription}
                  onChange={(e) => setNewArticleDescription(e.target.value)}
                  placeholder="Brief description or key points (optional, for AI generation)"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    marginBottom: '12px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />

                <input
                  type="text"
                  value={newArticleKeywords}
                  onChange={(e) => setNewArticleKeywords(e.target.value)}
                  placeholder="Keywords (comma-separated, optional)"
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    onClick={handleGenerateWithAI}
                    disabled={generatingAI}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: generatingAI ? '#9ca3af' : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: generatingAI ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {generatingAI ? (
                      <>
                        <div style={{
                          width: '14px',
                          height: '14px',
                          border: '2px solid white',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite'
                        }} />
                        Generating with AI...
                      </>
                    ) : (
                      <>
                        ✨ Generate with AI
                      </>
                    )}
                  </button>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setShowCreateModal(false)
                        setNewArticleTitle('')
                        setNewArticleDescription('')
                        setNewArticleKeywords('')
                      }}
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
                    disabled={generatingAI}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: generatingAI ? '#d1d5db' : '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: '600',
                      cursor: generatingAI ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Create Empty Draft
                  </button>
                </div>
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
