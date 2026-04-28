import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  ArrowLeft, TrendingUp, Users, Eye, MousePointer, IndianRupee,
  Calendar, Clock, Target, BarChart3, Activity, Share2, MessageSquare,
  FileText, CheckCircle, AlertCircle, Loader2, Settings, Download,
  Play, Pause, RefreshCw, Trash2, Globe
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiClient } from '../../api/client';

// Add CSS animations
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slideIn {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

function CampaignDashboard() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [trackingDataUpdated, setTrackingDataUpdated] = useState(false);
  const [automationSettings, setAutomationSettings] = useState({
    autoScheduling: {
      enabled: false,
      frequency: 'WEEKLY',
      timeOfDay: '09:00',
      daysOfWeek: [1, 3, 5]
    },
    notifications: {
      milestones: { enabled: true },
      emailAlerts: {
        enabled: true,
        onStart: true,
        onComplete: true,
        onMilestone: true
      }
    }
  });

  useEffect(() => {
    if (campaignId) {
      fetchCampaignData();
    }
  }, [campaignId]);

  // Separate effect for auto-refresh to avoid dependency issues
  useEffect(() => {
    // Auto-refresh data every 30 seconds for EMAIL campaigns to show real-time tracking updates
    if (campaign?.campaignType === 'EMAIL' && campaign?.status === 'RUNNING') {
      const refreshInterval = setInterval(() => {
        // Use lightweight tracking stats endpoint for faster updates
        fetchTrackingStats();
      }, 30000); // Refresh every 30 seconds
      
      return () => {
        clearInterval(refreshInterval);
      };
    }
  }, [campaign?.campaignType, campaign?.status]);

  const fetchTrackingStats = async () => {
    try {
      const response = await apiClient.get(`/campaigns/${campaignId}/tracking-stats`);
      
      // Check if data actually changed
      const dataChanged = analytics && (
        analytics.engagement.opensCount !== response.data.opensCount ||
        analytics.engagement.clicksCount !== response.data.clicksCount
      );
      
      // Update only the tracking-related data in analytics
      if (analytics) {
        setAnalytics(prev => ({
          ...prev,
          engagement: {
            ...prev.engagement,
            opensCount: response.data.opensCount,
            clicksCount: response.data.clicksCount,
            conversionCount: response.data.conversionCount,
            emailsSent: response.data.emailsSent,
            openRate: response.data.openRate,
            clickRate: response.data.clickRate
          }
        }));
        
        // Update campaign status if changed
        if (campaign && campaign.status !== response.data.status) {
          setCampaign(prev => ({ ...prev, status: response.data.status }));
        }
        
        setLastUpdated(new Date());
        
        // Show visual feedback if data changed
        if (dataChanged) {
          setTrackingDataUpdated(true);
          setTimeout(() => setTrackingDataUpdated(false), 2000);
        }
      }
    } catch (error) {
      console.error('Failed to fetch tracking stats:', error);
      // Silently fail - don't show error to user for background updates
    }
  };

  const fetchCampaignData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const campaignRes = await apiClient.get(`/campaigns/${campaignId}`);
      setCampaign(campaignRes.data);
      
      if (campaignRes.data.autoScheduling) {
        setAutomationSettings(prev => ({
          ...prev,
          autoScheduling: campaignRes.data.autoScheduling
        }));
      }
      
      const [analyticsRes, articlesRes] = await Promise.all([
        apiClient.get(`/campaigns/${campaignId}/analytics`).catch(() => ({ 
          data: {
            campaign: { id: campaignId, progress: 0 },
            articles: { total: 0, published: 0, draft: 0, scheduled: 0 },
            performance: { totalViews: 0, uniqueVisitors: 0, avgTimeOnPage: 0, bounceRate: 0, engagementRate: 0, socialShares: 0 },
            roi: { investment: 0, revenue: 0, roiPercentage: 0, costPerClick: 0, costPerConversion: 0 },
            engagement: { emailsSent: 0, opensCount: 0, clicksCount: 0, conversionCount: 0, openRate: 0, clickRate: 0, conversionRate: 0 },
            abTesting: null,
            topArticles: []
          }
        })),
        apiClient.get(`/campaigns/${campaignId}/articles`).catch(() => ({ 
          data: { articles: [], pagination: { total: 0, page: 1, limit: 20, pages: 0 } }
        }))
      ]);
      
      setAnalytics(analyticsRes.data);
      setArticles(articlesRes.data.articles || []);
      setLastUpdated(new Date());

    } catch (error) {
      if (error.response?.status === 404) {
        setError('Campaign not found');
      } else if (error.response?.status === 403) {
        setError('Unauthorized access');
      } else {
        setError('Failed to load campaign data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await apiClient.patch(`/campaigns/${campaignId}`, { status: newStatus });
      setCampaign({ ...campaign, status: newStatus });
      setSuccess(`Campaign ${newStatus.toLowerCase()} successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to update campaign status');
    }
  };

  const handleBulkAction = async (action) => {
    try {
      let endpoint = '';
      let message = '';

      switch (action) {
        case 'publish':
          endpoint = `/campaigns/${campaignId}/bulk-update-status`;
          await apiClient.post(endpoint, { status: 'PUBLISHED' });
          message = 'All articles published successfully!';
          break;
        case 'draft':
          endpoint = `/campaigns/${campaignId}/bulk-update-status`;
          await apiClient.post(endpoint, { status: 'DRAFT' });
          message = 'All articles moved to draft!';
          break;
        case 'delete':
          if (!confirm('Are you sure you want to delete all articles?')) return;
          endpoint = `/campaigns/${campaignId}/bulk-delete`;
          await apiClient.post(endpoint);
          message = 'All articles deleted successfully!';
          break;
        case 'wordpress':
          endpoint = `/campaigns/${campaignId}/bulk-publish`;
          await apiClient.post(endpoint);
          message = 'Bulk WordPress publish initiated!';
          break;
      }

      setSuccess(message);
      setTimeout(() => setSuccess(''), 3000);
      fetchCampaignData();
    } catch (error) {
      setError('Failed to perform bulk action');
    }
  };

  const handleSaveAutomation = async () => {
    try {
      await apiClient.patch(`/campaigns/${campaignId}/automation`, automationSettings);
      setSuccess('Automation settings saved successfully!');
      setShowSettings(false);
      setTimeout(() => setSuccess(''), 3000);
      fetchCampaignData();
    } catch (error) {
      setError('Failed to save automation settings');
    }
  };

  const handleGenerateArticleNow = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🚀 Generating article now for campaign:', campaignId);
      
      const response = await apiClient.post(`/campaigns/${campaignId}/generate-article-now`);
      
      if (response.data.success) {
        setSuccess(`✅ Article "${response.data.article.title}" generated successfully! It will be published at the next scheduled time.`);
        setTimeout(() => setSuccess(''), 5000);
        
        // Refresh campaign data to show new article
        fetchCampaignData();
      } else {
        setError('Failed to generate article. Please try again.');
      }
    } catch (error) {
      console.error('Error generating article:', error);
      setError(error.response?.data?.error || 'Failed to generate article. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading-state">
          <Loader2 className="loading-spinner" size={40} />
          <p>Loading campaign dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!campaign || !analytics) {
    return (
      <DashboardLayout>
        <div className="error-state">
          <AlertCircle size={48} />
          <h3>{error || 'Campaign not found'}</h3>
          <button onClick={() => navigate('/dashboard/campaigns')} className="primary-button">
            <ArrowLeft size={18} />
            Back to Campaigns
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <Helmet>
        <title>{campaign.title} - Campaign Dashboard</title>
      </Helmet>

      <DashboardLayout>
        <div className="dashboard-container" style={{ 
          padding: '32px 40px', 
          maxWidth: '1600px', 
          margin: '0 auto',
          minHeight: 'calc(100vh - 80px)'
        }}>
          {/* Header */}
          <div className="dashboard-header" style={{ 
            marginBottom: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingBottom: '24px',
            borderBottom: '2px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flex: 1 }}>
              <button
                onClick={() => navigate('/dashboard/campaigns')}
                className="icon-button"
                style={{ 
                  padding: '12px',
                  background: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <ArrowLeft size={20} color="#374151" />
              </button>
              <div style={{ flex: 1 }}>
                <h1 style={{ 
                  fontFamily: 'Inter, sans-serif', 
                  fontSize: '32px', 
                  fontWeight: '800', 
                  color: '#111827', 
                  marginBottom: '8px',
                  letterSpacing: '-0.5px'
                }}>{campaign.title}</h1>
                <p style={{ 
                  fontFamily: 'Share Tech Mono, monospace', 
                  fontSize: '15px', 
                  color: '#6b7280',
                  lineHeight: '1.6',
                  maxWidth: '600px'
                }}>{campaign.description}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Show last updated time and refresh button for EMAIL campaigns */}
              {campaign.campaignType === 'EMAIL' && lastUpdated && (
                <>
                  <div style={{
                    fontFamily: 'Share Tech Mono, monospace',
                    fontSize: '12px',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Clock size={14} />
                    Updated: {lastUpdated.toLocaleTimeString()}
                    {trackingDataUpdated && (
                      <span style={{
                        marginLeft: '8px',
                        padding: '2px 8px',
                        background: '#10b981',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        animation: 'fadeIn 0.3s ease-in'
                      }}>
                        NEW DATA
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => fetchCampaignData()}
                    disabled={loading}
                    className="secondary-button"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '12px 20px',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      fontWeight: '600',
                      background: '#f9fafb',
                      color: '#374151',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    <RefreshCw size={18} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                    Refresh
                  </button>
                </>
              )}
              
              {/* Generate Article Now button - Only for CONTENT campaigns */}
              {campaign.campaignType !== 'EMAIL' && (
                <button
                  onClick={handleGenerateArticleNow}
                  disabled={loading}
                  className="secondary-button"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '12px 20px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  <FileText size={18} />
                  Generate Article Now
                </button>
              )}
              
              <button
                onClick={() => setShowSettings(true)}
                className="secondary-button"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '12px 20px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: '600',
                  background: '#f9fafb',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <Settings size={18} />
                Automation
              </button>
              {campaign.status === 'RUNNING' ? (
                <button
                  onClick={() => handleStatusChange('PAUSED')}
                  className="secondary-button"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '12px 20px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    fontWeight: '600',
                    background: '#fff7ed',
                    color: '#ea580c',
                    border: '1px solid #fed7aa',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <Pause size={18} />
                  Pause
                </button>
              ) : (
                <button
                  onClick={() => handleStatusChange('RUNNING')}
                  className="primary-button"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '12px 20px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(249, 115, 22, 0.25)'
                  }}
                >
                  <Play size={18} />
                  Start
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="error-message" style={{ 
              marginBottom: '24px',
              padding: '16px 20px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              color: '#991b1b',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: '500'
            }}>{error}</div>
          )}
          
          {success && (
            <div className="success-message" style={{ 
              marginBottom: '24px',
              padding: '16px 20px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '10px',
              color: '#166534',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: '500'
            }}>{success}</div>
          )}

          {/* Info Banner for Scheduled Articles */}
          {campaign.campaignType !== 'EMAIL' && (
            <div style={{ 
              marginBottom: '24px',
              padding: '18px 20px',
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              border: '1px solid #60a5fa',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#3b82f6',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <AlertCircle size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ 
                  margin: '0 0 6px 0',
                  color: '#1e40af',
                  fontSize: '15px',
                  fontWeight: '700',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Article Generation & Publishing
                </h4>
                <p style={{ 
                  margin: 0,
                  color: '#1e3a8a',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  fontFamily: 'Share Tech Mono, monospace'
                }}>
                  <strong>Automatic:</strong> New articles generate daily at midnight and publish at scheduled times (requires system running 24/7). 
                  <strong>Manual:</strong> Click "Generate Article Now" button above to create articles immediately. 
                  All articles are saved here for preview - you can manually publish anytime if system is offline.
                </p>
              </div>
            </div>
          )}

          {/* Campaign Status Bar */}
          <div style={{
            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
            borderRadius: '16px',
            padding: '32px',
            color: 'white',
            marginBottom: '32px',
            boxShadow: '0 8px 24px rgba(249, 115, 22, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '13px', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600', marginBottom: '8px' }}>Campaign Status</div>
                <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>{campaign.status}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600', marginBottom: '8px' }}>Progress</div>
                <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>
                  {analytics?.campaign?.progress || 0}%
                </div>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '12px', height: '12px', overflow: 'hidden' }}>
              <div style={{
                background: 'white',
                height: '100%',
                width: `${analytics?.campaign?.progress || 0}%`,
                transition: 'width 0.5s ease',
                borderRadius: '12px'
              }} />
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}>
            {campaign.campaignType === 'EMAIL' ? (
              // EMAIL Campaign Metrics
              <>
                <MetricCard
                  icon={<MessageSquare />}
                  label="Emails Sent"
                  value={analytics?.engagement?.emailsSent || 0}
                  color="#F97316"
                />
                <MetricCard
                  icon={<Eye />}
                  label="Emails Opened"
                  value={analytics?.engagement?.opensCount || 0}
                  color="#F97316"
                  highlight={trackingDataUpdated}
                />
                <MetricCard
                  icon={<MousePointer />}
                  label="Clicks"
                  value={analytics?.engagement?.clicksCount || 0}
                  color="#111827"
                  highlight={trackingDataUpdated}
                />
                <MetricCard
                  icon={<Activity />}
                  label="Open Rate"
                  value={`${parseFloat(analytics?.engagement?.openRate || 0).toFixed(1)}%`}
                  color="#111827"
                />
                <MetricCard
                  icon={<Target />}
                  label="Click Rate"
                  value={`${parseFloat(analytics?.engagement?.clickRate || 0).toFixed(1)}%`}
                  color="#111827"
                />
                <MetricCard
                  icon={<CheckCircle />}
                  label="Conversions"
                  value={analytics?.engagement?.conversionCount || 0}
                  color={parseFloat(analytics?.engagement?.conversionRate || 0) >= 5 ? '#10b981' : '#F97316'}
                />
              </>
            ) : (
              // ARTICLE/BLOG Campaign Metrics
              <>
                <MetricCard
                  icon={<FileText />}
                  label="Total Articles"
                  value={analytics?.articles?.total || 0}
                  color="#F97316"
                />
                <MetricCard
                  icon={<Eye />}
                  label="Total Views"
                  value={formatNumber(analytics?.performance?.totalViews || 0)}
                  color="#F97316"
                />
                <MetricCard
                  icon={<Activity />}
                  label="Engagement Rate"
                  value={`${parseFloat(analytics?.performance?.engagementRate || 0).toFixed(1)}%`}
                  color="#111827"
                />
                <MetricCard
                  icon={<IndianRupee />}
                  label="ROI"
                  value={`${parseFloat(analytics?.roi?.roiPercentage || 0).toFixed(1)}%`}
                  color={parseFloat(analytics?.roi?.roiPercentage || 0) >= 0 ? '#111827' : '#ef4444'}
                />
                <MetricCard
                  icon={<MousePointer />}
                  label="Click Rate"
                  value={`${parseFloat(analytics?.engagement?.clickRate || 0).toFixed(1)}%`}
                  color="#111827"
                />
                <MetricCard
                  icon={<Target />}
                  label="Conversions"
                  value={analytics?.engagement?.conversionCount || 0}
                  color="#F97316"
                />
              </>
            )}
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: campaign.campaignType === 'EMAIL' ? '2fr 1fr' : '1fr', gap: '24px', marginBottom: '32px' }}>
            {/* Performance Chart */}
            {campaign.campaignType === 'EMAIL' && (
              <div className="card" style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '14px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
              }}>
                <h3 style={{ 
                  marginBottom: '20px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#111827'
                }}>Email Performance</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Recipients</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#F97316' }}>
                      {analytics?.engagement?.emailsSent || 0}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Delivery Rate</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                      {analytics?.engagement?.emailsSent > 0 ? '100%' : '0%'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Avg. Open Rate</div>
                    <div style={{ fontSize: '20px', fontWeight: '600' }}>
                      {parseFloat(analytics?.engagement?.openRate || 0).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Conversion Rate</div>
                    <div style={{ fontSize: '20px', fontWeight: '600' }}>
                      {parseFloat(analytics?.engagement?.conversionRate || 0).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Article Status - Only for non-EMAIL campaigns */}
            {campaign.campaignType !== 'EMAIL' && (
              <div className="card" style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '14px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
              }}>
                <h3 style={{ 
                  marginBottom: '20px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#111827'
                }}>Article Status</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <StatusBar 
                    label="Published" 
                    count={analytics?.articles?.published || 0} 
                    total={analytics?.articles?.total || 0} 
                    color="#F97316" 
                  />
                  <StatusBar 
                    label="Draft" 
                    count={analytics?.articles?.draft || 0} 
                    total={analytics?.articles?.total || 0} 
                    color="#6b7280" 
                  />
                  <StatusBar 
                    label="Scheduled" 
                    count={analytics?.articles?.scheduled || 0} 
                    total={analytics?.articles?.total || 0} 
                    color="#f59e0b" 
                  />
                </div>
              </div>
            )}
          </div>

          {/* A/B Testing Results */}
          {analytics.abTesting && (
            <div className="card" style={{ 
              marginBottom: '32px',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '14px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}>
              <h3 style={{ 
                marginBottom: '20px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '18px',
                fontWeight: '700',
                color: '#111827'
              }}>A/B Testing Results</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                {analytics.abTesting.variants.map((variant, index) => (
                  <div key={index} style={{
                    padding: '16px',
                    border: '2px solid',
                    borderColor: variant.name === analytics.abTesting.winningVariant ? '#F97316' : '#e5e7eb',
                    borderRadius: '8px',
                    position: 'relative'
                  }}>
                    {variant.name === analytics.abTesting.winningVariant && (
                      <div style={{
                        position: 'absolute',
                        top: '-12px',
                        right: '16px',
                        background: '#F97316',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        Winner 🏆
                      </div>
                    )}
                    <h4 style={{ marginBottom: '12px' }}>{variant.name}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Impressions:</span>
                        <strong>{variant.impressions}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Clicks:</span>
                        <strong>{variant.clicks}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Conversions:</span>
                        <strong>{variant.conversions}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                        <span>Conversion Rate:</span>
                        <strong style={{ color: '#111827' }}>{variant.conversionRate.toFixed(2)}%</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated Articles - Only for non-EMAIL campaigns */}
          {campaign.campaignType !== 'EMAIL' && (
            <>
              {/* Upcoming Scheduled Articles */}
              {articles.filter(a => a.scheduledPublishAt && new Date(a.scheduledPublishAt) > new Date()).length > 0 && (
                <div className="card" style={{ 
                  marginBottom: '24px',
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  border: '1px solid #fbbf24',
                  borderRadius: '14px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(251, 191, 36, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#f59e0b',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Clock size={22} />
                    </div>
                    <div>
                      <h3 style={{ 
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#78350f',
                        margin: 0,
                        marginBottom: '2px'
                      }}>Upcoming Scheduled Articles</h3>
                      <p style={{
                        fontFamily: 'Share Tech Mono, monospace',
                        fontSize: '13px',
                        color: '#92400e',
                        margin: 0
                      }}>
                        {articles.filter(a => a.scheduledPublishAt && new Date(a.scheduledPublishAt) > new Date()).length} article{articles.filter(a => a.scheduledPublishAt && new Date(a.scheduledPublishAt) > new Date()).length !== 1 ? 's' : ''} scheduled for publishing
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {articles
                      .filter(a => a.scheduledPublishAt && new Date(a.scheduledPublishAt) > new Date())
                      .sort((a, b) => new Date(a.scheduledPublishAt) - new Date(b.scheduledPublishAt))
                      .slice(0, 5)
                      .map((article) => {
                        const scheduledDate = new Date(article.scheduledPublishAt);
                        const now = new Date();
                        const hoursUntil = Math.round((scheduledDate - now) / (1000 * 60 * 60));
                        const daysUntil = Math.round(hoursUntil / 24);
                        
                        return (
                          <div key={article._id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '14px',
                            background: 'rgba(255, 255, 255, 0.7)',
                            borderRadius: '8px',
                            border: '1px solid rgba(251, 191, 36, 0.3)',
                            transition: 'all 0.2s',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                            e.currentTarget.style.borderColor = '#f59e0b';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                            e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)';
                          }}
                          onClick={() => window.open(`/dashboard/articles/${article._id}`, '_blank')}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ 
                                fontWeight: '600', 
                                marginBottom: '4px',
                                color: '#78350f',
                                fontSize: '14px'
                              }}>
                                {article.title}
                              </div>
                              <div style={{ 
                                fontSize: '12px', 
                                color: '#92400e',
                                fontFamily: 'Share Tech Mono, monospace'
                              }}>
                                {scheduledDate.toLocaleString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                                {hoursUntil < 24 ? ` (in ${hoursUntil}h)` : ` (in ${daysUntil}d)`}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/dashboard/articles/${article._id}`, '_blank');
                              }}
                              style={{
                                padding: '6px 14px',
                                background: '#f59e0b',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#d97706'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#f59e0b'}
                            >
                              <Eye size={12} />
                              Preview
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
              
              <div className="card" style={{ 
                marginBottom: '32px',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '14px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ 
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#111827',
                      margin: 0,
                      marginBottom: '4px'
                    }}>All Generated Articles</h3>
                    <p style={{
                      fontFamily: 'Share Tech Mono, monospace',
                      fontSize: '13px',
                      color: '#6b7280',
                      margin: 0
                    }}>
                      {articles.length} article{articles.length !== 1 ? 's' : ''} in this campaign
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/dashboard/articles?campaign=${campaignId}`)}
                    className="secondary-button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <FileText size={18} />
                    Manage Articles
                  </button>
                </div>
              
              {articles && articles.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {articles.slice(0, 10).map((article) => (
                    <div key={article._id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      background: '#f9fafb',
                      borderRadius: '10px',
                      border: '1px solid #e5e7eb',
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f3f4f6';
                      e.currentTarget.style.borderColor = '#F97316';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f9fafb';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                    onClick={() => window.open(`/dashboard/articles/${article._id}`, '_blank')}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontWeight: '600', 
                          marginBottom: '6px',
                          color: '#111827',
                          fontSize: '15px'
                        }}>
                          {article.title}
                        </div>
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#6b7280',
                          fontFamily: 'Share Tech Mono, monospace',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          flexWrap: 'wrap'
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Eye size={14} />
                            {article.views || 0} views
                          </span>
                          <span>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Activity size={14} />
                            {article.likes || 0} likes
                          </span>
                          <span>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Share2 size={14} />
                            {article.shares || 0} shares
                          </span>
                          {article.scheduledPublishAt && (
                            <>
                              <span>•</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={14} />
                                Scheduled: {new Date(article.scheduledPublishAt).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: article.status === 'PUBLISHED' ? '#fff7ed' : 
                                     article.status === 'DRAFT' ? '#f3f4f6' : '#fef3c7',
                          color: article.status === 'PUBLISHED' ? '#ea580c' : 
                                article.status === 'DRAFT' ? '#374151' : '#f59e0b',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {article.status}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/dashboard/articles/${article._id}`, '_blank');
                          }}
                          style={{
                            padding: '8px 16px',
                            background: '#F97316',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#ea580c'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#F97316'}
                        >
                          <Eye size={14} />
                          Preview
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {articles.length > 10 && (
                    <button
                      onClick={() => navigate(`/dashboard/articles?campaign=${campaignId}`)}
                      style={{
                        padding: '12px',
                        background: '#f9fafb',
                        border: '2px dashed #e5e7eb',
                        borderRadius: '10px',
                        color: '#6b7280',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#F97316';
                        e.currentTarget.style.color = '#F97316';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.color = '#6b7280';
                      }}
                    >
                      View {articles.length - 10} More Articles →
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '60px 20px', 
                  color: '#6b7280',
                  background: '#f9fafb',
                  borderRadius: '10px',
                  border: '2px dashed #e5e7eb'
                }}>
                  <FileText size={56} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                  <h4 style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '18px', 
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    No Articles Generated Yet
                  </h4>
                  <p style={{ margin: '0 0 20px 0', fontSize: '14px' }}>
                    Articles will appear here once they are generated for this campaign.
                  </p>
                  <button
                    onClick={() => navigate(`/dashboard/articles?campaign=${campaignId}`)}
                    style={{
                      padding: '12px 24px',
                      background: '#F97316',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#ea580c'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#F97316'}
                  >
                    Generate Articles
                  </button>
                </div>
              )}
            </div>
            </>
          )}

          {/* Bulk Actions */}
          {campaign.campaignType !== 'EMAIL' && (
            <div className="card">
              <h3 style={{ marginBottom: '16px' }}>Bulk Actions</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleBulkAction('publish')}
                  className="secondary-button"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <CheckCircle size={18} />
                  Publish All
                </button>
                <button
                  onClick={() => handleBulkAction('draft')}
                  className="secondary-button"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <FileText size={18} />
                  Move to Draft
                </button>
                <button
                  onClick={() => handleBulkAction('wordpress')}
                  className="secondary-button"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Globe size={18} />
                  Bulk Publish to WordPress
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="secondary-button"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}
                >
                  <Trash2 size={18} />
                  Delete All
                </button>
              </div>
            </div>
          )}

          {/* Automation Settings Modal */}
          {showSettings && createPortal(
            <div 
              className="modal-overlay" 
              onClick={() => setShowSettings(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(17, 24, 39, 0.75)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px'
              }}
            >
              <div 
                className="modal-content" 
                onClick={(e) => e.stopPropagation()} 
                style={{ 
                  maxWidth: '700px',
                  width: '100%',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  background: 'white',
                  borderRadius: '16px',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                  animation: 'slideUp 0.3s ease-out'
                }}
              >
                <div className="modal-header" style={{ 
                  background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                  color: 'white',
                  padding: '24px 32px',
                  borderRadius: '12px 12px 0 0'
                }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', fontFamily: 'Inter, sans-serif' }}>
                      Automation Settings
                    </h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9, fontFamily: 'Share Tech Mono, monospace' }}>
                      Configure automated scheduling and notifications
                    </p>
                  </div>
                  <button 
                    className="close-button" 
                    onClick={() => setShowSettings(false)}
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      border: 'none',
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      fontSize: '24px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                  >
                    ×
                  </button>
                </div>

                <div style={{ padding: '32px' }}>
                  {/* Auto-Scheduling Section */}
                  <div style={{ 
                    marginBottom: '32px',
                    padding: '24px',
                    background: '#f9fafb',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                      <div style={{ 
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px'
                      }}>
                        ⏰
                      </div>
                      <div>
                        <h3 style={{ 
                          margin: 0,
                          fontSize: '18px',
                          fontWeight: '700',
                          color: '#111827',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          Auto-Scheduling
                        </h3>
                        <p style={{ 
                          margin: '2px 0 0 0',
                          fontSize: '13px',
                          color: '#6b7280',
                          fontFamily: 'Share Tech Mono, monospace'
                        }}>
                          Automatically schedule campaign activities
                        </p>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px',
                        background: 'white',
                        borderRadius: '8px',
                        border: '2px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontWeight: '600',
                        color: '#374151',
                        fontFamily: 'Inter, sans-serif'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#F97316'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                      >
                        <input
                          type="checkbox"
                          checked={automationSettings.autoScheduling.enabled}
                          onChange={(e) => setAutomationSettings({
                            ...automationSettings,
                            autoScheduling: {
                              ...automationSettings.autoScheduling,
                              enabled: e.target.checked
                            }
                          })}
                          style={{ 
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                            accentColor: '#F97316'
                          }}
                        />
                        <span>Enable Auto-Scheduling</span>
                      </label>
                    </div>

                    {automationSettings.autoScheduling.enabled && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                        style={{ 
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '16px',
                          marginTop: '16px'
                        }}
                      >
                        <div className="form-group">
                          <label style={{ 
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: '600',
                            color: '#374151',
                            fontSize: '14px',
                            fontFamily: 'Inter, sans-serif'
                          }}>
                            Frequency
                          </label>
                          <select
                            value={automationSettings.autoScheduling.frequency}
                            onChange={(e) => setAutomationSettings({
                              ...automationSettings,
                              autoScheduling: {
                                ...automationSettings.autoScheduling,
                                frequency: e.target.value
                              }
                            })}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '2px solid #e5e7eb',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#374151',
                              background: 'white',
                              cursor: 'pointer',
                              fontFamily: 'Inter, sans-serif',
                              transition: 'all 0.2s'
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = '#F97316'}
                            onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                          >
                            <option value="DAILY">Daily</option>
                            <option value="WEEKLY">Weekly</option>
                            <option value="BI_WEEKLY">Bi-Weekly</option>
                            <option value="MONTHLY">Monthly</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label style={{ 
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: '600',
                            color: '#374151',
                            fontSize: '14px',
                            fontFamily: 'Inter, sans-serif'
                          }}>
                            Time of Day
                          </label>
                          <input
                            type="time"
                            value={automationSettings.autoScheduling.timeOfDay}
                            onChange={(e) => setAutomationSettings({
                              ...automationSettings,
                              autoScheduling: {
                                ...automationSettings.autoScheduling,
                                timeOfDay: e.target.value
                              }
                            })}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '2px solid #e5e7eb',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#374151',
                              background: 'white',
                              fontFamily: 'Share Tech Mono, monospace',
                              transition: 'all 0.2s'
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = '#F97316'}
                            onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Email Notifications Section */}
                  <div style={{ 
                    marginBottom: '32px',
                    padding: '24px',
                    background: '#f9fafb',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                      <div style={{ 
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px'
                      }}>
                        📧
                      </div>
                      <div>
                        <h3 style={{ 
                          margin: 0,
                          fontSize: '18px',
                          fontWeight: '700',
                          color: '#111827',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          Email Notifications
                        </h3>
                        <p style={{ 
                          margin: '2px 0 0 0',
                          fontSize: '13px',
                          color: '#6b7280',
                          fontFamily: 'Share Tech Mono, monospace'
                        }}>
                          Get notified about important campaign events
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <label style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px',
                        background: 'white',
                        borderRadius: '8px',
                        border: '2px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontWeight: '500',
                        color: '#374151',
                        fontFamily: 'Inter, sans-serif'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#F97316'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                      >
                        <input
                          type="checkbox"
                          checked={automationSettings.notifications.emailAlerts.onStart}
                          onChange={(e) => setAutomationSettings({
                            ...automationSettings,
                            notifications: {
                              ...automationSettings.notifications,
                              emailAlerts: {
                                ...automationSettings.notifications.emailAlerts,
                                onStart: e.target.checked
                              }
                            }
                          })}
                          style={{ 
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                            accentColor: '#F97316'
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', marginBottom: '2px' }}>Campaign Start</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>Notify when campaign begins</div>
                        </div>
                      </label>

                      <label style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px',
                        background: 'white',
                        borderRadius: '8px',
                        border: '2px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontWeight: '500',
                        color: '#374151',
                        fontFamily: 'Inter, sans-serif'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#F97316'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                      >
                        <input
                          type="checkbox"
                          checked={automationSettings.notifications.emailAlerts.onComplete}
                          onChange={(e) => setAutomationSettings({
                            ...automationSettings,
                            notifications: {
                              ...automationSettings.notifications,
                              emailAlerts: {
                                ...automationSettings.notifications.emailAlerts,
                                onComplete: e.target.checked
                              }
                            }
                          })}
                          style={{ 
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                            accentColor: '#F97316'
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', marginBottom: '2px' }}>Campaign Complete</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>Notify when campaign ends</div>
                        </div>
                      </label>

                      <label style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px',
                        background: 'white',
                        borderRadius: '8px',
                        border: '2px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontWeight: '500',
                        color: '#374151',
                        fontFamily: 'Inter, sans-serif'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#F97316'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                      >
                        <input
                          type="checkbox"
                          checked={automationSettings.notifications.emailAlerts.onMilestone}
                          onChange={(e) => setAutomationSettings({
                            ...automationSettings,
                            notifications: {
                              ...automationSettings.notifications,
                              emailAlerts: {
                                ...automationSettings.notifications.emailAlerts,
                                onMilestone: e.target.checked
                              }
                            }
                          })}
                          style={{ 
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                            accentColor: '#F97316'
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', marginBottom: '2px' }}>Milestone Reached</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>Notify on key achievements</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="modal-actions" style={{ 
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end',
                    paddingTop: '8px'
                  }}>
                    <button 
                      className="secondary-button" 
                      onClick={() => setShowSettings(false)}
                      style={{
                        padding: '12px 24px',
                        border: '2px solid #e5e7eb',
                        background: 'white',
                        color: '#374151',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: 'Inter, sans-serif'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f9fafb'
                        e.currentTarget.style.borderColor = '#d1d5db'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white'
                        e.currentTarget.style.borderColor = '#e5e7eb'
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      className="primary-button" 
                      onClick={handleSaveAutomation}
                      style={{
                        padding: '12px 32px',
                        background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                        fontFamily: 'Inter, sans-serif'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(249, 115, 22, 0.4)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.3)'
                      }}
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>
      </DashboardLayout>
    </>
  );
}

// Helper Components
function MetricCard({ icon, label, value, color, highlight }) {
  return (
    <motion.div
      className="card"
      style={{ 
        padding: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      animate={highlight ? {
        boxShadow: [
          '0 4px 6px rgba(0,0,0,0.1)',
          `0 0 20px ${color}40`,
          '0 4px 6px rgba(0,0,0,0.1)'
        ]
      } : {}}
    >
      {highlight && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: color,
          animation: 'slideIn 0.5s ease-out'
        }} />
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          background: `${color}20`,
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </div>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>{label}</div>
      </div>
      <div style={{ fontSize: '28px', fontWeight: '700', color: color }}>{value}</div>
    </motion.div>
  );
}

function StatusBar({ label, count, total, color }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
        <span>{label}</span>
        <span style={{ fontWeight: '600' }}>{count} / {total}</span>
      </div>
      <div style={{ background: '#e5e7eb', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
        <div style={{
          background: color,
          height: '100%',
          width: `${percentage}%`,
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  );
}

export default CampaignDashboard;
