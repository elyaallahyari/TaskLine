import { ApiError } from './api'

export const MESSAGES = {
  LOCAL_BACKEND_DOWN: 'Cannot reach local server. Make sure your backend is running on port 4000.',
  NETWORK_ERROR:
    'Cannot connect to the server. Please turn on your VPN and check your internet connection, then try again.',
  OFFLINE: 'You appear to be offline. Please check your internet connection.',
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
  EMAIL_EXISTS: 'This email is already registered. Please log in instead.',
  REQUIRED_FIELDS: 'Please enter your email and password.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  WEAK_PASSWORD: 'Password must be at least 8 characters long.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  SERVER_ERROR: 'Something went wrong on our server. Please try again later.',
  LOGIN_SUCCESS: 'Welcome back! Logged in successfully.',
  REGISTER_SUCCESS: 'Account created successfully. Welcome to TaskLine!',
  DASHBOARD_LOAD_ERROR: 'Cannot load your dashboard. Please check your connection and try again.'
} as const

function isLocalApi(): boolean {
  const url = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
  return url.includes('localhost') || url.includes('127.0.0.1')
}

type LegacyErrorShape = {
  response?: {
    status?: unknown
    data?: { message?: unknown }
  }
}

function getLegacyStatus(error: unknown): number | null {
  if (typeof error !== 'object' || error === null) return null
  if (!('response' in error)) return null
  const resp = (error as LegacyErrorShape).response
  return typeof resp?.status === 'number' ? resp.status : null
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return MESSAGES.OFFLINE
  }

  const networkMsg = isLocalApi() ? MESSAGES.LOCAL_BACKEND_DOWN : MESSAGES.NETWORK_ERROR

  if (error instanceof TypeError) {
    const m = error.message.toLowerCase()
    if (
      m.includes('failed to fetch') ||
      m.includes('fetch failed') ||
      m.includes('network') ||
      m.includes('load failed')
    ) {
      return networkMsg
    }
  }

  if (error instanceof ApiError) {
    if (error.message.toLowerCase().includes('failed to fetch')) return networkMsg
    if (error.status === 400) return error.message || MESSAGES.VALIDATION_ERROR
    if (error.status === 401) return MESSAGES.INVALID_CREDENTIALS
    if (error.status === 403) return MESSAGES.UNAUTHORIZED
    if (error.status === 409) return MESSAGES.EMAIL_EXISTS
    if (error.status === 422) return error.message || MESSAGES.VALIDATION_ERROR
    if (error.status >= 500) return MESSAGES.SERVER_ERROR
    if (error.message && error.message.length < 200 && !error.message.includes('<')) {
      return error.message
    }
    return fallback
  }

  const legacyStatus = getLegacyStatus(error)
  if (legacyStatus === 401) return MESSAGES.INVALID_CREDENTIALS
  if (legacyStatus === 409) return MESSAGES.EMAIL_EXISTS

  return fallback
}
