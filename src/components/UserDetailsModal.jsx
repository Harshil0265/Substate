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
  IndianRupee,
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
        case 'sendDiscount':
          response = await apiClient.post(`/admin/users/${user._id}/send-discount`, data);
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
          <div className="modal-header-pro">
            <div className="user-header-info-pro">
              <div className="user-avatar-large-pro">
                {user.name?.charAt(0) || 'U'}
              </div>
              <div className="user-header-details-pro">
                <h2>{user.name}</h2>
                <p className="user-email-header">{user.email}</p>
                <div className="user-badges-pro">
                  {user.role === 'ADMIN' && (
                    <span className="badge-pro admin-badge-pro">
                      <Crown size={14} />
                      ADMIN
                    </span>
                  )}
                  <span 
                    className="badge-pro subscription-badge-pro"
                    style={{ 
                      backgroundColor: `${getSubscriptionColor(user.subscription)}15`,
                      color: getSubscriptionColor(user.subscription),
                      border: `1px solid ${getSubscriptionColor(user.subscription)}30`
                    }}
                  >
                    {getSubscriptionIcon(user.subscription)}
                    {user.role === 'ADMIN' ? 'UNLIMITED ACCESS' : user.subscription}
                  </span>
                  <span className={`badge-pro status-badge-pro status-${user.subscriptionStatus?.toLowerCase()}`}>
                    {user.subscriptionStatus}
                  </span>
                </div>
              </div>
            </div>
            <button className="modal-close-pro" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          {/* Modal Tabs */}
          <div className="modal-tabs-pro">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`modal-tab-pro ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.name}</span>
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
                {/* Overview Tab - Flat Layout v2.0 */}
                {activeTab === 'overview' && userDetails && (
                  <div className="tab-content" data-version="flat-v2.0">
                    <div className="overview-full-layout">{/* Flat layout - no cards */}
                      {/* Personal Information Section */}
                      <div className="section-block personal-section">
                        <h3 className="section-title"><User size={18} />Personal Information</h3>
                        <div className="info-list-flat">
                          <div className="info-item-flat">
                            <Mail size={18} />
                            <span className="info-label">Email</span>
                            <span className="info-value">{userDetails.user.email}</span>
                          </div>
                          <div className="info-item-flat">
                            <Phone size={18} />
                            <span className="info-label">Phone</span>
                            <span className="info-value">{userDetails.user.phone || 'Not provided'}</span>
                          </div>
                          <div className="info-item-flat">
                            <Building size={18} />
                            <span className="info-label">Company</span>
                            <span className="info-value">{userDetails.user.company || 'Not provided'}</span>
                          </div>
                          <div className="info-item-flat">
                            <Globe size={18} />
                            <span className="info-label">Website</span>
                            <span className="info-value">{userDetails.user.website || 'Not provided'}</span>
                          </div>
                          <div className="info-item-flat">
                            <Calendar size={18} />
                            <span className="info-label">Member Since</span>
                            <span className="info-value">{formatDate(userDetails.user.createdAt)}</span>
                          </div>
                          <div className="info-item-flat">
                            <LogIn size={18} />
                            <span className="info-label">Last Login</span>
                            <span className="info-value">{userDetails.user.lastLogin ? formatDate(userDetails.user.lastLogin) : 'Never'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Statistics Section */}
                      <div className="section-block stats-section">
                        <h3 className="section-title"><TrendingUp size={18} />Quick Statistics</h3>
                        <div className="stats-grid-flat">
                          <div className="stat-item-flat">
                            <div className="stat-icon-wrapper">
                              <Target size={24} />
                            </div>
                            <span className="stat-value">{userDetails.usageStats.totalCampaigns}</span>
                            <span className="stat-label">Campaigns</span>
                          </div>
                          <div className="stat-item-flat">
                            <div className="stat-icon-wrapper">
                              <FileText size={24} />
                            </div>
                            <span className="stat-value">{userDetails.usageStats.totalArticles}</span>
                            <span className="stat-label">Articles</span>
                          </div>
                          <div className="stat-item-flat">
                            <div className="stat-icon-wrapper">
                              <LogIn size={24} />
                            </div>
                            <span className="stat-value">{userDetails.usageStats.loginFrequency}</span>
                            <span className="stat-label">Logins</span>
                          </div>
                          <div className="stat-item-flat">
                            <div className="stat-icon-wrapper">
                              <Calendar size={24} />
                            </div>
                            <span className="stat-value">{userDetails.usageStats.accountAge}</span>
                            <span className="stat-label">Days Old</span>
                          </div>
                        </div>
                      </div>

                      {/* Account Status Section */}
                      <div className="section-block status-section">
                        <h3 className="section-title"><Shield size={18} />Account Status</h3>
                        <div className="status-grid-flat">
                          <div className="status-item-flat">
                            <div className="status-icon-flat" style={{ background: userDetails.user.emailVerified ? '#10b98115' : '#ef444415' }}>
                              {userDetails.user.emailVerified ? <CheckCircle size={20} color="#10b981" /> : <XCircle size={20} color="#ef4444" />}
                            </div>
                            <div className="status-info-flat">
                              <span className="status-label-flat">Email Verified</span>
                              <span className={`status-value-flat ${userDetails.user.emailVerified ? 'verified' : 'unverified'}`}>
                                {userDetails.user.emailVerified ? 'Verified' : 'Not Verified'}
                              </span>
                            </div>
                          </div>
                          <div className="status-item-flat">
                            <div className="status-icon-flat" style={{ background: '#3b82f615' }}>
                              <Activity size={20} color="#3b82f6" />
                            </div>
                            <div className="status-info-flat">
                              <span className="status-label-flat">Account Status</span>
                              <span className="status-value-flat active">{userDetails.user.subscriptionStatus}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions Section */}
                      {user.role !== 'ADMIN' && (
                        <div className="section-block actions-section">
                          <h3 className="section-title"><Key size={18} />Quick Actions</h3>
                          <div className="action-buttons-flat">
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

                      {/* Discount Coupon Section */}
                      {user.role !== 'ADMIN' && (
                        <div className="section-block discount-section-flat">
                          <h3 className="section-title">🎁 Send Discount Coupon</h3>
                          <p className="section-description">Reward this user with a personalized discount coupon</p>
                          <div className="discount-options-flat">
                            {[10, 15, 30, 50].map((discount) => (
                              <button
                                key={discount}
                                className="discount-btn-flat"
                                onClick={() => handleAction('sendDiscount', { discountPercent: discount })}
                                disabled={actionLoading}
                              >
                                {discount}% OFF
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
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
                                  <div className="payment-header">
                                    <span className="payment-amount">
                                      {new Intl.NumberFormat('en-IN', {
                                        style: 'currency',
                                        currency: 'INR',
                                        maximumFractionDigits: 2
                                      }).format(payment.amount)}
                                    </span>
                                    {payment.originalAmount && payment.originalAmount !== payment.amount && (
                                      <span className="payment-original" style={{ 
                                        textDecoration: 'line-through', 
                                        fontSize: '12px', 
                                        color: '#6b7280',
                                        marginLeft: '8px'
                                      }}>
                                        {new Intl.NumberFormat('en-IN', {
                                          style: 'currency',
                                          currency: 'INR',
                                          maximumFractionDigits: 2
                                        }).format(payment.originalAmount)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="payment-details">
                                    <span className="payment-plan">{payment.planType || payment.plan || 'N/A'}</span>
                                    {payment.invoiceNumber && (
                                      <span className="payment-invoice" style={{ fontSize: '12px', color: '#6b7280' }}>
                                        {payment.invoiceNumber}
                                      </span>
                                    )}
                                    {payment.coupon?.code && (
                                      <span className="payment-coupon" style={{ 
                                        fontSize: '11px', 
                                        backgroundColor: '#10b98115',
                                        color: '#10b981',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        border: '1px solid #10b98130'
                                      }}>
                                        🎟️ {payment.coupon.code}
                                      </span>
                                    )}
                                  </div>
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
                            <IndianRupee size={20} />
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