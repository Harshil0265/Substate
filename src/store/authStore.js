import { create } from 'zustand'

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isLoading: false,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  sessionInfo: null,
  tokenRefreshTimer: null,

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
    } else {
      localStorage.removeItem('accessToken');
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
      sessionInfo
    });
    
    // Set up automatic token refresh
    if (accessToken) {
      get().setupTokenRefresh();
    }
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
    set({ 
      user: null, 
      accessToken: null, 
      refreshToken: null, 
      isAuthenticated: false,
      sessionInfo: null,
      tokenRefreshTimer: null
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
    set({ 
      user: null, 
      accessToken: null, 
      refreshToken: null, 
      isAuthenticated: false,
      sessionInfo: null,
      tokenRefreshTimer: null
    });
  },
  
  refreshAccessToken: async () => {
    const { refreshToken } = get();
    
    if (!refreshToken) {
      get().clearAuth();
      return false;
    }
    
    try {
      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.accessToken);
        set({ accessToken: data.accessToken });
        
        // Setup next refresh
        get().setupTokenRefresh();
        return true;
      } else {
        // Refresh token is invalid, clear auth
        get().clearAuth();
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
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
      
      // Refresh token 2 minutes before it expires
      const refreshTime = Math.max(0, timeUntilExpiry - (2 * 60 * 1000));
      
      if (refreshTime > 0) {
        const timer = setTimeout(() => {
          get().refreshAccessToken();
        }, refreshTime);
        
        set({ tokenRefreshTimer: timer });
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
        if (data.session.needsRefresh) {
          await get().refreshAccessToken();
        }
        
        return true;
      } else {
        get().clearAuth();
        return false;
      }
    } catch (error) {
      console.error('Session check failed:', error);
      return false;
    }
  },
  
  // Restore session from localStorage on app load
  restoreSession: async () => {
    const { accessToken, user } = get();
    
    if (!accessToken) {
      return false;
    }
    
    // If we have user data in localStorage, we're good
    if (user) {
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
        get().setUser(userData);
        get().setupTokenRefresh();
        return true;
      } else {
        get().clearAuth();
        return false;
      }
    } catch (error) {
      console.error('Session restore failed:', error);
      get().clearAuth();
      return false;
    }
  }
}))

// Initialize token refresh on app start
const store = useAuthStore.getState();
if (store.accessToken) {
  store.setupTokenRefresh();
  // Restore user session if needed
  if (!store.user) {
    store.restoreSession();
  }
}
