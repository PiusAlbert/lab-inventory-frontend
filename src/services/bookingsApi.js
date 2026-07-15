import api from '../lib/api'

export const fetchBookings    = (params = {}) => api.get('/bookings', { params }).then(r => r.data)
export const fetchBookingById = (id)           => api.get(`/bookings/${id}`).then(r => r.data)
export const createBooking    = (body)         => api.post('/bookings', body).then(r => r.data)
export const approveBooking   = (id, body = {})=> api.patch(`/bookings/${id}/approve`, body).then(r => r.data)
export const declineBooking   = (id, body = {})=> api.patch(`/bookings/${id}/decline`, body).then(r => r.data)
export const cancelBooking    = (id)           => api.patch(`/bookings/${id}/cancel`).then(r => r.data)
