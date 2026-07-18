import { useState, type MouseEvent as ReactMouseEvent } from 'react'
import { Outlet } from 'react-router-dom'
import { AppSidebar } from '../components/AppSidebar'
import { TopHeader } from '../components/TopHeader'
import { courseService } from '../services/courseService'

const confirmedDeletes = new WeakSet<HTMLButtonElement>()
function confirmBuilderDelete(event: ReactMouseEvent<HTMLElement>) {
  const target = event.target as HTMLElement; const button = target.closest<HTMLButtonElement>('button')
  if (!target.closest('.course-builder') || !button?.getAttribute('aria-label')?.startsWith('Xóa')) return
  if (confirmedDeletes.has(button)) { confirmedDeletes.delete(button); return }
  event.preventDefault(); event.stopPropagation()
  if (window.confirm('Nội dung này sẽ bị xóa khỏi bản nháp. Bạn có chắc chắn?')) { confirmedDeletes.add(button); button.click() }
}

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false); const user = courseService.getUser()
  return <div className="dashboard-shell trainer-shell"><AppSidebar role="trainer" open={sidebarOpen} onClose={() => setSidebarOpen(false)} /><div className="dashboard-main"><TopHeader role="trainer" user={user} onOpenMenu={() => setSidebarOpen(true)} /><main className="dashboard-content admin-content" onClickCapture={confirmBuilderDelete}><Outlet /></main></div></div>
}
