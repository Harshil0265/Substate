import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Building, 
  Globe, 
  Calendar, 
  CreditCard, 
  Activity, 
  Shield, 
  Clock, 
  Star, 
  Crown, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Lock, 
  Unlock,
  Key,
  Plus,
  Edit,
  Save,
  RotateCcw,
  Eye,
  TrendingUp,
  DollarSign,
  FileText,
  Target,
  LogIn,
  MapPin,
  Smartphone
} from 'lucide-react';
import { apiClient } from '../api/client';

const UserDetailsModal = ({ user, isOpen, onClose, onUserUpdate }) => {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState({});
  const [formData, setFormData] = useState({});
  const [actionLoading, setActionLoading] = useState(false);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: <User size={16} /> },
    { id: 'subscription', name: 'Subscription', icon: <CreditCard size={16} /> },
    { id: 'usage', name: 'Usage Stats', icon: <Activity size={16} /> },
    { id: 'risk', name: 'Risk Assessment', icon: <Shield size={16} /> },
    { id: 'activity', name: 'Activity Log', icon: <Clock size={16} /> }
  ];

  useEffect(() => {
    if (isOpen && user) {
      fetchUserDetails();
    }
  }, [isOpen, user]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/admin/users/${user._id}/details`);
      setUserDetails(response.data);
      setFormData({
        name: response.data.user.name,
        email: response.data.user.email,
        phone: response.data.user.phone || '',
        company: response.data.user.company || '',
        website: response.data.user.website || '',
        bio: response.data.user.bio || ''
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, data = {}) => {
    try {
      setActionLoading(true);
      let response;

      switch (action) {
        case 'changeSubscription':
          response = await apiClient.patch(`/admin/users/${user._id}/subscription`, data);
          break;
        case 'resetPassword':
          response = await apiClient.patch(`/admin/users/${user._id}/reset-password`, data);
          break;
        case 'extendTrial':
          response = await apiClient.patch(`/admin/users/${user._id}/extend-trial`, data);
          break;
        case 'verifyEmail':
          response = await apiClient.patch(`/admin/users/${user._id}/verify-email`, data);
          break;
        case 'updateRisk':
          response = await apiClient.patch(`/admin/users/${user._id}/risk-assessment`, data);
          break;
        case 'suspend':
        case 'activate':
        case 'reactivate':
          response = await apiClient.patch(`/admin/users/${user._id}`, { action });
          break;
      }

      // Refresh user details
      await fetchUserDetails();
      
      // Notify parent component
      if (onUserUpdate) {
        onUserUpdate();
      }

      alert(response.data.message || 'Action completed successfully');
    } catch (error) {
      console.error('Action error:', error);
      alert(error.response?.data?.error || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getSubscriptionIcon = (subscription) => {
    switch (subscription) {
      case 'TRIAL': return <Clock size={16} />;
      case 'PROFESSIONAL': return <Star size={16} />;
      case 'ENTERPRISE': return <Crown size={16} />;
      default: return <User size={16} />;
    }
  };

  const getSubscriptionColor = (subscription) => {
    switch (subscription) {
      case 'TRIAL': return '#3b82f6';
      case 'PROFESSIONAL': return '#f59e0b';
      case 'ENTERPRISE': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount / 100);
  };

  if (!isOpen || !user) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="user-details-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="modal-header">
            <div className="user-header-info">
              <div className="user-avatar-large">
                {user.name?.charAt(0) || 'U'}
              </div>
              <div className="user-header-details">
                <h2>{user.name}</h2>
                <p>{user.email}</p>
                <div className="user-badges">
                  {user.role === 'ADMIN' && (
                    <span className="badge admin">👑 ADMIN</span>
                  )}
                  <span 
                    className="badge subscription"
                    style={{ backgroundColor: getSubscriptionColor(user.subscription) }}
                  >
                    {getSubscriptionIcon(user.subscription)}
                    {user.role === 'ADMIN' ? 'UNLIMITED ACCESS' : user.subscription}
                  </span>
                  <span className={`badge status ${user.subscriptionStatus?.toLowerCase()}`}>
                    {user.subscriptionStatus}
                  </span>
                </div>
              </div>
            </div>
            <button className="modal-close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          {/* Modal Tabs */}
          <div className="modal-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`modal-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </div>

          {/* Modal Content */}
          <div className="modal-content">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading user details...</p>
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && userDetails && (
                  <div className="tab-content">
                    <div className="content-grid">
                      {/* Personal Information */}
                      <div className="info-card">
                        <h3>Personal Information</h3>
                        <div className="info-list">
                          <div className="info-item">
                            <Mail size={16} />
                            <span>Email</span>
                            <span>{userDetails.user.email}</span>
                          </div>
                          <div className="info-item">
                            <Phone size={16} />
                            <span>Phone</span>
                            <span>{userDetails.user.phone || 'Not provided'}</span>
                          </div>
                          <div className="info-item">
                            <Building size={16} />
                            <span>Company</span>
                            <span>{userDetails.user.company || 'Not provided'}</span>
                          </div>
                          <div className="info-item">
                            <Globe size={16} />
                            <span>Website</span>
                            <span>{userDetails.user.website || 'Not provided'}</span>
                          </div>
                          <div className="info-item">
                            <Calendar size={16} />
                            <span>Member Since</span>
                            <span>{formatDate(userDetails.user.createdAt)}</span>
                          </div>
                          <div className="info-item">
                            <LogIn size={16} />
                            <span>Last Login</span>
                            <span>{userDetails.user.lastLogin ? formatDate(userDetails.user.lastLogin) : 'Never'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="info-card">
                        <h3>Quick Statistics</h3>
                        <div className="stats-grid">
                          <div className="stat-item">
                            <Target size={20} />
                            <span className="stat-value">{userDetails.usageStats.totalCampaigns}</span>
                            <span className="stat-label">Campaigns</span>
                          </div>
                          <div className="stat-item">
                            <FileText size={20} />
                            <span className="stat-value">{userDetails.usageStats.totalArticles}</span>
                            <span className="stat-label">Articles</span>
                          </div>
                          <div className="stat-item">
                            <LogIn size={20} />
                            <span className="stat-value">{userDetails.usageStats.loginFrequency}</span>
                            <span className="stat-label">Logins</span>
                          </div>
                          <div className="stat-item">
                            <Calendar size={20} />
                            <span className="stat-value">{userDetails.usageStats.accountAge}</span>
                            <span className="stat-label">Days Old</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    {user.role !== 'ADMIN' && (
                      <div className="quick-actions">
                        <h3>Quick Actions</h3>
                        <div className="action-buttons">
                          {!userDetails.user.emailVerified && (
                            <button 
                              className="action-btn primary"
                              onClick={() => handleAction('verifyEmail', { reason: 'Admin manual verification' })}
                              disabled={actionLoading}
                            >
                              <CheckCircle size={16} />
                              Verify Email
                            </button>
                          )}
                          <button 
                            className="action-btn warning"
                            onClick={() => {
                              const reason = prompt('Reason for password reset:');
                              if (reason) handleAction('resetPassword', { reason });
                            }}
                            disabled={actionLoading}
                          >
                            <Key size={16} />
                            Reset Password
                          </button>
                          {userDetails.user.subscription === 'TRIAL' && (
                            <button 
                              className="action-btn success"
                              onClick={() => {
                                const days = prompt('Days to extend (1-90):');
                                const reason = prompt('Reason for extension:');
                                if (days && reason) {
                                  handleAction('extendTrial', { days: parseInt(days), reason });
                                }
                              }}
                              disabled={actionLoading}
                            >
                              <Plus size={16} />
                              Extend Trial
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Subscription Tab */}
                {activeTab === 'subscription' && userDetails && (
                  <div className="tab-content">
                    <div className="content-grid">
                      {/* Current Subscription */}
                      <div className="info-card">
                        <h3>Current Subscription</h3>
                        <div className="subscription-details">
                          <div className="subscription-plan">
                            {getSubscriptionIcon(userDetails.user.subscription)}
                            <span>{userDetails.user.subscription}</span>
                          </div>
                          <div className="subscription-dates">
                            <div className="date-item">
                              <span>Start Date</span>
                              <span>{formatDate(userDetails.user.subscriptionStartDate)}</span>
                            </div>
                            <div className="date-item">
                              <span>End Date</span>
                              <span>{formatDate(userDetails.user.subscriptionEndDate)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Change Subscription */}
                        {user.role !== 'ADMIN' && (
                          <div className="subscription-actions">
                            <h4>Change Subscription Plan</h4>
                            <div className="plan-options">
                              {['TRIAL', 'PROFESSIONAL', 'ENTERPRISE'].map((plan) => (
                                <button
                                  key={plan}
                                  className={`plan-option ${userDetails.user.subscription === plan ? 'current' : ''}`}
                                  onClick={() => {
                                    if (userDetails.user.subscription !== plan) {
                                      const reason = prompt(`Reason for changing to ${plan}:`);
                                      if (reason) {
                                        handleAction('changeSubscription', { newPlan: plan, reason });
                                      }
                                    }
                                  }}
                                  disabled={userDetails.user.subscription === plan || actionLoading}
                                >
                                  {getSubscriptionIcon(plan)}
                                  {plan}
                                  {userDetails.user.subscription === plan && <span>(Current)</span>}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Payment History */}
                      <div className="info-card">
                        <h3>Payment History</h3>
                        <div className="payment-list">
                          {userDetails.paymentHistory?.length > 0 ? (
                            userDetails.paymentHistory.map((payment, index) => (
                              <div key={index} className="payment-item">
                                <div className="payment-info">
                                  <span className="payment-amount">{formatCurrency(payment.amount)}</span>
                                  <span className="payment-plan">{payment.plan}</span>
                                </div>
                                <div className="payment-meta">
                                  <span className={`payment-status ${payment.status.toLowerCase()}`}>
                                    {payment.status}
                                  </span>
                                  <span className="payment-date">{formatDate(payment.createdAt)}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p>No payment history</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Subscription History */}
                    {userDetails.user.subscriptionHistory?.length > 0 && (
                      <div className="info-card">
                        <h3>Subscription Changes</h3>
                        <div className="history-list">
                          {userDetails.user.subscriptionHistory.map((change, index) => (
                            <div key={index} className="history-item">
                              <div className="change-info">
                                <span>{change.previousPlan} → {change.newPlan}</span>
                                <span className="change-reason">{change.reason}</span>
                              </div>
                              <span className="change-date">{formatDate(change.changeDate)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Usage Stats Tab */}
                {activeTab === 'usage' && userDetails && (
                  <div className="tab-content">
                    <div className="usage-overview">
                      <div className="usage-cards">
                        <div className="usage-card">
                          <Target size={24} />
                          <div className="usage-info">
                            <span className="usage-value">{userDetails.usageStats.totalCampaigns}</span>
                            <span className="usage-label">Total Campaigns</span>
                          </div>
                        </div>
                        <div className="usage-card">
                          <FileText size={24} />
                          <div className="usage-info">
                            <span className="usage-value">{userDetails.usageStats.totalArticles}</span>
                            <span className="usage-label">Total Articles</span>
                          </div>
                        </div>
                        <div className="usage-card">
                          <LogIn size={24} />
                          <div className="usage-info">
                            <span className="usage-value">{userDetails.usageStats.loginFrequency}</span>
                            <span className="usage-label">Login Sessions</span>
                          </div>
                        </div>
                        <div className="usage-card">
                          <Calendar size={24} />
                          <div className="usage-info">
                            <span className="usage-value">{userDetails.usageStats.accountAge}</span>
                            <span className="usage-label">Days Active</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="content-grid">
                      <div className="info-card">
                        <h3>Recent Campaigns</h3>
                        <div className="recent-list">
                          {userDetails.usageStats.recentCampaigns?.length > 0 ? (
                            userDetails.usageStats.recentCampaigns.map((campaign, index) => (
                              <div key={index} className="recent-item">
                                <span className="item-name">{campaign.title}</span>
                                <span className="item-date">{formatDate(campaign.createdAt)}</span>
                              </div>
                            ))
                          ) : (
                            <p>No campaigns yet</p>
                          )}
                        </div>
                      </div>

                      <div className="info-card">
                        <h3>Recent Articles</h3>
                        <div className="recent-list">
                          {userDetails.usageStats.recentArticles?.length > 0 ? (
                            userDetails.usageStats.recentArticles.map((article, index) => (
                              <div key={index} className="recent-item">
                                <span className="item-name">{article.title}</span>
                                <span className="item-date">{formatDate(article.createdAt)}</span>
                              </div>
                            ))
                          ) : (
                            <p>No articles yet</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Risk Assessment Tab */}
                {activeTab === 'risk' && userDetails && (
                  <div className="tab-content">
                    <div className="risk-overview">
                      <div className="risk-cards">
                        <div className="risk-card">
                          <div className="risk-header">
                            <TrendingUp size={20} />
                            <span>Overall Risk</span>
                          </div>
                          <div className="risk-score" style={{ color: userDetails.riskScores.overall > 70 ? '#ef4444' : userDetails.riskScores.overall > 40 ? '#f59e0b' : '#10b981' }}>
                            {userDetails.riskScores.overall}%
                          </div>
                        </div>
                        <div className="risk-card">
                          <div className="risk-header">
                            <User size={20} />
                            <span>Churn Risk</span>
                          </div>
                          <div className="risk-score" style={{ color: userDetails.riskScores.churn > 70 ? '#ef4444' : userDetails.riskScores.churn > 40 ? '#f59e0b' : '#10b981' }}>
                            {userDetails.riskScores.churn}%
                          </div>
                        </div>
                        <div className="risk-card">
                          <div className="risk-header">
                            <DollarSign size={20} />
                            <span>Payment Risk</span>
                          </div>
                          <div className="risk-score" style={{ color: userDetails.riskScores.payment > 70 ? '#ef4444' : userDetails.riskScores.payment > 40 ? '#f59e0b' : '#10b981' }}>
                            {userDetails.riskScores.payment}%
                          </div>
                        </div>
                        <div className="risk-card">
                          <div className="risk-header">
                            <Activity size={20} />
                            <span>Activity Risk</span>
                          </div>
                          <div className="risk-score" style={{ color: userDetails.riskScores.activity > 70 ? '#ef4444' : userDetails.riskScores.activity > 40 ? '#f59e0b' : '#10b981' }}>
                            {userDetails.riskScores.activity}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Update Risk Scores */}
                    {user.role !== 'ADMIN' && (
                      <div className="info-card">
                        <h3>Update Risk Assessment</h3>
                        <div className="risk-form">
                          <div className="form-grid">
                            <div className="form-group">
                              <label>Overall Risk (0-100)</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                defaultValue={userDetails.riskScores.overall}
                                id="overallRisk"
                              />
                            </div>
                            <div className="form-group">
                              <label>Churn Risk (0-100)</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                defaultValue={userDetails.riskScores.churn}
                                id="churnRisk"
                              />
                            </div>
                            <div className="form-group">
                              <label>Payment Risk (0-100)</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                defaultValue={userDetails.riskScores.payment}
                                id="paymentRisk"
                              />
                            </div>
                            <div className="form-group">
                              <label>Activity Risk (0-100)</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                defaultValue={userDetails.riskScores.activity}
                                id="activityRisk"
                              />
                            </div>
                          </div>
                          <button
                            className="action-btn primary"
                            onClick={() => {
                              const overallRisk = parseInt(document.getElementById('overallRisk').value);
                              const churnRisk = parseInt(document.getElementById('churnRisk').value);
                              const paymentRisk = parseInt(document.getElementById('paymentRisk').value);
                              const activityRisk = parseInt(document.getElementById('activityRisk').value);
                              
                              handleAction('updateRisk', {
                                overallRisk,
                                churnRisk,
                                paymentRisk,
                                activityRisk
                              });
                            }}
                            disabled={actionLoading}
                          >
                            <Save size={16} />
                            Update Risk Scores
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Activity Log Tab */}
                {activeTab === 'activity' && (
                  <ActivityLogTab userId={user._id} />
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Activity Log Component
const ActivityLogTab = ({ userId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchActivityLog();
  }, [userId]);

  const fetchActivityLog = async (page = 1) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/admin/users/${userId}/activity-log?page=${page}`);
      setActivities(response.data.activities);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching activity log:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'LOGIN': return <LogIn size={16} />;
      case 'SUBSCRIPTION_CHANGE': return <CreditCard size={16} />;
      case 'PASSWORD_RESET': return <Key size={16} />;
      case 'TRIAL_EXTENSION': return <Plus size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'LOGIN': return '#10b981';
      case 'SUBSCRIPTION_CHANGE': return '#3b82f6';
      case 'PASSWORD_RESET': return '#f59e0b';
      case 'TRIAL_EXTENSION': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const formatActivityDetails = (activity) => {
    switch (activity.type) {
      case 'LOGIN':
        return `Login from ${activity.details.ipAddress || 'Unknown IP'}`;
      case 'SUBSCRIPTION_CHANGE':
        return `Changed from ${activity.details.from} to ${activity.details.to}`;
      case 'PASSWORD_RESET':
        return `Password reset: ${activity.details.reason}`;
      case 'TRIAL_EXTENSION':
        return `Trial extended by ${activity.details.daysAdded} days`;
      default:
        return 'Activity recorded';
    }
  };

  return (
    <div className="tab-content">
      <div className="activity-log">
        <h3>Activity History</h3>
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading activity log...</p>
          </div>
        ) : (
          <div className="activity-list">
            {activities.length > 0 ? (
              activities.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div 
                    className="activity-icon"
                    style={{ backgroundColor: `${getActivityColor(activity.type)}15`, color: getActivityColor(activity.type) }}
                  >
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">{activity.type.replace('_', ' ')}</div>
                    <div className="activity-description">{formatActivityDetails(activity)}</div>
                    <div className="activity-timestamp">{new Date(activity.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))
            ) : (
              <p>No activity recorded</p>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="pagination">
            <button
              disabled={pagination.page === 1}
              onClick={() => fetchActivityLog(pagination.page - 1)}
            >
              Previous
            </button>
            <span>Page {pagination.page} of {pagination.pages}</span>
            <button
              disabled={pagination.page === pagination.pages}
              onClick={() => fetchActivityLog(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetailsModal;