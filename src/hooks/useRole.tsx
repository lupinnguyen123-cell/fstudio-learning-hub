/* eslint-disable react-refresh/only-export-components -- Provider and its typed hook are intentionally colocated. */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { UserRole } from '../types'

const ROLE_KEY = 'fstudio-learning-role'
interface RoleContextValue { role: UserRole; setRole: (role: UserRole) => void }
const RoleContext = createContext<RoleContextValue | null>(null)

function initialRole(): UserRole {
  try {
    return localStorage.getItem(ROLE_KEY) === 'trainer' ? 'trainer' : 'employee'
  } catch {
    return 'employee'
  }
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, updateRole] = useState<UserRole>(initialRole)
  const value = useMemo(() => ({ role, setRole: (nextRole: UserRole) => {
    try { localStorage.setItem(ROLE_KEY, nextRole) } catch { /* Storage may be unavailable; in-memory role still works. */ }
    updateRole(nextRole)
  } }), [role])
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

export function useRole() {
  const context = useContext(RoleContext)
  if (!context) throw new Error('useRole must be used within RoleProvider')
  return context
}
