import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import EmailVerification from '../models/EmailVerification.js';
import verifyToken from '../middleware/auth.js';
import { validateEmail, validatePassword, validateName, generateOTP, sanitizeInput } from '../utils/validators.js';
import EmailService from '../services/EmailService.js';
import TokenService from '../services/TokenService.js';

const router = express.Router();

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map();

const checkRateLimit = (identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const now = Date.now();
  const record = rateLimitStore.get(identifier) || { attempts: 0, resetAt: now + windowMs };
  
  if (now > record.resetAt) {
    record.attempts = 0;
    record.resetAt = now + windowMs;
  }
  
  record.attempts++;
  rateLimitStore.set(identifier, record);
  
  return record.attempts <= maxAttempts;
};

// Step 1: Register (sends OTP)
router.post('/register', async (req, res) => {
  try {
    let { email, password, name } = req.body;

    // Rate limiting
    if (!checkRateLimit(`register_${req.ip}`, 5, 15 * 60 * 1000)) {
      return res.status(429).json({ error: 'Too many registration attempts. Please try again later.' });
    }

    // Sanitize inputs
    email = sanitizeInput(email)?.toLowerCase();
    name = sanitizeInput(name);

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ error: emailValidation.error });
    }

    // Validate name
    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      return res.status(400).json({ error: nameValidation.error });
    }
    name = nameValidation.sanitized;

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.emailVerified) {
        return res.status(400).json({ error: 'An account with this email already exists' });
      } else {
        // User registered but not verified - allow resend
        await User.deleteOne({ _id: existingUser._id });
      }
    }

    // Create user (unverified)
    const user = new User({
      email,
      password,
      name,
      emailVerified: false,
      subscription: 'TRIAL',
      subscriptionStatus: 'ACTIVE',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    });

    await user.save();

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP
    await EmailVerification.create({
      email,
      otp,
      userId: user._id,
      expiresAt
    });

    // Send OTP email
    try {
      await EmailService.sendOTP(email, otp, name);
    } catch (emailError) {
      console.error('Email send failed:', emailError);
      // Continue anyway - user can request resend
    }

    res.status(201).json({
      message: 'Registration successful! Please check your email for verification code.',
      userId: user._id,
      email: user.email,
      requiresVerification: true
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Step 2: Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    let { email, otp } = req.body;
    email = sanitizeInput(email)?.toLowerCase();
    otp = sanitizeInput(otp);

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Rate limiting
    if (!checkRateLimit(`verify_${email}`, 10, 15 * 60 * 1000)) {
      return res.status(429).json({ error: 'Too many verification attempts. Please request a new code.' });
    }

    // Find verification record
    const verification = await EmailVerification.findOne({
      email,
      verified: false
    }).sort({ createdAt: -1 });

    if (!verification) {
      return res.status(400).json({ error: 'No verification code found. Please request a new one.' });
    }

    // Check expiration
    if (new Date() > verification.expiresAt) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    // Check attempts
    if (verification.attempts >= 5) {
      return res.status(400).json({ error: 'Too many failed attempts. Please request a new code.' });
    }

    // Verify OTP
    if (verification.otp !== otp) {
      verification.attempts++;
      await verification.save();
      return res.status(400).json({ 
        error: 'Invalid verification code',
        attemptsLeft: 5 - verification.attempts
      });
    }

    // Mark as verified
    verification.verified = true;
    await verification.save();

    // Update user
    const user = await User.findById(verification.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.emailVerified = true;
    user.verifiedAt = new Date();
    await user.save();

    // Send welcome email
    try {
      await EmailService.sendWelcomeEmail(email, user.name);
    } catch (emailError) {
      console.error('Welcome email failed:', emailError);
    }

    // Generate tokens
    const tokenPayload = { userId: user._id, email: user.email };
    const tokens = TokenService.generateTokenPair(tokenPayload, false);

    res.json({
      message: 'Email verified successfully!',
      ...tokens,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        subscription: user.subscription,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    let { email } = req.body;
    email = sanitizeInput(email)?.toLowerCase();

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Rate limiting
    if (!checkRateLimit(`resend_${email}`, 3, 15 * 60 * 1000)) {
      return res.status(429).json({ error: 'Too many resend requests. Please wait before trying again.' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Delete old OTPs
    await EmailVerification.deleteMany({ email, verified: false });

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await EmailVerification.create({
      email,
      otp,
      userId: user._id,
      expiresAt
    });

    // Send OTP
    await EmailService.sendOTP(email, otp, user.name);

    res.json({ message: 'Verification code sent successfully!' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Failed to resend code. Please try again.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    let { email, password, rememberMe } = req.body;
    email = sanitizeInput(email)?.toLowerCase();
    rememberMe = Boolean(rememberMe);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Rate limiting
    if (!checkRateLimit(`login_${email}`, 5, 15 * 60 * 1000)) {
      return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if account is locked
    if (user.accountLocked && user.lockedUntil && new Date() < user.lockedUntil) {
      const minutesLeft = Math.ceil((user.lockedUntil - new Date()) / 60000);
      return res.status(403).json({ 
        error: `Account is locked due to multiple failed login attempts. Please try again in ${minutesLeft} minutes.` 
      });
    }

    // Reset lock if expired
    if (user.accountLocked && user.lockedUntil && new Date() >= user.lockedUntil) {
      user.accountLocked = false;
      user.lockedUntil = null;
      user.failedLoginAttempts = 0;
    }

    // Check email verification
    if (!user.emailVerified) {
      return res.status(403).json({ 
        error: 'Please verify your email before logging in',
        requiresVerification: true,
        email: user.email
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      user.failedLoginAttempts++;
      
      // Lock account after 5 failed attempts
      if (user.failedLoginAttempts >= 5) {
        user.accountLocked = true;
        user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        await user.save();
        return res.status(403).json({ error: 'Account locked due to multiple failed login attempts. Please try again in 30 minutes.' });
      }
      
      await user.save();
      return res.status(401).json({ 
        error: 'Invalid email or password',
        attemptsLeft: 5 - user.failedLoginAttempts
      });
    }

    // Reset failed attempts on successful login
    user.failedLoginAttempts = 0;
    user.lastLogin = new Date();
    user.lastActivityDate = new Date();
    await user.save();

    // Generate tokens
    const tokenPayload = { userId: user._id, email: user.email };
    const tokens = TokenService.generateTokenPair(tokenPayload, rememberMe);

    res.json({
      ...tokens,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        subscription: user.subscription,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionStartDate: user.subscriptionStartDate,
        subscriptionEndDate: user.subscriptionEndDate,
        emailVerified: user.emailVerified
      },
      sessionInfo: {
        rememberMe,
        expiresAt: TokenService.getTokenExpiration(tokens.refreshToken),
        sessionDuration: rememberMe ? '30 days' : '7 days'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Get current user
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update last activity
    user.lastActivityDate = new Date();
    await user.save();
    
    // Return user with subscription data
    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      subscription: user.subscription,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionStartDate: user.subscriptionStartDate,
      subscriptionEndDate: user.subscriptionEndDate,
      emailVerified: user.emailVerified,
      campaignCount: user.campaignCount,
      articleCount: user.articleCount,
      riskScore: user.riskScore,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Refresh access token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ 
        error: 'Refresh token required',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = TokenService.verifyToken(refreshToken);
    } catch (error) {
      return res.status(401).json({ 
        error: 'Invalid or expired refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user || !user.emailVerified) {
      return res.status(401).json({ 
        error: 'User not found or not verified',
        code: 'USER_NOT_FOUND'
      });
    }

    // Update last activity
    user.lastActivityDate = new Date();
    await user.save();

    // Generate new access token
    const tokenPayload = { userId: user._id, email: user.email };
    const newAccessToken = TokenService.generateAccessToken(tokenPayload);

    res.json({
      accessToken: newAccessToken,
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m'
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// Logout (invalidate session)
router.post('/logout', verifyToken, async (req, res) => {
  try {
    // Update user's last activity
    const user = await User.findById(req.userId);
    if (user) {
      user.lastActivityDate = new Date();
      await user.save();
    }

    // In a production app, you'd want to blacklist the token
    // For now, we'll just return success and let the client handle token removal
    res.json({ 
      message: 'Logged out successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Check session status
router.get('/session-status', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('email name lastActivityDate');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const tokenExpiration = new Date(req.tokenExp * 1000);
    const now = new Date();
    const timeUntilExpiry = Math.max(0, Math.floor((tokenExpiration.getTime() - now.getTime()) / (1000 * 60)));

    res.json({
      isValid: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      },
      session: {
        expiresAt: tokenExpiration,
        expiresIn: `${timeUntilExpiry} minutes`,
        lastActivity: user.lastActivityDate,
        needsRefresh: timeUntilExpiry <= 5
      }
    });
  } catch (error) {
    console.error('Session status error:', error);
    res.status(500).json({ error: 'Failed to get session status' });
  }
});

export default router;
