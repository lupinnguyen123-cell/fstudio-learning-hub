import { ArrowRight, BookOpenCheck, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Course, Lesson } from '../types'
import { formatDuration } from '../utils/course'
import { ProgressBar } from './ProgressBar'

interface HeroBannerProps {
  name: string
  course?: Course
  lesson?: Lesson | null
  continuePath: string
  remainingMinutes: number
}

export function HeroBanner({ name, course, lesson, continuePath, remainingMinutes }: HeroBannerProps) {
  const hasCourse = Boolean(course)

  return <section className="dashboard-hero" aria-labelledby="continue-learning-title">
    <div className="dashboard-hero-copy">
      <span className="dashboard-kicker"><BookOpenCheck aria-hidden="true" /> Học tiếp theo</span>
      <p className="dashboard-welcome">Chào {name}, đây là bước tiếp theo của bạn.</p>
      <h1 id="continue-learning-title">{lesson?.title ?? (course ? 'Làm bài kiểm tra cuối khóa' : 'Bắt đầu hành trình học tập')}</h1>
      <p className="dashboard-course-name">{course?.title ?? 'Chọn một khóa học phù hợp để bắt đầu.'}</p>
      {course && <div className="dashboard-hero-meta"><span><Clock3 aria-hidden="true" /> Còn khoảng {formatDuration(remainingMinutes)}</span></div>}
      {course && <ProgressBar value={course.progress} label="Tiến độ khóa học" />}
      <Link className="button button-primary dashboard-primary-action" to={continuePath}>
        {hasCourse ? 'Tiếp tục học' : 'Khám phá khóa học'} <ArrowRight aria-hidden="true" />
      </Link>
    </div>
  </section>
}
