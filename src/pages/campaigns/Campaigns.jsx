import { Helmet } from 'react-helmet-async'
import { useState, useEffect, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Plus, BarChart3, Globe, Eye, Loader2 } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { apiClient } from '../../api/client'
import { useAuthStore } from '../../store/authStore'

// Lazy load WordPress components
const WordPressPublisher = lazy(() => import('../../components/WordPressPublisher'))

function Campaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(null) // Track which campaign is being updated
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showWordPressModal, setShowWordPressModal] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    description: '',
    campaignType: 'CONTENT',
    targetAudience: 'ALL',
    startDate: '',
    endDate: '',
    status: 'DRAFT'
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
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
    console.log('Current user from auth store:', user)
    if (user?.id) {
      fetchCampaigns()
    } else {
      console.log('No user found, redirecting to login')
      setError('Please log in to view your campaigns')
      setLoading(false)
    }
  }, [user])

  const fetchCampaigns = async () => {
    try {
      console.log('Fetching campaigns for user:', user?.email, 'ID:', user?.id)
      const response = await apiClient.get('/campaigns')
      console.log('Campaigns response:', response.data)
      
      // Ensure we only show campaigns that belong to the current user
      const userCampaigns = response.data.campaigns || []
      console.log('User campaigns count:', userCampaigns.length)
      
      setCampaigns(userCampaigns)
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      if (error.response?.status === 401) {
        setError('Please log in again to view your campaigns')
      } else {
        setError('Failed to load campaigns')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validate dates
    const today = new Date().toISOString().split('T')[0]
    
    if (newCampaign.startDate && newCampaign.startDate < today) {
      setError('Start date cannot be in the past')
      return
    }
    
    if (newCampaign.endDate && newCampaign.startDate && newCampaign.endDate < newCampaign.startDate) {
      setError('End date cannot be before start date')
      return
    }

    try {
      setCreating(true)
      const response = await apiClient.post('/campaigns', newCampaign)
      
      // Add the new campaign to the list immediately
      setCampaigns([response.data.campaign, ...campaigns])
      
      // Refresh usage data
      await fetchUsageData()
      
      // Reset form
      setNewCampaign({
        title: '',
        description: '',
        campaignType: 'CONTENT',
        targetAudience: 'ALL',
        startDate: '',
        endDate: '',
        status: 'DRAFT'
      })
      
      // Close modal and show success
      setShowCreateModal(false)
      setSuccess('Campaign created successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
      
    } catch (error) {
      console.error('Campaign creation error:', error)
      setError(error.response?.data?.error || 'Failed to create campaign')
    } finally {
      setCreating(false)
    }
  }

  const handleStatusChange = async (campaignId, newStatus) => {
    try {
      setError('') // Clear any existing errors
      setUpdatingStatus(campaignId) // Show loading state for this campaign
      
      console.log('Updating campaign status:', { 
        campaignId, 
        newStatus, 
        currentUser: user?.email,
        currentUserId: user?.id 
      })
      
      const response = await apiClient.patch(`/campaigns/${campaignId}`, { status: newStatus })
      
      console.log('Status update response:', response.data)
      
      // Update the campaign in the local state with the response data
      setCampaigns(campaigns.map(campaign => 
        campaign._id === campaignId 
          ? { ...campaign, ...response.data }
          : campaign
      ))
      
      setSuccess(`Campaign status updated to ${newStatus}!`)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
      
    } catch (error) {
      console.error('Status update error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method,
        campaignId,
        currentUser: user?.email
      })
      
      let errorMessage = 'Failed to update campaign status'
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.response?.status === 404) {
        errorMessage = 'Campaign not found - it may have been deleted or you may not have access to it'
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to update this campaign'
      } else if (error.response?.status === 401) {
        errorMessage = 'Please log in again to continue'
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error - please check your connection and server status'
      }
      
      setError(errorMessage)
      
      // Clear error message after 5 seconds
      setTimeout(() => setError(''), 5000)
    } finally {
      setUpdatingStatus(null) // Clear loading state
    }
  }

  const handleBulkPublishToWordPress = (campaign) => {
    setSelectedCampaign(campaign)
    setShowWordPressModal(true)
  }

  const handleWordPressPublishSuccess = (result) => {
    setShowWordPressModal(false)
    setSelectedCampaign(null)
    // Refresh campaigns to show updated article counts
    fetchCampaigns()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'RUNNING': return '#10b981'
      case 'PAUSED': return '#f59e0b'
      case 'COMPLETED': return '#6b7280'
      case 'DRAFT': return '#3b82f6'
      case 'SCHEDULED': return '#8b5cf6'
      default: return '#6b7280'
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <>
      <Helmet>
        <title>Campaigns - SUBSTATE</title>
        <meta name="description" content="Manage and create marketing campaigns." />
      </Helmet>

      <DashboardLayout>
        <div className="dashboard-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
          <div className="dashboard-header" style={{ marginBottom: '28px' }}>
            <div>
              <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: '28px', fontWeight: '800', color: '#111827', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                Campaigns
              </h1>
              <p style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '15px', color: '#6b7280', marginBottom: '12px' }}>
                Create and manage your marketing campaigns
              </p>
              {usageData && (
                <div style={{ 
                  marginTop: '12px', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '8px 16px',
                  background: usageData.usage.campaigns >= usageData.limits.campaigns && usageData.limits.campaigns !== -1 ? '#fee2e2' : '#f0fdf4',
                  border: `1px solid ${usageData.usage.campaigns >= usageData.limits.campaigns && usageData.limits.campaigns !== -1 ? '#fecaca' : '#bbf7d0'}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: usageData.usage.campaigns >= usageData.limits.campaigns && usageData.limits.campaigns !== -1 ? '#991b1b' : '#166534',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  <BarChart3 size={16} />
                  <span>
                    {usageData.usage.campaigns} / {usageData.limits.campaigns === -1 ? '∞' : usageData.limits.campaigns} campaigns used
                  </span>
                </div>
              )}
            </div>
            <button 
              className="primary-button"
              onClick={() => {
                // Check if user has reached limit
                if (usageData && usageData.limits.campaigns !== -1 && usageData.usage.campaigns >= usageData.limits.campaigns) {
                  setError(`You've reached your campaign limit (${usageData.limits.campaigns}). Please upgrade your plan to create more campaigns.`)
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
                cursor: usageData && usageData.limits.campaigns !== -1 && usageData.usage.campaigns >= usageData.limits.campaigns ? 'not-allowed' : 'pointer',
                opacity: usageData && usageData.limits.campaigns !== -1 && usageData.usage.campaigns >= usageData.limits.campaigns ? 0.6 : 1,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(249, 115, 22, 0.25)'
              }}
            >
              <Plus size={20} />
              Create Campaign
            </button>
          </div>

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
              <p>Loading campaigns...</p>
            </div>
          ) : (
            <div className="campaigns-grid">
              {campaigns.length === 0 ? (
                <div className="empty-state">
                  <BarChart3 size={64} style={{ color: '#9ca3af', marginBottom: '16px' }} />
                  <h3>No campaigns yet</h3>
                  <p>Create your first campaign to start tracking performance</p>
                  <button 
                    className="primary-button"
                    onClick={() => {
                      if (usageData && usageData.limits.campaigns !== -1 && usageData.usage.campaigns >= usageData.limits.campaigns) {
                        setError(`You've reached your campaign limit (${usageData.limits.campaigns}). Please upgrade your plan to create more campaigns.`)
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
                      opacity: usageData && usageData.limits.campaigns !== -1 && usageData.usage.campaigns >= usageData.limits.campaigns ? 0.6 : 1
                    }}
                  >
                    <Plus size={20} />
                    Create Your First Campaign
                  </button>
                </div>
              ) : (
                campaigns.map((campaign, index) => (
                  <motion.div
                    key={campaign._id}
                    className="campaign-card"
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
                    <div className="campaign-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                      <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0, flex: 1 }}>
                        {campaign.title}
                      </h3>
                      <div 
                        className="status-badge"
                        style={{ 
                          backgroundColor: getStatusColor(campaign.status),
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          fontFamily: 'Inter, sans-serif'
                        }}
                      >
                        {campaign.status}
                      </div>
                    </div>
                    
                    <p className="campaign-description" style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '14px', color: '#6b7280', marginBottom: '18px', lineHeight: '1.6' }}>
                      {campaign.description}
                    </p>
                    
                    <div className="campaign-metrics" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px', padding: '14px', background: '#f9fafb', borderRadius: '8px' }}>
                      <div className="metric" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="metric-label" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</span>
                        <span className="metric-value" style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '14px', color: '#111827', fontWeight: '600' }}>{campaign.campaignType}</span>
                      </div>
                      <div className="metric" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="metric-label" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target Audience</span>
                        <span className="metric-value" style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '14px', color: '#111827', fontWeight: '600' }}>{campaign.targetAudience}</span>
                      </div>
                      <div className="metric" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="metric-label" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Articles Generated</span>
                        <span className="metric-value" style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '14px', color: '#111827', fontWeight: '600' }}>{campaign.articlesGenerated || 0}</span>
                      </div>
                    </div>

                    <div className="campaign-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <select
                        value={campaign.status}
                        onChange={(e) => handleStatusChange(campaign._id, e.target.value)}
                        className="status-select"
                        disabled={updatingStatus === campaign._id}
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '13px',
                          fontWeight: '600',
                          padding: '8px 12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          background: '#ffffff',
                          color: '#374151',
                          cursor: 'pointer',
                          flex: '1',
                          minWidth: '120px'
                        }}
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="RUNNING">Running</option>
                        <option value="PAUSED">Paused</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                      {updatingStatus === campaign._id && (
                        <span className="updating-indicator" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#F97316', fontStyle: 'italic' }}>Updating...</span>
                      )}
                      <button 
                        className="wordpress-button"
                        onClick={() => handleBulkPublishToWordPress(campaign)}
                        title="Bulk publish all articles to WordPress"
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '13px',
                          fontWeight: '600',
                          padding: '8px 14px',
                          background: '#111827',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Globe size={16} />
                        Bulk Publish
                      </button>
                      <button 
                        className="secondary-button" 
                        onClick={() => window.location.href = `/dashboard/campaigns/${campaign._id}`}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '13px',
                          fontWeight: '600',
                          padding: '8px 14px',
                          background: '#f9fafb',
                          color: '#374151',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Eye size={16} />
                        View Dashboard
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Create Campaign Modal */}
          {showCreateModal && (
            <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Create New Campaign</h2>
                  <button 
                    className="close-button"
                    onClick={() => setShowCreateModal(false)}
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleCreateCampaign} className="campaign-form">
                  <div className="form-group">
                    <label>Campaign Title</label>
                    <input
                      type="text"
                      value={newCampaign.title}
                      onChange={(e) => setNewCampaign({...newCampaign, title: e.target.value})}
                      placeholder="Enter campaign title"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={newCampaign.description}
                      onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
                      placeholder="Describe your campaign"
                      rows="3"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Campaign Type</label>
                      <select
                        value={newCampaign.campaignType}
                        onChange={(e) => setNewCampaign({...newCampaign, campaignType: e.target.value})}
                        required
                      >
                        <option value="EMAIL">Email Campaign</option>
                        <option value="CONTENT">Content Campaign</option>
                        <option value="SOCIAL">Social Media</option>
                        <option value="MULTI_CHANNEL">Multi-Channel</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Target Audience</label>
                      <select
                        value={newCampaign.targetAudience}
                        onChange={(e) => setNewCampaign({...newCampaign, targetAudience: e.target.value})}
                        required
                      >
                        <option value="ALL">All Users</option>
                        <option value="PREMIUM">Premium Users</option>
                        <option value="TRIAL">Trial Users</option>
                        <option value="AT_RISK">At-Risk Users</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Start Date</label>
                      <input
                        type="date"
                        value={newCampaign.startDate}
                        onChange={(e) => setNewCampaign({...newCampaign, startDate: e.target.value})}
                        min={new Date().toISOString().split('T')[0]}
                        max="2030-12-31"
                      />
                      <small className="form-help">Campaign can only start today or in the future</small>
                    </div>

                    <div className="form-group">
                      <label>End Date</label>
                      <input
                        type="date"
                        value={newCampaign.endDate}
                        onChange={(e) => setNewCampaign({...newCampaign, endDate: e.target.value})}
                        min={newCampaign.startDate || new Date().toISOString().split('T')[0]}
                        max="2030-12-31"
                      />
                      <small className="form-help">End date must be after start date</small>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button 
                      type="button" 
                      className="secondary-button"
                      onClick={() => setShowCreateModal(false)}
                      disabled={creating}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="primary-button"
                      disabled={creating}
                    >
                      {creating ? (
                        <>
                          <span className="loading-spinner-small"></span>
                          Creating...
                        </>
                      ) : (
                        'Create Campaign'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* WordPress Publisher Modal */}
          {showWordPressModal && selectedCampaign && (
            <div className="modal-overlay" onClick={() => setShowWordPressModal(false)}>
              <div className="modal-content wordpress-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Bulk Publish Campaign to WordPress</h2>
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
                    campaign={selectedCampaign}
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

export default Campaigns
