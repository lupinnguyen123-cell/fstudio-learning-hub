import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useRole } from '../hooks/useRole'
export function AdminGuard() { const { role } = useRole(); const location = useLocation(); return role === 'trainer' ? <Outlet /> : <Navigate to="/unauthorized" replace state={{ from: location }} /> }
