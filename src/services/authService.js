/**
 * Lumiere AI — Auth Service
 * Login (email/password), Register, Google OAuth, Me
 */
import apiClient from './apiClient';

export const authService = {
  /** Register a new teacher account */
  register: (data) => apiClient.post('/api/auth/register', data),

  /** Login with email + password */
  login: (email, password) =>
    apiClient.post('/api/auth/login', { email, password }),

  /** Login with Google ID token (from @react-oauth/google) */
  googleLogin: (credential) =>
    apiClient.post('/api/auth/google', { credential }),

  /** Get current user info */
  me: () => apiClient.get('/api/auth/me'),

  /** Request password reset OTP */
  forgotPassword: (email) =>
    apiClient.post('/api/auth/forgot-password', { email }),

  /** Reset password with email OTP */
  resetPassword: ({ email, otp, new_password }) =>
    apiClient.post('/api/auth/reset-password', { email, otp, new_password }),
};
