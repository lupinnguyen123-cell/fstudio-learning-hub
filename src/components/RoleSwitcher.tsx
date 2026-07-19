import { ShieldCheck, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../hooks/useRole'
import type { UserRole } from '../types'

function isUserRole(value: string): value is UserRole {
  return value === 'employee' || value === 'trainer'
}

export function RoleSwitcher({ onRoleChange }: { onRoleChange?: () => void }) {
  const { role, setRole } = useRole()
  const navigate = useNavigate()
  const changeRole = (nextRole: UserRole) => {
    if (nextRole === role) return
    setRole(nextRole)
    onRoleChange?.()
    navigate(nextRole === 'trainer' ? '/admin/courses' : '/', { replace: true })
  }
  return <label className="role-switcher"><span className="sr-only">Vai trò mô phỏng</span>{role === 'trainer' ? <ShieldCheck size={16} aria-hidden="true" /> : <UserRound size={16} aria-hidden="true" />}<select value={role} onChange={(event) => { if (isUserRole(event.target.value)) changeRole(event.target.value) }}><option value="employee">Nhân viên</option><option value="trainer">Trainer</option></select></label>
}
