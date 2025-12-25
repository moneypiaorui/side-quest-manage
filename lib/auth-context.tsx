"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getCurrentUser, type UserVO } from "./api"

interface AuthContextType {
  user: UserVO | null
  token: string | null
  isLoading: boolean
  isAdmin: boolean
  login: (token: string) => void
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserVO | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const result = await getCurrentUser()
      if (result.code === 200 && result.data) {
        setUser(result.data)
      } else {
        setUser(null)
        localStorage.removeItem("adminToken")
        setToken(null)
      }
    } catch {
      setUser(null)
      localStorage.removeItem("adminToken")
      setToken(null)
    }
  }

  useEffect(() => {
    const storedToken = localStorage.getItem("adminToken")
    if (storedToken) {
      setToken(storedToken)
      refreshUser().finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = (newToken: string) => {
    localStorage.setItem("adminToken", newToken)
    setToken(newToken)
    refreshUser()
  }

  const logout = () => {
    localStorage.removeItem("adminToken")
    setToken(null)
    setUser(null)
  }

  const isAdmin = user?.role === "admin" || user?.role === "ADMIN"

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAdmin, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
