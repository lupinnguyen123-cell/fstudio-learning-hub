import { BookOpen } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { RoleSwitcher } from '../components/RoleSwitcher'
const nav = [{to:'/admin/courses',label:'Khóa học',icon:BookOpen}]
export function AdminLayout() { const navigation = nav.map(({to,label,icon:Icon})=><NavLink key={to} to={to}><Icon aria-hidden="true" />{label}</NavLink>); return <div className="admin-shell"><aside className="admin-sidebar"><Brand /><nav aria-label="Điều hướng quản trị">{navigation}</nav><p className="mock-note">Trainer CMS MVP · Local pilot</p></aside><div className="admin-main"><header className="admin-header"><div><span className="admin-kicker">Không gian Trainer</span><strong>Course Studio</strong></div><RoleSwitcher /></header><nav className="admin-mobile-nav" aria-label="Điều hướng quản trị trên di động">{navigation}</nav><main className="admin-content"><Outlet /></main></div></div> }
