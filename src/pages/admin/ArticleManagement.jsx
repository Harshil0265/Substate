import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FileText, AlertCircle, Loader2, Search } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { apiClient } from '../../api/client'

// Shared badge styles
const BADGE_STYLES = {
  moderation: {
    PENDING: { bg: '#f3f4f6', color: '#6b7280', text: 'Pending' },
    APPROVED: { bg: '#f0fdf4', color: '#10b981', text: 'Approved' },
    REJECTED: { bg: '#fee2e2', color: '#ef4444', text: 'Rejected' },
    FLAGGED: { bg: '#fef3c7', color: '#f59e0b', text: 'Flagged' },
    UNDER_REVIEW: { bg: '#dbeafe', color: '#3b82f6', text: 'Under Review' }
  }
}

function ArticleManagement() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filterStatus, setFilterStatus] = useState('PENDING')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    fetchArticles()
  }, [filterStatus, page])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/articles/admin/pending-review', {
        params: {
          page,
          limit: 20
        }
      })

      setArticles(response.data.articles)
      setTotalPages(response.data.pagination.pages)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load articles')
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (articleId, action, notes = '') => {
    try {
      const response = await apiClient.post(`/articles/${articleId}/review`, {
        action,
        notes
      })

      setSuccess(`Article ${action}ed successfully`)
      setArticles(articles.filter(a => a.id !== articleId))
      setShowDetailModal(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to review article')
    }
  }

  const getModerationBadge = (status) => BADGE_STYLES.moderation[status] || BADGE_STYLES.moderation.PENDING

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
      <Helmet>
        <title>Article Management - Admin</title>
        <meta name="description" content="Manage and moderate articles" />
      </Helmet>

      <DashboardLayout>
        <div className="dashboard-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
          <div className="dashboard-header" style={{ marginBottom: '28px' }}>
            <div>
              <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: '28px', fontWeight: '800', color: '#111827', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                Article Management
              </h1>
              <p style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '15px', color: '#6b7280' }}>
                Review and moderate user-submitted articles
              </p>
            </div>
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
              <option value="PENDING">Pending</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="FLAGGED">Flagged</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Articles Table */}
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
              <p style={{ color: '#6b7280' }}>
                {searchTerm ? 'Try adjusting your search' : 'All articles have been reviewed'}
              </p>
            </div>
          ) : (
            <div style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>
                        Title
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>
                        Author
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>
                        Status
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>
                        Risk Score
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>
                        Violations
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#6b7280' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredArticles.map((article, index) => {
                      const badge = getModerationBadge(article.status)
                      return (
                        <motion.tr
                          key={article.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          style={{
                            borderBottom: '1px solid #e5e7eb',
                            ':hover': { background: '#f9fafb' }
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                              {article.title}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              {new Date(article.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                            {article.author}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{
                              display: 'inline-block',
                              background: badge.bg,
                              color: badge.color,
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              {badge.text}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{
                              display: 'inline-block',
                              padding: '4px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: article.riskScore >= 70 ? '#fee2e2' : 
                                         article.riskScore >= 40 ? '#fef3c7' : '#f0fdf4',
                              color: article.riskScore >= 70 ? '#991b1b' : 
                                    article.riskScore >= 40 ? '#92400e' : '#166534'
                            }}>
                              {article.riskScore}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {article.violations?.length > 0 ? (
                              <div style={{
                                display: 'inline-block',
                                background: '#fee2e2',
                                color: '#991b1b',
                                padding: '4px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}>
                                {article.violations.length} violation{article.violations.length !== 1 ? 's' : ''}
                              </div>
                            ) : (
                              <div style={{ color: '#6b7280', fontSize: '12px' }}>None</div>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <button
                              onClick={() => {
                                setSelectedArticle(article)
                                setShowDetailModal(true)
                              }}
                              style={{
                                padding: '6px 12px',
                                background: '#F97316',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Review
                            </button>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  padding: '16px',
                  borderTop: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: page === 1 ? 'not-allowed' : 'pointer',
                      opacity: page === 1 ? 0.5 : 1
                    }}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      style={{
                        padding: '8px 12px',
                        border: p === page ? '2px solid #F97316' : '1px solid #d1d5db',
                        borderRadius: '6px',
                        background: p === page ? '#fff7ed' : 'white',
                        color: p === page ? '#F97316' : '#6b7280',
                        fontWeight: p === page ? '600' : '400',
                        cursor: 'pointer'
                      }}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: page === totalPages ? 'not-allowed' : 'pointer',
                      opacity: page === totalPages ? 0.5 : 1
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Detail Modal */}
          {showDetailModal && selectedArticle && (
            <ArticleDetailModal
              article={selectedArticle}
              onClose={() => setShowDetailModal(false)}
              onReview={handleReview}
            />
          )}
        </div>
      </DashboardLayout>
    </>
  )
}

function ArticleDetailModal({ article, onClose, onReview }) {
  const [activeTab, setActiveTab] = useState('content')
  const [reviewAction, setReviewAction] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmitReview = async () => {
    if (!reviewAction) return

    setLoading(true)
    await onReview(article.id, reviewAction, reviewNotes)
    setLoading(false)
    onClose()
  }

  return (
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
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px rgba(0,0,0,0.15)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'white'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
            {article.title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb'
        }}>
          {['content', 'violations', 'review'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: 'none',
                background: activeTab === tab ? 'white' : 'transparent',
                borderBottom: activeTab === tab ? '2px solid #F97316' : 'none',
                cursor: 'pointer',
                fontWeight: activeTab === tab ? '600' : '400',
                color: activeTab === tab ? '#F97316' : '#6b7280',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {activeTab === 'content' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '4px' }}>
                  AUTHOR
                </div>
                <div style={{ fontSize: '14px', color: '#111827' }}>
                  {article.author}
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '4px' }}>
                  CREATED
                </div>
                <div style={{ fontSize: '14px', color: '#111827' }}>
                  {new Date(article.createdAt).toLocaleString()}
                </div>
              </div>
              <div style={{
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '13px',
                lineHeight: '1.6',
                color: '#111827',
                maxHeight: '400px',
                overflow: 'auto'
              }}>
                Article content would be displayed here
              </div>
            </div>
          )}

          {activeTab === 'violations' && (
            <div>
              {article.violations && article.violations.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {article.violations.map((violation, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '12px',
                        background: '#fee2e2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        borderLeft: `4px solid ${
                          violation.severity >= 4 ? '#ef4444' :
                          violation.severity >= 3 ? '#f59e0b' : '#fbbf24'
                        }`
                      }}
                    >
                      <div style={{ fontWeight: '600', color: '#991b1b', marginBottom: '4px' }}>
                        {violation.category}
                      </div>
                      <div style={{ fontSize: '13px', color: '#991b1b', marginBottom: '4px' }}>
                        {violation.description}
                      </div>
                      <div style={{ fontSize: '12px', color: '#991b1b', opacity: 0.7 }}>
                        Severity: {violation.severity}/5
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>
                  No violations found
                </div>
              )}
            </div>
          )}

          {activeTab === 'review' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                  Action
                </label>
                <select
                  value={reviewAction}
                  onChange={(e) => setReviewAction(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select action...</option>
                  <option value="approve">Approve</option>
                  <option value="reject">Reject</option>
                  <option value="flag">Flag for Review</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                  Notes
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about this review..."
                  rows="4"
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
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={onClose}
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
                  onClick={handleSubmitReview}
                  disabled={!reviewAction || loading}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: '#F97316',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: loading || !reviewAction ? 'not-allowed' : 'pointer',
                    opacity: loading || !reviewAction ? 0.6 : 1
                  }}
                >
                  {loading ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ArticleManagement
