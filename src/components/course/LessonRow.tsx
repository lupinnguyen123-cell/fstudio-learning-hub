import { Check, ChevronRight, Circle, LockKeyhole, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Lesson, LessonStatus } from '../../types'

const labels: Record<LessonStatus, string> = { locked: 'Đang khóa', not_started: 'Chưa học', in_progress: 'Đang học', completed: 'Hoàn thành' }
export function LessonRow({ courseId, lesson, status }: { courseId: string; lesson: Lesson; status: LessonStatus }) {
  const icon = status === 'completed' ? <Check /> : status === 'in_progress' ? <Play fill="currentColor" /> : status === 'locked' ? <LockKeyhole /> : <Circle />
  const content = <><span className={`lesson-state ${status}`}>{icon}</span><span><strong>{lesson.title}</strong><small>{lesson.durationMinutes} phút · {labels[status]}</small></span><ChevronRight /></>
  return status === 'locked' ? <div className="lesson-row is-locked" aria-label={`${lesson.title} - ${labels[status]}`}>{content}</div> : <Link to={`/learn/${courseId}/${lesson.id}`} className="lesson-row">{content}</Link>
}
