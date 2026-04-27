import { Helmet } from 'react-helmet-async'
import { useState, useEffect, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Plus, BarChart3, Globe, Eye, Loader2, RefreshCw, Search, Mail, Upload, FileText, Clock, MapPin, Zap, Instagram, Facebook, Youtube, Twitter, Linkedin, Music, Sparkles, TrendingUp, Users as UsersIcon, Calendar, Link2, Key, ExternalLink, Info, Trash2, RotateCcw, AlertTriangle } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { apiClient } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import '../../styles/animations.css'

// Lazy load WordPress components
const WordPressPublisher = lazy(() => import('../../components/WordPressPublisher'))

function Campaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [filteredCampaigns, setFilteredCampaigns] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(null) // Track which campaign is being updated
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showWordPressModal, setShowWordPressModal] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [showTrash, setShowTrash] = useState(false)
  const [trashedCampaigns, setTrashedCampaigns] = useState([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [campaignToDelete, setCampaignToDelete] = useState(null)
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    description: '',
    campaignType: 'CONTENT',
    targetAudience: 'ALL',
    startDate: '',
    endDate: '',
    status: 'DRAFT',
    scheduledTimes: [{ time: '09:00', isActive: true }], // Default single time
    // Content campaign specific
    publishDestination: 'NONE', // NONE, WORDPRESS, CUSTOM_WEBSITE
    wordpressUrl: '',
    wordpressUsername: '',
    wordpressAppPassword: '',
    customWebsiteUrl: '',
    customWebsiteApiKey: '',
    // Email campaign specific
    emailList: [],
    emailInputMethod: 'MANUAL', // MANUAL or CSV
    emailCsvText: '',
    emailScheduledTime: '09:00',
    emailThrottleRate: 100, // emails per hour
    emailTimezone: 'Asia/Kolkata',
    // Social campaign specific
    socialPlatforms: [],
    socialPostTimes: [{ time: '10:00', platforms: [] }],
    socialTimezone: 'Asia/Kolkata',
    // Multi-channel campaign specific
    multiChannelWorkflows: [
      {
        id: 1,
        day: 1,
        time: '09:00',
        channel: 'CONTENT',
        action: 'Publish blog article',
        condition: null
      }
    ],
    enabledChannels: ['CONTENT']
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const user = useAuthStore((state) => state.user)
  const [usageData, setUsageData] = useState(null)

  useEffect(() => {
    fetchUsageData()
  }, [])

  // Filter campaigns based on search and status
  useEffect(() => {
    let filtered = campaigns

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(campaign =>
        campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.campaignType.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by status
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(campaign => campaign.status === filterStatus)
    }

    setFilteredCampaigns(filtered)
  }, [campaigns, searchQuery, filterStatus])

  const fetchUsageData = async () => {
    try {
      console.log('🔄 Fetching usage data...');
      const response = await apiClient.get('/users/usage/current');
      console.log('📊 Usage data received:', response.data);
      setUsageData(response.data);
    } catch (error) {
      console.error('Error fetching usage data:', error);
    }
  };

  useEffect(() => {
    console.log('Current user from auth store:', user)
    if (user?.id) {
      fetchCampaigns()
    } else {
      console.log('No user found, redirecting to login')
      setError('Please log in to view your campaigns')
      setLoading(false)
    }
  }, [user])

  const fetchCampaigns = async () => {
    try {
      console.log('🔄 Fetching campaigns for user:', user?.email, 'ID:', user?.id)
      const response = await apiClient.get('/campaigns')
      console.log('✅ Campaigns response:', response.data)
      
      // Ensure we only show campaigns that belong to the current user
      const userCampaigns = response.data.campaigns || []
      console.log('📊 User campaigns count:', userCampaigns.length)
      
      setCampaigns(userCampaigns)
    } catch (error) {
      console.error('❌ Error fetching campaigns:', error)
      if (error.response?.status === 401) {
        setError('Please log in again to view your campaigns')
      } else {
        setError(error.response?.data?.error || 'Failed to load campaigns')
      }
      // Set empty array on error to prevent blank screen
      setCampaigns([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validate dates
    const today = new Date().toISOString().split('T')[0]
    
    if (newCampaign.startDate && newCampaign.startDate < today) {
      setError('Start date cannot be in the past')
      return
    }
    
    if (newCampaign.endDate && newCampaign.startDate && newCampaign.endDate < newCampaign.startDate) {
      setError('End date cannot be before start date')
      return
    }

    // Validate email campaign
    if (newCampaign.campaignType === 'EMAIL' && newCampaign.emailList.length === 0) {
      setError('Please add at least one email recipient for email campaigns')
      return
    }

    // Validate social campaign
    if (newCampaign.campaignType === 'SOCIAL' && newCampaign.socialPlatforms.length === 0) {
      setError('Please select at least one social media platform')
      return
    }

    // Check if it's a "Coming Soon" campaign
    if (isComingSoonCampaign()) {
      setError('This campaign type is coming soon! We\'ve saved your configuration and will notify you when it\'s available.')
      // Still allow saving the configuration
      setTimeout(() => {
        setError('')
        setSuccess('Campaign configuration saved! You\'ll be notified when this feature launches.')
        setTimeout(() => setSuccess(''), 5000)
      }, 3000)
      return
    }

    try {
      setCreating(true)
      
      // Prepare campaign data
      const campaignPayload = {
        title: newCampaign.title,
        description: newCampaign.description,
        campaignType: newCampaign.campaignType,
        targetAudience: newCampaign.targetAudience,
        startDate: newCampaign.startDate,
        endDate: newCampaign.endDate
      }

      // Add content campaign specific data
      if (newCampaign.campaignType === 'CONTENT') {
        campaignPayload.scheduledTimes = newCampaign.scheduledTimes
        campaignPayload.publishDestination = newCampaign.publishDestination
        
        if (newCampaign.publishDestination === 'WORDPRESS') {
          campaignPayload.wordpressConfig = {
            url: newCampaign.wordpressUrl,
            username: newCampaign.wordpressUsername,
            appPassword: newCampaign.wordpressAppPassword
          }
        } else if (newCampaign.publishDestination === 'CUSTOM_WEBSITE') {
          campaignPayload.customWebsiteConfig = {
            url: newCampaign.customWebsiteUrl,
            apiKey: newCampaign.customWebsiteApiKey
          }
        }
      }

      // Add email campaign specific data
      if (newCampaign.campaignType === 'EMAIL') {
        campaignPayload.emailList = newCampaign.emailList
        campaignPayload.emailScheduledTime = newCampaign.emailScheduledTime
        campaignPayload.emailThrottleRate = newCampaign.emailThrottleRate
        campaignPayload.emailTimezone = newCampaign.emailTimezone
      }

      // Add social campaign specific data
      if (newCampaign.campaignType === 'SOCIAL') {
        campaignPayload.socialPlatforms = newCampaign.socialPlatforms
        campaignPayload.socialPostTimes = newCampaign.socialPostTimes
        campaignPayload.socialTimezone = newCampaign.socialTimezone
      }

      const response = await apiClient.post('/campaigns', campaignPayload)
      
      // Add the new campaign to the list immediately
      setCampaigns([response.data.campaign, ...campaigns])
      
      // Refresh usage data
      await fetchUsageData()
      
      // Reset form
      setNewCampaign({
        title: '',
        description: '',
        campaignType: 'CONTENT',
        targetAudience: 'ALL',
        startDate: '',
        endDate: '',
        status: 'DRAFT',
        scheduledTimes: [{ time: '09:00', isActive: true }],
        publishDestination: 'NONE',
        wordpressUrl: '',
        wordpressUsername: '',
        wordpressAppPassword: '',
        customWebsiteUrl: '',
        customWebsiteApiKey: '',
        emailList: [],
        emailInputMethod: 'MANUAL',
        emailCsvText: '',
        emailScheduledTime: '09:00',
        emailThrottleRate: 100,
        emailTimezone: 'Asia/Kolkata',
        socialPlatforms: [],
        socialPostTimes: [{ time: '10:00', platforms: [] }],
        socialTimezone: 'Asia/Kolkata',
        multiChannelWorkflows: [
          {
            id: 1,
            day: 1,
            time: '09:00',
            channel: 'CONTENT',
            action: 'Publish blog article',
            condition: null
          }
        ],
        enabledChannels: ['CONTENT']
      })
      
      // Close modal and show success
      setShowCreateModal(false)
      setSuccess('Campaign created successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
      
    } catch (error) {
      console.error('Campaign creation error:', error)
      setError(error.response?.data?.error || 'Failed to create campaign')
    } finally {
      setCreating(false)
    }
  }

  const handleStatusChange = async (campaignId, newStatus) => {
    try {
      setError('') // Clear any existing errors
      setUpdatingStatus(campaignId) // Show loading state for this campaign
      
      console.log('Updating campaign status:', { 
        campaignId, 
        newStatus, 
        currentUser: user?.email,
        currentUserId: user?.id 
      })
      
      const response = await apiClient.patch(`/campaigns/${campaignId}`, { status: newStatus })
      
      console.log('Status update response:', response.data)
      
      // Update the campaign in the local state with the response data
      setCampaigns(campaigns.map(campaign => 
        campaign._id === campaignId 
          ? { ...campaign, ...response.data }
          : campaign
      ))
      
      setSuccess(`Campaign status updated to ${newStatus}!`)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
      
    } catch (error) {
      console.error('Status update error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method,
        campaignId,
        currentUser: user?.email
      })
      
      let errorMessage = 'Failed to update campaign status'
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.response?.status === 404) {
        errorMessage = 'Campaign not found - it may have been deleted or you may not have access to it'
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to update this campaign'
      } else if (error.response?.status === 401) {
        errorMessage = 'Please log in again to continue'
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error - please check your connection and server status'
      }
      
      setError(errorMessage)
      
      // Clear error message after 5 seconds
      setTimeout(() => setError(''), 5000)
    } finally {
      setUpdatingStatus(null) // Clear loading state
    }
  }

  const handleBulkPublishToWordPress = (campaign) => {
    setSelectedCampaign(campaign)
    setShowWordPressModal(true)
  }

  const handleWordPressPublishSuccess = (result) => {
    setShowWordPressModal(false)
    setSelectedCampaign(null)
    // Refresh campaigns to show updated article counts
    fetchCampaigns()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'RUNNING': return '#F97316'
      case 'PAUSED': return '#f59e0b'
      case 'COMPLETED': return '#6b7280'
      case 'DRAFT': return '#3b82f6'
      case 'SCHEDULED': return '#8b5cf6'
      default: return '#6b7280'
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatAgeRange = (ageRange) => {
    const ageLabels = {
      'ALL': 'All Ages',
      '13-17': 'Teens (13-17)',
      '18-24': 'Young Adults (18-24)',
      '25-34': 'Adults (25-34)',
      '35-44': 'Mid Adults (35-44)',
      '45-54': 'Mature Adults (45-54)',
      '55-64': 'Pre-Seniors (55-64)',
      '65+': 'Seniors (65+)'
    }
    return ageLabels[ageRange] || ageRange
  }

  // Parse CSV email data
  const parseEmailCsv = (csvText) => {
    const lines = csvText.trim().split('\n')
    const emails = []
    
    lines.forEach((line, index) => {
      // Skip header row if it exists
      if (index === 0 && (line.toLowerCase().includes('email') || line.toLowerCase().includes('name'))) {
        return
      }
      
      const parts = line.split(',').map(p => p.trim())
      if (parts.length > 0 && parts[0]) {
        const email = parts[0].replace(/['"]/g, '') // Remove quotes
        const name = parts.length > 1 ? parts[1].replace(/['"]/g, '') : ''
        
        // Basic email validation
        if (email.includes('@') && email.includes('.')) {
          emails.push({ email, name })
        }
      }
    })
    
    return emails
  }

  // Add manual email
  const addManualEmail = (email, name = '') => {
    if (email && email.includes('@') && email.includes('.')) {
      setNewCampaign({
        ...newCampaign,
        emailList: [...newCampaign.emailList, { email, name }]
      })
      return true
    }
    return false
  }

  // Remove email from list
  const removeEmail = (index) => {
    const updatedList = newCampaign.emailList.filter((_, i) => i !== index)
    setNewCampaign({ ...newCampaign, emailList: updatedList })
  }

  // Process CSV paste
  const handleCsvPaste = () => {
    const parsed = parseEmailCsv(newCampaign.emailCsvText)
    if (parsed.length > 0) {
      setNewCampaign({
        ...newCampaign,
        emailList: [...newCampaign.emailList, ...parsed],
        emailCsvText: ''
      })
      setSuccess(`Added ${parsed.length} email(s) successfully!`)
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setError('No valid emails found in CSV data')
      setTimeout(() => setError(''), 3000)
    }
  }

  // Comprehensive timezone list
  const timezones = [
    // Americas
    { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
    { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
    { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
    { value: 'America/Anchorage', label: 'Alaska' },
    { value: 'Pacific/Honolulu', label: 'Hawaii' },
    { value: 'America/Toronto', label: 'Toronto' },
    { value: 'America/Vancouver', label: 'Vancouver' },
    { value: 'America/Mexico_City', label: 'Mexico City' },
    { value: 'America/Sao_Paulo', label: 'São Paulo' },
    { value: 'America/Buenos_Aires', label: 'Buenos Aires' },
    { value: 'America/Lima', label: 'Lima' },
    { value: 'America/Bogota', label: 'Bogotá' },
    { value: 'America/Santiago', label: 'Santiago' },
    
    // Europe
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Europe/Berlin', label: 'Berlin' },
    { value: 'Europe/Rome', label: 'Rome' },
    { value: 'Europe/Madrid', label: 'Madrid' },
    { value: 'Europe/Amsterdam', label: 'Amsterdam' },
    { value: 'Europe/Brussels', label: 'Brussels' },
    { value: 'Europe/Vienna', label: 'Vienna' },
    { value: 'Europe/Warsaw', label: 'Warsaw' },
    { value: 'Europe/Prague', label: 'Prague' },
    { value: 'Europe/Budapest', label: 'Budapest' },
    { value: 'Europe/Athens', label: 'Athens' },
    { value: 'Europe/Istanbul', label: 'Istanbul' },
    { value: 'Europe/Moscow', label: 'Moscow' },
    { value: 'Europe/Stockholm', label: 'Stockholm' },
    { value: 'Europe/Oslo', label: 'Oslo' },
    { value: 'Europe/Copenhagen', label: 'Copenhagen' },
    { value: 'Europe/Helsinki', label: 'Helsinki' },
    { value: 'Europe/Dublin', label: 'Dublin' },
    { value: 'Europe/Lisbon', label: 'Lisbon' },
    
    // Asia
    { value: 'Asia/Dubai', label: 'Dubai' },
    { value: 'Asia/Kolkata', label: 'India (IST)' },
    { value: 'Asia/Karachi', label: 'Karachi' },
    { value: 'Asia/Dhaka', label: 'Dhaka' },
    { value: 'Asia/Bangkok', label: 'Bangkok' },
    { value: 'Asia/Singapore', label: 'Singapore' },
    { value: 'Asia/Hong_Kong', label: 'Hong Kong' },
    { value: 'Asia/Shanghai', label: 'Beijing/Shanghai' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'Asia/Seoul', label: 'Seoul' },
    { value: 'Asia/Jakarta', label: 'Jakarta' },
    { value: 'Asia/Manila', label: 'Manila' },
    { value: 'Asia/Kuala_Lumpur', label: 'Kuala Lumpur' },
    { value: 'Asia/Taipei', label: 'Taipei' },
    { value: 'Asia/Ho_Chi_Minh', label: 'Ho Chi Minh' },
    { value: 'Asia/Riyadh', label: 'Riyadh' },
    { value: 'Asia/Tehran', label: 'Tehran' },
    { value: 'Asia/Jerusalem', label: 'Jerusalem' },
    { value: 'Asia/Beirut', label: 'Beirut' },
    { value: 'Asia/Baghdad', label: 'Baghdad' },
    { value: 'Asia/Kabul', label: 'Kabul' },
    { value: 'Asia/Tashkent', label: 'Tashkent' },
    { value: 'Asia/Almaty', label: 'Almaty' },
    
    // Oceania
    { value: 'Australia/Sydney', label: 'Sydney' },
    { value: 'Australia/Melbourne', label: 'Melbourne' },
    { value: 'Australia/Brisbane', label: 'Brisbane' },
    { value: 'Australia/Perth', label: 'Perth' },
    { value: 'Australia/Adelaide', label: 'Adelaide' },
    { value: 'Pacific/Auckland', label: 'Auckland' },
    { value: 'Pacific/Fiji', label: 'Fiji' },
    
    // Africa
    { value: 'Africa/Cairo', label: 'Cairo' },
    { value: 'Africa/Johannesburg', label: 'Johannesburg' },
    { value: 'Africa/Lagos', label: 'Lagos' },
    { value: 'Africa/Nairobi', label: 'Nairobi' },
    { value: 'Africa/Casablanca', label: 'Casablanca' },
    { value: 'Africa/Algiers', label: 'Algiers' },
    { value: 'Africa/Tunis', label: 'Tunis' },
    { value: 'Africa/Accra', label: 'Accra' },
    { value: 'Africa/Addis_Ababa', label: 'Addis Ababa' },
    { value: 'Africa/Dar_es_Salaam', label: 'Dar es Salaam' },
    
    // Atlantic
    { value: 'Atlantic/Reykjavik', label: 'Reykjavik' },
    { value: 'Atlantic/Azores', label: 'Azores' },
    
    // UTC
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' }
  ].sort((a, b) => a.label.localeCompare(b.label))

  // Social media platforms
  const socialPlatforms = [
    { 
      id: 'INSTAGRAM', 
      name: 'Instagram', 
      icon: Instagram,
      color: '#E4405F',
      description: 'Share photos and stories'
    },
    { 
      id: 'FACEBOOK', 
      name: 'Facebook', 
      icon: Facebook,
      color: '#1877F2',
      description: 'Connect with your audience'
    },
    { 
      id: 'YOUTUBE', 
      name: 'YouTube', 
      icon: Youtube,
      color: '#FF0000',
      description: 'Upload and share videos'
    },
    { 
      id: 'TWITTER', 
      name: 'X (Twitter)', 
      icon: Twitter,
      color: '#000000',
      description: 'Post tweets and updates'
    },
    { 
      id: 'LINKEDIN', 
      name: 'LinkedIn', 
      icon: Linkedin,
      color: '#0A66C2',
      description: 'Professional networking'
    },
    { 
      id: 'TIKTOK', 
      name: 'TikTok', 
      icon: Music,
      color: '#000000',
      description: 'Short-form video content'
    }
  ]

  // Toggle social platform selection
  const toggleSocialPlatform = (platformId) => {
    const platforms = [...newCampaign.socialPlatforms]
    const index = platforms.indexOf(platformId)
    
    if (index > -1) {
      platforms.splice(index, 1)
    } else {
      platforms.push(platformId)
    }
    
    setNewCampaign({ ...newCampaign, socialPlatforms: platforms })
  }

  // Add social post time
  const addSocialPostTime = () => {
    setNewCampaign({
      ...newCampaign,
      socialPostTimes: [...newCampaign.socialPostTimes, { time: '12:00', platforms: [] }]
    })
  }

  // Remove social post time
  const removeSocialPostTime = (index) => {
    const times = newCampaign.socialPostTimes.filter((_, i) => i !== index)
    setNewCampaign({ ...newCampaign, socialPostTimes: times })
  }

  // Update social post time
  const updateSocialPostTime = (index, time) => {
    const times = [...newCampaign.socialPostTimes]
    times[index].time = time
    setNewCampaign({ ...newCampaign, socialPostTimes: times })
  }

  // Toggle platform for specific post time
  const togglePlatformForPostTime = (timeIndex, platformId) => {
    const times = [...newCampaign.socialPostTimes]
    const platforms = times[timeIndex].platforms || []
    const index = platforms.indexOf(platformId)
    
    if (index > -1) {
      platforms.splice(index, 1)
    } else {
      platforms.push(platformId)
    }
    
    times[timeIndex].platforms = platforms
    setNewCampaign({ ...newCampaign, socialPostTimes: times })
  }

  // Multi-channel workflow helpers
  const addWorkflowStep = () => {
    const newId = Math.max(...newCampaign.multiChannelWorkflows.map(w => w.id), 0) + 1
    setNewCampaign({
      ...newCampaign,
      multiChannelWorkflows: [
        ...newCampaign.multiChannelWorkflows,
        {
          id: newId,
          day: 1,
          time: '09:00',
          channel: 'CONTENT',
          action: '',
          condition: null
        }
      ]
    })
  }

  const removeWorkflowStep = (id) => {
    setNewCampaign({
      ...newCampaign,
      multiChannelWorkflows: newCampaign.multiChannelWorkflows.filter(w => w.id !== id)
    })
  }

  const updateWorkflowStep = (id, field, value) => {
    setNewCampaign({
      ...newCampaign,
      multiChannelWorkflows: newCampaign.multiChannelWorkflows.map(w =>
        w.id === id ? { ...w, [field]: value } : w
      )
    })
  }

  const toggleMultiChannel = (channel) => {
    const channels = [...newCampaign.enabledChannels]
    const index = channels.indexOf(channel)
    
    if (index > -1) {
      channels.splice(index, 1)
    } else {
      channels.push(channel)
    }
    
    setNewCampaign({ ...newCampaign, enabledChannels: channels })
  }

  // Check if campaign type is "Coming Soon"
  const isComingSoonCampaign = () => {
    return ['SOCIAL', 'MULTI_CHANNEL'].includes(newCampaign.campaignType)
  }

  // Fetch trashed campaigns
  const fetchTrashedCampaigns = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/campaigns/trash/list')
      setTrashedCampaigns(response.data.campaigns || [])
    } catch (error) {
      console.error('Error fetching trashed campaigns:', error)
      setError('Failed to load trashed campaigns')
    } finally {
      setLoading(false)
    }
  }

  // Move campaign to trash
  const moveCampaignToTrash = async (campaignId) => {
    try {
      console.log('🗑️ Moving campaign to trash:', campaignId)
      const response = await apiClient.delete(`/campaigns/${campaignId}/trash`)
      console.log('✅ Campaign moved to trash successfully:', response.data)
      
      // Remove from active campaigns list
      setCampaigns(campaigns.filter(c => c._id !== campaignId))
      
      // Update usage data
      await fetchUsageData()
      
      setSuccess('Campaign moved to trash')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('❌ Error moving campaign to trash:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      setError(error.response?.data?.error || 'Failed to move campaign to trash')
      setTimeout(() => setError(''), 3000)
    }
  }

  // Restore campaign from trash
  const restoreCampaign = async (campaignId) => {
    try {
      console.log('♻️ Restoring campaign from trash:', campaignId)
      const response = await apiClient.post(`/campaigns/${campaignId}/restore`)
      console.log('✅ Campaign restored successfully:', response.data)
      
      setTrashedCampaigns(trashedCampaigns.filter(c => c._id !== campaignId))
      setSuccess('Campaign restored successfully')
      setTimeout(() => setSuccess(''), 3000)
      
      // Refresh active campaigns and usage data
      await fetchCampaigns()
      await fetchUsageData()
    } catch (error) {
      console.error('❌ Error restoring campaign:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      setError(error.response?.data?.error || 'Failed to restore campaign')
      setTimeout(() => setError(''), 3000)
    }
  }

  // Permanently delete campaign
  const permanentlyDeleteCampaign = async (campaignId) => {
    try {
      console.log('🗑️ Permanently deleting campaign:', campaignId)
      const response = await apiClient.delete(`/campaigns/${campaignId}/permanent`)
      console.log('✅ Campaign permanently deleted:', response.data)
      
      setTrashedCampaigns(trashedCampaigns.filter(c => c._id !== campaignId))
      setSuccess('Campaign permanently deleted')
      setTimeout(() => setSuccess(''), 3000)
      setShowDeleteConfirm(false)
      setCampaignToDelete(null)
      
      // Update usage data
      await fetchUsageData()
    } catch (error) {
      console.error('❌ Error permanently deleting campaign:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      setError(error.response?.data?.error || 'Failed to permanently delete campaign')
      setTimeout(() => setError(''), 3000)
    }
  }

  // Empty trash
  const emptyTrash = async () => {
    if (!confirm('Are you sure you want to permanently delete all trashed campaigns? This action cannot be undone.')) {
      return
    }
    
    try {
      console.log('🗑️ Emptying trash...')
      const response = await apiClient.delete('/campaigns/trash/empty')
      console.log('✅ Trash emptied successfully:', response.data)
      
      setTrashedCampaigns([])
      setSuccess('Trash emptied successfully')
      setTimeout(() => setSuccess(''), 3000)
      
      // Update usage data
      await fetchUsageData()
    } catch (error) {
      console.error('❌ Error emptying trash:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      setError(error.response?.data?.error || 'Failed to empty trash')
      setTimeout(() => setError(''), 3000)
    }
  }

  // Toggle trash view
  const toggleTrashView = () => {
    if (!showTrash) {
      fetchTrashedCampaigns()
    }
    setShowTrash(!showTrash)
  }

  return (
    <>
      <Helmet>
        <title>Campaigns - SUBSTATE</title>
        <meta name="description" content="Manage and create marketing campaigns." />
      </Helmet>

      <DashboardLayout>
        <div className="dashboard-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
          <div className="dashboard-header" style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: '28px', fontWeight: '800', color: '#111827', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                Campaigns
              </h1>
              <p style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '15px', color: '#6b7280', marginBottom: 0 }}>
                Create and manage your marketing campaigns
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button 
                className="primary-button"
                onClick={() => {
                  // Check if user has reached limit
                  if (usageData && usageData.limits && usageData.limits.campaigns !== -1 && usageData.usage.campaigns >= usageData.limits.campaigns) {
                    setError(`You've reached your campaign limit (${usageData.limits.campaigns}). Please upgrade your plan to create more campaigns.`)
                    // Scroll to top to show error
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  } else {
                    setShowCreateModal(true)
                  }
                }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: '600',
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: usageData && usageData.limits.campaigns !== -1 && usageData.usage.campaigns >= usageData.limits.campaigns ? 'not-allowed' : 'pointer',
                  opacity: usageData && usageData.limits.campaigns !== -1 && usageData.usage.campaigns >= usageData.limits.campaigns ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(249, 115, 22, 0.25)',
                  flexShrink: 0
                }}
              >
                <Plus size={20} />
                Create Campaign
              </button>
            </div>
          </div>

          {/* Usage Stats Row */}
          {usageData && (
            <div style={{ 
              marginBottom: '24px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '8px 16px',
                  background: usageData.usage.campaigns >= usageData.limits.campaigns && usageData.limits.campaigns !== -1 ? '#fee2e2' : '#fff7ed',
                  border: `1px solid ${usageData.usage.campaigns >= usageData.limits.campaigns && usageData.limits.campaigns !== -1 ? '#fecaca' : '#fed7aa'}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: usageData.usage.campaigns >= usageData.limits.campaigns && usageData.limits.campaigns !== -1 ? '#991b1b' : '#ea580c',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  <BarChart3 size={16} />
                  <span>
                    {usageData.usage.campaigns} / {usageData.limits.campaigns === -1 ? '∞' : usageData.limits.campaigns} campaigns used
                    {usageData.limits.campaigns === -1 && ' (Unlimited)'}
                  </span>
                </div>
                <button
                  onClick={fetchUsageData}
                  style={{
                    padding: '8px',
                    background: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  title="Refresh usage data"
                >
                  <RefreshCw size={16} color="#6b7280" />
                </button>
              </div>
              <button 
                onClick={toggleTrashView}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  fontWeight: '600',
                  padding: '8px 16px',
                  background: 'white',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: 'none'
                }}
              >
                {showTrash ? (
                  <>
                    <span style={{ fontSize: '16px' }}>←</span>
                    <span>Back to Campaigns</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Trash</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Search and Filter Bar */}
          <div style={{
            marginBottom: '24px',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            {/* Search Input */}
            <div style={{
              position: 'relative',
              flex: '1 1 300px',
              minWidth: '250px'
            }}>
              <Search 
                size={18} 
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                  pointerEvents: 'none'
                }}
              />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 44px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'Inter, sans-serif',
                  color: '#374151',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#F97316'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: '600',
                color: '#374151',
                background: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
                outline: 'none',
                minWidth: '180px'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#F97316'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            >
              <option value="ALL">All Campaigns</option>
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="RUNNING">Running</option>
              <option value="PAUSED">Paused</option>
              <option value="COMPLETED">Completed</option>
            </select>

            {/* Results Count */}
            {(searchQuery || filterStatus !== 'ALL') && (
              <>
                <div style={{
                  padding: '12px 16px',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'Inter, sans-serif',
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                  {filteredCampaigns.length} result{filteredCampaigns.length !== 1 ? 's' : ''} found
                </div>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setFilterStatus('ALL')
                  }}
                  style={{
                    padding: '12px 16px',
                    background: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: '600',
                    color: '#6b7280',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#F97316'
                    e.currentTarget.style.color = '#F97316'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb'
                    e.currentTarget.style.color = '#6b7280'
                  }}
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>

          {error && (
            <div className="error-message" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>{error}</span>
              {error.includes('upgrade') && (
                <button 
                  onClick={() => window.location.href = '/dashboard/subscription'}
                  style={{
                    background: 'white',
                    color: '#ef4444',
                    border: '2px solid white',
                    padding: '6px 16px',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '14px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Upgrade Now
                </button>
              )}
            </div>
          )}

          {success && (
            <div className="success-message" style={{ marginBottom: '20px' }}>
              {success}
            </div>
          )}

          {loading ? (
            <div className="loading-state">
              <Loader2 className="loading-spinner" size={40} style={{ animation: 'spin 1s linear infinite' }} />
              <p>Loading campaigns...</p>
            </div>
          ) : (
            <>
              {/* Trash View Header */}
              {showTrash && (
                <div style={{
                  background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      background: '#fee2e2',
                      padding: '10px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Trash2 size={24} color="#dc2626" />
                    </div>
                    <div>
                      <h3 style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#111827',
                        margin: 0,
                        marginBottom: '4px'
                      }}>
                        Trash Bin
                      </h3>
                      <p style={{
                        fontFamily: 'Share Tech Mono, monospace',
                        fontSize: '13px',
                        color: '#6b7280',
                        margin: 0
                      }}>
                        {trashedCampaigns.length} campaign{trashedCampaigns.length !== 1 ? 's' : ''} in trash
                      </p>
                    </div>
                  </div>
                  {trashedCampaigns.length > 0 && (
                    <button
                      onClick={emptyTrash}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        fontWeight: '600',
                        padding: '10px 18px',
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#fee2e2'
                        e.target.style.borderColor = '#fca5a5'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#fef2f2'
                        e.target.style.borderColor = '#fecaca'
                      }}
                    >
                      <AlertTriangle size={18} />
                      Empty Trash
                    </button>
                  )}
                </div>
              )}

              <div className="campaigns-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '20px',
                width: '100%'
              }}>
              {/* Show different campaigns based on trash view */}
              {(showTrash ? trashedCampaigns : filteredCampaigns).length === 0 ? (
                <div style={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '400px'
                }}>
                  <div className="empty-state" style={{
                    maxWidth: '600px',
                    width: '100%',
                    background: '#ffffff',
                    border: '2px solid #e5e7eb',
                    borderRadius: '16px',
                    padding: '60px 40px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    textAlign: 'center'
                  }}>
                    <BarChart3 size={64} style={{ color: '#9ca3af', marginBottom: '24px', opacity: 0.5 }} />
                    <h3 style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '28px',
                      fontWeight: '800',
                      color: '#111827',
                      marginBottom: '12px'
                    }}>
                      {showTrash ? 'Trash is empty' : (searchQuery || filterStatus !== 'ALL' ? 'No campaigns found' : 'No campaigns yet')}
                    </h3>
                    <p style={{
                      fontFamily: 'Share Tech Mono, monospace',
                      fontSize: '16px',
                      color: '#6b7280',
                      marginBottom: '32px',
                      lineHeight: '1.6'
                    }}>
                      {showTrash ? 'No deleted campaigns to display' : (searchQuery || filterStatus !== 'ALL' ? 'Try adjusting your search or filter' : 'Create your first campaign to start tracking performance')}
                    </p>
                    {!showTrash && (
                      <button 
                        className="primary-button"
                        onClick={() => {
                          if (usageData && usageData.limits.campaigns !== -1 && usageData.usage.campaigns >= usageData.limits.campaigns) {
                            setError(`You've reached your campaign limit (${usageData.limits.campaigns}). Please upgrade your plan to create more campaigns.`)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          } else {
                            setShowCreateModal(true)
                          }
                        }}
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '10px',
                          padding: '14px 32px',
                          background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '16px',
                          fontWeight: '600',
                          fontFamily: 'Inter, sans-serif',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                          opacity: usageData && usageData.limits.campaigns !== -1 && usageData.usage.campaigns >= usageData.limits.campaigns ? 0.6 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (!usageData || usageData.limits.campaigns === -1 || usageData.usage.campaigns < usageData.limits.campaigns) {
                            e.target.style.transform = 'translateY(-2px)'
                            e.target.style.boxShadow = '0 6px 20px rgba(249, 115, 22, 0.4)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)'
                          e.target.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.3)'
                        }}
                      >
                        <Plus size={20} />
                        Create Your First Campaign
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                (showTrash ? trashedCampaigns : filteredCampaigns).map((campaign, index) => (
                  <motion.div
                    key={campaign._id}
                    className="campaign-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    style={{
                      background: showTrash ? '#fafafa' : '#ffffff',
                      border: showTrash ? '1px solid #e5e7eb' : '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '20px',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      opacity: showTrash ? 0.95 : 1
                    }}
                  >
                    <div className="campaign-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                      <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0, flex: 1 }}>
                        {campaign.title}
                      </h3>
                      <div 
                        className="status-badge"
                        style={{ 
                          backgroundColor: getStatusColor(campaign.status),
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          fontFamily: 'Inter, sans-serif'
                        }}
                      >
                        {campaign.status}
                      </div>
                    </div>
                    
                    <p className="campaign-description" style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '14px', color: '#6b7280', marginBottom: '18px', lineHeight: '1.6' }}>
                      {campaign.description}
                    </p>
                    
                    <div className="campaign-metrics" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '12px', marginBottom: '18px', padding: '14px', background: '#f9fafb', borderRadius: '8px', justifyContent: 'space-between' }}>
                      <div className="metric" style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1', minWidth: '120px' }}>
                        <span className="metric-label" style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TYPE</span>
                        <span className="metric-value" style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '14px', color: '#111827', fontWeight: '700' }}>{campaign.campaignType}</span>
                      </div>
                      <div className="metric" style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1', minWidth: '120px' }}>
                        <span className="metric-label" style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TARGET AUDIENCE</span>
                        <span className="metric-value" style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '14px', color: '#111827', fontWeight: '700' }}>{formatAgeRange(campaign.targetAudience)}</span>
                      </div>
                      <div className="metric" style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1', minWidth: '120px' }}>
                        <span className="metric-label" style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ARTICLES GENERATED</span>
                        <span className="metric-value" style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '14px', color: '#111827', fontWeight: '700' }}>{campaign.articlesGenerated || 0}</span>
                      </div>
                    </div>

                    <div className="campaign-actions" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                      {showTrash ? (
                        // Trash view - Show Restore and Delete buttons with professional styling
                        <>
                          <button 
                            onClick={() => restoreCampaign(campaign._id)}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              gap: '8px',
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '14px',
                              fontWeight: '600',
                              padding: '12px 16px',
                              background: '#F97316',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              width: '100%'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#EA580C'}
                            onMouseLeave={(e) => e.target.style.background = '#F97316'}
                          >
                            <RotateCcw size={18} />
                            Restore Campaign
                          </button>
                          <button 
                            onClick={() => {
                              setCampaignToDelete(campaign._id)
                              setShowDeleteConfirm(true)
                            }}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              gap: '8px',
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '14px',
                              fontWeight: '600',
                              padding: '12px 16px',
                              background: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              width: '100%'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#fee2e2'
                              e.target.style.borderColor = '#fca5a5'
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = '#fef2f2'
                              e.target.style.borderColor = '#fecaca'
                            }}
                          >
                            <Trash2 size={18} />
                            Delete Permanently
                          </button>
                        </>
                      ) : (
                        // Active campaigns view - Show normal buttons
                        <>
                          <select
                            value={campaign.status}
                            onChange={(e) => handleStatusChange(campaign._id, e.target.value)}
                            className="status-select"
                            disabled={updatingStatus === campaign._id}
                            style={{
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '13px',
                              fontWeight: '600',
                              padding: '8px 12px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              background: '#ffffff',
                              color: '#374151',
                              cursor: 'pointer',
                              width: '100%'
                            }}
                          >
                            <option value="DRAFT">Draft</option>
                            <option value="SCHEDULED">Scheduled</option>
                            <option value="RUNNING">Running</option>
                            <option value="PAUSED">Paused</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                          {updatingStatus === campaign._id && (
                            <span className="updating-indicator" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#F97316', fontStyle: 'italic', textAlign: 'center' }}>Updating...</span>
                          )}
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="wordpress-button"
                              onClick={() => handleBulkPublishToWordPress(campaign)}
                              title="Bulk publish all articles to WordPress"
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                gap: '6px',
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '13px',
                                fontWeight: '600',
                                padding: '8px 14px',
                                background: '#111827',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                flex: 1
                              }}
                            >
                              <Globe size={16} />
                              Bulk Publish
                            </button>
                            <button 
                              className="secondary-button" 
                              onClick={() => window.location.href = `/dashboard/campaigns/${campaign._id}`}
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                gap: '6px',
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '13px',
                                fontWeight: '600',
                                padding: '8px 14px',
                                background: '#f9fafb',
                                color: '#374151',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                flex: 1
                              }}
                            >
                              <Eye size={16} />
                              View Dashboard
                            </button>
                          </div>
                          <button 
                            onClick={() => moveCampaignToTrash(campaign._id)}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              gap: '6px',
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '13px',
                              fontWeight: '600',
                              padding: '8px 14px',
                              background: '#fee2e2',
                              color: '#dc2626',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              width: '100%'
                            }}
                          >
                            <Trash2 size={16} />
                            Move to Trash
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            </>
          )}

          {/* Create Campaign Modal */}
          {showCreateModal && (
            <div 
              className="modal-overlay" 
              onClick={() => setShowCreateModal(false)} 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px'
              }}
            >
              <div 
                className="modal-content" 
                onClick={(e) => e.stopPropagation()} 
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  maxWidth: '550px',
                  width: '100%',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                <div 
                  className="modal-header" 
                  style={{
                    padding: '24px 24px 20px 24px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <h2 style={{
                    margin: 0,
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#111827',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Create New Campaign
                  </h2>
                  <button 
                    className="close-button"
                    onClick={() => setShowCreateModal(false)}
                    style={{
                      background: '#111827',
                      border: 'none',
                      fontSize: '28px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      padding: '0',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#374151'
                      e.currentTarget.style.color = '#ffffff'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#111827'
                      e.currentTarget.style.color = '#ffffff'
                    }}
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleCreateCampaign} style={{ padding: '24px' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Campaign Title
                    </label>
                    <input
                      type="text"
                      value={newCampaign.title}
                      onChange={(e) => setNewCampaign({...newCampaign, title: e.target.value})}
                      placeholder="Enter campaign title"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'Inter, sans-serif',
                        color: '#111827',
                        transition: 'all 0.2s',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#F97316'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      Description
                    </label>
                    <textarea
                      value={newCampaign.description}
                      onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
                      placeholder="Describe your campaign"
                      rows="3"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'Inter, sans-serif',
                        color: '#111827',
                        transition: 'all 0.2s',
                        outline: 'none',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#F97316'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        Campaign Type
                      </label>
                      <select
                        value={newCampaign.campaignType}
                        onChange={(e) => setNewCampaign({...newCampaign, campaignType: e.target.value})}
                        required
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontFamily: 'Inter, sans-serif',
                          color: '#111827',
                          background: 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#F97316'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                      >
                        <option value="EMAIL">Email Campaign</option>
                        <option value="CONTENT">Content Campaign</option>
                        <option value="SOCIAL">Social Media</option>
                        <option value="MULTI_CHANNEL">Multi-Channel</option>
                      </select>
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        Target Audience
                      </label>
                      <select
                        value={newCampaign.targetAudience}
                        onChange={(e) => setNewCampaign({...newCampaign, targetAudience: e.target.value})}
                        required
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontFamily: 'Inter, sans-serif',
                          color: '#111827',
                          background: 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#F97316'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                      >
                        <option value="ALL">All Ages</option>
                        <option value="13-17">Ages 13-17 (Teens)</option>
                        <option value="18-24">Ages 18-24 (Young Adults)</option>
                        <option value="25-34">Ages 25-34 (Adults)</option>
                        <option value="35-44">Ages 35-44 (Mid Adults)</option>
                        <option value="45-54">Ages 45-54 (Mature Adults)</option>
                        <option value="55-64">Ages 55-64 (Pre-Seniors)</option>
                        <option value="65+">Ages 65+ (Seniors)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={newCampaign.startDate}
                        onChange={(e) => setNewCampaign({...newCampaign, startDate: e.target.value})}
                        min={new Date().toISOString().split('T')[0]}
                        max="2030-12-31"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontFamily: 'Inter, sans-serif',
                          color: '#111827',
                          transition: 'all 0.2s',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#F97316'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                      />
                      <small style={{
                        display: 'block',
                        marginTop: '6px',
                        fontSize: '12px',
                        color: '#6b7280',
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        Campaign can only start today or in the future
                      </small>
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        End Date
                      </label>
                      <input
                        type="date"
                        value={newCampaign.endDate}
                        onChange={(e) => setNewCampaign({...newCampaign, endDate: e.target.value})}
                        min={newCampaign.startDate || new Date().toISOString().split('T')[0]}
                        max="2030-12-31"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontFamily: 'Inter, sans-serif',
                          color: '#111827',
                          transition: 'all 0.2s',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#F97316'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                      />
                      <small style={{
                        display: 'block',
                        marginTop: '6px',
                        fontSize: '12px',
                        color: '#6b7280',
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        End date must be after start date
                      </small>
                    </div>
                  </div>

                  {/* Scheduling Times Section - Only for CONTENT campaigns */}
                  {newCampaign.campaignType === 'CONTENT' && (
                    <div style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <label style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#374151',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          Publishing Schedule Times
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setNewCampaign({
                              ...newCampaign,
                              scheduledTimes: [...newCampaign.scheduledTimes, { time: '12:00', isActive: true }]
                            })
                          }}
                          style={{
                            padding: '6px 12px',
                            background: '#F97316',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Plus size={14} />
                          Add Time
                        </button>
                      </div>
                      <small style={{
                        display: 'block',
                        marginBottom: '12px',
                        fontSize: '12px',
                        color: '#6b7280',
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        Schedule multiple publishing times per day (e.g., 1st blog at 7:00 AM, 2nd at 5:00 PM)
                      </small>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {newCampaign.scheduledTimes.map((schedule, index) => (
                          <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ 
                              fontSize: '13px', 
                              fontWeight: '600', 
                              color: '#6b7280',
                              minWidth: '60px'
                            }}>
                              Blog #{index + 1}
                            </span>
                            <input
                              type="time"
                              value={schedule.time}
                              onChange={(e) => {
                                const updatedTimes = [...newCampaign.scheduledTimes]
                                updatedTimes[index].time = e.target.value
                                setNewCampaign({ ...newCampaign, scheduledTimes: updatedTimes })
                              }}
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                border: '2px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontFamily: 'Inter, sans-serif',
                                color: '#111827',
                                outline: 'none'
                              }}
                            />
                            {newCampaign.scheduledTimes.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedTimes = newCampaign.scheduledTimes.filter((_, i) => i !== index)
                                  setNewCampaign({ ...newCampaign, scheduledTimes: updatedTimes })
                                }}
                                style={{
                                  padding: '8px',
                                  background: '#111827',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '20px',
                                  width: '32px',
                                  height: '32px',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#374151'}
                                onMouseLeave={(e) => e.target.style.background = '#111827'}
                                title="Remove this time"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Content Publishing Destination - Only for CONTENT campaigns */}
                  {newCampaign.campaignType === 'CONTENT' && (
                    <div style={{ marginBottom: '24px', padding: '16px', background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                          }}>
                            <Globe size={20} />
                          </div>
                          <h4 style={{ 
                            fontSize: '15px', 
                            fontWeight: '700', 
                            color: '#111827', 
                            margin: 0,
                            fontFamily: 'Inter, sans-serif'
                          }}>
                            Publishing Destination
                          </h4>
                        </div>
                        <p style={{ 
                          fontSize: '12px', 
                          color: '#9a3412', 
                          margin: 0,
                          fontFamily: 'Inter, sans-serif',
                          paddingLeft: '46px'
                        }}>
                          Configure where to automatically publish your content
                        </p>
                      </div>

                      {/* Destination Type Selection */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '8px', 
                          fontSize: '13px', 
                          fontWeight: '600', 
                          color: '#374151',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          Select Destination
                        </label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => setNewCampaign({ ...newCampaign, publishDestination: 'NONE' })}
                            style={{
                              flex: 1,
                              minWidth: '140px',
                              padding: '10px',
                              background: newCampaign.publishDestination === 'NONE' ? 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' : 'white',
                              color: newCampaign.publishDestination === 'NONE' ? 'white' : '#374151',
                              border: `2px solid ${newCampaign.publishDestination === 'NONE' ? '#F97316' : '#fed7aa'}`,
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              fontFamily: 'Inter, sans-serif',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <FileText size={16} />
                            Manual Only
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewCampaign({ ...newCampaign, publishDestination: 'WORDPRESS' })}
                            style={{
                              flex: 1,
                              minWidth: '140px',
                              padding: '10px',
                              background: newCampaign.publishDestination === 'WORDPRESS' ? 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' : 'white',
                              color: newCampaign.publishDestination === 'WORDPRESS' ? 'white' : '#374151',
                              border: `2px solid ${newCampaign.publishDestination === 'WORDPRESS' ? '#F97316' : '#fed7aa'}`,
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              fontFamily: 'Inter, sans-serif',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <Globe size={16} />
                            WordPress
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewCampaign({ ...newCampaign, publishDestination: 'CUSTOM_WEBSITE' })}
                            style={{
                              flex: 1,
                              minWidth: '140px',
                              padding: '10px',
                              background: newCampaign.publishDestination === 'CUSTOM_WEBSITE' ? 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' : 'white',
                              color: newCampaign.publishDestination === 'CUSTOM_WEBSITE' ? 'white' : '#374151',
                              border: `2px solid ${newCampaign.publishDestination === 'CUSTOM_WEBSITE' ? '#F97316' : '#fed7aa'}`,
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              fontFamily: 'Inter, sans-serif',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <ExternalLink size={16} />
                            Custom Website
                          </button>
                        </div>
                      </div>

                      {/* WordPress Configuration */}
                      {newCampaign.publishDestination === 'WORDPRESS' && (
                        <div style={{ padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #fed7aa' }}>
                          <div style={{ marginBottom: '12px' }}>
                            <label style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginBottom: '6px', 
                              fontSize: '13px', 
                              fontWeight: '600', 
                              color: '#374151',
                              fontFamily: 'Inter, sans-serif'
                            }}>
                              <Link2 size={14} />
                              WordPress Site URL
                            </label>
                            <input
                              type="url"
                              value={newCampaign.wordpressUrl}
                              onChange={(e) => setNewCampaign({ ...newCampaign, wordpressUrl: e.target.value })}
                              placeholder="https://yoursite.com"
                              required
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '2px solid #fed7aa',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontFamily: 'Inter, sans-serif',
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                              <label style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginBottom: '6px', 
                                fontSize: '13px', 
                                fontWeight: '600', 
                                color: '#374151',
                                fontFamily: 'Inter, sans-serif'
                              }}>
                                <UsersIcon size={14} />
                                Username
                              </label>
                              <input
                                type="text"
                                value={newCampaign.wordpressUsername}
                                onChange={(e) => setNewCampaign({ ...newCampaign, wordpressUsername: e.target.value })}
                                placeholder="admin"
                                required
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  border: '2px solid #fed7aa',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  fontFamily: 'Inter, sans-serif',
                                  outline: 'none',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginBottom: '6px', 
                                fontSize: '13px', 
                                fontWeight: '600', 
                                color: '#374151',
                                fontFamily: 'Inter, sans-serif'
                              }}>
                                <Key size={14} />
                                App Password
                              </label>
                              <input
                                type="password"
                                value={newCampaign.wordpressAppPassword}
                                onChange={(e) => setNewCampaign({ ...newCampaign, wordpressAppPassword: e.target.value })}
                                placeholder="xxxx xxxx xxxx xxxx"
                                required
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  border: '2px solid #fed7aa',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  fontFamily: 'Inter, sans-serif',
                                  outline: 'none',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                          </div>
                          <small style={{ 
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '6px',
                            marginTop: '8px', 
                            fontSize: '11px', 
                            color: '#9a3412',
                            fontFamily: 'Inter, sans-serif',
                            lineHeight: '1.4'
                          }}>
                            <Info size={12} style={{ marginTop: '2px', flexShrink: 0 }} />
                            <span>Generate an Application Password in WordPress: Users → Profile → Application Passwords</span>
                          </small>
                        </div>
                      )}

                      {/* Custom Website Configuration */}
                      {newCampaign.publishDestination === 'CUSTOM_WEBSITE' && (
                        <div style={{ padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #fed7aa' }}>
                          <div style={{ marginBottom: '12px' }}>
                            <label style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginBottom: '6px', 
                              fontSize: '13px', 
                              fontWeight: '600', 
                              color: '#374151',
                              fontFamily: 'Inter, sans-serif'
                            }}>
                              <Link2 size={14} />
                              Website API URL
                            </label>
                            <input
                              type="url"
                              value={newCampaign.customWebsiteUrl}
                              onChange={(e) => setNewCampaign({ ...newCampaign, customWebsiteUrl: e.target.value })}
                              placeholder="https://api.yoursite.com/posts"
                              required
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '2px solid #fed7aa',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontFamily: 'Inter, sans-serif',
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginBottom: '6px', 
                              fontSize: '13px', 
                              fontWeight: '600', 
                              color: '#374151',
                              fontFamily: 'Inter, sans-serif'
                            }}>
                              <Key size={14} />
                              API Key
                            </label>
                            <input
                              type="password"
                              value={newCampaign.customWebsiteApiKey}
                              onChange={(e) => setNewCampaign({ ...newCampaign, customWebsiteApiKey: e.target.value })}
                              placeholder="Your API key"
                              required
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '2px solid #fed7aa',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontFamily: 'Inter, sans-serif',
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>
                          <small style={{ 
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '6px',
                            marginTop: '8px', 
                            fontSize: '11px', 
                            color: '#9a3412',
                            fontFamily: 'Inter, sans-serif',
                            lineHeight: '1.4'
                          }}>
                            <Info size={12} style={{ marginTop: '2px', flexShrink: 0 }} />
                            <span>Your website must have a REST API endpoint that accepts POST requests with article data</span>
                          </small>
                        </div>
                      )}

                      {/* Manual Only Info */}
                      {newCampaign.publishDestination === 'NONE' && (
                        <div style={{ 
                          padding: '12px', 
                          background: 'rgba(249, 115, 22, 0.1)', 
                          borderRadius: '6px',
                          border: '1px dashed #fed7aa'
                        }}>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#9a3412',
                            fontFamily: 'Inter, sans-serif',
                            lineHeight: '1.5',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px'
                          }}>
                            <div style={{
                              minWidth: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginTop: '2px'
                            }}>
                              <Info size={12} color="white" />
                            </div>
                            <div>
                              <strong style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                Manual Publishing:
                              </strong>
                              Content will be generated and saved in your dashboard. You can manually publish to your website or WordPress later.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Email Campaign Section - Only for EMAIL campaigns */}
                  {newCampaign.campaignType === 'EMAIL' && (
                    <div style={{ marginBottom: '24px', padding: '16px', background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                          }}>
                            <Mail size={20} />
                          </div>
                          <h4 style={{ 
                            fontSize: '15px', 
                            fontWeight: '700', 
                            color: '#111827', 
                            margin: 0,
                            fontFamily: 'Inter, sans-serif'
                          }}>
                            Email Campaign Settings
                          </h4>
                        </div>
                        <p style={{ 
                          fontSize: '12px', 
                          color: '#9a3412', 
                          margin: 0,
                          fontFamily: 'Inter, sans-serif',
                          paddingLeft: '46px'
                        }}>
                          Configure email recipients, scheduling, and delivery settings
                        </p>
                      </div>

                      {/* Email Input Method Toggle */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '8px', 
                          fontSize: '13px', 
                          fontWeight: '600', 
                          color: '#374151',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          Email Input Method
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setNewCampaign({ ...newCampaign, emailInputMethod: 'MANUAL' })}
                            style={{
                              flex: 1,
                              padding: '10px',
                              background: newCampaign.emailInputMethod === 'MANUAL' ? 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' : 'white',
                              color: newCampaign.emailInputMethod === 'MANUAL' ? 'white' : '#374151',
                              border: `2px solid ${newCampaign.emailInputMethod === 'MANUAL' ? '#F97316' : '#fed7aa'}`,
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              fontFamily: 'Inter, sans-serif',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <FileText size={16} />
                            Manual Entry
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewCampaign({ ...newCampaign, emailInputMethod: 'CSV' })}
                            style={{
                              flex: 1,
                              padding: '10px',
                              background: newCampaign.emailInputMethod === 'CSV' ? 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' : 'white',
                              color: newCampaign.emailInputMethod === 'CSV' ? 'white' : '#374151',
                              border: `2px solid ${newCampaign.emailInputMethod === 'CSV' ? '#F97316' : '#fed7aa'}`,
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              fontFamily: 'Inter, sans-serif',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <Upload size={16} />
                            CSV Paste
                          </button>
                        </div>
                      </div>

                      {/* Manual Email Entry */}
                      {newCampaign.emailInputMethod === 'MANUAL' && (
                        <div style={{ marginBottom: '16px', padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '8px', 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            color: '#374151',
                            fontFamily: 'Inter, sans-serif'
                          }}>
                            Add Email Address
                          </label>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <input
                              type="email"
                              id="manualEmail"
                              placeholder="email@example.com"
                              style={{
                                flex: 2,
                                padding: '8px 12px',
                                border: '2px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontFamily: 'Inter, sans-serif',
                                outline: 'none'
                              }}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  const email = e.target.value
                                  const name = document.getElementById('manualName').value
                                  if (addManualEmail(email, name)) {
                                    e.target.value = ''
                                    document.getElementById('manualName').value = ''
                                  } else {
                                    setError('Please enter a valid email address')
                                    setTimeout(() => setError(''), 3000)
                                  }
                                }
                              }}
                            />
                            <input
                              type="text"
                              id="manualName"
                              placeholder="Name (optional)"
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                border: '2px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontFamily: 'Inter, sans-serif',
                                outline: 'none'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const email = document.getElementById('manualEmail').value
                                const name = document.getElementById('manualName').value
                                if (addManualEmail(email, name)) {
                                  document.getElementById('manualEmail').value = ''
                                  document.getElementById('manualName').value = ''
                                } else {
                                  setError('Please enter a valid email address')
                                  setTimeout(() => setError(''), 3000)
                                }
                              }}
                              style={{
                                padding: '8px 16px',
                                background: '#F97316',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              Add
                            </button>
                          </div>
                          <small style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'Inter, sans-serif' }}>
                            Press Enter or click Add to add email
                          </small>
                        </div>
                      )}

                      {/* CSV Paste */}
                      {newCampaign.emailInputMethod === 'CSV' && (
                        <div style={{ marginBottom: '16px', padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '8px', 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            color: '#374151',
                            fontFamily: 'Inter, sans-serif'
                          }}>
                            Paste CSV Data
                          </label>
                          <textarea
                            value={newCampaign.emailCsvText}
                            onChange={(e) => setNewCampaign({ ...newCampaign, emailCsvText: e.target.value })}
                            placeholder="email@example.com,John Doe&#10;another@example.com,Jane Smith&#10;&#10;Format: email,name (one per line)"
                            rows="5"
                            style={{
                              width: '100%',
                              padding: '10px',
                              border: '2px solid #e5e7eb',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontFamily: 'Share Tech Mono, monospace',
                              resize: 'vertical',
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                            <small style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'Inter, sans-serif' }}>
                              Format: email,name (comma-separated, one per line)
                            </small>
                            <button
                              type="button"
                              onClick={handleCsvPaste}
                              disabled={!newCampaign.emailCsvText.trim()}
                              style={{
                                padding: '6px 16px',
                                background: newCampaign.emailCsvText.trim() ? '#F97316' : '#d1d5db',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: newCampaign.emailCsvText.trim() ? 'pointer' : 'not-allowed'
                              }}
                            >
                              Process CSV
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Email List Display */}
                      {newCampaign.emailList.length > 0 && (
                        <div style={{ marginBottom: '16px', padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={{ 
                              fontSize: '13px', 
                              fontWeight: '600', 
                              color: '#374151',
                              fontFamily: 'Inter, sans-serif'
                            }}>
                              Email Recipients ({newCampaign.emailList.length})
                            </label>
                            <button
                              type="button"
                              onClick={() => setNewCampaign({ ...newCampaign, emailList: [] })}
                              style={{
                                padding: '4px 10px',
                                background: '#fee2e2',
                                color: '#dc2626',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Clear All
                            </button>
                          </div>
                          <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {newCampaign.emailList.map((item, index) => (
                              <div key={index} style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '6px 10px',
                                background: '#f9fafb',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}>
                                <div style={{ flex: 1, fontFamily: 'Share Tech Mono, monospace' }}>
                                  <strong>{item.email}</strong>
                                  {item.name && <span style={{ color: '#6b7280', marginLeft: '8px' }}>({item.name})</span>}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeEmail(index)}
                                  style={{
                                    padding: '2px 8px',
                                    background: '#fee2e2',
                                    color: '#dc2626',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Email Scheduling & Delivery Settings */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '6px', 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            color: '#374151',
                            fontFamily: 'Inter, sans-serif'
                          }}>
                            <Clock size={14} />
                            Send Time
                          </label>
                          <input
                            type="time"
                            value={newCampaign.emailScheduledTime}
                            onChange={(e) => setNewCampaign({ ...newCampaign, emailScheduledTime: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '2px solid #fed7aa',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontFamily: 'Inter, sans-serif',
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '6px', 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            color: '#374151',
                            fontFamily: 'Inter, sans-serif'
                          }}>
                            <Zap size={14} />
                            Emails Per Hour (0-100)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={newCampaign.emailThrottleRate}
                            onChange={(e) => {
                              const value = Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                              setNewCampaign({ ...newCampaign, emailThrottleRate: value })
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '2px solid #fed7aa',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontFamily: 'Inter, sans-serif',
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      </div>

                      {/* Timezone Selection */}
                      <div>
                        <label style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '6px', 
                          fontSize: '13px', 
                          fontWeight: '600', 
                          color: '#374151',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          <MapPin size={14} />
                          Timezone
                        </label>
                        <select
                          value={newCampaign.emailTimezone}
                          onChange={(e) => setNewCampaign({ ...newCampaign, emailTimezone: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '2px solid #fed7aa',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontFamily: 'Inter, sans-serif',
                            background: 'white',
                            cursor: 'pointer',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        >
                          {timezones.map(tz => (
                            <option key={tz.value} value={tz.value}>{tz.label}</option>
                          ))}
                        </select>
                        <small style={{ 
                          display: 'block', 
                          marginTop: '4px', 
                          fontSize: '11px', 
                          color: '#9a3412',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          Emails will be sent according to this timezone
                        </small>
                      </div>
                    </div>
                  )}

                  {/* Social Media Campaign Section - Only for SOCIAL campaigns */}
                  {newCampaign.campaignType === 'SOCIAL' && (
                    <div style={{ marginBottom: '24px', padding: '16px', background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', borderRadius: '8px', border: '2px solid #fed7aa', position: 'relative' }}>
                      {/* Coming Soon Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '-12px',
                        right: '16px',
                        background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                        color: 'white',
                        padding: '6px 16px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        letterSpacing: '0.5px',
                        boxShadow: '0 4px 12px rgba(249, 115, 22, 0.4)',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Sparkles size={12} />
                        Coming Soon
                      </div>

                      <div style={{ marginBottom: '16px', marginTop: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                          }}>
                            <TrendingUp size={20} />
                          </div>
                          <h4 style={{ 
                            fontSize: '15px', 
                            fontWeight: '700', 
                            color: '#111827', 
                            margin: 0,
                            fontFamily: 'Inter, sans-serif'
                          }}>
                            Social Media Campaign Settings
                          </h4>
                        </div>
                        <p style={{ 
                          fontSize: '12px', 
                          color: '#9a3412', 
                          margin: 0,
                          fontFamily: 'Inter, sans-serif',
                          paddingLeft: '46px',
                          fontWeight: '500'
                        }}>
                          Configure platforms, posting schedule, and timing for your social media campaigns
                        </p>
                      </div>

                      {/* Platform Selection */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '10px', 
                          fontSize: '13px', 
                          fontWeight: '600', 
                          color: '#374151',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          Select Social Platforms
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                          {socialPlatforms.map(platform => {
                            const IconComponent = platform.icon
                            return (
                              <button
                                key={platform.id}
                                type="button"
                                onClick={() => toggleSocialPlatform(platform.id)}
                                style={{
                                  padding: '12px',
                                  background: newCampaign.socialPlatforms.includes(platform.id) ? 'white' : '#fef3c7',
                                  border: `2px solid ${newCampaign.socialPlatforms.includes(platform.id) ? platform.color : '#fed7aa'}`,
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  position: 'relative',
                                  opacity: 0.7
                                }}
                                disabled
                                title="Coming soon!"
                              >
                                <div style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '6px',
                                  background: `${platform.color}15`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: platform.color
                                }}>
                                  <IconComponent size={18} />
                                </div>
                                <div style={{ flex: 1, textAlign: 'left' }}>
                                  <div style={{ 
                                    fontSize: '13px', 
                                    fontWeight: '700', 
                                    color: '#111827',
                                    fontFamily: 'Inter, sans-serif'
                                  }}>
                                    {platform.name}
                                  </div>
                                  <div style={{ 
                                    fontSize: '10px', 
                                    color: '#6b7280',
                                    fontFamily: 'Inter, sans-serif'
                                  }}>
                                    {platform.description}
                                  </div>
                                </div>
                                {newCampaign.socialPlatforms.includes(platform.id) && (
                                  <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    background: platform.color,
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    fontWeight: '700'
                                  }}>
                                    ✓
                                  </div>
                                )}
                              </button>
                            )
                          })}
                        </div>
                        <small style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginTop: '8px', 
                          fontSize: '11px', 
                          color: '#9a3412',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: '600'
                        }}>
                          <UsersIcon size={12} />
                          Platform integration is currently in development. You can configure settings now for future use.
                        </small>
                      </div>

                      {/* Post Scheduling Times */}
                      <div style={{ marginBottom: '16px', padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #fed7aa' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <label style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '13px', 
                            fontWeight: '600', 
                            color: '#374151',
                            fontFamily: 'Inter, sans-serif'
                          }}>
                            <Calendar size={14} />
                            Posting Schedule
                          </label>
                          <button
                            type="button"
                            onClick={addSocialPostTime}
                            style={{
                              padding: '6px 12px',
                              background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Plus size={14} />
                            Add Time
                          </button>
                        </div>
                        <small style={{ 
                          display: 'block', 
                          marginBottom: '12px', 
                          fontSize: '11px', 
                          color: '#6b7280',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          Schedule multiple posts throughout the day (e.g., Morning post at 9 AM, Evening post at 6 PM)
                        </small>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {newCampaign.socialPostTimes.map((postTime, index) => (
                            <div key={index} style={{ 
                              padding: '10px', 
                              background: '#fef3c7', 
                              borderRadius: '6px',
                              border: '1px solid #fed7aa'
                            }}>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ 
                                  fontSize: '12px', 
                                  fontWeight: '700', 
                                  color: '#6b7280',
                                  minWidth: '60px',
                                  fontFamily: 'Inter, sans-serif'
                                }}>
                                  Post #{index + 1}
                                </span>
                                <input
                                  type="time"
                                  value={postTime.time}
                                  onChange={(e) => updateSocialPostTime(index, e.target.value)}
                                  style={{
                                    flex: 1,
                                    padding: '6px 10px',
                                    border: '2px solid #fed7aa',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontFamily: 'Inter, sans-serif',
                                    outline: 'none',
                                    background: 'white'
                                  }}
                                />
                                {newCampaign.socialPostTimes.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeSocialPostTime(index)}
                                    style={{
                                      padding: '6px 10px',
                                      background: '#fee2e2',
                                      color: '#dc2626',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      fontWeight: '600'
                                    }}
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                              
                              {/* Platform selection for this specific time */}
                              <div style={{ paddingLeft: '68px' }}>
                                <div style={{ 
                                  fontSize: '11px', 
                                  color: '#6b7280', 
                                  marginBottom: '6px',
                                  fontFamily: 'Inter, sans-serif',
                                  fontWeight: '600'
                                }}>
                                  Post to:
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                  {socialPlatforms.slice(0, 4).map(platform => {
                                    const IconComponent = platform.icon
                                    return (
                                      <button
                                        key={platform.id}
                                        type="button"
                                        onClick={() => togglePlatformForPostTime(index, platform.id)}
                                        style={{
                                          padding: '4px 10px',
                                          background: (postTime.platforms || []).includes(platform.id) ? platform.color : 'white',
                                          color: (postTime.platforms || []).includes(platform.id) ? 'white' : '#6b7280',
                                          border: `1px solid ${(postTime.platforms || []).includes(platform.id) ? platform.color : '#fed7aa'}`,
                                          borderRadius: '12px',
                                          fontSize: '10px',
                                          fontWeight: '600',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          transition: 'all 0.2s',
                                          fontFamily: 'Inter, sans-serif'
                                        }}
                                      >
                                        <IconComponent size={12} />
                                        {platform.name}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Timezone Selection */}
                      <div>
                        <label style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '6px', 
                          fontSize: '13px', 
                          fontWeight: '600', 
                          color: '#374151',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          <MapPin size={14} />
                          Timezone
                        </label>
                        <select
                          value={newCampaign.socialTimezone}
                          onChange={(e) => setNewCampaign({ ...newCampaign, socialTimezone: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '2px solid #fed7aa',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontFamily: 'Inter, sans-serif',
                            background: 'white',
                            cursor: 'pointer',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        >
                          {timezones.map(tz => (
                            <option key={tz.value} value={tz.value}>{tz.label}</option>
                          ))}
                        </select>
                        <small style={{ 
                          display: 'block', 
                          marginTop: '4px', 
                          fontSize: '11px', 
                          color: '#9a3412',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: '500'
                        }}>
                          Posts will be scheduled according to this timezone
                        </small>
                      </div>

                      {/* Info Box */}
                      <div style={{
                        marginTop: '16px',
                        padding: '12px',
                        background: 'rgba(249, 115, 22, 0.1)',
                        borderRadius: '6px',
                        border: '1px dashed #fed7aa'
                      }}>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#9a3412',
                          fontFamily: 'Inter, sans-serif',
                          lineHeight: '1.5',
                          fontWeight: '500'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontWeight: '700' }}>
                            <Sparkles size={14} />
                            What's Coming:
                          </div>
                          <ul style={{ margin: '0', paddingLeft: '20px' }}>
                            <li>Direct posting to all major social platforms</li>
                            <li>Auto-scheduling with optimal posting times</li>
                            <li>Cross-platform content adaptation</li>
                            <li>Analytics and engagement tracking</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Multi-Channel Campaign Section - Only for MULTI_CHANNEL campaigns */}
                  {newCampaign.campaignType === 'MULTI_CHANNEL' && (
                    <div style={{ marginBottom: '24px', padding: '16px', background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', borderRadius: '8px', border: '2px solid #fed7aa', position: 'relative' }}>
                      {/* Coming Soon Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '-12px',
                        right: '16px',
                        background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                        color: 'white',
                        padding: '6px 16px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        letterSpacing: '0.5px',
                        boxShadow: '0 4px 12px rgba(249, 115, 22, 0.4)',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Sparkles size={12} />
                        Coming Soon
                      </div>

                      <div style={{ marginBottom: '16px', marginTop: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                          }}>
                            <Zap size={20} />
                          </div>
                          <h4 style={{ 
                            fontSize: '15px', 
                            fontWeight: '700', 
                            color: '#111827', 
                            margin: 0,
                            fontFamily: 'Inter, sans-serif'
                          }}>
                            Multi-Channel Campaign Workflow
                          </h4>
                        </div>
                        <p style={{ 
                          fontSize: '12px', 
                          color: '#9a3412', 
                          margin: 0,
                          fontFamily: 'Inter, sans-serif',
                          paddingLeft: '46px',
                          fontWeight: '500'
                        }}>
                          Orchestrate automated workflows across Content, Email, and Social channels with conditional logic
                        </p>
                      </div>

                      {/* Channel Selection */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '10px', 
                          fontSize: '13px', 
                          fontWeight: '600', 
                          color: '#374151',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          Enable Channels
                        </label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {[
                            { id: 'CONTENT', name: 'Content/Blog', icon: FileText, color: '#3b82f6' },
                            { id: 'EMAIL', name: 'Email', icon: Mail, color: '#8b5cf6' },
                            { id: 'SOCIAL', name: 'Social Media', icon: TrendingUp, color: '#ec4899' }
                          ].map(channel => {
                            const IconComponent = channel.icon
                            return (
                              <button
                                key={channel.id}
                                type="button"
                                onClick={() => toggleMultiChannel(channel.id)}
                                style={{
                                  padding: '10px 16px',
                                  background: newCampaign.enabledChannels.includes(channel.id) ? channel.color : 'white',
                                  color: newCampaign.enabledChannels.includes(channel.id) ? 'white' : '#374151',
                                  border: `2px solid ${newCampaign.enabledChannels.includes(channel.id) ? channel.color : '#fed7aa'}`,
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  fontFamily: 'Inter, sans-serif',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <IconComponent size={16} />
                                {channel.name}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Workflow Builder */}
                      <div style={{ marginBottom: '16px', padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #fed7aa' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <label style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '13px', 
                            fontWeight: '600', 
                            color: '#374151',
                            fontFamily: 'Inter, sans-serif'
                          }}>
                            <Calendar size={14} />
                            Workflow Steps
                          </label>
                          <button
                            type="button"
                            onClick={addWorkflowStep}
                            style={{
                              padding: '6px 12px',
                              background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Plus size={14} />
                            Add Step
                          </button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {newCampaign.multiChannelWorkflows.map((workflow, index) => (
                            <div key={workflow.id} style={{ 
                              padding: '12px', 
                              background: '#fef3c7', 
                              borderRadius: '6px',
                              border: '1px solid #fed7aa'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <div style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: '700'
                                }}>
                                  {index + 1}
                                </div>
                                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '80px 80px 1fr', gap: '8px' }}>
                                  <div>
                                    <label style={{ fontSize: '10px', color: '#6b7280', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Day</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={workflow.day}
                                      onChange={(e) => updateWorkflowStep(workflow.id, 'day', parseInt(e.target.value) || 1)}
                                      style={{
                                        width: '100%',
                                        padding: '6px',
                                        border: '1px solid #fed7aa',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        background: 'white'
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: '10px', color: '#6b7280', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Time</label>
                                    <input
                                      type="time"
                                      value={workflow.time}
                                      onChange={(e) => updateWorkflowStep(workflow.id, 'time', e.target.value)}
                                      style={{
                                        width: '100%',
                                        padding: '6px',
                                        border: '1px solid #fed7aa',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        background: 'white'
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: '10px', color: '#6b7280', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Channel</label>
                                    <select
                                      value={workflow.channel}
                                      onChange={(e) => updateWorkflowStep(workflow.id, 'channel', e.target.value)}
                                      style={{
                                        width: '100%',
                                        padding: '6px',
                                        border: '1px solid #fed7aa',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        background: 'white',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <option value="CONTENT">Content/Blog</option>
                                      <option value="EMAIL">Email</option>
                                      <option value="SOCIAL">Social Media</option>
                                    </select>
                                  </div>
                                </div>
                                {newCampaign.multiChannelWorkflows.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeWorkflowStep(workflow.id)}
                                    style={{
                                      padding: '6px',
                                      background: '#fee2e2',
                                      color: '#dc2626',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '16px',
                                      lineHeight: '1'
                                    }}
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                              
                              <div style={{ marginBottom: '8px' }}>
                                <label style={{ fontSize: '10px', color: '#6b7280', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Action</label>
                                <input
                                  type="text"
                                  value={workflow.action}
                                  onChange={(e) => updateWorkflowStep(workflow.id, 'action', e.target.value)}
                                  placeholder="e.g., Publish blog article, Send email to subscribers"
                                  style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #fed7aa',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    background: 'white',
                                    boxSizing: 'border-box'
                                  }}
                                />
                              </div>
                              
                              <div>
                                <label style={{ fontSize: '10px', color: '#6b7280', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                                  Condition (Optional)
                                </label>
                                <input
                                  type="text"
                                  value={workflow.condition || ''}
                                  onChange={(e) => updateWorkflowStep(workflow.id, 'condition', e.target.value)}
                                  placeholder="e.g., If email open rate > 40%, If social post gets 100+ likes"
                                  style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #fed7aa',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    background: 'white',
                                    boxSizing: 'border-box',
                                    fontStyle: 'italic'
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div style={{ 
                          marginTop: '12px', 
                          padding: '10px', 
                          background: 'rgba(59, 130, 246, 0.1)', 
                          borderRadius: '6px',
                          fontSize: '11px',
                          color: '#1e40af',
                          fontFamily: 'Inter, sans-serif',
                          lineHeight: '1.5'
                        }}>
                          <strong>💡 Example Workflow:</strong><br/>
                          Day 1, 9:00 AM: Publish blog article<br/>
                          Day 1, 9:00 AM: Send email with article link<br/>
                          Day 1, 11:00 AM: Post on Instagram/Facebook (If email open rate &gt; 40%)<br/>
                          Day 2, 9:00 AM: Send follow-up email (If social post gets 100+ likes)
                        </div>
                      </div>

                      {/* Info Box */}
                      <div style={{
                        marginTop: '16px',
                        padding: '12px',
                        background: 'rgba(249, 115, 22, 0.1)',
                        borderRadius: '6px',
                        border: '1px dashed #fed7aa'
                      }}>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#9a3412',
                          fontFamily: 'Inter, sans-serif',
                          lineHeight: '1.5',
                          fontWeight: '500'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontWeight: '700' }}>
                            <Sparkles size={14} />
                            What's Coming:
                          </div>
                          <ul style={{ margin: '0', paddingLeft: '20px' }}>
                            <li>Automated cross-channel workflows with conditional logic</li>
                            <li>Real-time performance tracking and triggers</li>
                            <li>Smart audience segmentation across channels</li>
                            <li>Unified analytics dashboard</li>
                            <li>A/B testing across multiple channels</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end',
                    paddingTop: '20px',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <button 
                      type="button" 
                      onClick={() => setShowCreateModal(false)}
                      disabled={creating}
                      style={{
                        padding: '12px 24px',
                        background: 'white',
                        color: '#374151',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        fontFamily: 'Inter, sans-serif',
                        cursor: creating ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        opacity: creating ? 0.5 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!creating) {
                          e.currentTarget.style.background = '#f9fafb'
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white'
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={creating}
                      style={{
                        padding: '12px 24px',
                        background: creating ? '#9ca3af' : isComingSoonCampaign() ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        fontFamily: 'Inter, sans-serif',
                        cursor: creating ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: creating ? 'none' : '0 2px 8px rgba(249, 115, 22, 0.25)'
                      }}
                    >
                      {creating ? (
                        <>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid white',
                            borderTop: '2px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }}></div>
                          Creating...
                        </>
                      ) : isComingSoonCampaign() ? (
                        <>
                          <Sparkles size={16} />
                          Save Configuration (Coming Soon)
                        </>
                      ) : (
                        'Create Campaign'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* WordPress Publisher Modal */}
          {showWordPressModal && selectedCampaign && (
            <div className="modal-overlay" onClick={() => setShowWordPressModal(false)}>
              <div className="modal-content wordpress-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Bulk Publish Campaign to WordPress</h2>
                  <button 
                    className="close-button"
                    onClick={() => setShowWordPressModal(false)}
                  >
                    ×
                  </button>
                </div>
                <Suspense fallback={
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      border: '3px solid #f3f4f6',
                      borderTop: '3px solid #f97316',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 16px'
                    }}></div>
                    <p>Loading WordPress Publisher...</p>
                  </div>
                }>
                  <WordPressPublisher 
                    campaign={selectedCampaign}
                    onPublishSuccess={handleWordPressPublishSuccess}
                  />
                </Suspense>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div 
              className="modal-overlay" 
              onClick={() => setShowDeleteConfirm(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                backdropFilter: 'blur(4px)'
              }}
            >
              <div 
                className="modal-content" 
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '32px',
                  maxWidth: '480px',
                  width: '90%',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    background: '#fee2e2',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    <AlertTriangle size={32} color="#dc2626" />
                  </div>
                  <h2 style={{ 
                    fontFamily: 'Inter, sans-serif', 
                    fontSize: '24px', 
                    fontWeight: '700', 
                    color: '#111827',
                    marginBottom: '8px'
                  }}>
                    Delete Campaign Permanently?
                  </h2>
                  <p style={{ 
                    fontFamily: 'Inter, sans-serif', 
                    fontSize: '15px', 
                    color: '#6b7280',
                    lineHeight: '1.6'
                  }}>
                    This action cannot be undone. This will permanently delete the campaign and all associated articles from the database.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{
                      flex: 1,
                      padding: '12px 24px',
                      background: '#f9fafb',
                      color: '#374151',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => permanentlyDeleteCampaign(campaignToDelete)}
                    style={{
                      flex: 1,
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)'
                    }}
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  )
}

export default Campaigns
