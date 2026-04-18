// Validation utilities for authentication

export const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  // Block common fake email domains
  const blockedDomains = ['tempmail.com', 'throwaway.email', '10minutemail.com', 'guerrillamail.com'];
  const domain = email.split('@')[1]?.toLowerCase();
  
  if (blockedDomains.includes(domain)) {
    return { valid: false, error: 'Temporary email addresses are not allowed' };
  }
  
  return { valid: true };
};

export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  
  if (password.length > 128) {
    return { valid: false, error: 'Password must not exceed 128 characters' };
  }
  
  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  
  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }
  
  // Check for number
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  
  // Check for special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character (!@#$%^&*...)' };
  }
  
  // Check for common weak passwords
  const weakPasswords = ['Password1!', 'Welcome1!', 'Admin123!', 'Test1234!'];
  if (weakPasswords.includes(password)) {
    return { valid: false, error: 'This password is too common. Please choose a stronger password' };
  }
  
  return { valid: true };
};

export const validateName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required' };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters long' };
  }
  
  if (trimmedName.length > 50) {
    return { valid: false, error: 'Name must not exceed 50 characters' };
  }
  
  // Only allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(trimmedName)) {
    return { valid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }
  
  // Check for numbers
  if (/\d/.test(trimmedName)) {
    return { valid: false, error: 'Name cannot contain numbers' };
  }
  
  // Check for special characters (except hyphen and apostrophe)
  if (/[^a-zA-Z\s'-]/.test(trimmedName)) {
    return { valid: false, error: 'Name contains invalid characters' };
  }
  
  return { valid: true, sanitized: trimmedName };
};

export const generateOTP = () => {
  // Generate 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove any HTML tags
  return input.replace(/<[^>]*>/g, '').trim();
};
