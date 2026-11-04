import { User } from '../types';

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters long' };
  }
  return { valid: true };
}

export function authenticateUser(email: string, users: User[]): User | null {
  const normalized = email.trim().toLowerCase();
  const matched = users.find(u => u.email.toLowerCase() === normalized);
  return matched || null;
}
