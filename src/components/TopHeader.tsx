import { Menu } from 'lucide-react'
import type { User, UserRole } from '../types'
import { BrandLogo } from './BrandLogo'
import { UserProfileMenu } from './UserProfileMenu'

export function TopHeader({ role, user, onOpenMenu }: { role: UserRole; user: User; onOpenMenu(): void }) {
  return <header className="top-header"><button className="icon-button menu-trigger" onClick={onOpenMenu} aria-label="Mở menu"><Menu /></button><div className="mobile-brand"><BrandLogo variant="header" /></div><div className="top-header-context"><small>{role === 'trainer' ? 'Không gian Trainer' : 'Employee Learning'}</small><strong>{role === 'trainer' ? 'Course Studio' : 'Học tập của tôi'}</strong></div><UserProfileMenu user={user} roleLabel={role === 'trainer' ? 'Trainer' : 'Học viên'} /></header>
}
