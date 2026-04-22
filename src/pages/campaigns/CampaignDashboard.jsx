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
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
              color="#F97316"
            />
            <MetricCard
              icon={<IndianRupee />}
              label="ROI"
              value={`${parseFloat(analytics?.roi?.roiPercentage || 0).toFixed(1)}%`}
              color={parseFloat(analytics?.roi?.roiPercentage || 0) >= 0 ? '#F97316' : '#ef4444'}
            />
            <MetricCard
              icon={<MousePointer />}
              label="Click Rate"
              value={`${parseFloat(analytics?.engagement?.clickRate || 0).toFixed(1)}%`}
              color="#F97316"
            />
            <MetricCard
              icon={<Target />}
              label="Conversions"
              value={analytics?.engagement?.conversionCount || 0}
              color="#F97316"
            />
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
            {/* Performance Chart */}
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
              }}>Performance Overview</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Revenue</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#F97316' }}>
                    {formatCurrency(analytics?.roi?.revenue || 0)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Investment</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
                    {formatCurrency(analytics?.roi?.investment || 0)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Cost Per Click</div>
                  <div style={{ fontSize: '20px', fontWeight: '600' }}>
                    {formatCurrency(analytics?.roi?.costPerClick || 0)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Cost Per Conversion</div>
                  <div style={{ fontSize: '20px', fontWeight: '600' }}>
                    {formatCurrency(analytics?.roi?.costPerConversion || 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Article Status */}
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
                        <strong style={{ color: '#F97316' }}>{variant.conversionRate.toFixed(2)}%</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Performing Articles */}
          <div className="card" style={{ 
            marginBottom: '32px',
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '14px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ 
                fontFamily: 'Inter, sans-serif',
                fontSize: '18px',
                fontWeight: '700',
                color: '#111827',
                margin: 0
              }}>Top Performing Articles</h3>
              <button
                onClick={() => navigate(`/dashboard/articles?campaign=${campaignId}`)}
                className="secondary-button"
              >
                View All
              </button>
            </div>
            {analytics?.topArticles && analytics.topArticles.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {analytics.topArticles.map((article, index) => (
                  <div key={article.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: '#f9fafb',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : '#cd7f32',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '700'
                      }}>
                        {index + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>{article.title}</div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                          {article.views || 0} views • {article.likes || 0} likes • {article.shares || 0} shares
                        </div>
                      </div>
                    </div>
                    <div style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: article.status === 'PUBLISHED' ? '#fff7ed' : '#e5e7eb',
                      color: article.status === 'PUBLISHED' ? '#ea580c' : '#374151'
                    }}>
                      {article.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p>No articles yet. Create articles for this campaign to see performance data.</p>
              </div>
            )}
          </div>

          {/* Bulk Actions */}
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
function MetricCard({ icon, label, value, color }) {
  return (
    <motion.div
      className="card"
      style={{ padding: '20px' }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
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
