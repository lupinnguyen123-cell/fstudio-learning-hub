import { CheckCircle2, Circle, Gauge } from 'lucide-react'
import { getAuthoringChecklist, type AuthoringChecklistItem } from '../../data/authoringTemplates'
import type { Course } from '../../types'

export function CourseCompleteness({ course, onNavigate }: { course: Course; onNavigate(tab: AuthoringChecklistItem['tab']): void }) {
  const items = getAuthoringChecklist(course)
  const percentage = Math.round((items.filter((item) => item.complete).length / items.length) * 100)
  return <aside className="course-completeness" aria-label="Publish Checklist"><div className="completeness-heading"><span><Gauge /></span><div><strong>Publish Checklist</strong><small>{items.filter((item) => item.complete).length}/{items.length} mục hoàn tất</small></div><b>{percentage}%</b></div><div className="completeness-track" aria-hidden="true"><span style={{ width: `${percentage}%` }} /></div><ul>{items.map((item) => <li key={item.id} className={item.complete ? 'complete' : ''}><button type="button" onClick={() => onNavigate(item.tab)}>{item.complete ? <CheckCircle2 /> : <Circle />}<span>{item.label}</span></button></li>)}</ul></aside>
}
