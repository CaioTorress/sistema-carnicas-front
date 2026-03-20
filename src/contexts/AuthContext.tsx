import { createContext, useContext, useState, type ReactNode } from 'react'
import { authHttp } from '../http/auth'

interface AuthContextData {
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('token'),
  )

  const login = async (email: string, password: string) => {
    const { data } = await authHttp.login({ email, password })
    const receivedToken = data.data.token
    localStorage.setItem('token', receivedToken)
    setToken(receivedToken)
  }

  const logout = async () => {
    try {
      await authHttp.logout()
    } finally {
      localStorage.removeItem('token')
      setToken(null)
    }
  }

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
