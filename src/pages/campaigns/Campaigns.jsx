import { Helmet } from 'react-helmet-async'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { apiClient } from '../../api/client'
import { useAuthStore } from '../../store/authStore'

function Campaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(null) // Track which campaign is being updated
  const [showCreateModal, setShowCreateModal] = useState(false)
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
        <div className="dashboard-container">
          <div className="dashboard-header">
            <div>
              <h1>Campaigns</h1>
              <p>Create and manage your marketing campaigns</p>
            </div>
            <button 
              className="primary-button"
              onClick={() => setShowCreateModal(true)}
            >
              + Create Campaign
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
              <p>Loading campaigns...</p>
            </div>
          ) : (
            <div className="campaigns-grid">
              {campaigns.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <h3>No campaigns yet</h3>
                  <p>Create your first campaign to start tracking performance</p>
                  <button 
                    className="primary-button"
                    onClick={() => setShowCreateModal(true)}
                  >
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
                  >
                    <div className="campaign-header">
                      <h3>{campaign.title}</h3>
                      <div 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(campaign.status) }}
                      >
                        {campaign.status}
                      </div>
                    </div>
                    
                    <p className="campaign-description">{campaign.description}</p>
                    
                    <div className="campaign-metrics">
                      <div className="metric">
                        <span className="metric-label">Type</span>
                        <span className="metric-value">{campaign.campaignType}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Target Audience</span>
                        <span className="metric-value">{campaign.targetAudience}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Articles Generated</span>
                        <span className="metric-value">{campaign.articlesGenerated || 0}</span>
                      </div>
                    </div>

                    <div className="campaign-actions">
                      <select
                        value={campaign.status}
                        onChange={(e) => handleStatusChange(campaign._id, e.target.value)}
                        className="status-select"
                        disabled={updatingStatus === campaign._id}
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="RUNNING">Running</option>
                        <option value="PAUSED">Paused</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                      {updatingStatus === campaign._id && (
                        <span className="updating-indicator">Updating...</span>
                      )}
                      <button className="secondary-button">View Details</button>
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
        </div>
      </DashboardLayout>
    </>
  )
}

export default Campaigns
