import api from '../lib/api'

export const fetchDashboard = async () => {
  const response = await api.get('/dashboard')
  if (!response.data?.success) {
    throw new Error(response.data?.error || 'Failed to load dashboard')
  }
  return response.data.data
}