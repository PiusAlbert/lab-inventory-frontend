import api from '../lib/api'

export const fetchCategories = () =>
  api.get('/categories').then(r => r.data)

export const createCategory = (body) =>
  api.post('/categories', body).then(r => r.data)

export const updateCategory = (id, body) =>
  api.put(`/categories/${id}`, body).then(r => r.data)

export const deleteCategory = (id) =>
  api.delete(`/categories/${id}`).then(r => r.data)