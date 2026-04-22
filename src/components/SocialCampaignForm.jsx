import { useState } from 'react'
import { Plus, Trash2, AlertCircle } from 'lucide-react'
import { apiClient } from '../api/client'

function SocialCampaignForm({ campaign, onUpdate }) {
  const [platforms, setPlatforms] = useState(campaign?.campaignData?.social?.platforms || [])
  const [postTypes, setPostTypes] = useState(campaign?.campaignData?.social?.postTypes || ['TEXT'])
  const [hashtags, setHashtags] = useState(campaign?.campaignData?.social?.hashtags || [])
  const [newHashtag, setNewHashtag] = useState('')
  const [frequency, setFrequency] = useState(campaign?.campaignData?.social?.postingSchedule?.frequency || 'DAILY')
  const [timesPerDay, setTimesPerDay] = useState(campaign?.campaignData?.social?.postingSchedule?.timesPerDay || 1)
  const [contentThemes, setContentThemes] = useState(campaign?.campaignData?.social?.contentThemes || [])
  const [newTheme, setNewTheme] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const platformOptions = ['FACEBOOK', 'TWITTER', 'LINKEDIN', 'INSTAGRAM', 'YOUTUBE']
  const postTypeOptions = ['TEXT', 'IMAGE', 'VIDEO', 'LINK', 'POLL', 'STORY']

  const handleTogglePlatform = (platform) => {
    if (platforms.find(p => p.platform === platform)) {
      setPlatforms(platforms.filter(p => p.platform !== platform))
    } else {
      setPlatforms([...platforms, { platform, accountId: '', isActive: true }])
    }
  }

  const handleTogglePostType = (type) => {
    if (postTypes.includes(type)) {
      setPostTypes(postTypes.filter(t => t !== type))
    } else {
      setPostTypes([...postTypes, type])
    }
  }

  const handleAddHashtag = () => {
    if (newHashtag.trim()) {
      const tag = newHashtag.trim().startsWith('#') ? newHashtag.trim() : `#${newHashtag.trim()}`
      setHashtags([...hashtags, tag])
      setNewHashtag('')
    }
  }

  const handleRemoveHashtag = (index) => {
    setHashtags(hashtags.filter((_, i) => i !== index))
  }

  const handleAddTheme = () => {
    if (newTheme.trim()) {
      setContentThemes([...contentThemes, newTheme.trim()])
      setNewTheme('')
    }
  }

  const handleRemoveTheme = (index) => {
    setContentThemes(contentThemes.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!platforms.length) {
      setError('Please select at least one social platform')
      return
    }

    try {
      setLoading(true)
      await apiClient.patch(`/campaigns/${campaign._id}/campaign-data`, {
        social: {
          platforms,
          postTypes,
          hashtags,
          postingSchedule: {
            frequency,
            timesPerDay,
            preferredTimes: ['09:00', '14:00', '18:00'].slice(0, timesPerDay)
          },
          contentThemes
        }
      })

      setSuccess('Social campaign settings saved successfully')
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

      {/* Social Platforms */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Social Platforms</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          {platformOptions.map(platform => (
            <label
              key={platform}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                border: platforms.find(p => p.platform === platform) ? '2px solid #F97316' : '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                background: platforms.find(p => p.platform === platform) ? '#fff7ed' : '#ffffff'
              }}
            >
              <input
                type="checkbox"
                checked={!!platforms.find(p => p.platform === platform)}
                onChange={() => handleTogglePlatform(platform)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{platform}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Post Types */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Post Types</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
          {postTypeOptions.map(type => (
            <label
              key={type}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                border: postTypes.includes(type) ? '2px solid #F97316' : '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                background: postTypes.includes(type) ? '#fff7ed' : '#ffffff'
              }}
            >
              <input
                type="checkbox"
                checked={postTypes.includes(type)}
                onChange={() => handleTogglePostType(type)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Hashtags */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Hashtags</h3>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            type="text"
            value={newHashtag}
            onChange={(e) => setNewHashtag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddHashtag()}
            placeholder="Add hashtag (with or without #)"
            style={{
              flex: 1,
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
          <button
            onClick={handleAddHashtag}
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
          {hashtags.map((tag, index) => (
            <div
              key={index}
              style={{
                background: '#e0e7ff',
                border: '1px solid #c7d2fe',
                borderRadius: '6px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px'
              }}
            >
              {tag}
              <button
                onClick={() => handleRemoveHashtag(index)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4f46e5',
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

      {/* Content Themes */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Content Themes</h3>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            type="text"
            value={newTheme}
            onChange={(e) => setNewTheme(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTheme()}
            placeholder="Add content theme"
            style={{
              flex: 1,
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
          <button
            onClick={handleAddTheme}
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
          {contentThemes.map((theme, index) => (
            <div
              key={index}
              style={{
                background: '#f0fdf4',
                border: '1px solid #dcfce7',
                borderRadius: '6px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px'
              }}
            >
              {theme}
              <button
                onClick={() => handleRemoveTheme(index)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#16a34a',
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

      {/* Posting Schedule */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Posting Schedule</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
              Frequency
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
              <option value="MULTIPLE_DAILY">Multiple Daily</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="BI_WEEKLY">Bi-Weekly</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
              Posts Per Day
            </label>
            <input
              type="number"
              value={timesPerDay}
              onChange={(e) => setTimesPerDay(Math.min(10, Math.max(1, parseInt(e.target.value))))}
              min="1"
              max="10"
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
        {loading ? 'Saving...' : 'Save Social Campaign Settings'}
      </button>
    </div>
  )
}

export default SocialCampaignForm
