import api from '../lib/api'

export const fetchTransactions = () =>
  api.get('/transactions').then(r => r.data)

export const issueStock = (body) =>
  api.post('/transactions/issue', body).then(r => r.data)

export const receiveStock = (body) =>
  api.post('/transactions/receive', body).then(r => r.data)