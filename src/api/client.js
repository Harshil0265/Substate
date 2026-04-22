import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// For production on Vercel, VITE_API_URL is already /api, so don't add /api again
const baseURL = API_BASE_URL.includes('/api') ? API_BASE_URL : `${API_BASE_URL}/api`

export const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
})

// Request interceptor to add token and handle refresh
apiClient.interceptors.request.use(
  (config) => {
    const { accessToken, updateActivity } = useAuthStore.getState()
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
      // Update activity on each request
      updateActivity()
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for token refresh and errors
apiClient.interceptors.response.use(
  (response) => {
    // Check if server suggests token refresh
    const refreshNeeded = response.headers['x-token-refresh-needed']
    if (refreshNeeded === 'true') {
      const { refreshAccessToken } = useAuthStore.getState()
      // Refresh token in background (don't wait for it)
      refreshAccessToken().catch(console.error)
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    // Handle network errors without clearing auth
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject(error);
    }
    
    // If token expired and we haven't already tried to refresh
    if (error.response?.status === 401 && 
        (error.response?.data?.code === 'TOKEN_EXPIRED' || 
         error.response?.data?.message?.includes('expired') ||
         error.response?.data?.message?.includes('invalid token')) && 
        !originalRequest._retry) {
      
      originalRequest._retry = true
      
      console.log('🔄 Token expired, attempting refresh...');
      const { refreshAccessToken } = useAuthStore.getState()
      const refreshSuccess = await refreshAccessToken()
      
      if (refreshSuccess) {
        console.log('✅ Token refreshed, retrying request');
        // Retry the original request with new token
        const { accessToken } = useAuthStore.getState()
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return apiClient(originalRequest)
      } else {
        console.log('❌ Token refresh failed');
      }
    }
    
    // If refresh failed or other auth errors (but not on login/register pages)
    if (error.response?.status === 401 && 
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register') &&
        !window.location.pathname.includes('/verify-email')) {
      
      const { clearAuth } = useAuthStore.getState()
      console.log('❌ Unauthorized, clearing auth and redirecting to login');
      clearAuth()
      
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search)
      window.location.href = `/login?returnUrl=${returnUrl}`
    }
    
    return Promise.reject(error)
  }
)

export default apiClient
