import { ShieldCheck, UserRound } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useRole } from '../hooks/useRole'
import type { UserRole } from '../types'

function isUserRole(value: string): value is UserRole {
  return value === 'employee' || value === 'trainer'
}

export function RoleSwitcher() {
  const { role, setRole } = useRole()
  const navigate = useNavigate()
  const location = useLocation()
  const changeRole = (nextRole: UserRole) => {
    setRole(nextRole)
    if (nextRole === 'employee' && location.pathname.startsWith('/admin')) navigate('/')
  }
  return <label className="role-switcher"><span className="sr-only">Vai trò mô phỏng</span>{role === 'trainer' ? <ShieldCheck size={16} aria-hidden="true" /> : <UserRound size={16} aria-hidden="true" />}<select value={role} onChange={(event) => { if (isUserRole(event.target.value)) changeRole(event.target.value) }}><option value="employee">Nhân viên</option><option value="trainer">Trainer</option></select></label>
}
