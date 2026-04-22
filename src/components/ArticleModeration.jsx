import { useState } from 'react'
import { AlertCircle, CheckCircle, XCircle, Flag, Loader2 } from 'lucide-react'
import { apiClient } from '../api/client'

function ArticleModeration({ article, onUpdate }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [notes, setNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const handleApprove = async () => {
    try {
      setLoading(true)
      const response = await apiClient.post(`/articles/${article._id}/review`, {
        action: 'approve',
        notes
      })

      setSuccess('Article approved successfully')
      onUpdate?.(response.data.article)
      setNotes('')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve article')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason')
      return
    }

    try {
      setLoading(true)
      const response = await apiClient.post(`/articles/${article._id}/review`, {
        action: 'reject',
        notes: rejectionReason
      })

      setSuccess('Article rejected')
      onUpdate?.(response.data.article)
      setRejectionReason('')
      setShowRejectForm(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject article')
    } finally {
      setLoading(false)
    }
  }

  const handleFlag = async () => {
    try {
      setLoading(true)
      const response = await apiClient.post(`/articles/${article._id}/review`, {
        action: 'flag',
        notes
      })

      setSuccess('Article flagged for review')
      onUpdate?.(response.data.article)
      setNotes('')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to flag article')
    } finally {
      setLoading(false)
    }
  }

  const moderation = article?.moderation || {}
  const violations = moderation.violations || []

  const getModerationColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return { bg: '#f0fdf4', border: '#dcfce7', text: '#166534', icon: '#10b981' }
      case 'REJECTED':
        return { bg: '#fee2e2', border: '#fecaca', text: '#991b1b', icon: '#ef4444' }
      case 'FLAGGED':
        return { bg: '#fef3c7', border: '#fcd34d', text: '#92400e', icon: '#f59e0b' }
      case 'UNDER_REVIEW':
        return { bg: '#dbeafe', border: '#bfdbfe', text: '#1e40af', icon: '#3b82f6' }
      default:
        return { bg: '#f9fafb', border: '#e5e7eb', text: '#6b7280', icon: '#9ca3af' }
    }
  }

  const colors = getModerationColor(moderation.status)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

      {/* Moderation Status */}
      <div style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: `${colors.icon}20`,
            color: colors.icon,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {moderation.status === 'APPROVED' && <CheckCircle size={24} />}
            {moderation.status === 'REJECTED' && <XCircle size={24} />}
            {moderation.status === 'FLAGGED' && <Flag size={24} />}
            {moderation.status === 'UNDER_REVIEW' && <AlertCircle size={24} />}
            {!moderation.status && <AlertCircle size={24} />}
          </div>
          <div>
            <div style={{ fontSize: '14px', color: colors.text, fontWeight: '600' }}>
              {moderation.status || 'PENDING'}
            </div>
            {moderation.reviewedAt && (
              <div style={{ fontSize: '12px', color: colors.text, opacity: 0.7 }}>
                Reviewed on {new Date(moderation.reviewedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {moderation.adminNotes && (
          <div style={{
            padding: '12px',
            background: 'rgba(255,255,255,0.5)',
            borderRadius: '6px',
            fontSize: '13px',
            color: colors.text
          }}>
            <strong>Admin Notes:</strong> {moderation.adminNotes}
          </div>
        )}

        {moderation.rejectionReason && (
          <div style={{
            padding: '12px',
            background: 'rgba(255,255,255,0.5)',
            borderRadius: '6px',
            fontSize: '13px',
            color: colors.text,
            marginTop: '12px'
          }}>
            <strong>Rejection Reason:</strong> {moderation.rejectionReason}
          </div>
        )}
      </div>

      {/* Risk Score */}
      {moderation.riskScore !== undefined && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600', marginBottom: '8px' }}>
              Risk Score
            </div>
            <div style={{
              fontSize: '28px',
              fontWeight: '700',
              color: moderation.riskScore >= 70 ? '#ef4444' : 
                     moderation.riskScore >= 40 ? '#f59e0b' : '#10b981'
            }}>
              {moderation.riskScore}
            </div>
          </div>
          <div style={{
            height: '8px',
            background: '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${moderation.riskScore}%`,
              background: moderation.riskScore >= 70 ? '#ef4444' : 
                         moderation.riskScore >= 40 ? '#f59e0b' : '#10b981',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}

      {/* Violations */}
      {violations.length > 0 && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#991b1b', fontSize: '14px', fontWeight: '600' }}>
            Content Violations ({violations.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {violations.map((violation, index) => (
              <div
                key={index}
                style={{
                  padding: '12px',
                  background: 'rgba(255,255,255,0.5)',
                  borderRadius: '6px',
                  borderLeft: `4px solid ${
                    violation.severity >= 4 ? '#ef4444' :
                    violation.severity >= 3 ? '#f59e0b' : '#fbbf24'
                  }`
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#991b1b', marginBottom: '4px' }}>
                  {violation.category}
                </div>
                <div style={{ fontSize: '12px', color: '#991b1b', marginBottom: '4px' }}>
                  {violation.description}
                </div>
                {violation.matches && violation.matches.length > 0 && (
                  <div style={{ fontSize: '11px', color: '#991b1b', opacity: 0.7 }}>
                    Matches: {violation.matches.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Moderation Actions */}
      {moderation.status !== 'APPROVED' && moderation.status !== 'REJECTED' && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600' }}>
            Moderation Actions
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Approve */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
                Approve Article
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
                rows="2"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '13px',
                  marginBottom: '8px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
              <button
                onClick={handleApprove}
                disabled={loading}
                style={{
                  padding: '10px 16px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={16} />}
                Approve
              </button>
            </div>

            {/* Reject */}
            <div>
              <button
                onClick={() => setShowRejectForm(!showRejectForm)}
                style={{
                  padding: '10px 16px',
                  background: '#ef4444',
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
                <XCircle size={16} />
                Reject
              </button>

              {showRejectForm && (
                <div style={{ marginTop: '12px', padding: '12px', background: '#fef2f2', borderRadius: '6px' }}>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Reason for rejection..."
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #fecaca',
                      borderRadius: '6px',
                      fontSize: '13px',
                      marginBottom: '8px',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleReject}
                      disabled={loading}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1
                      }}
                    >
                      Confirm Rejection
                    </button>
                    <button
                      onClick={() => setShowRejectForm(false)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: '#f3f4f6',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Flag */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
                Flag for Manual Review
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for flagging..."
                rows="2"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '13px',
                  marginBottom: '8px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
              <button
                onClick={handleFlag}
                disabled={loading}
                style={{
                  padding: '10px 16px',
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Flag size={16} />}
                Flag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ArticleModeration
