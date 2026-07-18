import { BookOpen, Home, Map, Menu, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { RoleSwitcher } from '../components/RoleSwitcher'

const navItems = [{ to: '/', label: 'Trang chủ', icon: Home }, { to: '/courses', label: 'Khóa học', icon: BookOpen }, { to: '/journey', label: 'Hành trình', icon: Map }, { to: '/profile', label: 'Hồ sơ', icon: UserRound }]
export function UserLayout() {
  const [open, setOpen] = useState(false)
  return <div className="app-shell"><header className="user-header"><div className="container header-inner"><Brand /><nav className="desktop-nav" aria-label="Điều hướng chính">{navItems.map(({ to, label }) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}</nav><div className="header-actions"><RoleSwitcher /><button type="button" className="icon-button mobile-menu" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? 'Đóng menu' : 'Mở menu'}>{open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button></div></div>{open && <nav id="mobile-navigation" className="mobile-drawer" aria-label="Điều hướng di động">{navItems.map(({ to, label }) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}>{label}</NavLink>)}</nav>}</header><main id="main-content"><Outlet /></main><nav className="mobile-bottom-nav" aria-label="Điều hướng nhanh">{navItems.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'}><Icon size={20} aria-hidden="true" /><span>{label}</span></NavLink>)}</nav><footer><div className="container footer-inner"><span>F.Studio Learning Hub</span><span>Học tốt hơn · Tư vấn tốt hơn</span></div></footer></div>
}
