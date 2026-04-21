import { Helmet } from 'react-helmet-async'
import { useState, useEffect, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { User, Lock, Bell, FileText, Settings as SettingsIcon, Loader2 } from 'lucide-react'
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { user, setUser, logout } = useAuthStore()

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
                      <h2>Application Preferences</h2>
                      
                      <div className="preferences-grid">
                        <div className="preference-card">
                          <h4>🌙 Theme</h4>
                          <p>Choose your preferred theme</p>
                          <select className="preference-select">
                            <option value="dark">Dark Mode</option>
                            <option value="light">Light Mode</option>
                            <option value="auto">Auto</option>
                          </select>
                        </div>

                        <div className="preference-card">
                          <h4>🌍 Language</h4>
                          <p>Select your language</p>
                          <select className="preference-select">
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                          </select>
                        </div>

                        <div className="preference-card">
                          <h4>⏰ Timezone</h4>
                          <p>Your local timezone</p>
                          <select className="preference-select">
                            <option value="UTC">UTC</option>
                            <option value="EST">Eastern Time</option>
                            <option value="PST">Pacific Time</option>
                          </select>
                        </div>

                        <div className="preference-card">
                          <h4>📊 Dashboard Layout</h4>
                          <p>Customize your dashboard</p>
                          <select className="preference-select">
                            <option value="default">Default</option>
                            <option value="compact">Compact</option>
                            <option value="detailed">Detailed</option>
                          </select>
                        </div>
                      </div>
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
