import { Helmet } from 'react-helmet-async'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { apiClient } from '../../api/client'
import { useAuthStore } from '../../store/authStore'

function Campaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    budget: '',
    targetAudience: '',
    startDate: '',
    endDate: '',
    status: 'DRAFT'
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const response = await apiClient.get('/campaigns')
      setCampaigns(response.data.campaigns || [])
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      setError('Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const response = await apiClient.post('/campaigns', newCampaign)
      setCampaigns([response.data.campaign, ...campaigns])
      setNewCampaign({
        name: '',
        description: '',
        budget: '',
        targetAudience: '',
        startDate: '',
        endDate: '',
        status: 'DRAFT'
      })
      setShowCreateModal(false)
      setSuccess('Campaign created successfully!')
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create campaign')
    }
  }

  const handleStatusChange = async (campaignId, newStatus) => {
    try {
      await apiClient.patch(`/campaigns/${campaignId}`, { status: newStatus })
      setCampaigns(campaigns.map(campaign => 
        campaign._id === campaignId 
          ? { ...campaign, status: newStatus }
          : campaign
      ))
      setSuccess('Campaign status updated!')
    } catch (error) {
      setError('Failed to update campaign status')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return '#10b981'
      case 'PAUSED': return '#f59e0b'
      case 'COMPLETED': return '#6b7280'
      case 'DRAFT': return '#3b82f6'
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
                      <h3>{campaign.name}</h3>
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
                        <span className="metric-label">Budget</span>
                        <span className="metric-value">{formatCurrency(campaign.budget)}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Target Audience</span>
                        <span className="metric-value">{campaign.targetAudience}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Duration</span>
                        <span className="metric-value">
                          {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="campaign-actions">
                      <select
                        value={campaign.status}
                        onChange={(e) => handleStatusChange(campaign._id, e.target.value)}
                        className="status-select"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="ACTIVE">Active</option>
                        <option value="PAUSED">Paused</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
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
                    <label>Campaign Name</label>
                    <input
                      type="text"
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                      placeholder="Enter campaign name"
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
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Budget ($)</label>
                      <input
                        type="number"
                        value={newCampaign.budget}
                        onChange={(e) => setNewCampaign({...newCampaign, budget: e.target.value})}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Target Audience</label>
                      <input
                        type="text"
                        value={newCampaign.targetAudience}
                        onChange={(e) => setNewCampaign({...newCampaign, targetAudience: e.target.value})}
                        placeholder="e.g., Young Adults 18-25"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Start Date</label>
                      <input
                        type="date"
                        value={newCampaign.startDate}
                        onChange={(e) => setNewCampaign({...newCampaign, startDate: e.target.value})}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>End Date</label>
                      <input
                        type="date"
                        value={newCampaign.endDate}
                        onChange={(e) => setNewCampaign({...newCampaign, endDate: e.target.value})}
                        required
                      />
                    </div>
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
                      Create Campaign
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
