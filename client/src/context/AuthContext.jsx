import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('adminToken'))

  // Create axios instance with auth header
  const api = axios.create({
    baseURL: API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })

  // Update axios headers when token changes
  useEffect(() => {
    if (token) {
      api.defaults.headers.Authorization = `Bearer ${token}`
      localStorage.setItem('adminToken', token)
    } else {
      delete api.defaults.headers.Authorization
      localStorage.removeItem('adminToken')
    }
  }, [token])

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/me')
          setUser(response.data.user)
        } catch (error) {
          console.error('Auth check failed:', error)
          setToken(null)
          setUser(null)
        }
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password })
      setToken(response.data.token)
      setUser(response.data.user)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      }
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('adminToken')
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    api,
    token
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

