import { api } from './api'
import type { ApiResponse } from './api'

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthData {
  token: string
}

export const authHttp = {
  login: (payload: LoginPayload) =>
    api.post<ApiResponse<AuthData>>('/auth/login', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  logout: () =>
    api.post<ApiResponse<null>>('/auth/logout'),
}
