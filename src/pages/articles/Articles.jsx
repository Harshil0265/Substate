import { Helmet } from 'react-helmet-async'
import { useState, useEffect, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { apiClient } from '../../api/client'
import { useAuthStore } from '../../store/authStore'

// Lazy load WordPress components
const WordPressPublisher = lazy(() => import('../../components/WordPressPublisher'))

function Articles() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showWordPressModal, setShowWordPressModal] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [newArticle, setNewArticle] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    tags: '',
    status: 'DRAFT'
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [generatingContent, setGeneratingContent] = useState(false)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    try {
      const response = await apiClient.get('/articles')
      setArticles(response.data.articles || [])
    } catch (error) {
      console.error('Error fetching articles:', error)
      setError('Failed to load articles')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateArticle = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const articleData = {
        ...newArticle,
        tags: newArticle.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      }
      
      const response = await apiClient.post('/articles', articleData)
      setArticles([response.data.article, ...articles])
      setNewArticle({
        title: '',
        content: '',
        excerpt: '',
        category: '',
        tags: '',
        status: 'DRAFT'
      })
      setShowCreateModal(false)
      setSuccess('Article created successfully!')
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create article')
    }
  }

  const handleStatusChange = async (articleId, newStatus) => {
    try {
      await apiClient.patch(`/articles/${articleId}`, { status: newStatus })
      setArticles(articles.map(article => 
        article._id === articleId 
          ? { ...article, status: newStatus }
          : article
      ))
      setSuccess('Article status updated!')
    } catch (error) {
      setError('Failed to update article status')
    }
  }

  const handlePublishToWordPress = (article) => {
    setSelectedArticle(article)
    setShowWordPressModal(true)
  }

  const handleWordPressPublishSuccess = (wordpressPost) => {
    // Update article with WordPress info
    setArticles(articles.map(article => 
      article._id === selectedArticle._id 
        ? { 
            ...article, 
            wordpressPostId: wordpressPost.id,
            wordpressUrl: wordpressPost.url,
            wordpressStatus: wordpressPost.status
          }
        : article
    ))
    setShowWordPressModal(false)
    setSelectedArticle(null)
  }

  const generateAIContent = async () => {
    if (!newArticle.title) {
      setError('Please enter a title first')
      return
    }

    setGeneratingContent(true)
    setError('')

    try {
      const response = await apiClient.post('/articles/generate-content', {
        title: newArticle.title,
        category: newArticle.category
      })

      setNewArticle({
        ...newArticle,
        content: response.data.content,
        excerpt: response.data.excerpt
      })
      setSuccess('AI content generated successfully!')
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to generate content')
    } finally {
      setGeneratingContent(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PUBLISHED': return '#10b981'
      case 'DRAFT': return '#3b82f6'
      case 'REVIEW': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text
    return text.substr(0, maxLength) + '...'
  }

  return (
    <>
      <Helmet>
        <title>Articles - SUBSTATE</title>
        <meta name="description" content="Manage and publish articles with AI assistance." />
      </Helmet>

      <DashboardLayout>
        <div className="dashboard-container">
          <div className="dashboard-header">
            <div>
              <h1>Articles</h1>
              <p>Create and manage your content with AI assistance</p>
            </div>
            <button 
              className="primary-button"
              onClick={() => setShowCreateModal(true)}
            >
              + Create Article
            </button>
          </div>

          {error && (
            <div className="error-message" style={{ marginBottom: '20px' }}>
              {error}
            </div>
          )}

          {success && (
            <div className="success-message" style={{ marginBottom: '20px' }}>
              {success}
            </div>
          )}

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading articles...</p>
            </div>
          ) : (
            <div className="articles-grid">
              {articles.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <h3>No articles yet</h3>
                  <p>Create your first article with AI assistance</p>
                  <button 
                    className="primary-button"
                    onClick={() => setShowCreateModal(true)}
                  >
                    Create Your First Article
                  </button>
                </div>
              ) : (
                articles.map((article, index) => (
                  <motion.div
                    key={article._id}
                    className="article-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <div className="article-header">
                      <h3>{article.title}</h3>
                      <div 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(article.status) }}
                      >
                        {article.status}
                      </div>
                    </div>
                    
                    <p className="article-excerpt">{truncateText(article.excerpt, 120)}</p>
                    
                    <div className="article-meta">
                      <span className="category">{article.category}</span>
                      <span className="date">{new Date(article.createdAt).toLocaleDateString()}</span>
                    </div>

                    {article.tags && article.tags.length > 0 && (
                      <div className="article-tags">
                        {article.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="tag">{tag}</span>
                        ))}
                        {article.tags.length > 3 && (
                          <span className="tag">+{article.tags.length - 3} more</span>
                        )}
                      </div>
                    )}

                    <div className="article-actions">
                      <select
                        value={article.status}
                        onChange={(e) => handleStatusChange(article._id, e.target.value)}
                        className="status-select"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="REVIEW">Review</option>
                        <option value="PUBLISHED">Published</option>
                      </select>
                      <button 
                        className="wordpress-button"
                        onClick={() => handlePublishToWordPress(article)}
                        title="Publish to WordPress"
                      >
                        🌐 WordPress
                      </button>
                      <button className="secondary-button">Edit</button>
                    </div>

                    {/* WordPress Status */}
                    {article.wordpressPostId && (
                      <div className="wordpress-status">
                        <span className="wp-indicator">
                          🌐 Published to WordPress
                        </span>
                        {article.wordpressUrl && (
                          <a 
                            href={article.wordpressUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="wp-link"
                          >
                            View Post
                          </a>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Create Article Modal */}
          {showCreateModal && (
            <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
              <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Create New Article</h2>
                  <button 
                    className="close-button"
                    onClick={() => setShowCreateModal(false)}
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleCreateArticle} className="article-form">
                  <div className="form-group">
                    <label>Article Title</label>
                    <input
                      type="text"
                      value={newArticle.title}
                      onChange={(e) => setNewArticle({...newArticle, title: e.target.value})}
                      placeholder="Enter article title"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Category</label>
                      <select
                        value={newArticle.category}
                        onChange={(e) => setNewArticle({...newArticle, category: e.target.value})}
                        required
                      >
                        <option value="">Select category</option>
                        {/* Trending & Popular */}
                        <option value="Trending">🔥 Trending</option>
                        <option value="Viral">📱 Viral</option>
                        
                        {/* Technology & Innovation */}
                        <option value="Technology">💻 Technology</option>
                        <option value="AI & Machine Learning">🤖 AI & Machine Learning</option>
                        <option value="Cybersecurity">🔒 Cybersecurity</option>
                        <option value="Web Development">🌐 Web Development</option>
                        <option value="Mobile Apps">📲 Mobile Apps</option>
                        <option value="Cloud Computing">☁️ Cloud Computing</option>
                        
                        {/* Business & Entrepreneurship */}
                        <option value="Business">💼 Business</option>
                        <option value="Startups">🚀 Startups</option>
                        <option value="Entrepreneurship">👨‍💼 Entrepreneurship</option>
                        <option value="Corporate">🏢 Corporate</option>
                        <option value="Leadership">👑 Leadership</option>
                        
                        {/* Marketing & Sales */}
                        <option value="Marketing">📢 Marketing</option>
                        <option value="Digital Marketing">📊 Digital Marketing</option>
                        <option value="Social Media">📱 Social Media</option>
                        <option value="Content Marketing">✍️ Content Marketing</option>
                        <option value="SEO">🔍 SEO</option>
                        <option value="Sales">💰 Sales</option>
                        
                        {/* Finance & Investment */}
                        <option value="Finance">💵 Finance</option>
                        <option value="Cryptocurrency">₿ Cryptocurrency</option>
                        <option value="Stock Market">📈 Stock Market</option>
                        <option value="Investment">💎 Investment</option>
                        <option value="Personal Finance">🏦 Personal Finance</option>
                        
                        {/* Health & Wellness */}
                        <option value="Health">🏥 Health</option>
                        <option value="Fitness">💪 Fitness</option>
                        <option value="Mental Health">🧠 Mental Health</option>
                        <option value="Nutrition">🥗 Nutrition</option>
                        <option value="Wellness">🧘 Wellness</option>
                        
                        {/* Sports & Recreation */}
                        <option value="Sports">⚽ Sports</option>
                        <option value="Football">🏈 Football</option>
                        <option value="Basketball">🏀 Basketball</option>
                        <option value="Cricket">🏏 Cricket</option>
                        <option value="Tennis">🎾 Tennis</option>
                        <option value="Gaming">🎮 Gaming</option>
                        <option value="Esports">🎯 Esports</option>
                        
                        {/* Entertainment & Media */}
                        <option value="Entertainment">🎬 Entertainment</option>
                        <option value="Movies">🎥 Movies</option>
                        <option value="Music">🎵 Music</option>
                        <option value="Television">📺 Television</option>
                        <option value="Celebrity">⭐ Celebrity</option>
                        
                        {/* Education & Learning */}
                        <option value="Education">📚 Education</option>
                        <option value="Online Learning">🎓 Online Learning</option>
                        <option value="Career Development">📖 Career Development</option>
                        <option value="Skill Development">🛠️ Skill Development</option>
                        
                        {/* Lifestyle & Culture */}
                        <option value="Lifestyle">🌟 Lifestyle</option>
                        <option value="Travel">✈️ Travel</option>
                        <option value="Food & Cooking">🍽️ Food & Cooking</option>
                        <option value="Fashion">👗 Fashion</option>
                        <option value="Beauty">💄 Beauty</option>
                        <option value="Home & Garden">🏡 Home & Garden</option>
                        <option value="Relationships">💑 Relationships</option>
                        
                        {/* News & Current Events */}
                        <option value="News">📰 News</option>
                        <option value="World News">🌍 World News</option>
                        <option value="Politics">🗳️ Politics</option>
                        <option value="Environment">🌱 Environment</option>
                        <option value="Climate">🌡️ Climate</option>
                        
                        {/* Science & Research */}
                        <option value="Science">🔬 Science</option>
                        <option value="Space">🚀 Space</option>
                        <option value="Biology">🧬 Biology</option>
                        <option value="Physics">⚛️ Physics</option>
                        
                        {/* Other */}
                        <option value="General">📝 General</option>
                        <option value="Opinion">💭 Opinion</option>
                        <option value="How-To">📋 How-To</option>
                        <option value="Tutorial">🎯 Tutorial</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Tags (comma separated)</label>
                      <input
                        type="text"
                        value={newArticle.tags}
                        onChange={(e) => setNewArticle({...newArticle, tags: e.target.value})}
                        placeholder="e.g., AI, automation, productivity"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Excerpt</label>
                    <textarea
                      value={newArticle.excerpt}
                      onChange={(e) => setNewArticle({...newArticle, excerpt: e.target.value})}
                      placeholder="Brief description of the article"
                      rows="2"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <div className="content-header">
                      <label>Content</label>
                      <button
                        type="button"
                        className="ai-button"
                        onClick={generateAIContent}
                        disabled={generatingContent || !newArticle.title}
                      >
                        {generatingContent ? '🤖 Generating...' : '🤖 Generate with AI'}
                      </button>
                    </div>
                    <textarea
                      value={newArticle.content}
                      onChange={(e) => setNewArticle({...newArticle, content: e.target.value})}
                      placeholder="Write your article content or use AI to generate it"
                      rows="10"
                      required
                    />
                  </div>

                  <div className="modal-actions">
                    <button 
                      type="button" 
                      className="secondary-button"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="primary-button">
                      Create Article
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* WordPress Publisher Modal */}
          {showWordPressModal && selectedArticle && (
            <div className="modal-overlay" onClick={() => setShowWordPressModal(false)}>
              <div className="modal-content wordpress-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Publish to WordPress</h2>
                  <button 
                    className="close-button"
                    onClick={() => setShowWordPressModal(false)}
                  >
                    ×
                  </button>
                </div>
                <Suspense fallback={
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      border: '3px solid #f3f4f6',
                      borderTop: '3px solid #f97316',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 16px'
                    }}></div>
                    <p>Loading WordPress Publisher...</p>
                  </div>
                }>
                  <WordPressPublisher 
                    article={selectedArticle}
                    onPublishSuccess={handleWordPressPublishSuccess}
                  />
                </Suspense>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  )
}

export default Articles
