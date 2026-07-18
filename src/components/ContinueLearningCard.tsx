import { ArrowRight, BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Course } from '../types'
import { ProgressBar } from './ProgressBar'

export function ContinueLearningCard({ course, lessonTitle, path }: { course: Course; lessonTitle: string; path: string }) {
  return <article className="continue-card"><span className="continue-thumb"><BookOpen /></span><div className="continue-copy"><span className="course-category">{course.category}</span><h3>{course.title}</h3><p>Bài tiếp theo: <strong>{lessonTitle}</strong></p><ProgressBar value={course.progress} label="Tiến độ" /></div><Link className="button button-primary" to={path}>Học tiếp <ArrowRight /></Link></article>
}
