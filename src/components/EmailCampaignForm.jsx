import { useState } from 'react'
import { Upload, Mail, Send, AlertCircle } from 'lucide-react'
import { apiClient } from '../api/client'

function EmailCampaignForm({ campaign, onUpdate, onSend }) {
  const [emailList, setEmailList] = useState(campaign?.campaignData?.email?.emailList || [])
  const [csvFile, setCsvFile] = useState(null)
  const [subject, setSubject] = useState(campaign?.campaignData?.email?.emailTemplate?.subject || '')
  const [htmlContent, setHtmlContent] = useState(campaign?.campaignData?.email?.emailTemplate?.htmlContent || '')
  const [fromName, setFromName] = useState(campaign?.campaignData?.email?.senderInfo?.fromName || 'SUBSTATE')
  const [fromEmail, setFromEmail] = useState(campaign?.campaignData?.email?.senderInfo?.fromEmail || '')
  const [throttleRate, setThrottleRate] = useState(campaign?.campaignData?.email?.deliverySettings?.throttleRate || 100)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setLoading(true)
      const text = await file.text()
      
      const response = await apiClient.post(`/campaigns/${campaign._id}/email/import-list`, {
        csvData: text
      })

      setSuccess(`Imported ${response.data.imported} email addresses`)
      setEmailList(response.data.totalRecipients)
      
      if (response.data.errors.length > 0) {
        setError(`${response.data.errors.length} rows had errors`)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to import CSV')
    } finally {
      setLoading(false)
    }
  }

  const handleAddEmail = (e) => {
    e.preventDefault()
    const email = e.target.email.value.trim()
    const name = e.target.name.value.trim()

    if (!email || !email.includes('@')) {
      setError('Invalid email address')
      return
    }

    setEmailList([...emailList, { email, name, tags: [], customFields: {} }])
    e.target.reset()
    setSuccess('Email added successfully')
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleRemoveEmail = (index) => {
    setEmailList(emailList.filter((_, i) => i !== index))
  }

  const handleSaveCampaignData = async () => {
    try {
      setLoading(true)
      await apiClient.patch(`/campaigns/${campaign._id}/campaign-data`, {
        email: {
          emailList,
          emailTemplate: {
            subject,
            htmlContent,
            previewText: htmlContent.substring(0, 100)
          },
          senderInfo: {
            fromName,
            fromEmail
          },
          deliverySettings: {
            throttleRate
          }
        }
      })

      setSuccess('Campaign data saved successfully')
      onUpdate?.()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save campaign data')
    } finally {
      setLoading(false)
    }
  }

  const handleSendCampaign = async () => {
    if (!emailList.length) {
      setError('No email recipients added')
      return
    }

    if (!subject || !htmlContent) {
      setError('Email subject and content are required')
      return
    }

    try {
      setLoading(true)
      const response = await apiClient.post(`/campaigns/${campaign._id}/email/send`)
      
      setSuccess(`Campaign sent to ${response.data.results.sent} recipients`)
      onSend?.(response.data)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send campaign')
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

      {/* Email Recipients Section */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Email Recipients</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
            Import from CSV
          </label>
          <div style={{
            border: '2px dashed #d1d5db',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              style={{ display: 'none' }}
              id="csv-upload"
            />
            <label htmlFor="csv-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Upload size={24} style={{ color: '#F97316' }} />
              <span style={{ fontWeight: '600' }}>Click to upload CSV</span>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>Format: email, name (optional)</span>
            </label>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
            Or add manually
          </label>
          <form onSubmit={handleAddEmail} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="email"
              name="email"
              placeholder="Email address"
              required
              style={{
                flex: 1,
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <input
              type="text"
              name="name"
              placeholder="Name (optional)"
              style={{
                flex: 1,
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '10px 16px',
                background: '#F97316',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Add
            </button>
          </form>
        </div>

        <div style={{
          background: '#f9fafb',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            Total Recipients: <strong>{emailList.length}</strong>
          </div>
          {emailList.length > 0 && (
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {emailList.map((recipient, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px',
                    background: 'white',
                    borderRadius: '4px',
                    marginBottom: '4px',
                    fontSize: '13px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600' }}>{recipient.email}</div>
                    {recipient.name && <div style={{ color: '#6b7280' }}>{recipient.name}</div>}
                  </div>
                  <button
                    onClick={() => handleRemoveEmail(index)}
                    style={{
                      background: '#fee2e2',
                      color: '#991b1b',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Email Template Section */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Email Template</h3>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
            From Name
          </label>
          <input
            type="text"
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
            placeholder="Your company name"
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

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
            From Email
          </label>
          <input
            type="email"
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            placeholder="noreply@yourcompany.com"
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

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
            Subject Line
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject (use {{name}} for personalization)"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
          <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
            Use {{'{name}'}} for recipient name, {{'{email}'}} for email
          </small>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
            Email Content (HTML)
          </label>
          <textarea
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            placeholder="Enter your email HTML content"
            rows="10"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'monospace',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
            Throttle Rate (emails/hour)
          </label>
          <input
            type="number"
            value={throttleRate}
            onChange={(e) => setThrottleRate(parseInt(e.target.value))}
            min="1"
            max="1000"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
          <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
            Limit emails sent per hour to avoid spam filters
          </small>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handleSaveCampaignData}
          disabled={loading}
          style={{
            flex: 1,
            padding: '12px 16px',
            background: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          Save Campaign Data
        </button>
        <button
          onClick={handleSendCampaign}
          disabled={loading || !emailList.length}
          style={{
            flex: 1,
            padding: '12px 16px',
            background: '#F97316',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: loading || !emailList.length ? 'not-allowed' : 'pointer',
            opacity: loading || !emailList.length ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Send size={18} />
          Send Campaign
        </button>
      </div>
    </div>
  )
}

export default EmailCampaignForm
