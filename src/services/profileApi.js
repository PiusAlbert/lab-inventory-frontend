import api from '../lib/api'

export const fetchProfile   = ()     => api.get('/users/me').then(r => r.data)
export const updateProfile  = (body) => api.patch('/users/me', body).then(r => r.data)
export const changePassword = (body) => api.patch('/users/me/password', body).then(r => r.data)
