import api from '../lib/api'

export const fetchAuditLogs = (params = {}) =>
  api.get('/audit', { params }).then(r => r.data)
