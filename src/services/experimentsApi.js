import api from '../lib/api'

// ── Core ─────────────────────────────────────────────────────────────
export const fetchExperiments   = (params = {}) => api.get('/experiments', { params }).then(r => r.data)
export const fetchExperimentById = (id)          => api.get(`/experiments/${id}`).then(r => r.data)
export const createExperiment   = (body)          => api.post('/experiments', body).then(r => r.data)
export const updateExperiment   = (id, body)      => api.put(`/experiments/${id}`, body).then(r => r.data)
export const deleteExperiment   = (id)            => api.delete(`/experiments/${id}`).then(r => r.data)

// ── Workflow ──────────────────────────────────────────────────────────
export const submitExperiment   = (id)            => api.post(`/experiments/${id}/submit`).then(r => r.data)
export const approveExperiment  = (id, body = {}) => api.post(`/experiments/${id}/approve`, body).then(r => r.data)
export const rejectExperiment   = (id, body = {}) => api.post(`/experiments/${id}/reject`,  body).then(r => r.data)

// ── Sections ──────────────────────────────────────────────────────────
export const addParticipant     = (id, body)        => api.post(`/experiments/${id}/participants`, body).then(r => r.data)
export const removeParticipant  = (id, pid)         => api.delete(`/experiments/${id}/participants/${pid}`).then(r => r.data)

export const addMaterial        = (id, body)        => api.post(`/experiments/${id}/materials`, body).then(r => r.data)
export const updateMaterial     = (id, mid, body)   => api.put(`/experiments/${id}/materials/${mid}`, body).then(r => r.data)
export const deleteMaterial     = (id, mid)         => api.delete(`/experiments/${id}/materials/${mid}`).then(r => r.data)

export const addEquipment       = (id, body)        => api.post(`/experiments/${id}/equipment`, body).then(r => r.data)
export const updateEquipment    = (id, eid, body)   => api.put(`/experiments/${id}/equipment/${eid}`, body).then(r => r.data)
export const deleteEquipment    = (id, eid)         => api.delete(`/experiments/${id}/equipment/${eid}`).then(r => r.data)

export const upsertSafety       = (id, body)        => api.put(`/experiments/${id}/safety`, body).then(r => r.data)

export const addStep            = (id, body)        => api.post(`/experiments/${id}/steps`, body).then(r => r.data)
export const updateStep         = (id, sid, body)   => api.put(`/experiments/${id}/steps/${sid}`, body).then(r => r.data)
export const deleteStep         = (id, sid)         => api.delete(`/experiments/${id}/steps/${sid}`).then(r => r.data)

export const addControl         = (id, body)        => api.post(`/experiments/${id}/controls`, body).then(r => r.data)
export const updateControl      = (id, cid, body)   => api.put(`/experiments/${id}/controls/${cid}`, body).then(r => r.data)
export const deleteControl      = (id, cid)         => api.delete(`/experiments/${id}/controls/${cid}`).then(r => r.data)

export const addObservation     = (id, body)        => api.post(`/experiments/${id}/observations`, body).then(r => r.data)
export const updateObservation  = (id, oid, body)   => api.put(`/experiments/${id}/observations/${oid}`, body).then(r => r.data)
export const deleteObservation  = (id, oid)         => api.delete(`/experiments/${id}/observations/${oid}`).then(r => r.data)

export const addResult          = (id, body)        => api.post(`/experiments/${id}/results`, body).then(r => r.data)
export const updateResult       = (id, rid, body)   => api.put(`/experiments/${id}/results/${rid}`, body).then(r => r.data)
export const deleteResult       = (id, rid)         => api.delete(`/experiments/${id}/results/${rid}`).then(r => r.data)

export const upsertConclusions  = (id, body)        => api.put(`/experiments/${id}/conclusions`, body).then(r => r.data)

export const addWasteRecord     = (id, body)        => api.post(`/experiments/${id}/waste`, body).then(r => r.data)
export const deleteWasteRecord  = (id, wid)         => api.delete(`/experiments/${id}/waste/${wid}`).then(r => r.data)

export const addEthicalApproval    = (id, body)     => api.post(`/experiments/${id}/approvals`, body).then(r => r.data)
export const deleteEthicalApproval = (id, apid)     => api.delete(`/experiments/${id}/approvals/${apid}`).then(r => r.data)
