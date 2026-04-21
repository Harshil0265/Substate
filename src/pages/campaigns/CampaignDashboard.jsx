import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  ArrowLeft, TrendingUp, Users, Eye, MousePointer, DollarSign,
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
      daysOfWeek: [1, 3, 5] // Mon, Wed, Fri
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
    fetchCampaignData();
  }, [campaignId]);

  const fetchCampaignData = async () => {
    try {
      setLoading(true);
      const [campaignRes, analyticsRes, articlesRes] = await Promise.all([
        apiClient.get(`/campaigns/${campaignId}`),
        apiClient.get(`/campaigns/${campaignId}/analytics`),
        apiClient.get(`/campaigns/${campaignId}/articles`)
      ]);

      setCampaign(campaignRes.data);
      setAnalytics(analyticsRes.data);
      setArticles(articlesRes.data.articles);

      // Set automation settings from campaign
      if (campaignRes.data.autoScheduling) {
        setAutomationSettings(prev => ({
          ...prev,
          autoScheduling: campaignRes.data.autoScheduling
        }));
      }
    } catch (error) {
      console.error('Error fetching campaign data:', error);
      setError('Failed to load campaign data');
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
          if (!confirm('Are you sure you want to delete all articles? This cannot be undone.')) return;
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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
          <h3>Campaign not found</h3>
          <button onClick={() => navigate('/dashboard/campaigns')} className="primary-button">
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
        <div className="dashboard-container">
          {/* Header */}
          <div className="dashboard-header" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => navigate('/dashboard/campaigns')}
                className="icon-button"
                style={{ padding: '8px' }}
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1>{campaign.title}</h1>
                <p>{campaign.description}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowSettings(true)}
                className="secondary-button"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Settings size={18} />
                Automation
              </button>
              {campaign.status === 'RUNNING' ? (
                <button
                  onClick={() => handleStatusChange('PAUSED')}
                  className="secondary-button"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Pause size={18} />
                  Pause
                </button>
              ) : (
                <button
                  onClick={() => handleStatusChange('RUNNING')}
                  className="primary-button"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Play size={18} />
                  Start
                </button>
              )}
            </div>
          </div>

          {error && <div className="error-message" style={{ marginBottom: '20px' }}>{error}</div>}
          {success && <div className="success-message" style={{ marginBottom: '20px' }}>{success}</div>}

          {/* Campaign Status Bar */}
          <div style={{
            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
            borderRadius: '12px',
            padding: '24px',
            color: 'white',
            marginBottom: '24px',
            boxShadow: '0 4px 14px rgba(249, 115, 22, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Campaign Status</div>
                <div style={{ fontSize: '24px', fontWeight: '700', marginTop: '4px' }}>{campaign.status}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Progress</div>
                <div style={{ fontSize: '24px', fontWeight: '700', marginTop: '4px' }}>{analytics.campaign.progress}%</div>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
              <div style={{
                background: 'white',
                height: '100%',
                width: `${analytics.campaign.progress}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <MetricCard
              icon={<FileText />}
              label="Total Articles"
              value={analytics.articles.total}
              color="#F97316"
            />
            <MetricCard
              icon={<Eye />}
              label="Total Views"
              value={formatNumber(analytics.performance.totalViews)}
              color="#F97316"
            />
            <MetricCard
              icon={<Activity />}
              label="Engagement Rate"
              value={`${analytics.performance.engagementRate.toFixed(1)}%`}
              color="#F97316"
            />
            <MetricCard
              icon={<DollarSign />}
              label="ROI"
              value={`${analytics.roi.roiPercentage.toFixed(1)}%`}
              color={analytics.roi.roiPercentage >= 0 ? '#F97316' : '#ef4444'}
            />
            <MetricCard
              icon={<MousePointer />}
              label="Click Rate"
              value={`${analytics.engagement.clickRate.toFixed(1)}%`}
              color="#F97316"
            />
            <MetricCard
              icon={<Target />}
              label="Conversions"
              value={analytics.engagement.conversionCount}
              color="#F97316"
            />
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
            {/* Performance Chart */}
            <div className="card">
              <h3 style={{ marginBottom: '16px' }}>Performance Overview</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Revenue</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#F97316' }}>
                    {formatCurrency(analytics.roi.revenue)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Investment</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
                    {formatCurrency(analytics.roi.investment)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Cost Per Click</div>
                  <div style={{ fontSize: '20px', fontWeight: '600' }}>
                    {formatCurrency(analytics.roi.costPerClick)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Cost Per Conversion</div>
                  <div style={{ fontSize: '20px', fontWeight: '600' }}>
                    {formatCurrency(analytics.roi.costPerConversion)}
                  </div>
                </div>
              </div>
            </div>

            {/* Article Status */}
            <div className="card">
              <h3 style={{ marginBottom: '16px' }}>Article Status</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <StatusBar label="Published" count={analytics.articles.published} total={analytics.articles.total} color="#F97316" />
                <StatusBar label="Draft" count={analytics.articles.draft} total={analytics.articles.total} color="#6b7280" />
                <StatusBar label="Scheduled" count={analytics.articles.scheduled} total={analytics.articles.total} color="#f59e0b" />
              </div>
            </div>
          </div>

          {/* A/B Testing Results */}
          {analytics.abTesting && (
            <div className="card" style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '16px' }}>A/B Testing Results</h3>
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
          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Top Performing Articles</h3>
              <button
                onClick={() => navigate(`/dashboard/articles?campaign=${campaignId}`)}
                className="secondary-button"
              >
                View All
              </button>
            </div>
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
                        {article.views} views • {article.likes} likes • {article.shares} shares
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
          {showSettings && (
            <div className="modal-overlay" onClick={() => setShowSettings(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                  <h2>Automation Settings</h2>
                  <button className="close-button" onClick={() => setShowSettings(false)}>×</button>
                </div>

                <div style={{ padding: '24px' }}>
                  {/* Auto-Scheduling */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ marginBottom: '16px' }}>Auto-Scheduling</h3>
                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                        />
                        Enable Auto-Scheduling
                      </label>
                    </div>

                    {automationSettings.autoScheduling.enabled && (
                      <>
                        <div className="form-group">
                          <label>Frequency</label>
                          <select
                            value={automationSettings.autoScheduling.frequency}
                            onChange={(e) => setAutomationSettings({
                              ...automationSettings,
                              autoScheduling: {
                                ...automationSettings.autoScheduling,
                                frequency: e.target.value
                              }
                            })}
                          >
                            <option value="DAILY">Daily</option>
                            <option value="WEEKLY">Weekly</option>
                            <option value="BI_WEEKLY">Bi-Weekly</option>
                            <option value="MONTHLY">Monthly</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Time of Day</label>
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
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Email Notifications */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ marginBottom: '16px' }}>Email Notifications</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                        />
                        Campaign Start
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                        />
                        Campaign Complete
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                        />
                        Milestone Reached
                      </label>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button className="secondary-button" onClick={() => setShowSettings(false)}>
                      Cancel
                    </button>
                    <button className="primary-button" onClick={handleSaveAutomation}>
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
