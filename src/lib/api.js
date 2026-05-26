import axios from 'axios'
import { supabase } from './supabase'
import { getStoredLabId, LAB_ID_HEADER } from './labStorage'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

if (!BASE_URL) {
  throw new Error(
    '[api.js] VITE_API_BASE_URL is not set.\n' +
    'Add to .env.development:\n' +
    '  VITE_API_BASE_URL=http://localhost:5000/api'
  )
}

const api = axios.create({
  baseURL:         BASE_URL,
  withCredentials: false,
  timeout:         20000,
  headers:         { 'Content-Type': 'application/json' },
})

// ── Request interceptor ───────────────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    const next = { ...config, headers: { ...(config.headers || {}) } }

    // Attach JWT
    const { data } = await supabase.auth.getSession()
    const token    = data?.session?.access_token

    if (token) {
      next.headers.Authorization = `Bearer ${token}`
    } else {
      delete next.headers.Authorization
    }

    // Attach lab selection (SUPER_ADMIN only — regular users never set this)
    const selectedLabId = getStoredLabId()
    if (selectedLabId) {
      next.headers[LAB_ID_HEADER] = selectedLabId
    } else {
      delete next.headers[LAB_ID_HEADER]
    }

    return next
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor ──────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(
        new Error('Request timed out. The backend may be restarting.')
      )
    }

    if (error.response) {
      const contentType = error.response.headers?.['content-type'] ?? ''
      if (contentType.includes('text/html')) {
        return Promise.reject(
          new Error(
            `API returned HTML instead of JSON (status ${error.response.status}). ` +
            'Check VITE_API_BASE_URL and backend deployment.'
          )
        )
      }
      return Promise.reject(error)
    }

    if (error.request) {
      return Promise.reject(
        new Error('Unable to reach the backend. Check your network connection or backend server.')
      )
    }

    return Promise.reject(error)
  }
)

export default api
