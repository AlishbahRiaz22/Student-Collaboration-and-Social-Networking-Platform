import api from './index'

export const getPosts = async () => {
  const response = await api.get('/posts')
  return response.data
}

export const getPostById = async (postId) => {
  const response = await api.get(`/posts/${postId}`)
  return response.data
}

export const createPost = async (postData) => {
  const response = await api.post('/posts', postData)
  return response.data
}

export const likePost = async (postId) => {
  const response = await api.put(`/posts/${postId}/like`)
  return response.data
}