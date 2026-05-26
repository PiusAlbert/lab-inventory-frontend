import api from '../lib/api'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

// ── Public (no auth token needed) ────────────────────────────────────
export const fetchPublicLabs = () =>
  axios.get(`${BASE_URL}/laboratories/public`).then(r => r.data)

export const registerStudent = (body) =>
  axios.post(`${BASE_URL}/auth/register/student`, body).then(r => r.data)

// ── Authenticated ─────────────────────────────────────────────────────
export const fetchPendingStudents = () =>
  api.get('/students/pending').then(r => r.data)

export const fetchStudents = () =>
  api.get('/students').then(r => r.data)

export const approveStudent = (id) =>
  api.post(`/students/${id}/approve`).then(r => r.data)

export const rejectStudent = (id, reason) =>
  api.post(`/students/${id}/reject`, { reason }).then(r => r.data)
