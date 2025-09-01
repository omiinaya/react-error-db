/**
 * Token utility functions for JWT validation and expiration checking
 */

/**
 * Checks if a JWT token is expired
 * @param token The JWT token to check
 * @returns boolean indicating if token is expired
 */
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;

  try {
    // Split the token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      return true; // Invalid token format
    }

    // Parse the payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token has expiration
    if (!payload.exp) {
      return true; // No expiration date, assume expired
    }

    // Check if token is expired (current time in seconds)
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Assume expired on error
  }
};

/**
 * Gets the remaining time until token expiration in seconds
 * @param token The JWT token to check
 * @returns number of seconds until expiration, or null if expired/invalid
 */
export const getTokenExpirationTime = (token: string | null): number | null => {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    
    if (!payload.exp) {
      return null;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiration = payload.exp - currentTime;
    
    return timeUntilExpiration > 0 ? timeUntilExpiration : null;
  } catch (error) {
    console.error('Error getting token expiration time:', error);
    return null;
  }
};

/**
 * Gets the token payload (decoded)
 * @param token The JWT token to decode
 * @returns The decoded payload or null if invalid
 */
export const getTokenPayload = (token: string | null): any => {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    return JSON.parse(atob(parts[1]));
  } catch (error) {
    console.error('Error decoding token payload:', error);
    return null;
  }
};

/**
 * Validates token format and returns a validation result
 * @param token The JWT token to validate
 * @returns Object with validation information
 */
export const validateToken = (token: string | null): {
  isValid: boolean;
  isExpired: boolean;
  expiresIn: number | null;
  payload: any;
} => {
  if (!token) {
    return {
      isValid: false,
      isExpired: true,
      expiresIn: null,
      payload: null
    };
  }

  const payload = getTokenPayload(token);
  const isExpired = isTokenExpired(token);
  const expiresIn = getTokenExpirationTime(token);

  return {
    isValid: payload !== null,
    isExpired,
    expiresIn,
    payload
  };
};