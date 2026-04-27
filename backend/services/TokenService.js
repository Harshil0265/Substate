import jwt from 'jsonwebtoken';

class TokenService {
  // Generate access token (long-lived for professional experience)
  static generateAccessToken(payload) {
    return jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY || '7d',
        issuer: 'substate-app',
        audience: 'substate-users'
      }
    );
  }

  // Generate refresh token (longer-lived)
  static generateRefreshToken(payload) {
    return jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRY || '30d',
        issuer: 'substate-app',
        audience: 'substate-users'
      }
    );
  }

  // Generate remember me token (longest-lived)
  static generateRememberMeToken(payload) {
    return jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_REMEMBER_ME_EXPIRY || '90d',
        issuer: 'substate-app',
        audience: 'substate-users'
      }
    );
  }

  // Generate token pair
  static generateTokenPair(payload, rememberMe = false) {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = rememberMe 
      ? this.generateRememberMeToken(payload)
      : this.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      expiresIn: rememberMe ? '90d' : '30d',
      tokenType: 'Bearer'
    };
  }

  // Verify token
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'substate-app',
        audience: 'substate-users'
      });
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  // Decode token without verification (for expired token info)
  static decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }

  // Check if token is expired
  static isTokenExpired(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  // Get token expiration time
  static getTokenExpiration(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) return null;
      
      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }

  // Get time until token expires (in minutes)
  static getTimeUntilExpiry(token) {
    try {
      const expiration = this.getTokenExpiration(token);
      if (!expiration) return 0;
      
      const now = new Date();
      const diffMs = expiration.getTime() - now.getTime();
      return Math.max(0, Math.floor(diffMs / (1000 * 60)));
    } catch (error) {
      return 0;
    }
  }
}

export default TokenService;