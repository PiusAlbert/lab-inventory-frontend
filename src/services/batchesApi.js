import api from '../lib/api'

export const fetchBatches = () =>
  api.get('/batches').then(r => r.data)

export const fetchItemBatches = (itemId) =>
  api.get(`/batches/item/${itemId}`).then(r => r.data)

export const createBatch = (body) =>
  api.post('/batches', body).then(r => r.data)