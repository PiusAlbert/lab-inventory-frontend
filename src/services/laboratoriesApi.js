import api from '../lib/api'

export const fetchLaboratories  = ()           => api.get('/laboratories').then(r => r.data)
export const createLaboratory   = (body)       => api.post('/laboratories', body).then(r => r.data)
export const updateLaboratory   = (id, body)   => api.patch(`/laboratories/${id}`, body).then(r => r.data)
export const toggleLaboratory   = (id)         => api.patch(`/laboratories/${id}/toggle`).then(r => r.data)
