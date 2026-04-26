import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FileText, Plus, Eye, Edit, Trash2, AlertCircle, Loader2, Search, ExternalLink, Globe, X, Database, Shield, TrendingUp } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import ArticleEditor from '../../components/ArticleEditor'
import ArticleAnalytics from '../../components/ArticleAnalytics'
import WordPressPublisher from '../../components/WordPressPublisher'
import AuthenticArticleGenerator from '../../components/AuthenticArticleGenerator'
import ContentAuthenticityValidator from '../../components/ContentAuthenticityValidator'
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
  },
  authenticity: {
    verified: { bg: '#f0fdf4', color: '#10b981', text: 'Verified' },
    unknown: { bg: '#f3f4f6', color: '#6b7280', text: 'Unknown' },
    low: { bg: '#fee2e2', color: '#ef4444', text: 'Low Quality' }
  }
}

function ArticleManagementEnhanced() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [viewMode, setViewMode] = useState('list') // list, edit, analytics, authentic-generator, validator
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newArticleTitle, setNewArticleTitle] = useState('')
  const [newArticleDescription, setNewArticleDescription] = useState('')
  const [newArticleKeywords, setNewArticleKeywords] = useState('')
  const [generatingAI, setGeneratingAI] = useState(false)
  const [regeneratingArticle, setRegeneratingArticle] = useState(null)
  const [wpPublishArticle, setWpPublishArticle] = useState(null)
  const [usageData, setUsageData] = useState(null)
  const [validatingContent, setValidatingContent] = useState(null)

  useEffect(() => {
    fetchUsageData()
    fetchArticles()
  }, [page, filterStatus, searchTerm])

  const fetchUsageData = async () => {
    try {
      const response = await apiClient.get('/api/users/usage/current')
      setUsageData(response.data.usage)
    } catch (error) {
      console.error('Error fetching usage data:', error)
    }
  }

  const fetchArticles = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(filterStatus !== 'ALL' && { status: filterStatus }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await apiClient.get(`/api/articles?${params}`)
      setArticles(response.data.articles)
      setTotalPages(response.data.totalPages)
    } catch (error) {
      setError('Failed to fetch articles')
      console.error('Error fetching articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAuthenticArticleGenerated = (article) => {
    setArticles(prev => [article, ...prev])
    setSuccess('Authentic article generated successfully with real data and verified sources!')
    setTimeout(() => setSuccess(''), 5000)
  }

  const handleValidateContent = async (article) => {
    setValidatingContent(article)
    setViewMode('validator')
  }

  const handleRegenerateWithFreshData = async (articleId) => {
    try {
      setRegeneratingArticle(articleId)
      const response = await apiClient.post(`/api/articles/${articleId}/regenerate-research`, {
        requirements: {
          researchDepth: 'comprehensive',
          targetLength: 2000
        }
      })

      if (response.data.success) {
        setSuccess('Article regenerated with fresh research data!')
        fetchArticles()
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to regenerate article')
    } finally {
      setRegeneratingArticle(null)
    }
  }

  const getAuthenticityBadge = (article) => {
    const authenticity = article.metadata?.authenticity || 'unknown'
    const style = BADGE_STYLES.authenticity[authenticity] || BADGE_STYLES.authenticity.unknown
    
    return (
      <span
        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
        style={{ backgroundColor: style.bg, color: style.color }}
      >
        {style.text}
      </span>
    )
  }

  const getResearchQualityScore = (article) => {
    const researchDepth = article.metadata?.researchDepth?.overall || 0
    return Math.round(researchDepth)
  }

  const renderArticleCard = (article) => (
    <motion.div
      key={article.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{article.title}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{article.excerpt}</p>
          
          <div className="flex flex-wrap gap-2 mb-3">
            <span
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              style={{ 
                backgroundColor: BADGE_STYLES.status[article.status]?.bg || '#f3f4f6',
                color: BADGE_STYLES.status[article.status]?.color || '#6b7280'
              }}
            >
              {BADGE_STYLES.status[article.status]?.text || article.status}
            </span>
            
            <span
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              style={{ 
                backgroundColor: BADGE_STYLES.moderation[article.moderation?.status]?.bg || '#f3f4f6',
                color: BADGE_STYLES.moderation[article.moderation?.status]?.color || '#6b7280'
              }}
            >
              {BADGE_STYLES.moderation[article.moderation?.status]?.text || 'Unknown'}
            </span>

            {getAuthenticityBadge(article)}

            {article.aiGenerated && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                AI Generated
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{article.wordCount} words</span>
            <span>{article.readTime} min read</span>
            {article.metadata?.sourcesUsed && (
              <span className="flex items-center gap-1">
                <Database className="w-4 h-4" />
                {article.metadata.sourcesUsed} sources
              </span>
            )}
            {article.metadata?.dataPoints && (
              <span className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {article.metadata.dataPoints} data points
              </span>
            )}
            <span>Research: {getResearchQualityScore(article)}%</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedArticle(article)
              setViewMode('analytics')
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            <Eye className="w-4 h-4" />
            View
          </button>
          
          <button
            onClick={() => {
              setSelectedArticle(article)
              setViewMode('edit')
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>

          <button
            onClick={() => handleValidateContent(article)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
          >
            <Shield className="w-4 h-4" />
            Validate
          </button>

          {article.aiGenerated && (
            <button
              onClick={() => handleRegenerateWithFreshData(article.id)}
              disabled={regeneratingArticle === article.id}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
            >
              {regeneratingArticle === article.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Database className="w-4 h-4" />
              )}
              Refresh Data
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setWpPublishArticle(article)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-md transition-colors"
          >
            <Globe className="w-4 h-4" />
            Publish
          </button>
        </div>
      </div>
    </motion.div>
  )

  const renderContent = () => {
    switch (viewMode) {
      case 'authentic-generator':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Generate Authentic Content</h2>
              <button
                onClick={() => setViewMode('list')}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
                Back to Articles
              </button>
            </div>
            <AuthenticArticleGenerator 
              onArticleGenerated={handleAuthenticArticleGenerated}
            />
          </div>
        )

      case 'validator':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Content Authenticity Validator</h2>
              <button
                onClick={() => setViewMode('list')}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
                Back to Articles
              </button>
            </div>
            {validatingContent && (
              <ContentAuthenticityValidator 
                content={validatingContent.content}
                title={validatingContent.title}
                onValidationComplete={(result) => {
                  console.log('Validation result:', result)
                }}
              />
            )}
          </div>
        )

      case 'edit':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Edit Article</h2>
              <button
                onClick={() => setViewMode('list')}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
                Back to Articles
              </button>
            </div>
            {selectedArticle && (
              <ArticleEditor 
                article={selectedArticle}
                onSave={(updatedArticle) => {
                  setArticles(prev => prev.map(a => a.id === updatedArticle.id ? updatedArticle : a))
                  setSuccess('Article updated successfully!')
                  setViewMode('list')
                }}
                onCancel={() => setViewMode('list')}
              />
            )}
          </div>
        )

      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Article Analytics</h2>
              <button
                onClick={() => setViewMode('list')}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
                Back to Articles
              </button>
            </div>
            {selectedArticle && (
              <ArticleAnalytics articleId={selectedArticle.id} />
            )}
          </div>
        )

      default:
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Article Management</h1>
                <p className="text-gray-600">Create and manage authentic, data-driven content</p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewMode('authentic-generator')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Database className="w-5 h-5" />
                  Generate Authentic Content
                </button>
                
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create Manual
                </button>
              </div>
            </div>

            {/* Usage Stats */}
            {usageData && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {usageData.articlesUsed || 0}/{usageData.articlesLimit || 0}
                    </div>
                    <div className="text-sm text-gray-600">Articles Used</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {articles.filter(a => a.metadata?.authenticity === 'verified').length}
                    </div>
                    <div className="text-sm text-gray-600">Verified Authentic</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {articles.reduce((sum, a) => sum + (a.metadata?.sourcesUsed || 0), 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Sources Used</div>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search articles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="REVIEW">In Review</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            {/* Success/Error Messages */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-green-700">{success}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Articles List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
                <p className="text-gray-600 mb-6">Get started by creating your first authentic article</p>
                <button
                  onClick={() => setViewMode('authentic-generator')}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                >
                  <Database className="w-5 h-5" />
                  Generate Authentic Content
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {articles.map(renderArticleCard)}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                
                <button
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )
    }
  }

  return (
    <DashboardLayout>
      <Helmet>
        <title>Enhanced Article Management - SUBSTATE</title>
        <meta name="description" content="Create and manage authentic, data-driven articles with real statistics and verified sources" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>

      {/* WordPress Publisher Modal */}
      {wpPublishArticle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Publish to WordPress</h3>
                <button
                  onClick={() => setWpPublishArticle(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <WordPressPublisher
                article={wpPublishArticle}
                onPublished={() => {
                  setWpPublishArticle(null)
                  setSuccess('Article published to WordPress successfully!')
                  fetchArticles()
                }}
                onCancel={() => setWpPublishArticle(null)}
              />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default ArticleManagementEnhanced