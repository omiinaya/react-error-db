/**
 * Validation utilities for user input
 */

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Username validation: alphanumeric, underscore, hyphen, 3-30 chars
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;

// Error code validation: alphanumeric, underscore, 2-50 chars
const ERROR_CODE_REGEX = /^[a-zA-Z0-9_]{2,50}$/;

// Password requirements: min 8 chars, at least one uppercase, one lowercase, one number, one special char
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return EMAIL_REGEX.test(email);
}

/**
 * Validate password strength
 * Requirements: min 8 chars, uppercase, lowercase, number, special char
 */
export function validatePassword(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false;
  }
  return PASSWORD_REGEX.test(password);
}

/**
 * Validate username
 * Requirements: 3-30 chars, alphanumeric, underscore, hyphen only
 */
export function validateUsername(username: string): boolean {
  if (!username || typeof username !== 'string') {
    return false;
  }
  return USERNAME_REGEX.test(username);
}

/**
 * Validate error code format
 * Requirements: 2-50 chars, alphanumeric, underscore only
 */
export function validateErrorCode(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }
  return ERROR_CODE_REGEX.test(code);
}

/**
 * Validate solution text length
 * Requirements: 10-10000 characters
 */
export function validateSolutionText(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }
  const length = text.trim().length;
  return length >= 10 && length <= 10000;
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
