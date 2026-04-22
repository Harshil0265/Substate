import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Eye, Heart, Share2, MessageSquare, AlertCircle, Loader2 } from 'lucide-react'
import { apiClient } from '../api/client'

function ArticleAnalytics({ articleId }) {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAnalytics()
  }, [articleId])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/articles/${articleId}/analytics`)
      setAnalytics(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        background: '#fee2e2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        color: '#991b1b'
      }}>
        <AlertCircle size={20} />
        {error}
      </div>
    )
  }

  if (!analytics) return null

  const { performance, seo, quality, wordpress } = analytics.analytics

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Performance Metrics */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Performance Metrics</h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px'
        }}>
          <MetricCard
            icon={<Eye size={20} />}
            label="Total Views"
            value={performance.totalViews}
            color="#3b82f6"
          />
          <MetricCard
            icon={<Eye size={20} />}
            label="Unique Visitors"
            value={performance.uniqueVisitors}
            color="#8b5cf6"
          />
          <MetricCard
            icon={<Heart size={20} />}
            label="Likes"
            value={performance.likes}
            color="#ef4444"
          />
          <MetricCard
            icon={<Share2 size={20} />}
            label="Shares"
            value={performance.shares}
            color="#10b981"
          />
          <MetricCard
            icon={<MessageSquare size={20} />}
            label="Comments"
            value={performance.comments}
            color="#f59e0b"
          />
          <MetricCard
            icon={<TrendingUp size={20} />}
            label="Conversions"
            value={performance.conversions}
            color="#F97316"
          />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Avg Time on Page</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {performance.avgTimeOnPage}s
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Bounce Rate</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {performance.bounceRate.toFixed(1)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Scroll Depth</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {performance.scrollDepth.toFixed(1)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Conversion Rate</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {performance.conversionRate.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* SEO Analysis */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>SEO Analysis</h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div style={{
            padding: '16px',
            background: '#f9fafb',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>SEO Score</div>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: seo.score >= 70 ? '#10b981' : seo.score >= 50 ? '#f59e0b' : '#ef4444'
            }}>
              {seo.score}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
              {seo.score >= 70 ? 'Excellent' : seo.score >= 50 ? 'Good' : 'Needs Improvement'}
            </div>
          </div>

          <div style={{
            padding: '16px',
            background: '#f9fafb',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>
              Focus Keyword
            </div>
            <div style={{ fontSize: '14px', color: '#111827', marginBottom: '12px' }}>
              {seo.focusKeyword || 'Not set'}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {seo.metaDescription ? `${seo.metaDescription.length}/160 chars` : 'No meta description'}
            </div>
          </div>
        </div>

        {seo.recommendations && seo.recommendations.length > 0 && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: '8px',
            padding: '12px 16px'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '8px', color: '#92400e' }}>
              SEO Recommendations
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#92400e', fontSize: '13px' }}>
              {seo.recommendations.map((rec, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Quality Metrics */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Content Quality</h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px'
        }}>
          <QualityCard
            label="Overall Score"
            value={quality.overallScore}
            color="#F97316"
          />
          <QualityCard
            label="Readability"
            value={quality.readability}
            color="#3b82f6"
          />
          <QualityCard
            label="Originality"
            value={quality.originality}
            color="#8b5cf6"
          />
          <QualityCard
            label="Engagement"
            value={quality.engagement}
            color="#10b981"
          />
        </div>

        {quality.issues && quality.issues.length > 0 && (
          <div style={{
            marginTop: '20px',
            padding: '12px 16px',
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#991b1b',
            fontSize: '13px'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '8px' }}>Issues Found</div>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {quality.issues.map((issue, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* WordPress Sync Status */}
      {wordpress && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>WordPress Status</h3>

          {wordpress.synced ? (
            <div style={{
              padding: '16px',
              background: '#f0fdf4',
              border: '1px solid #dcfce7',
              borderRadius: '8px',
              color: '#166534'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '8px' }}>✓ Synced to WordPress</div>
              <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                Post ID: {wordpress.postId}
              </div>
              <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                Status: {wordpress.status}
              </div>
              <div style={{ fontSize: '12px', color: '#15803d' }}>
                Last synced: {new Date(wordpress.lastSyncedAt).toLocaleDateString()}
              </div>
              {wordpress.url && (
                <a
                  href={wordpress.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    marginTop: '12px',
                    color: '#15803d',
                    textDecoration: 'underline',
                    fontSize: '13px'
                  }}
                >
                  View on WordPress →
                </a>
              )}
            </div>
          ) : (
            <div style={{
              padding: '16px',
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              color: '#6b7280'
            }}>
              Not synced to WordPress yet
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MetricCard({ icon, label, value, color }) {
  return (
    <div style={{
      padding: '16px',
      background: '#f9fafb',
      borderRadius: '8px',
      textAlign: 'center',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '6px',
        background: `${color}20`,
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 8px'
      }}>
        {icon}
      </div>
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>{value}</div>
    </div>
  )
}

function QualityCard({ label, value, color }) {
  return (
    <div style={{
      padding: '16px',
      background: '#f9fafb',
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>{label}</div>
      <div style={{
        fontSize: '24px',
        fontWeight: '700',
        color: value >= 70 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444',
        marginBottom: '8px'
      }}>
        {value}
      </div>
      <div style={{
        height: '4px',
        background: '#e5e7eb',
        borderRadius: '2px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${value}%`,
          background: value >= 70 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444',
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  )
}

export default ArticleAnalytics
