import api from '../lib/api'

export const fetchUsers    = ()         => api.get('/users').then(r => r.data)
export const createUser    = (body)     => api.post('/auth/register', body).then(r => r.data)
export const toggleUser    = (id)       => api.patch(`/users/${id}/toggle`).then(r => r.data)
