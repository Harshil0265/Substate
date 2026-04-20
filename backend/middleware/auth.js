import jwt from 'jsonwebtoken';
import TokenService from '../services/TokenService.js';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  console.log('🔐 Auth middleware - Token verification:', {
    hasAuthHeader: !!authHeader,
    hasToken: !!token,
    tokenPreview: token ? token.substring(0, 20) + '...' : 'none'
  });
  
  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'NO_TOKEN'
    });
  }

  try {
    const decoded = TokenService.verifyToken(token);
    console.log('✅ Token decoded successfully:', {
      userId: decoded.userId,
      email: decoded.email,
      exp: new Date(decoded.exp * 1000).toISOString()
    });
    
    // IMPORTANT: JWT payload uses 'userId', not 'id'
    req.userId = decoded.userId.toString(); // Ensure it's a string for comparison
    req.userEmail = decoded.email;
    req.tokenExp = decoded.exp;
    
    // Check if token expires soon (within 5 minutes)
    const timeUntilExpiry = TokenService.getTimeUntilExpiry(token);
    if (timeUntilExpiry <= 5 && timeUntilExpiry > 0) {
      res.setHeader('X-Token-Refresh-Needed', 'true');
      res.setHeader('X-Token-Expires-In', timeUntilExpiry.toString());
    }
    
    next();
  } catch (error) {
    console.log('❌ Token verification failed:', error.message);
    if (error.message.includes('expired')) {
      return res.status(401).json({ 
        error: 'Access token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(401).json({ 
      error: 'Invalid access token',
      code: 'INVALID_TOKEN'
    });
  }
};

// Optional auth middleware (doesn't fail if no token)
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    try {
      const decoded = TokenService.verifyToken(token);
      req.userId = decoded.userId;
      req.userEmail = decoded.email;
      req.tokenExp = decoded.exp;
    } catch (error) {
      // Continue without auth if token is invalid
    }
  }
  
  next();
};

export default verifyToken;
