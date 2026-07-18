import { ChevronDown } from 'lucide-react'
import type { User } from '../types'

export function UserProfileMenu({ user, roleLabel }: { user: User; roleLabel: string }) {
  const initials = user.name.split(' ').slice(-2).map((part) => part[0]).join('').toUpperCase()
  return <div className="user-profile" aria-label={`Người dùng ${user.name}`}><span className="user-avatar" aria-hidden="true">{initials}</span><span className="user-profile-copy"><strong>{user.name}</strong><small>{roleLabel}</small></span><ChevronDown className="user-profile-chevron" aria-hidden="true" /></div>
}
