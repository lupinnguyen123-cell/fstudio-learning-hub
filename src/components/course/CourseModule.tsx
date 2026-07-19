import { ChevronDown, Clock3 } from 'lucide-react'
import { useState } from 'react'
import type { LessonStatus, Module } from '../../types'
import { Badge } from '../Badge'
import { ProgressBar } from '../ProgressBar'
import { LessonRow } from './LessonRow'
export function CourseModule({ courseId, module, index, getStatus }: { courseId: string; module: Module; index: number; getStatus: (lessonId: string) => LessonStatus }) {
  const statuses = module.lessons.map((lesson) => getStatus(lesson.id)); const completed = statuses.filter((status) => status === 'completed').length; const percentage = module.lessons.length ? Math.round((completed / module.lessons.length) * 100) : 0
  const moduleStatus = percentage === 100 ? 'Hoàn thành' : completed > 0 || statuses.includes('in_progress') ? 'Đang học' : 'Chưa học'; const variant = percentage === 100 ? 'success' : moduleStatus === 'Đang học' ? 'blue' : 'neutral'
  const [open, setOpen] = useState(statuses.includes('in_progress') || index === 0)
  return <article className="module-card"><div className="module-number">{String(index + 1).padStart(2, '0')}</div><div className="module-content"><header className="module-card-header"><div><Badge variant={variant}>{moduleStatus}</Badge><h3>{module.title}</h3>{module.description && <p>{module.description}</p>}<div className="module-meta"><span>{module.lessons.length} bài học</span><span><Clock3 />{module.lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0)} phút</span></div></div><button type="button" className="icon-button module-toggle" aria-label={`${open ? 'Thu gọn' : 'Mở rộng'} ${module.title}`} aria-expanded={open} onClick={() => setOpen(!open)}><ChevronDown className={open ? 'rotated' : ''} /></button></header><ProgressBar value={percentage} label="Tiến độ module" />{open && <div className="module-lessons">{module.lessons.map((lesson) => <LessonRow key={lesson.id} courseId={courseId} lesson={lesson} status={getStatus(lesson.id)} />)}</div>}</div></article>
}
