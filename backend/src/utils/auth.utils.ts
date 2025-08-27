import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { config } from '../config';

export const generateAccessToken = (userId: string, email: string): string => {
  return jwt.sign(
    { userId, email },
    config.jwt.secret,
    { expiresIn: '15m' } // 15 minutes
  );
};

export const generateRefreshToken = (userId: string, email: string): string => {
  return jwt.sign(
    { userId, email },
    config.jwt.refreshSecret,
    { expiresIn: '7d' } // 7 days
  );
};

export const verifyRefreshToken = (token: string): { userId: string; email: string } => {
  return jwt.verify(token, config.jwt.refreshSecret) as { userId: string; email: string };
};

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const validatePasswordStrength = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }

  if (!/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }

  return { valid: true };
};