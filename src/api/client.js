import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add token and handle refresh
apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState()
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
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
    
    // If token expired and we haven't already tried to refresh
    if (error.response?.status === 401 && 
        error.response?.data?.code === 'TOKEN_EXPIRED' && 
        !originalRequest._retry) {
      
      originalRequest._retry = true
      
      const { refreshAccessToken } = useAuthStore.getState()
      const refreshSuccess = await refreshAccessToken()
      
      if (refreshSuccess) {
        // Retry the original request with new token
        const { accessToken } = useAuthStore.getState()
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return apiClient(originalRequest)
      }
    }
    
    // If refresh failed or other auth errors, clear auth and redirect
    if (error.response?.status === 401) {
      const { clearAuth } = useAuthStore.getState()
      clearAuth()
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

export default apiClient
