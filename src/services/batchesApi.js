import api from "../lib/api"

export const fetchBatches = () =>
  api.get("/batches").then(r => r.data)

export const fetchItemBatches = (itemId) =>
  api.get(`/batches/item/${itemId}`).then(r => r.data)

export const createBatch = (body) =>
  api.post("/batches", body).then(r => r.data)

export const updateBatch = (id, body) =>
  api.put(`/batches/${id}`, body).then(r => r.data)

export const deleteBatch = (id) =>
  api.delete(`/batches/${id}`).then(r => r.data)