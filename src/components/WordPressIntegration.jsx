import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Settings, 
  Globe, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Trash2,
  Edit,
  Upload,
  RefreshCw,
  ExternalLink,
  BarChart3
} from 'lucide-react'
import { apiClient } from '../api/client'

function WordPressIntegration() {
  const [integrations, setIntegrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingIntegration, setEditingIntegration] = useState(null)
  const [testingConnection, setTestingConnection] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    siteUrl: '',
    username: '',
    applicationPassword: '',
    settings: {
      defaultStatus: 'draft',
      autoPublish: false,
      includeBacklink: true
    }
  })

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    try {
      const response = await apiClient.get('/wordpress/integrations')
      setIntegrations(response.data.integrations)
    } catch (error) {
      console.error('Error fetching integrations:', error)
      setError('Failed to load WordPress integrations')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      if (editingIntegration) {
        const response = await apiClient.put(
          `/wordpress/integrations/${editingIntegration._id}`,
          formData
        )
        setSuccess('WordPress integration updated successfully!')
      } else {
        const response = await apiClient.post('/wordpress/integrations', formData)
        setSuccess('WordPress integration created successfully!')
      }

      await fetchIntegrations()
      resetForm()
    } catch (error) {
      console.error('Error saving integration:', error)
      setError(error.response?.data?.error || 'Failed to save WordPress integration')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      siteUrl: '',
      username: '',
      applicationPassword: '',
      settings: {
        defaultStatus: 'draft',
        autoPublish: false,
        includeBacklink: true
      }
    })
    setShowAddForm(false)
    setEditingIntegration(null)
  }

  const handleEdit = (integration) => {
    setFormData({
      name: integration.name,
      siteUrl: integration.siteUrl,
      username: integration.username,
      applicationPassword: '', // Don't pre-fill password for security
      settings: integration.settings
    })
    setEditingIntegration(integration)
    setShowAddForm(true)
  }

  const handleDelete = async (integrationId) => {
    if (!window.confirm('Are you sure you want to delete this WordPress integration?')) {
      return
    }

    try {
      await apiClient.delete(`/wordpress/integrations/${integrationId}`)
      setSuccess('WordPress integration deleted successfully!')
      await fetchIntegrations()
    } catch (error) {
      console.error('Error deleting integration:', error)
      setError('Failed to delete WordPress integration')
    }
  }

  const testConnection = async (integrationId) => {
    setTestingConnection(integrationId)
    setError('')

    try {
      const response = await apiClient.post(`/wordpress/integrations/${integrationId}/test`)
      
      if (response.data.success) {
        setSuccess('WordPress connection test successful!')
      } else {
        setError(`Connection test failed: ${response.data.message}`)
      }

      await fetchIntegrations()
    } catch (error) {
      console.error('Error testing connection:', error)
      setError('Failed to test WordPress connection')
    } finally {
      setTestingConnection(null)
    }
  }

  const getStatusIcon = (integration) => {
    if (!integration.lastTestResult) {
      return <AlertCircle className="w-5 h-5 text-yellow-500" />
    }
    
    return integration.lastTestResult.success 
      ? <CheckCircle className="w-5 h-5 text-green-500" />
      : <XCircle className="w-5 h-5 text-red-500" />
  }

  const getStatusText = (integration) => {
    if (!integration.lastTestResult) {
      return 'Not tested'
    }
    
    return integration.lastTestResult.success ? 'Connected' : 'Connection failed'
  }

  return (
    <div className="wordpress-integration">
      <div className="integration-header">
        <div>
          <h2>WordPress Integration</h2>
          <p>Connect your WordPress sites to automatically publish articles and campaigns</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="add-integration-btn"
        >
          <Plus size={20} />
          Add WordPress Site
        </button>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <motion.div
          className="integration-form-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="integration-form-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="form-header">
              <h3>{editingIntegration ? 'Edit' : 'Add'} WordPress Integration</h3>
              <button onClick={resetForm} className="close-btn">×</button>
            </div>

            <form onSubmit={handleSubmit} className="integration-form">
              <div className="form-group">
                <label>Integration Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="My WordPress Site"
                  required
                />
              </div>

              <div className="form-group">
                <label>WordPress Site URL *</label>
                <input
                  type="url"
                  value={formData.siteUrl}
                  onChange={(e) => setFormData({...formData, siteUrl: e.target.value})}
                  placeholder="https://yoursite.com"
                  required
                />
                <small>Enter your WordPress site URL (including https://)</small>
              </div>

              <div className="form-group">
                <label>WordPress Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  placeholder="your-username"
                  required
                />
              </div>

              <div className="form-group">
                <label>Application Password *</label>
                <input
                  type="password"
                  value={formData.applicationPassword}
                  onChange={(e) => setFormData({...formData, applicationPassword: e.target.value})}
                  placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                  required={!editingIntegration}
                />
                <small>
                  Generate an application password in WordPress: Users → Profile → Application Passwords
                </small>
              </div>

              <div className="form-section">
                <h4>Default Settings</h4>
                
                <div className="form-group">
                  <label>Default Post Status</label>
                  <select
                    value={formData.settings.defaultStatus}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: {...formData.settings, defaultStatus: e.target.value}
                    })}
                  >
                    <option value="draft">Draft</option>
                    <option value="publish">Publish</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.settings.autoPublish}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: {...formData.settings, autoPublish: e.target.checked}
                      })}
                    />
                    <span>Auto-publish articles when generated</span>
                  </label>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.settings.includeBacklink}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: {...formData.settings, includeBacklink: e.target.checked}
                      })}
                    />
                    <span>Include "Generated by SUBSTATE" backlink</span>
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {editingIntegration ? 'Update' : 'Create'} Integration
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Integrations List */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading WordPress integrations...</p>
        </div>
      ) : integrations.length === 0 ? (
        <div className="empty-state">
          <Globe size={48} />
          <h3>No WordPress Integrations</h3>
          <p>Connect your WordPress sites to start automatically publishing your articles</p>
          <button onClick={() => setShowAddForm(true)} className="primary-btn">
            <Plus size={20} />
            Add Your First WordPress Site
          </button>
        </div>
      ) : (
        <div className="integrations-grid">
          {integrations.map((integration) => (
            <motion.div
              key={integration._id}
              className={`integration-card ${integration.isDefault ? 'default' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="card-header">
                <div className="site-info">
                  <div className="site-icon">
                    <Globe size={24} />
                  </div>
                  <div>
                    <h3>{integration.name}</h3>
                    <p>{integration.siteUrl}</p>
                  </div>
                </div>
                <div className="card-actions">
                  <button
                    onClick={() => testConnection(integration._id)}
                    disabled={testingConnection === integration._id}
                    className="test-btn"
                    title="Test Connection"
                  >
                    {testingConnection === integration._id ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(integration)}
                    className="edit-btn"
                    title="Edit Integration"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(integration._id)}
                    className="delete-btn"
                    title="Delete Integration"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="card-status">
                <div className="status-indicator">
                  {getStatusIcon(integration)}
                  <span>{getStatusText(integration)}</span>
                </div>
                {integration.isDefault && (
                  <span className="default-badge">Default</span>
                )}
              </div>

              <div className="card-stats">
                <div className="stat">
                  <span className="stat-value">{integration.stats.totalPosts}</span>
                  <span className="stat-label">Total Posts</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{integration.stats.successfulPosts}</span>
                  <span className="stat-label">Successful</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{integration.stats.failedPosts}</span>
                  <span className="stat-label">Failed</span>
                </div>
              </div>

              <div className="card-settings">
                <div className="setting">
                  <span>Default Status:</span>
                  <span className="setting-value">{integration.settings.defaultStatus}</span>
                </div>
                <div className="setting">
                  <span>Auto Publish:</span>
                  <span className="setting-value">
                    {integration.settings.autoPublish ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              {integration.lastTestResult && !integration.lastTestResult.success && (
                <div className="error-details">
                  <AlertCircle size={14} />
                  <span>{integration.lastTestResult.message}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <style jsx>{`
        .wordpress-integration {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .integration-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          gap: 24px;
        }

        .integration-header h2 {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 8px 0;
        }

        .integration-header p {
          color: #6b7280;
          margin: 0;
        }

        .add-integration-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .add-integration-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
        }

        .error-message, .success-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          font-weight: 500;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
        }

        .success-message {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        }

        .integration-form-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .integration-form-modal {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 24px 0 24px;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 24px;
        }

        .form-header h3 {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
        }

        .integration-form {
          padding: 0 24px 24px 24px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s ease;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #f97316;
        }

        .form-group small {
          display: block;
          margin-top: 4px;
          font-size: 12px;
          color: #6b7280;
        }

        .form-section {
          margin: 32px 0;
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .form-section h4 {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 16px 0;
        }

        .checkbox-group {
          margin-bottom: 16px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 500;
        }

        .checkbox-label input[type="checkbox"] {
          width: auto;
          margin: 0;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 32px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .cancel-btn, .save-btn {
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cancel-btn {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .cancel-btn:hover {
          background: #e5e7eb;
        }

        .save-btn {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          color: white;
          border: none;
        }

        .save-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #f97316;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .empty-state svg {
          margin-bottom: 16px;
          color: #d1d5db;
        }

        .empty-state h3 {
          font-size: 18px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 8px 0;
        }

        .empty-state p {
          margin: 0 0 24px 0;
        }

        .primary-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
        }

        .integrations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 24px;
        }

        .integration-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          padding: 24px;
          transition: all 0.2s ease;
        }

        .integration-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .integration-card.default {
          border-color: #f97316;
          background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .site-info {
          display: flex;
          gap: 12px;
          flex: 1;
        }

        .site-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .site-info h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 4px 0;
        }

        .site-info p {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .card-actions {
          display: flex;
          gap: 8px;
        }

        .test-btn, .edit-btn, .delete-btn {
          width: 32px;
          height: 32px;
          border: 1px solid #e5e7eb;
          background: white;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .test-btn:hover {
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .edit-btn:hover {
          border-color: #f97316;
          color: #f97316;
        }

        .delete-btn:hover {
          border-color: #ef4444;
          color: #ef4444;
        }

        .card-status {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
        }

        .default-badge {
          background: #f97316;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .card-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 16px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .stat {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
        }

        .stat-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .card-settings {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .setting {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
        }

        .setting-value {
          font-weight: 500;
          color: #1f2937;
          text-transform: capitalize;
        }

        .error-details {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          color: #dc2626;
          font-size: 12px;
        }

        @media (max-width: 768px) {
          .wordpress-integration {
            padding: 16px;
          }

          .integration-header {
            flex-direction: column;
            align-items: stretch;
          }

          .integrations-grid {
            grid-template-columns: 1fr;
          }

          .integration-form-modal {
            margin: 20px;
            max-height: calc(100vh - 40px);
          }

          .card-header {
            flex-direction: column;
            gap: 16px;
          }

          .card-actions {
            align-self: flex-end;
          }
        }
      `}</style>
    </div>
  )
}

export default WordPressIntegration