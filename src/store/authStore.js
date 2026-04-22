import { create } from 'zustand'

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isLoading: false,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  sessionInfo: null,
  tokenRefreshTimer: null,
  lastActivity: Date.now(),

  setUser: (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    set({ user });
  },
  
  setTokens: (tokens) => {
    const { accessToken, refreshToken, expiresIn, sessionInfo } = tokens;
    
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('tokenTimestamp', Date.now().toString());
    } else {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('tokenTimestamp');
    }
    
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    } else {
      localStorage.removeItem('refreshToken');
    }
    
    set({ 
      accessToken, 
      refreshToken, 
      isAuthenticated: !!accessToken,
      sessionInfo,
      lastActivity: Date.now()
    });
    
    // Set up automatic token refresh
    if (accessToken) {
      get().setupTokenRefresh();
    }
  },
  
  updateActivity: () => {
    set({ lastActivity: Date.now() });
    localStorage.setItem('lastActivity', Date.now().toString());
  },
  
  setIsLoading: (isLoading) => set({ isLoading }),
  
  logout: async () => {
    const { accessToken } = get();
    
    // Clear refresh timer
    const { tokenRefreshTimer } = get();
    if (tokenRefreshTimer) {
      clearTimeout(tokenRefreshTimer);
    }
    
    // Call logout endpoint if we have a token
    if (accessToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error('Logout API call failed:', error);
      }
    }
    
    // Clear local storage and state
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenTimestamp');
    localStorage.removeItem('lastActivity');
    set({ 
      user: null, 
      accessToken: null, 
      refreshToken: null, 
      isAuthenticated: false,
      sessionInfo: null,
      tokenRefreshTimer: null,
      lastActivity: Date.now()
    });
  },
  
  clearAuth: () => {
    const { tokenRefreshTimer } = get();
    if (tokenRefreshTimer) {
      clearTimeout(tokenRefreshTimer);
    }
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenTimestamp');
    localStorage.removeItem('lastActivity');
    set({ 
      user: null, 
      accessToken: null, 
      refreshToken: null, 
      isAuthenticated: false,
      sessionInfo: null,
      tokenRefreshTimer: null,
      lastActivity: Date.now()
    });
  },
  
  refreshAccessToken: async () => {
    const { refreshToken } = get();
    
    if (!refreshToken) {
      console.log('No refresh token available');
      get().clearAuth();
      return false;
    }
    
    try {
      console.log('🔄 Refreshing access token...');
      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Token refreshed successfully');
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('tokenTimestamp', Date.now().toString());
        
        // Update refresh token if provided
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
          set({ accessToken: data.accessToken, refreshToken: data.refreshToken });
        } else {
          set({ accessToken: data.accessToken });
        }
        
        // Setup next refresh
        get().setupTokenRefresh();
        return true;
      } else {
        console.log('❌ Token refresh failed:', response.status);
        // Refresh token is invalid, clear auth
        get().clearAuth();
        return false;
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      get().clearAuth();
      return false;
    }
  },
  
  setupTokenRefresh: () => {
    const { accessToken, tokenRefreshTimer } = get();
    
    // Clear existing timer
    if (tokenRefreshTimer) {
      clearTimeout(tokenRefreshTimer);
    }
    
    if (!accessToken) return;
    
    try {
      // Decode token to get expiration
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;
      
      console.log(`⏰ Token expires in ${Math.floor(timeUntilExpiry / 1000 / 60)} minutes`);
      
      // Refresh token 2 minutes before it expires
      const refreshTime = Math.max(0, timeUntilExpiry - (2 * 60 * 1000));
      
      if (refreshTime > 0) {
        console.log(`⏰ Will refresh token in ${Math.floor(refreshTime / 1000 / 60)} minutes`);
        const timer = setTimeout(() => {
          console.log('⏰ Auto-refreshing token...');
          get().refreshAccessToken();
        }, refreshTime);
        
        set({ tokenRefreshTimer: timer });
      } else {
        // Token is already expired or about to expire, refresh immediately
        console.log('⚠️ Token expired or expiring soon, refreshing now...');
        get().refreshAccessToken();
      }
    } catch (error) {
      console.error('Failed to setup token refresh:', error);
    }
  },
  
  checkSessionStatus: async () => {
    const { accessToken } = get();
    
    if (!accessToken) {
      return false;
    }
    
    try {
      const response = await fetch('/api/auth/session-status', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        set({ sessionInfo: data.session });
        
        // Update user data if available
        if (data.user) {
          get().setUser(data.user);
        }
        
        // If token needs refresh, do it now
        if (data.session?.needsRefresh) {
          await get().refreshAccessToken();
        }
        
        return true;
      } else if (response.status === 401) {
        // Token expired, try to refresh
        console.log('Session expired, attempting to refresh...');
        return await get().refreshAccessToken();
      } else {
        get().clearAuth();
        return false;
      }
    } catch (error) {
      console.error('Session check failed:', error);
      // Don't clear auth on network errors, just return false
      return false;
    }
  },
  
  // Restore session from localStorage on app load
  restoreSession: async () => {
    const { accessToken, user } = get();
    
    console.log('🔄 Restoring session...');
    
    if (!accessToken) {
      console.log('❌ No access token found');
      return false;
    }
    
    // Check if token is expired
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      
      if (currentTime >= expirationTime) {
        console.log('⚠️ Token expired, attempting refresh...');
        return await get().refreshAccessToken();
      }
    } catch (error) {
      console.error('Failed to decode token:', error);
      get().clearAuth();
      return false;
    }
    
    // If we have user data in localStorage, we're good
    if (user) {
      console.log('✅ Session restored from localStorage');
      get().setupTokenRefresh();
      return true;
    }
    
    // Otherwise, fetch user data from server
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('✅ User data fetched from server');
        get().setUser(userData);
        get().setupTokenRefresh();
        return true;
      } else if (response.status === 401) {
        // Token expired, try to refresh
        console.log('Token expired, attempting refresh...');
        return await get().refreshAccessToken();
      } else {
        get().clearAuth();
        return false;
      }
    } catch (error) {
      console.error('Session restore failed:', error);
      // Don't clear auth on network errors
      return false;
    }
  }
}))

// Initialize token refresh on app start
const store = useAuthStore.getState();
if (store.accessToken) {
  console.log('🚀 Initializing auth store...');
  store.setupTokenRefresh();
  // Restore user session if needed
  if (!store.user) {
    store.restoreSession();
  }
}

// Track user activity to keep session alive
if (typeof window !== 'undefined') {
  const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
  
  activityEvents.forEach(event => {
    window.addEventListener(event, () => {
      const store = useAuthStore.getState();
      if (store.accessToken) {
        store.updateActivity();
      }
    }, { passive: true });
  });
  
  // Check session every 5 minutes
  setInterval(() => {
    const store = useAuthStore.getState();
    if (store.accessToken) {
      const lastActivity = store.lastActivity || Date.now();
      const timeSinceActivity = Date.now() - lastActivity;
      
      // If user has been inactive for more than 30 minutes, don't auto-refresh
      if (timeSinceActivity < 30 * 60 * 1000) {
        store.checkSessionStatus();
      }
    }
  }, 5 * 60 * 1000); // Every 5 minutes
}
