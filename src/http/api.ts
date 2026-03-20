import axios from 'axios'

export interface ApiResponse<T> {
  title: string
  message: string
  data: T
}

export interface ApiErrorResponse {
  title: string
  message: string
}

function currentApiUrl(): string {
  const { href } = window.location

  if (href.includes('homolog')) return 'https://api-homolog.sistema-vini.com.br/api'
  if (href.includes('develop') || href.includes('localhost')) return 'http://localhost:8000/api'

  return 'https://api.sistema-vini.com.br/api'
}

export const api = axios.create({
  baseURL: currentApiUrl(),
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)
