import { createContext, useState, useContext, useEffect } from 'react'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)

  // On app load, check if token exists and set user
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setUser({ token }) // minimal user object so ProtectedRoute lets us in
    }
  }, [])

  const login = (userData, token) => {
    localStorage.setItem('token', token)
    setUser(userData || { token }) // fallback if no user object returned
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
export default AuthContext