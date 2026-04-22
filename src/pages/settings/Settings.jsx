import { Helmet } from 'react-helmet-async'
import { useState, useEffect, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { User, Lock, Bell, FileText, Settings as SettingsIcon, Loader2, Globe, Clock, LayoutDashboard } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { apiClient } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import '../../styles/settings.css'

// Lazy load WordPress Integration component
const WordPressIntegration = lazy(() => import('../../components/WordPressIntegration'))

function Settings() {
  const [activeTab, setActiveTab] = useState('profile')
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    website: '',
    bio: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    campaignUpdates: true,
    articlePublished: true,
    weeklyReports: false,
    marketingEmails: false
  })
  const [preferenceSettings, setPreferenceSettings] = useState({
    timezone: 'UTC',
    language: 'en',
    dashboardLayout: 'default'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { user, setUser, logout } = useAuthStore()

  const timezones = [
    { value: 'America/New_York', label: 'USA (Eastern Time)' },
    { value: 'America/Chicago', label: 'USA (Central Time)' },
    { value: 'America/Denver', label: 'USA (Mountain Time)' },
    { value: 'America/Los_Angeles', label: 'USA (Pacific Time)' },
    { value: 'Canada/Eastern', label: 'Canada (Eastern)' },
    { value: 'Canada/Central', label: 'Canada (Central)' },
    { value: 'Canada/Mountain', label: 'Canada (Mountain)' },
    { value: 'Canada/Pacific', label: 'Canada (Pacific)' },
    { value: 'Asia/Kolkata', label: 'India (IST)' },
    { value: 'Australia/Sydney', label: 'Australia (Sydney)' },
    { value: 'Australia/Melbourne', label: 'Australia (Melbourne)' },
    { value: 'Australia/Brisbane', label: 'Australia (Brisbane)' },
    { value: 'Australia/Perth', label: 'Australia (Perth)' },
    { value: 'Pacific/Auckland', label: 'New Zealand (Auckland)' },
    { value: 'Europe/London', label: 'Europe (GMT/UTC)' },
    { value: 'Europe/Paris', label: 'Europe (CET)' },
    { value: 'Europe/Berlin', label: 'Europe (CET)' },
    { value: 'Europe/Amsterdam', label: 'Europe (CET)' },
    { value: 'Europe/Madrid', label: 'Europe (CET)' },
    { value: 'Europe/Rome', label: 'Europe (CET)' },
    { value: 'UTC', label: 'UTC' }
  ]

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'wordpress', name: 'WordPress', icon: FileText },
    { id: 'preferences', name: 'Preferences', icon: SettingsIcon }
  ]

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await apiClient.get('/users/profile')
      const userData = response.data.user
      
      setProfileData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        company: userData.company || '',
        website: userData.website || '',
        bio: userData.bio || ''
      })

      setNotificationSettings({
        emailNotifications: userData.emailNotifications ?? true,
        campaignUpdates: userData.campaignUpdates ?? true,
        articlePublished: userData.articlePublished ?? true,
        weeklyReports: userData.weeklyReports ?? false,
        marketingEmails: userData.marketingEmails ?? false
      })

      setPreferenceSettings({
        timezone: userData.timezone || 'UTC',
        language: userData.language || 'en',
        dashboardLayout: userData.dashboardLayout || 'default'
      })
    } catch (error) {
      console.error('Error fetching user data:', error)
      setError('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await apiClient.patch('/users/profile', profileData)
      setUser(response.data.user)
      setSuccess('Profile updated successfully!')
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match')
      setSaving(false)
      return
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      setSaving(false)
      return
    }

    try {
      await apiClient.patch('/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setSuccess('Password changed successfully!')
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const handleNotificationUpdate = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await apiClient.patch('/users/notifications', notificationSettings)
      setSuccess('Notification preferences updated!')
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update notifications')
    } finally {
      setSaving(false)
    }
  }

  const handlePreferenceUpdate = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await apiClient.patch('/users/preferences', preferenceSettings)
      setSuccess('Preferences updated successfully!')
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update preferences')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    const confirmation = window.prompt('Type "DELETE" to confirm account deletion:')
    if (confirmation !== 'DELETE') {
      return
    }

    try {
      await apiClient.delete('/users/account')
      logout()
      window.location.href = '/'
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete account')
    }
  }

  return (
    <>
      <Helmet>
        <title>Settings - SUBSTATE</title>
        <meta name="description" content="Manage your account settings and preferences." />
      </Helmet>

      <DashboardLayout>
        <div className="dashboard-container">
          <div className="dashboard-header">
            <div>
              <h1>Settings</h1>
              <p>Manage your account settings and preferences</p>
            </div>
          </div>

          {error && (
            <div className="error-message" style={{ marginBottom: '20px' }}>
              {error}
            </div>
          )}

          {success && (
            <div className="success-message" style={{ marginBottom: '20px' }}>
              {success}
            </div>
          )}

          <div className="settings-container">
            {/* Settings Tabs */}
            <div className="settings-sidebar">
              {tabs.map((tab) => {
                const IconComponent = tab.icon
                return (
                  <button
                    key={tab.id}
                    className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <IconComponent size={18} className="tab-icon" />
                    <span className="tab-name">{tab.name}</span>
                  </button>
                )
              })}
            </div>

            {/* Settings Content */}
            <div className="settings-content">
              {loading ? (
                <div className="loading-state">
                  <Loader2 className="loading-spinner" size={40} style={{ animation: 'spin 1s linear infinite' }} />
                  <p>Loading settings...</p>
                </div>
              ) : (
                <>
                  {/* Profile Tab */}
                  {activeTab === 'profile' && (
                    <motion.div
                      className="settings-section"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2>Profile Information</h2>
                      <form onSubmit={handleProfileUpdate} className="settings-form">
                        <div className="form-row">
                          <div className="form-group">
                            <label>Full Name</label>
                            <input
                              type="text"
                              value={profileData.name}
                              onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Email</label>
                            <input
                              type="email"
                              value={profileData.email}
                              onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                              required
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Phone</label>
                            <input
                              type="tel"
                              value={profileData.phone}
                              onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                              placeholder="+1 (555) 123-4567"
                            />
                          </div>
                          <div className="form-group">
                            <label>Company</label>
                            <input
                              type="text"
                              value={profileData.company}
                              onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                              placeholder="Your company name"
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Website</label>
                          <input
                            type="url"
                            value={profileData.website}
                            onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                            placeholder="https://yourwebsite.com"
                          />
                        </div>

                        <div className="form-group">
                          <label>Bio</label>
                          <textarea
                            value={profileData.bio}
                            onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                            placeholder="Tell us about yourself"
                            rows="4"
                          />
                        </div>

                        <button type="submit" className="primary-button" disabled={saving}>
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                      </form>
                    </motion.div>
                  )}

                  {/* Security Tab */}
                  {activeTab === 'security' && (
                    <motion.div
                      className="settings-section"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2>Security Settings</h2>
                      
                      <div className="security-section">
                        <h3>Change Password</h3>
                        <form onSubmit={handlePasswordChange} className="settings-form">
                          <div className="form-group">
                            <label>Current Password</label>
                            <input
                              type="password"
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label>New Password</label>
                            <input
                              type="password"
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label>Confirm New Password</label>
                            <input
                              type="password"
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                              required
                            />
                          </div>

                          <button type="submit" className="primary-button" disabled={saving}>
                            {saving ? 'Changing...' : 'Change Password'}
                          </button>
                        </form>
                      </div>

                      <div className="security-section danger-zone">
                        <h3>Danger Zone</h3>
                        <p>Once you delete your account, there is no going back. Please be certain.</p>
                        <button 
                          className="danger-button"
                          onClick={handleDeleteAccount}
                        >
                          Delete Account
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Notifications Tab */}
                  {activeTab === 'notifications' && (
                    <motion.div
                      className="settings-section"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2>Notification Preferences</h2>
                      
                      <div className="notification-settings">
                        <div className="notification-item">
                          <div className="notification-info">
                            <h4>Email Notifications</h4>
                            <p>Receive important updates via email</p>
                          </div>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={notificationSettings.emailNotifications}
                              onChange={(e) => setNotificationSettings({
                                ...notificationSettings,
                                emailNotifications: e.target.checked
                              })}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>

                        <div className="notification-item">
                          <div className="notification-info">
                            <h4>Campaign Updates</h4>
                            <p>Get notified when campaigns are approved or rejected</p>
                          </div>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={notificationSettings.campaignUpdates}
                              onChange={(e) => setNotificationSettings({
                                ...notificationSettings,
                                campaignUpdates: e.target.checked
                              })}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>

                        <div className="notification-item">
                          <div className="notification-info">
                            <h4>Article Published</h4>
                            <p>Notification when your articles are published</p>
                          </div>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={notificationSettings.articlePublished}
                              onChange={(e) => setNotificationSettings({
                                ...notificationSettings,
                                articlePublished: e.target.checked
                              })}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>

                        <div className="notification-item">
                          <div className="notification-info">
                            <h4>Weekly Reports</h4>
                            <p>Receive weekly performance summaries</p>
                          </div>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={notificationSettings.weeklyReports}
                              onChange={(e) => setNotificationSettings({
                                ...notificationSettings,
                                weeklyReports: e.target.checked
                              })}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>

                        <div className="notification-item">
                          <div className="notification-info">
                            <h4>Marketing Emails</h4>
                            <p>Receive promotional content and feature updates</p>
                          </div>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={notificationSettings.marketingEmails}
                              onChange={(e) => setNotificationSettings({
                                ...notificationSettings,
                                marketingEmails: e.target.checked
                              })}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>

                      <button 
                        className="primary-button"
                        onClick={handleNotificationUpdate}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save Preferences'}
                      </button>
                    </motion.div>
                  )}

                  {/* WordPress Integration Tab */}
                  {activeTab === 'wordpress' && (
                    <motion.div
                      className="settings-section"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Suspense fallback={
                        <div style={{ 
                          padding: '60px 20px', 
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '16px'
                        }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            border: '3px solid #f3f4f6',
                            borderTop: '3px solid #f97316',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }}></div>
                          <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading WordPress Integration...</p>
                        </div>
                      }>
                        <WordPressIntegration />
                      </Suspense>
                    </motion.div>
                  )}

                  {/* Preferences Tab */}
                  {activeTab === 'preferences' && (
                    <motion.div
                      className="settings-section"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '24px' }}>
                        Application Preferences
                      </h2>
                      
                      <div className="preferences-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                        {/* Timezone Card */}
                        <div className="preference-card" style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
                          <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 8px 0', fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                            <Clock size={20} style={{ color: '#F97316' }} />
                            Timezone
                          </h4>
                          <p style={{ margin: '0 0 16px 0', fontFamily: 'Share Tech Mono, monospace', fontSize: '13px', color: '#6b7280' }}>
                            Your local timezone
                          </p>
                          <select 
                            value={preferenceSettings.timezone}
                            onChange={(e) => setPreferenceSettings({...preferenceSettings, timezone: e.target.value})}
                            className="preference-select" 
                            style={{ 
                              width: '100%', 
                              padding: '10px 14px', 
                              border: '2px solid #e5e7eb', 
                              borderRadius: '8px', 
                              background: '#ffffff', 
                              color: '#374151', 
                              fontFamily: 'Inter, sans-serif', 
                              fontSize: '14px', 
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = '#F97316'}
                            onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                          >
                            {timezones.map(tz => (
                              <option key={tz.value} value={tz.value}>{tz.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Dashboard Layout Card */}
                        <div className="preference-card" style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
                          <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 8px 0', fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                            <LayoutDashboard size={20} style={{ color: '#F97316' }} />
                            Dashboard Layout
                          </h4>
                          <p style={{ margin: '0 0 16px 0', fontFamily: 'Share Tech Mono, monospace', fontSize: '13px', color: '#6b7280' }}>
                            Default layout (fixed)
                          </p>
                          <select 
                            disabled
                            className="preference-select" 
                            style={{ 
                              width: '100%', 
                              padding: '10px 14px', 
                              border: '2px solid #e5e7eb', 
                              borderRadius: '8px', 
                              background: '#f9fafb', 
                              color: '#9ca3af', 
                              fontFamily: 'Inter, sans-serif', 
                              fontSize: '14px', 
                              cursor: 'not-allowed'
                            }}
                          >
                            <option value="default">Default</option>
                          </select>
                        </div>
                      </div>

                      {/* Save Button */}
                      <button 
                        className="primary-button"
                        onClick={handlePreferenceUpdate}
                        disabled={saving}
                        style={{
                          padding: '12px 32px',
                          background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '600',
                          fontSize: '14px',
                          cursor: saving ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s',
                          fontFamily: 'Inter, sans-serif',
                          opacity: saving ? 0.6 : 1
                        }}
                      >
                        {saving ? 'Saving...' : 'Save Preferences'}
                      </button>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  )
}

export default Settings
