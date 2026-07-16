import api from '../lib/api'

export const fetchNotifications = () => api.get('/notifications').then(r => r.data)
