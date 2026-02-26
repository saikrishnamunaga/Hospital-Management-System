// Use environment variable for production, fallback to local proxy for development
const API_BASE = import.meta.env.VITE_API_URL || '/api'

// Request timeout in milliseconds (10 seconds)
const REQUEST_TIMEOUT = 10000

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

// Create a fetch with timeout
const fetchWithTimeout = (url, options = {}, timeout = REQUEST_TIMEOUT) => {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => clearTimeout(id))
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
    try {
      const res = await fetchWithTimeout(`${API_BASE}${endpoint}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      })
      return { data: await handleResponse(res) }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Request timed out. Please check your connection and try again.', {}, 408)
      }
      throw error
    }
  },

  async post(endpoint, data) {
    const token = getToken()
    try {
      const res = await fetchWithTimeout(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      return { data: await handleResponse(res), response: res }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Request timed out. Please check your connection and try again.', {}, 408)
      }
      throw error
    }
  },

  async put(endpoint, data) {
    const token = getToken()
    try {
      const res = await fetchWithTimeout(`${API_BASE}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      return { data: await handleResponse(res) }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Request timed out. Please check your connection and try again.', {}, 408)
      }
      throw error
    }
  },

  async patch(endpoint, data) {
    const token = getToken()
    try {
      const res = await fetchWithTimeout(`${API_BASE}${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      return { data: await handleResponse(res) }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Request timed out. Please check your connection and try again.', {}, 408)
      }
      throw error
    }
  },

  async delete(endpoint) {
    const token = getToken()
    try {
      const res = await fetchWithTimeout(`${API_BASE}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      })
      return { data: await handleResponse(res) }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Request timed out. Please check your connection and try again.', {}, 408)
      }
      throw error
    }
  },
}

export default api
