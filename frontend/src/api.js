// Use environment variable for production, fallback to relative path for development
const API_BASE = import.meta.env.VITE_API_URL || '/api'

const getToken = () => localStorage.getItem('access')

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('access', token)
  }
}

class ApiError extends Error {
  constructor(message, data, status) {
    super(message)
    this.name = 'ApiError'
    this.data = data
    this.status = status
  }
}

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}))
  
  if (res.status === 401) {
    localStorage.removeItem('access')
    window.location.reload()
    throw new ApiError('Unauthorized', data, res.status)
  }
  
  if (!res.ok) {
    throw data
  }
  
  return data
}

const api = {
  async get(endpoint) {
    const token = getToken()
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    })
    return { data: await handleResponse(res) }
  },

  async post(endpoint, data) {
    const token = getToken()
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    return { data: await handleResponse(res), response: res }
  },

  async put(endpoint, data) {
    const token = getToken()
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    return { data: await handleResponse(res) }
  },

  async patch(endpoint, data) {
    const token = getToken()
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    return { data: await handleResponse(res) }
  },

  async delete(endpoint) {
    const token = getToken()
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    })
    return { data: await handleResponse(res) }
  },
}

export default api
