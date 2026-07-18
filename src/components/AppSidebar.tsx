import { BookOpen, Home, Map, PlusCircle, UserRound, X, type LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { BrandLogo } from './BrandLogo'
import { RoleSwitcher } from './RoleSwitcher'
import type { UserRole } from '../types'

interface NavigationItem { to: string; label: string; icon: LucideIcon; end?: boolean }
const employeeItems: NavigationItem[] = [{ to: '/', label: 'Trang chủ', icon: Home, end: true }, { to: '/courses', label: 'Khóa học của tôi', icon: BookOpen }, { to: '/journey', label: 'Hành trình học tập', icon: Map }, { to: '/profile', label: 'Hồ sơ', icon: UserRound }]
const trainerItems: NavigationItem[] = [{ to: '/admin/courses', label: 'Khóa học', icon: BookOpen }, { to: '/admin/courses/new', label: 'Tạo khóa học', icon: PlusCircle }]

export function AppSidebar({ role, open, onClose }: { role: UserRole; open: boolean; onClose(): void }) {
  const items = role === 'trainer' ? trainerItems : employeeItems
  return <><div className={`sidebar-scrim${open ? ' open' : ''}`} onClick={onClose} aria-hidden="true" /><aside className={`app-sidebar${open ? ' open' : ''}`} aria-label={role === 'trainer' ? 'Điều hướng Trainer' : 'Điều hướng học viên'}><div className="sidebar-brand"><BrandLogo /><button className="icon-button sidebar-close" onClick={onClose} aria-label="Đóng menu"><X /></button></div><nav className="sidebar-nav">{items.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={onClose}><Icon aria-hidden="true" /><span>{label}</span></NavLink>)}</nav><div className="sidebar-role"><span className="sidebar-label">Chế độ sử dụng</span><RoleSwitcher /></div><p className="sidebar-note">{role === 'trainer' ? 'Trainer CMS · Local pilot' : 'Học tốt hơn · Tư vấn tốt hơn'}</p></aside></>
}
