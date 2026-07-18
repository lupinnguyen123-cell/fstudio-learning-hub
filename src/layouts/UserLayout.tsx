import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AppSidebar } from '../components/AppSidebar'
import { TopHeader } from '../components/TopHeader'
import { courseService } from '../services/courseService'

export function UserLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = courseService.getUser()
  return <div className="dashboard-shell"><AppSidebar role="employee" open={sidebarOpen} onClose={() => setSidebarOpen(false)} /><div className="dashboard-main"><TopHeader role="employee" user={user} onOpenMenu={() => setSidebarOpen(true)} /><main id="main-content" className="dashboard-content"><Outlet /></main><footer className="dashboard-footer"><span>F.Studio Learning Hub</span><span>Học tốt hơn · Tư vấn tốt hơn</span></footer></div></div>
}
