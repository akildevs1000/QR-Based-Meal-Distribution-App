import { Navigate } from 'react-router-dom'
import { getToken } from '../api/client'

export default function ProtectedRoute({ children }) {
  if (!getToken()) return <Navigate to="/login" replace />
  if (localStorage.getItem('user_type') === 'supplier') {
    return <Navigate to="/supplier" replace />
  }
  return children
}
