import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const CustomerContext = createContext(null)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export function CustomerProvider({ children }) {
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('customerToken'))
  const [location, setLocation] = useState(null)

  const api = axios.create({ baseURL: API_URL })

  // Interceptor to always use the latest token
  api.interceptors.request.use((config) => {
    const currentToken = localStorage.getItem('customerToken')
    if (currentToken) {
      config.headers.Authorization = `Bearer ${currentToken}`
    }
    return config
  })

  useEffect(() => {
    if (token) {
      localStorage.setItem('customerToken', token)
    } else {
      localStorage.removeItem('customerToken')
    }
  }, [token])

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/customers/me')
          setCustomer(res.data.user)
        } catch {
          setToken(null)
          setCustomer(null)
        }
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  // Get user's current location
  const getLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (location) return resolve(location)

      if (!navigator.geolocation) {
        // Default to Pune
        const defaultLoc = { lat: 18.5204, lng: 73.8567 }
        setLocation(defaultLoc)
        resolve(defaultLoc)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setLocation(loc)
          resolve(loc)
        },
        () => {
          const defaultLoc = { lat: 18.5204, lng: 73.8567 }
          setLocation(defaultLoc)
          resolve(defaultLoc)
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
    })
  }, [location])

  const login = async (phone, password) => {
    const res = await axios.post(`${API_URL}/customers/login`, { phone, password })
    setToken(res.data.token)
    setCustomer(res.data.user)
    return res.data
  }

  const loginWithToken = (newToken, user) => {
    setToken(newToken)
    setCustomer(user)
  }

  const register = async (data) => {
    const res = await axios.post(`${API_URL}/customers/register`, data)
    setToken(res.data.token)
    setCustomer(res.data.user)
    return res.data
  }

  const logout = () => {
    setToken(null)
    setCustomer(null)
    localStorage.removeItem('customerToken')
  }

  return (
    <CustomerContext.Provider value={{
      customer, token, loading, location,
      isAuthenticated: !!customer,
      login, loginWithToken, register, logout, getLocation, api
    }}>
      {children}
    </CustomerContext.Provider>
  )
}

export const useCustomer = () => useContext(CustomerContext)
