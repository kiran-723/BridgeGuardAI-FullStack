import React, { createContext, useContext, useState, useCallback } from 'react'
import client from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('bg_user')
    return stored ? JSON.parse(stored) : null
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (username, password) => {
    setLoading(true)
    setError('')
    try {
      const { data } = await client.post('/auth/login', { username, password })
      localStorage.setItem('bg_token', data.access_token)
      const userInfo = { username: data.username, full_name: data.full_name, role: data.role }
      localStorage.setItem('bg_user', JSON.stringify(userInfo))
      setUser(userInfo)
      return true
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('bg_token')
    localStorage.removeItem('bg_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, error, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
