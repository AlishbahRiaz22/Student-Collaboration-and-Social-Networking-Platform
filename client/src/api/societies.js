import api from './index'

export const getSocietiesFeed = async () => {
  const response = await api.get('/societies/discover')
  return response.data
}

export const getMySocieties = async () => {
  const response = await api.get('/societies/mine')
  return response.data
}

export const getSociety = async (identifier) => {
  const response = await api.get(`/societies/${encodeURIComponent(identifier)}`)
  return response.data
}

export const getSocietyMembers = async (identifier) => {
  const response = await api.get(`/societies/${encodeURIComponent(identifier)}/members`)
  return response.data
}

export const getSocietySections = async (identifier) => {
  const response = await api.get(`/societies/${encodeURIComponent(identifier)}/sections`)
  return response.data
}

export const getSocietyPosts = async (identifier, sectionId) => {
  const params = sectionId ? { sectionId } : {}
  const response = await api.get(`/societies/${encodeURIComponent(identifier)}/posts`, { params })
  return response.data
}

export const createSocietySection = async (identifier, payload) => {
  const response = await api.post(`/societies/${encodeURIComponent(identifier)}/sections`, payload)
  return response.data
}

export const postToSociety = async (payload) => {
  const response = await api.post('/posts', payload)
  return response.data
}

export const addSocietyMember = async (identifier, payload) => {
  const response = await api.post(`/societies/${encodeURIComponent(identifier)}/members`, payload)
  return response.data
}

export const inviteSocietyMember = async (identifier, payload) => {
  const response = await api.post(`/societies/${encodeURIComponent(identifier)}/members`, payload)
  return response.data
}

export const updateSocietyMember = async (identifier, memberUserId, payload) => {
  const response = await api.patch(`/societies/${encodeURIComponent(identifier)}/members/${memberUserId}`, payload)
  return response.data
}

export const removeSocietyMember = async (identifier, memberUserId) => {
  const response = await api.delete(`/societies/${encodeURIComponent(identifier)}/members/${memberUserId}`)
  return response.data
}

export const assignSocietySectionMember = async (identifier, sectionId, payload) => {
  const response = await api.post(`/societies/${encodeURIComponent(identifier)}/sections/${sectionId}/members`, payload)
  return response.data
}

export const removeSocietySectionMember = async (identifier, sectionId, userId) => {
  const response = await api.delete(`/societies/${encodeURIComponent(identifier)}/sections/${sectionId}/members/${userId}`)
  return response.data
}

export const createSociety = async (payload) => {
  const response = await api.post('/societies', payload)
  return response.data
}

export const updateSociety = async (identifier, payload) => {
  const response = await api.put(`/societies/${encodeURIComponent(identifier)}`, payload)
  return response.data
}

export const joinSociety = async (identifier) => {
  const response = await api.post(`/societies/${encodeURIComponent(identifier)}/join`)
  return response.data
}

export const leaveSociety = async (identifier) => {
  const response = await api.delete(`/societies/${encodeURIComponent(identifier)}/leave`)
  return response.data
}

export const followSociety = async (identifier) => {
  const response = await api.post(`/societies/${encodeURIComponent(identifier)}/follow`)
  return response.data
}

export const unfollowSociety = async (identifier) => {
  const response = await api.delete(`/societies/${encodeURIComponent(identifier)}/follow`)
  return response.data
}