import { Helmet } from 'react-helmet-async'
import { useState, useEffect, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Plus, FileText, Globe, Edit, Loader2, Sparkles } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { apiClient } from '../../api/client'
import { useAuthStore } from '../../store/authStore'

// Lazy load WordPress components
const WordPressPublisher = lazy(() => import('../../components/WordPressPublisher'))

function Articles() {
  const [articles, setArticles] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [filterCampaign, setFilterCampaign] = useState('')
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
    status: 'DRAFT',
    campaignId: '',
    scheduledPublishAt: '',
    autoPublish: false
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [generatingContent, setGeneratingContent] = useState(false)
  const user = useAuthStore((state) => state.user)
  const [usageData, setUsageData] = useState(null)

  useEffect(() => {
    fetchUsageData()
  }, [])

  const fetchUsageData = async () => {
    try {
      const response = await apiClient.get('/users/usage/current')
      setUsageData(response.data)
    } catch (error) {
      console.error('Error fetching usage data:', error)
    }
  }

  useEffect(() => {
    fetchArticles()
    fetchCampaigns()
  }, [filterCampaign])

  const fetchCampaigns = async () => {
    try {
      const response = await apiClient.get('/campaigns')
      setCampaigns(response.data.campaigns || [])
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    }
  }

  const fetchArticles = async () => {
    try {
      const params = filterCampaign ? { campaignId: filterCampaign } : {}
      const response = await apiClient.get('/articles', { params })
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
        tags: newArticle.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        scheduledPublishAt: newArticle.scheduledPublishAt || undefined
      }
      
      const response = await apiClient.post('/articles', articleData)
      setArticles([response.data.article, ...articles])
      
      // Refresh usage data
      await fetchUsageData()
      
      setNewArticle({
        title: '',
        content: '',
        excerpt: '',
        category: '',
        tags: '',
        status: 'DRAFT',
        campaignId: '',
        scheduledPublishAt: '',
        autoPublish: false
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
        <div className="dashboard-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
          <div className="dashboard-header" style={{ marginBottom: '28px' }}>
            <div>
              <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: '28px', fontWeight: '800', color: '#111827', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                Articles
              </h1>
              <p style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '15px', color: '#6b7280', marginBottom: '12px' }}>
                Create and manage your content with AI assistance
              </p>
              {usageData && (
                <div style={{ 
                  marginTop: '12px', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '8px 16px',
                  background: usageData.usage.articles >= usageData.limits.articles && usageData.limits.articles !== -1 ? '#fee2e2' : '#f0fdf4',
                  border: `1px solid ${usageData.usage.articles >= usageData.limits.articles && usageData.limits.articles !== -1 ? '#fecaca' : '#bbf7d0'}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: usageData.usage.articles >= usageData.limits.articles && usageData.limits.articles !== -1 ? '#991b1b' : '#166534',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  <FileText size={16} />
                  <span>
                    {usageData.usage.articles} / {usageData.limits.articles === -1 ? '∞' : usageData.limits.articles} articles used
                  </span>
                </div>
              )}
            </div>
            <button 
              className="primary-button"
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
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: '600',
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: usageData && usageData.limits.articles !== -1 && usageData.usage.articles >= usageData.limits.articles ? 'not-allowed' : 'pointer',
                opacity: usageData && usageData.limits.articles !== -1 && usageData.usage.articles >= usageData.limits.articles ? 0.6 : 1,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(249, 115, 22, 0.25)'
              }}
            >
              <Plus size={20} />
              Create Article
            </button>
          </div>

          {/* Campaign Filter */}
          {campaigns.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#374151' }}>
                Filter by Campaign
              </label>
              <select
                value={filterCampaign}
                onChange={(e) => setFilterCampaign(e.target.value)}
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: '500',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  background: '#ffffff',
                  color: '#374151',
                  width: '100%',
                  maxWidth: '400px',
                  cursor: 'pointer'
                }}
              >
                <option value="">All Campaigns</option>
                {campaigns.map(campaign => (
                  <option key={campaign._id} value={campaign._id}>
                    {campaign.title} ({campaign.articlesGenerated || 0} articles)
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <div className="error-message" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>{error}</span>
              {error.includes('upgrade') && (
                <button 
                  onClick={() => window.location.href = '/dashboard/subscription'}
                  style={{
                    background: 'white',
                    color: '#ef4444',
                    border: '2px solid white',
                    padding: '6px 16px',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '14px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Upgrade Now
                </button>
              )}
            </div>
          )}

          {success && (
            <div className="success-message" style={{ marginBottom: '20px' }}>
              {success}
            </div>
          )}

          {loading ? (
            <div className="loading-state">
              <Loader2 className="loading-spinner" size={40} style={{ animation: 'spin 1s linear infinite' }} />
              <p>Loading articles...</p>
            </div>
          ) : (
            <div className="articles-grid">
              {articles.length === 0 ? (
                <div className="empty-state">
                  <FileText size={64} style={{ color: '#9ca3af', marginBottom: '16px' }} />
                  <h3>No articles yet</h3>
                  <p>Create your first article with AI assistance</p>
                  <button 
                    className="primary-button"
                    onClick={() => {
                      if (usageData && usageData.limits.articles !== -1 && usageData.usage.articles >= usageData.limits.articles) {
                        setError(`You've reached your article limit (${usageData.limits.articles}). Please upgrade your plan to create more articles.`)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      } else {
                        setShowCreateModal(true)
                      }
                    }}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      margin: '0 auto',
                      opacity: usageData && usageData.limits.articles !== -1 && usageData.usage.articles >= usageData.limits.articles ? 0.6 : 1
                    }}
                  >
                    <Plus size={20} />
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
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '20px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div className="article-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '17px', fontWeight: '700', color: '#111827', margin: 0, flex: 1, lineHeight: '1.4' }}>
                        {article.title}
                      </h3>
                      <div 
                        className="status-badge"
                        style={{ 
                          backgroundColor: getStatusColor(article.status),
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          fontFamily: 'Inter, sans-serif',
                          marginLeft: '12px',
                          flexShrink: 0
                        }}
                      >
                        {article.status}
                      </div>
                    </div>
                    
                    <p className="article-excerpt" style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '13px', color: '#6b7280', marginBottom: '14px', lineHeight: '1.6' }}>
                      {truncateText(article.excerpt, 120)}
                    </p>
                    
                    <div className="article-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', fontSize: '13px', gap: '12px' }}>
                      <span className="category" style={{ background: '#111827', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
                        {article.category}
                      </span>
                      <span className="date" style={{ color: '#6b7280', fontWeight: '500', fontFamily: 'Share Tech Mono, monospace', fontSize: '12px' }}>
                        {new Date(article.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {article.tags && article.tags.length > 0 && (
                      <div className="article-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                        {article.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="tag" style={{ background: '#f9fafb', color: '#6b7280', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', border: '1px solid #e5e7eb', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
                            {tag}
                          </span>
                        ))}
                        {article.tags.length > 3 && (
                          <span className="tag" style={{ background: '#f9fafb', color: '#6b7280', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', border: '1px solid #e5e7eb', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
                            +{article.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="article-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <select
                        value={article.status}
                        onChange={(e) => handleStatusChange(article._id, e.target.value)}
                        className="status-select"
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '13px',
                          fontWeight: '600',
                          padding: '7px 10px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          background: '#ffffff',
                          color: '#374151',
                          cursor: 'pointer',
                          flex: '1',
                          minWidth: '100px'
                        }}
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="REVIEW">Review</option>
                        <option value="PUBLISHED">Published</option>
                      </select>
                      <button 
                        className="wordpress-button"
                        onClick={() => handlePublishToWordPress(article)}
                        title="Publish to WordPress"
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '13px',
                          fontWeight: '600',
                          padding: '7px 12px',
                          background: '#111827',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Globe size={16} />
                        WordPress
                      </button>
                      <button 
                        className="secondary-button" 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '13px',
                          fontWeight: '600',
                          padding: '7px 12px',
                          background: '#f9fafb',
                          color: '#374151',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                    </div>

                    {/* WordPress Status */}
                    {article.wordpressPostId && (
                      <div className="wordpress-status" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', padding: '8px 12px', background: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                        <span className="wp-indicator" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: '600', color: '#166534' }}>
                          <Globe size={14} />
                          Published to WordPress
                        </span>
                        {article.wordpressUrl && (
                          <a 
                            href={article.wordpressUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="wp-link"
                            style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: '600', color: '#166534', textDecoration: 'underline' }}
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
                      <label>Campaign (Optional)</label>
                      <select
                        value={newArticle.campaignId}
                        onChange={(e) => setNewArticle({...newArticle, campaignId: e.target.value})}
                      >
                        <option value="">No Campaign</option>
                        {campaigns.map(campaign => (
                          <option key={campaign._id} value={campaign._id}>
                            {campaign.title}
                          </option>
                        ))}
                      </select>
                    </div>

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

                  {/* Scheduling Section */}
                  <div style={{
                    background: '#f0f9ff',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #bfdbfe',
                    marginBottom: '16px'
                  }}>
                    <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={18} />
                      Schedule Publishing (Optional)
                    </h4>
                    
                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={newArticle.autoPublish}
                          onChange={(e) => setNewArticle({...newArticle, autoPublish: e.target.checked})}
                        />
                        Enable Auto-Publish
                      </label>
                    </div>

                    {newArticle.autoPublish && (
                      <div className="form-group">
                        <label>Schedule Date & Time</label>
                        <input
                          type="datetime-local"
                          value={newArticle.scheduledPublishAt}
                          onChange={(e) => setNewArticle({...newArticle, scheduledPublishAt: e.target.value})}
                          min={new Date().toISOString().slice(0, 16)}
                        />
                        <small className="form-help">
                          Article will be automatically published at the scheduled time
                        </small>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <div className="content-header">
                      <label>Content</label>
                      <button
                        type="button"
                        className="ai-button"
                        onClick={generateAIContent}
                        disabled={generatingContent || !newArticle.title}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <Sparkles size={16} />
                        {generatingContent ? 'Generating...' : 'Generate with AI'}
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
