import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Upload, 
  Globe, 
  CheckCircle, 
  AlertCircle,
  Settings,
  RefreshCw,
  ExternalLink,
  Tag,
  Folder
} from 'lucide-react'
import { apiClient } from '../api/client'

function WordPressPublisher({ article, campaign, onPublishSuccess }) {
  const [integrations, setIntegrations] = useState([])
  const [selectedIntegration, setSelectedIntegration] = useState('')
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMetadata, setLoadingMetadata] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [publishOptions, setPublishOptions] = useState({
    status: 'draft',
    categories: [],
    tags: [],
    customTags: ''
  })

  useEffect(() => {
    fetchIntegrations()
  }, [])

  useEffect(() => {
    if (selectedIntegration) {
      fetchMetadata()
    }
  }, [selectedIntegration])

  const fetchIntegrations = async () => {
    try {
      const response = await apiClient.get('/wordpress/integrations')
      const activeIntegrations = response.data.integrations.filter(i => i.isActive)
      setIntegrations(activeIntegrations)
      
      // Auto-select default integration
      const defaultIntegration = activeIntegrations.find(i => i.isDefault)
      if (defaultIntegration) {
        setSelectedIntegration(defaultIntegration._id)
        setPublishOptions(prev => ({
          ...prev,
          status: defaultIntegration.settings.defaultStatus || 'draft',
          categories: defaultIntegration.settings.defaultCategories || [],
          tags: defaultIntegration.settings.defaultTags || []
        }))
      }
    } catch (error) {
      console.error('Error fetching integrations:', error)
      setError('Failed to load WordPress integrations')
    }
  }

  const fetchMetadata = async () => {
    setLoadingMetadata(true)
    try {
      const response = await apiClient.get(`/wordpress/integrations/${selectedIntegration}/metadata`)
      setCategories(response.data.categories || [])
      setTags(response.data.tags || [])
    } catch (error) {
      console.error('Error fetching metadata:', error)
      setError('Failed to load WordPress categories and tags')
    } finally {
      setLoadingMetadata(false)
    }
  }

  const handlePublish = async () => {
    if (!selectedIntegration) {
      setError('Please select a WordPress integration')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Prepare tags (combine selected tags with custom tags)
      const allTags = [...publishOptions.tags]
      if (publishOptions.customTags) {
        const customTagsArray = publishOptions.customTags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0)
        allTags.push(...customTagsArray)
      }

      // Add campaign name as tag if available
      if (campaign) {
        allTags.push(campaign.title)
      }

      const options = {
        status: publishOptions.status,
        categories: publishOptions.categories,
        tags: allTags
      }

      const response = await apiClient.post(
        `/wordpress/integrations/${selectedIntegration}/post-article/${article._id}`,
        { options }
      )

      if (response.data.success) {
        setSuccess(`Article published to WordPress successfully! Post ID: ${response.data.wordpressPost.id}`)
        if (onPublishSuccess) {
          onPublishSuccess(response.data.wordpressPost)
        }
      } else {
        setError(response.data.message || 'Failed to publish article')
      }
    } catch (error) {
      console.error('Error publishing article:', error)
      setError(error.response?.data?.error || 'Failed to publish article to WordPress')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkPublish = async () => {
    if (!selectedIntegration || !campaign) {
      setError('Campaign and WordPress integration are required for bulk publishing')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const allTags = [...publishOptions.tags]
      if (publishOptions.customTags) {
        const customTagsArray = publishOptions.customTags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0)
        allTags.push(...customTagsArray)
      }

      const options = {
        status: publishOptions.status,
        categories: publishOptions.categories,
        tags: allTags,
        batchSize: 3, // Publish 3 articles at a time
        delay: 3000 // 3 second delay between batches
      }

      const response = await apiClient.post(
        `/wordpress/integrations/${selectedIntegration}/post-campaign/${campaign._id}`,
        { options }
      )

      if (response.data.success) {
        const { summary } = response.data
        setSuccess(`Bulk publishing completed! ${summary.successful} successful, ${summary.failed} failed out of ${summary.total} articles`)
        if (onPublishSuccess) {
          onPublishSuccess(response.data)
        }
      } else {
        setError(response.data.message || 'Failed to bulk publish campaign')
      }
    } catch (error) {
      console.error('Error bulk publishing campaign:', error)
      setError(error.response?.data?.error || 'Failed to bulk publish campaign to WordPress')
    } finally {
      setLoading(false)
    }
  }

  const selectedIntegrationData = integrations.find(i => i._id === selectedIntegration)

  return (
    <div className="wordpress-publisher">
      <div className="publisher-header">
        <div className="header-icon">
          <Globe size={24} />
        </div>
        <div>
          <h3>Publish to WordPress</h3>
          <p>
            {article 
              ? `Publish "${article.title}" to your WordPress site`
              : `Bulk publish all articles from "${campaign?.title}" campaign`
            }
          </p>
        </div>
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

      <div className="publisher-form">
        {/* WordPress Integration Selection */}
        <div className="form-group">
          <label>WordPress Site</label>
          <select
            value={selectedIntegration}
            onChange={(e) => setSelectedIntegration(e.target.value)}
            disabled={loading}
          >
            <option value="">Select WordPress Site</option>
            {integrations.map(integration => (
              <option key={integration._id} value={integration._id}>
                {integration.name} ({integration.siteUrl})
                {integration.isDefault && ' - Default'}
              </option>
            ))}
          </select>
          {integrations.length === 0 && (
            <small className="error-text">
              No WordPress integrations found. Please add a WordPress site first.
            </small>
          )}
        </div>

        {selectedIntegration && (
          <>
            {/* Publish Status */}
            <div className="form-group">
              <label>Post Status</label>
              <select
                value={publishOptions.status}
                onChange={(e) => setPublishOptions({
                  ...publishOptions,
                  status: e.target.value
                })}
                disabled={loading}
              >
                <option value="draft">Draft</option>
                <option value="publish">Publish</option>
                <option value="private">Private</option>
              </select>
            </div>

            {/* Categories */}
            <div className="form-group">
              <label>
                <Folder size={16} />
                Categories
              </label>
              {loadingMetadata ? (
                <div className="loading-metadata">
                  <RefreshCw size={16} className="animate-spin" />
                  Loading categories...
                </div>
              ) : (
                <div className="checkbox-group">
                  {categories.length > 0 ? (
                    categories.map(category => (
                      <label key={category.id} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={publishOptions.categories.includes(category.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPublishOptions({
                                ...publishOptions,
                                categories: [...publishOptions.categories, category.id]
                              })
                            } else {
                              setPublishOptions({
                                ...publishOptions,
                                categories: publishOptions.categories.filter(id => id !== category.id)
                              })
                            }
                          }}
                          disabled={loading}
                        />
                        <span>{category.name} ({category.count})</span>
                      </label>
                    ))
                  ) : (
                    <small>No categories found</small>
                  )}
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="form-group">
              <label>
                <Tag size={16} />
                Tags
              </label>
              {loadingMetadata ? (
                <div className="loading-metadata">
                  <RefreshCw size={16} className="animate-spin" />
                  Loading tags...
                </div>
              ) : (
                <>
                  <div className="checkbox-group">
                    {tags.slice(0, 10).map(tag => (
                      <label key={tag.id} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={publishOptions.tags.includes(tag.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPublishOptions({
                                ...publishOptions,
                                tags: [...publishOptions.tags, tag.name]
                              })
                            } else {
                              setPublishOptions({
                                ...publishOptions,
                                tags: publishOptions.tags.filter(name => name !== tag.name)
                              })
                            }
                          }}
                          disabled={loading}
                        />
                        <span>{tag.name} ({tag.count})</span>
                      </label>
                    ))}
                  </div>
                  
                  <div className="custom-tags">
                    <label>Custom Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={publishOptions.customTags}
                      onChange={(e) => setPublishOptions({
                        ...publishOptions,
                        customTags: e.target.value
                      })}
                      placeholder="tag1, tag2, tag3"
                      disabled={loading}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Integration Info */}
            {selectedIntegrationData && (
              <div className="integration-info">
                <div className="info-header">
                  <Settings size={16} />
                  <span>Integration Settings</span>
                </div>
                <div className="info-details">
                  <div className="info-item">
                    <span>Site:</span>
                    <span>{selectedIntegrationData.siteUrl}</span>
                  </div>
                  <div className="info-item">
                    <span>Default Status:</span>
                    <span>{selectedIntegrationData.settings.defaultStatus}</span>
                  </div>
                  <div className="info-item">
                    <span>Auto Publish:</span>
                    <span>{selectedIntegrationData.settings.autoPublish ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Publish Actions */}
            <div className="publish-actions">
              {article ? (
                <button
                  onClick={handlePublish}
                  disabled={loading || !selectedIntegration}
                  className="publish-btn primary"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Publish Article
                    </>
                  )}
                </button>
              ) : campaign ? (
                <button
                  onClick={handleBulkPublish}
                  disabled={loading || !selectedIntegration}
                  className="publish-btn primary"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Publishing Campaign...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Bulk Publish Campaign
                    </>
                  )}
                </button>
              ) : null}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .wordpress-publisher {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          padding: 24px;
          max-width: 600px;
        }

        .publisher-header {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }

        .header-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .publisher-header h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 4px 0;
        }

        .publisher-header p {
          color: #6b7280;
          margin: 0;
          font-size: 14px;
        }

        .error-message, .success-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-weight: 500;
          font-size: 14px;
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

        .publisher-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .form-group select,
        .form-group input {
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s ease;
        }

        .form-group select:focus,
        .form-group input:focus {
          outline: none;
          border-color: #f97316;
        }

        .form-group select:disabled,
        .form-group input:disabled {
          background: #f9fafb;
          color: #6b7280;
          cursor: not-allowed;
        }

        .error-text {
          color: #dc2626;
          font-size: 12px;
        }

        .loading-metadata {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #6b7280;
          font-size: 14px;
          padding: 12px 0;
        }

        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 200px;
          overflow-y: auto;
          padding: 8px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          padding: 4px 0;
        }

        .checkbox-label:hover {
          background: #f9fafb;
          border-radius: 4px;
          padding: 4px 8px;
          margin: 0 -8px;
        }

        .checkbox-label input[type="checkbox"] {
          margin: 0;
          width: auto;
        }

        .custom-tags {
          margin-top: 12px;
        }

        .custom-tags label {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 6px;
        }

        .integration-info {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
        }

        .info-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 12px;
        }

        .info-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
        }

        .info-item span:first-child {
          color: #6b7280;
        }

        .info-item span:last-child {
          color: #1f2937;
          font-weight: 500;
        }

        .publish-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 8px;
        }

        .publish-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .publish-btn.primary {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          color: white;
        }

        .publish-btn.primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
        }

        .publish-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .wordpress-publisher {
            padding: 20px;
          }

          .publisher-header {
            flex-direction: column;
            gap: 12px;
          }

          .header-icon {
            align-self: flex-start;
          }

          .checkbox-group {
            max-height: 150px;
          }

          .publish-actions {
            justify-content: stretch;
          }

          .publish-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}

export default WordPressPublisher