import { useState } from 'react'
import { Plus, Trash2, AlertCircle } from 'lucide-react'
import { apiClient } from '../api/client'

function ContentCampaignForm({ campaign, onUpdate }) {
  const [topics, setTopics] = useState(campaign?.campaignData?.content?.contentTopics || [])
  const [newTopic, setNewTopic] = useState('')
  const [contentTypes, setContentTypes] = useState(campaign?.campaignData?.content?.contentTypes || ['ARTICLE'])
  const [seoKeywords, setSeoKeywords] = useState(campaign?.campaignData?.content?.seoKeywords || [])
  const [newKeyword, setNewKeyword] = useState('')
  const [targetWordCount, setTargetWordCount] = useState(campaign?.campaignData?.content?.targetWordCount || 800)
  const [tone, setTone] = useState(campaign?.campaignData?.content?.tone || 'PROFESSIONAL')
  const [frequency, setFrequency] = useState(campaign?.campaignData?.content?.publishingSchedule?.frequency || 'WEEKLY')
  const [preferredTime, setPreferredTime] = useState(campaign?.campaignData?.content?.publishingSchedule?.preferredTime || '09:00')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const contentTypeOptions = ['BLOG_POST', 'ARTICLE', 'GUIDE', 'TUTORIAL', 'NEWS', 'REVIEW']
  const toneOptions = ['PROFESSIONAL', 'CASUAL', 'FRIENDLY', 'AUTHORITATIVE', 'CONVERSATIONAL']

  const handleAddTopic = () => {
    if (newTopic.trim()) {
      setTopics([...topics, newTopic.trim()])
      setNewTopic('')
    }
  }

  const handleRemoveTopic = (index) => {
    setTopics(topics.filter((_, i) => i !== index))
  }

  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      setSeoKeywords([...seoKeywords, newKeyword.trim()])
      setNewKeyword('')
    }
  }

  const handleRemoveKeyword = (index) => {
    setSeoKeywords(seoKeywords.filter((_, i) => i !== index))
  }

  const handleToggleContentType = (type) => {
    if (contentTypes.includes(type)) {
      setContentTypes(contentTypes.filter(t => t !== type))
    } else {
      setContentTypes([...contentTypes, type])
    }
  }

  const handleSave = async () => {
    if (!topics.length) {
      setError('Please add at least one content topic')
      return
    }

    try {
      setLoading(true)
      await apiClient.patch(`/campaigns/${campaign._id}/campaign-data`, {
        content: {
          contentTopics: topics,
          contentTypes,
          seoKeywords,
          targetWordCount,
          tone,
          publishingSchedule: {
            frequency,
            preferredTime,
            preferredDays: [1, 3, 5] // Mon, Wed, Fri
          }
        }
      })

      setSuccess('Content campaign settings saved successfully')
      onUpdate?.()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save campaign settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '12px 16px',
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
          color: '#166534'
        }}>
          ✓ {success}
        </div>
      )}

      {/* Content Topics */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Content Topics</h3>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTopic()}
            placeholder="Add a content topic"
            style={{
              flex: 1,
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
          <button
            onClick={handleAddTopic}
            style={{
              padding: '10px 16px',
              background: '#F97316',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={18} />
            Add
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {topics.map((topic, index) => (
            <div
              key={index}
              style={{
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: '6px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px'
              }}
            >
              {topic}
              <button
                onClick={() => handleRemoveTopic(index)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ea580c',
                  cursor: 'pointer',
                  padding: '0'
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Content Types */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Content Types</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          {contentTypeOptions.map(type => (
            <label
              key={type}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                border: contentTypes.includes(type) ? '2px solid #F97316' : '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                background: contentTypes.includes(type) ? '#fff7ed' : '#ffffff'
              }}
            >
              <input
                type="checkbox"
                checked={contentTypes.includes(type)}
                onChange={() => handleToggleContentType(type)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* SEO Keywords */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>SEO Keywords</h3>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
            placeholder="Add SEO keyword"
            style={{
              flex: 1,
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
          <button
            onClick={handleAddKeyword}
            style={{
              padding: '10px 16px',
              background: '#F97316',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={18} />
            Add
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {seoKeywords.map((keyword, index) => (
            <div
              key={index}
              style={{
                background: '#dbeafe',
                border: '1px solid #bfdbfe',
                borderRadius: '6px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px'
              }}
            >
              {keyword}
              <button
                onClick={() => handleRemoveKeyword(index)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  padding: '0'
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Content Settings */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Content Settings</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
              Target Word Count
            </label>
            <input
              type="number"
              value={targetWordCount}
              onChange={(e) => setTargetWordCount(parseInt(e.target.value))}
              min="100"
              max="5000"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
              Tone
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              {toneOptions.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
              Publishing Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="BI_WEEKLY">Bi-Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
              Preferred Time
            </label>
            <input
              type="time"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={loading}
        style={{
          padding: '12px 16px',
          background: '#F97316',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          fontSize: '16px'
        }}
      >
        {loading ? 'Saving...' : 'Save Content Campaign Settings'}
      </button>
    </div>
  )
}

export default ContentCampaignForm
