import { useState } from 'react'
import { CourseCard } from '../../components/CourseCard'
import { EmptyState } from '../../components/States'
import { useLearningProgress } from '../../hooks/useLearningProgress'
import { courseService } from '../../services/courseService'
import type { CourseStatus } from '../../types'

type Filter = 'all' | CourseStatus
const filters: Array<[Filter, string]> = [['all', 'Tất cả'], ['in-progress', 'Đang học'], ['not-started', 'Chưa học'], ['completed', 'Hoàn thành']]

export function CoursesPage() {
  const { progress } = useLearningProgress()
  const [filter, setFilter] = useState<Filter>('all')
  const courses = courseService.getCourses(progress.completedLessonIds, progress.latestQuizResult)
  const visible = filter === 'all' ? courses : courses.filter((course) => course.status === filter)
  return <section className="page container"><div className="page-heading"><span className="ui-eyebrow">Thư viện học tập</span><h1>Khóa học của bạn</h1><p>Khám phá nội dung được thiết kế cho công việc tại cửa hàng.</p></div><div className="filter-tabs" role="group" aria-label="Lọc khóa học">{filters.map(([value, label]) => <button type="button" key={value} aria-pressed={filter === value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{label}</button>)}</div>{visible.length ? <div className="course-grid three">{visible.map((course) => <CourseCard key={course.id} course={course} />)}</div> : <EmptyState title="Không có khóa học phù hợp" description="Hãy thử chọn một trạng thái khác." />}</section>
}
