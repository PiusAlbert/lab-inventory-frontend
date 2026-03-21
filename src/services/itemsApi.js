import api from '../lib/api'

export const fetchItems = (params = {}) =>
  api.get('/items', { params }).then(r => r.data)

export const fetchItemById = (id) =>
  api.get(`/items/${id}`).then(r => r.data)

export const searchItems = (params = {}) =>
  api.get('/items/search', { params }).then(r => r.data)

export const createItem = (body) =>
  api.post('/items', body).then(r => r.data)

export const updateItem = (id, body) =>
  api.put(`/items/${id}`, body).then(r => r.data)

export const deleteItem = (id) =>
  api.delete(`/items/${id}`).then(r => r.data)