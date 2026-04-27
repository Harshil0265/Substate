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

  const handleCreateCategory = async () => {
    const categoryName = publishOptions.newCategory?.trim()
    if (!categoryName) {
      console.log('❌ Category name is empty')
      setError('Please enter a category name')
      return
    }

    if (!selectedIntegration) {
      console.log('❌ No WordPress integration selected')
      setError('Please select a WordPress integration first')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      console.log('📁 Creating category:', categoryName)
      console.log('   Integration ID:', selectedIntegration)
      console.log('   API endpoint:', `/wordpress/integrations/${selectedIntegration}/create-category`)
      
      const response = await apiClient.post(
        `/wordpress/integrations/${selectedIntegration}/create-category`,
        { name: categoryName }
      )

      console.log('✅ API response:', response.data)
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create category')
      }
      
      const newCategory = response.data.category
      console.log('✅ Category created:', newCategory)

      // Add new category to the list
      setCategories([...categories, newCategory])

      // Auto-select the new category
      setPublishOptions({
        ...publishOptions,
        categories: [...publishOptions.categories, newCategory.id],
        newCategory: '' // Clear input
      })

      setSuccess(response.data.message || `Category "${categoryName}" created successfully!`)
      setTimeout(() => setSuccess(''), 5000)
    } catch (error) {
      console.error('❌ Error creating category:', error)
      console.error('   Error response:', error.response)
      console.error('   Error status:', error.response?.status)
      console.error('   Error data:', error.response?.data)
      
      let errorMessage = 'Failed to create category'
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.response?.status === 404) {
        errorMessage = 'WordPress integration not found. Please check your connection.'
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        errorMessage = 'Authentication failed. Please check your WordPress credentials.'
      } else if (error.response?.status === 503) {
        errorMessage = 'Could not connect to WordPress. Please check your site URL.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      setTimeout(() => setError(''), 8000)
    } finally {
      setLoading(false)
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

      // Remove duplicates and empty tags
      const uniqueTags = [...new Set(allTags)].filter(tag => tag && tag.trim())

      const options = {
        status: publishOptions.status,
        categories: publishOptions.categories,
        tags: uniqueTags // Send clean array of tag names
      }

      console.log('Publishing with options:', { ...options, tags: uniqueTags })

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
      
      // Provide more specific error messages
      let errorMessage = 'Failed to publish article to WordPress'
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }

      // Handle specific WordPress API errors
      if (errorMessage.includes('tags')) {
        errorMessage = 'Error processing tags. Please check your tag names and try again.'
      } else if (errorMessage.includes('categories')) {
        errorMessage = 'Error processing categories. Please check your category selection.'
      } else if (errorMessage.includes('401')) {
        errorMessage = 'WordPress authentication failed. Please check your credentials.'
      } else if (errorMessage.includes('403')) {
        errorMessage = 'Permission denied. Your WordPress user may not have publishing rights.'
      }

      setError(errorMessage)
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
                <>
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
                  
                  {/* Add New Category */}
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Create new category..."
                        value={publishOptions.newCategory || ''}
                        onChange={(e) => setPublishOptions({ ...publishOptions, newCategory: e.target.value })}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleCreateCategory()
                          }
                        }}
                        disabled={loading}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleCreateCategory}
                        disabled={loading || !publishOptions.newCategory?.trim()}
                        style={{
                          padding: '8px 16px',
                          background: publishOptions.newCategory?.trim() ? '#f97316' : '#f3f4f6',
                          color: publishOptions.newCategory?.trim() ? '#ffffff' : '#9ca3af',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: publishOptions.newCategory?.trim() ? 'pointer' : 'not-allowed',
                          whiteSpace: 'nowrap',
                          transition: 'background 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (publishOptions.newCategory?.trim()) {
                            e.target.style.background = '#ea580c'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (publishOptions.newCategory?.trim()) {
                            e.target.style.background = '#f97316'
                          }
                        }}
                      >
                        + Add
                      </button>
                    </div>
                    <small style={{ display: 'block', marginTop: '6px', color: '#6b7280', fontSize: '12px' }}>
                      Category will be created in WordPress and automatically selected
                    </small>
                  </div>
                </>
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
                <div className="tags-section">
                  {/* Existing WordPress Tags */}
                  {tags.length > 0 && (
                    <div className="existing-tags">
                      <div className="tags-header">
                        <span>Popular WordPress Tags</span>
                        <small>({tags.length} available)</small>
                      </div>
                      <div className="tags-grid">
                        {tags.slice(0, 12).map(tag => (
                          <label key={tag.id} className="tag-checkbox">
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
                            <span className="tag-name">{tag.name}</span>
                            <span className="tag-count">({tag.count})</span>
                          </label>
                        ))}
                      </div>
                      {tags.length > 12 && (
                        <div className="tags-overflow">
                          <small>+ {tags.length - 12} more tags available</small>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Custom Tags Input */}
                  <div className="custom-tags">
                    <label>Add Custom Tags</label>
                    <input
                      type="text"
                      value={publishOptions.customTags}
                      onChange={(e) => setPublishOptions({
                        ...publishOptions,
                        customTags: e.target.value
                      })}
                      placeholder="Enter tags separated by commas (e.g., marketing, seo, content)"
                      disabled={loading}
                    />
                    <small className="input-help">
                      Separate multiple tags with commas. These will be created if they don't exist.
                    </small>
                  </div>

                  {/* Selected Tags Preview */}
                  {(publishOptions.tags.length > 0 || publishOptions.customTags) && (
                    <div className="selected-tags-preview">
                      <div className="preview-header">Selected Tags:</div>
                      <div className="selected-tags">
                        {publishOptions.tags.map((tag, index) => (
                          <span key={index} className="selected-tag existing">
                            {tag}
                            <button
                              type="button"
                              onClick={() => setPublishOptions({
                                ...publishOptions,
                                tags: publishOptions.tags.filter(t => t !== tag)
                              })}
                              className="remove-tag"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        {publishOptions.customTags && publishOptions.customTags.split(',').map((tag, index) => {
                          const trimmedTag = tag.trim();
                          return trimmedTag ? (
                            <span key={`custom-${index}`} className="selected-tag custom">
                              {trimmedTag}
                              <small>(new)</small>
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* No Tags Available Message */}
                  {tags.length === 0 && (
                    <div className="no-tags-message">
                      <div className="no-tags-icon">🏷️</div>
                      <div className="no-tags-text">
                        <strong>No existing tags found</strong>
                        <p>You can create new tags using the custom tags field above.</p>
                      </div>
                    </div>
                  )}
                </div>
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

        .tags-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .existing-tags {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px;
          background: #fafafa;
        }

        .tags-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .tags-header small {
          font-weight: 400;
          color: #6b7280;
        }

        .tags-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 8px;
          max-height: 200px;
          overflow-y: auto;
        }

        .tag-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          transition: background-color 0.2s;
        }

        .tag-checkbox:hover {
          background: #f3f4f6;
        }

        .tag-checkbox input[type="checkbox"] {
          margin: 0;
          width: auto;
        }

        .tag-name {
          flex: 1;
          color: #374151;
        }

        .tag-count {
          color: #6b7280;
          font-size: 12px;
        }

        .tags-overflow {
          margin-top: 8px;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
        }

        .custom-tags {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px;
        }

        .custom-tags label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .custom-tags input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          box-sizing: border-box;
        }

        .input-help {
          display: block;
          margin-top: 6px;
          color: #6b7280;
          font-size: 12px;
          line-height: 1.4;
        }

        .selected-tags-preview {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px;
          background: #f9fafb;
        }

        .preview-header {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .selected-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .selected-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .selected-tag.existing {
          background: #dbeafe;
          color: #1e40af;
          border: 1px solid #bfdbfe;
        }

        .selected-tag.custom {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fcd34d;
        }

        .selected-tag small {
          font-size: 10px;
          opacity: 0.8;
        }

        .remove-tag {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          font-size: 14px;
          font-weight: bold;
          padding: 0;
          margin-left: 2px;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .remove-tag:hover {
          opacity: 1;
        }

        .no-tags-message {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #f9fafb;
        }

        .no-tags-icon {
          font-size: 24px;
        }

        .no-tags-text strong {
          display: block;
          color: #374151;
          margin-bottom: 4px;
        }

        .no-tags-text p {
          margin: 0;
          color: #6b7280;
          font-size: 13px;
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