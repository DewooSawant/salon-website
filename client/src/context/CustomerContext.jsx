import { createContext, useContext, useState, useCallback } from 'react'
import axios from 'axios'

const CustomerContext = createContext(null)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export function CustomerProvider({ children }) {
  const [location, setLocation] = useState(null)

  const api = axios.create({ baseURL: API_URL })

  const getLocation = useCallback(() => {
    return new Promise((resolve) => {
      if (location) return resolve(location)

      const defaultLoc = { lat: 18.5204, lng: 73.8567 }

      if (!navigator.geolocation) {
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
          setLocation(defaultLoc)
          resolve(defaultLoc)
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
    })
  }, [location])

  return (
    <CustomerContext.Provider value={{
      customer: null,
      isAuthenticated: false,
      location,
      getLocation,
      api,
    }}>
      {children}
    </CustomerContext.Provider>
  )
}

export const useCustomer = () => useContext(CustomerContext)
