import { CheckCircle2, Circle, Gauge } from 'lucide-react'
import type { Course } from '../../types'
import { getCourseCompleteness, type PublishValidationIssue } from '../../services/contentService'

export function CourseCompleteness({ course, onNavigate }: { course: Course; onNavigate(tab: PublishValidationIssue['tab']): void }) {
  const { items, percentage } = getCourseCompleteness(course)
  return <aside className="course-completeness" aria-label="Mức độ hoàn thiện khóa học"><div className="completeness-heading"><span><Gauge /></span><div><strong>Course setup</strong><small>{percentage}% hoàn thiện</small></div><b>{percentage}%</b></div><div className="completeness-track" aria-hidden="true"><span style={{ width: `${percentage}%` }} /></div><ul>{items.map((item) => <li key={item.id} className={item.complete ? 'complete' : ''}><button onClick={() => onNavigate(item.tab)}>{item.complete ? <CheckCircle2 /> : <Circle />}<span>{item.label}</span></button></li>)}</ul></aside>
}
