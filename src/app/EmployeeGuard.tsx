import { Navigate, Outlet } from 'react-router-dom'
import { useRole } from '../hooks/useRole'

export function EmployeeGuard() {
  const { role } = useRole()
  return role === 'employee' ? <Outlet /> : <Navigate to="/admin/courses" replace />
}
