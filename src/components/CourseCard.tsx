import { ArrowRight, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Course } from '../types'
import { formatDuration, statusLabel } from '../utils/course'
import { ProgressBar } from './ProgressBar'

export function CourseCard({ course }: { course: Course }) {
  return <article className="course-card"><div className="course-art" aria-hidden="true"><span>{course.category}</span></div><div className="course-card-body"><div className="eyebrow-row"><span className={`status status-${course.status}`}>{statusLabel[course.status]}</span><span><Clock3 size={14} />{formatDuration(course.durationMinutes)}</span></div><h3>{course.title}</h3><p>{course.description}</p><ProgressBar value={course.progress} label="Tiến độ" /><Link className="text-link" to={`/courses/${course.id}`}>Xem khóa học <ArrowRight size={16} /></Link></div></article>
}
