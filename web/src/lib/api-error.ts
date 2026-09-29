export const MESSAGES = {
  NETWORK_ERROR:
    'Cannot connect to the server. Please turn on your VPN and check your internet connection, then try again.',
  OFFLINE: 'You appear to be offline. Please check your internet connection.',
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
  EMAIL_EXISTS: 'This email is already registered. Please log in instead.',
  WEAK_PASSWORD: 'Password must be at least 8 characters long.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  SERVER_ERROR: 'Something went wrong on our server. Please try again later.',
  LOGIN_SUCCESS: 'Welcome back! Logged in successfully.',
  REGISTER_SUCCESS: 'Account created successfully. Welcome to TaskLine!',
  DASHBOARD_LOAD_ERROR: 'Cannot load your dashboard. Please turn on your VPN and try again.'
} as const

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return MESSAGES.OFFLINE
  }

  if (error instanceof TypeError) {
    const msg = error.message.toLowerCase()
    if (
      msg.includes('failed to fetch') ||
      msg.includes('fetch failed') ||
      msg.includes('networkerror') ||
      msg.includes('load failed') ||
      msg.includes('econnrefused') ||
      msg.includes('enotfound')
    ) {
      return MESSAGES.NETWORK_ERROR
    }
  }

  const err = error as {
    code?: string
    response?: { status?: number; data?: { message?: string | string[] } }
    message?: string
  }

  if (!err?.response && (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error'))) {
    return MESSAGES.NETWORK_ERROR
  }

  const status = err?.response?.status
  const backendMsg = err?.response?.data?.message

  const cleanBackendMsg = Array.isArray(backendMsg)
    ? backendMsg.join(', ')
    : typeof backendMsg === 'string'
      ? backendMsg
      : ''

  if (status === 400) return cleanBackendMsg || MESSAGES.VALIDATION_ERROR
  if (status === 401) return MESSAGES.INVALID_CREDENTIALS
  if (status === 403) return MESSAGES.UNAUTHORIZED
  if (status === 409) return MESSAGES.EMAIL_EXISTS
  if (status && status >= 500) return MESSAGES.SERVER_ERROR

  if (cleanBackendMsg) return cleanBackendMsg

  return fallback
}
