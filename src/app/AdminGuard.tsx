import { Navigate, Outlet } from 'react-router-dom'
import { useRole } from '../hooks/useRole'
export function AdminGuard() { const { role } = useRole(); return role === 'trainer' ? <Outlet /> : <Navigate to="/" replace /> }
