import { Award, BookOpen, CheckCircle2, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ContinueLearningCard } from '../../components/ContinueLearningCard'
import { CourseCard } from '../../components/CourseCard'
import { HeroBanner } from '../../components/HeroBanner'
import { EmptyState } from '../../components/States'
import { useContent } from '../../context/ContentContext'
import { useLearningProgress } from '../../hooks/useLearningProgress'
import { courseService } from '../../services/courseService'
import { getContinueLesson, getContinuePath } from '../../utils/courseProgress'

export function HomePage() {
  useContent()
  const { progress } = useLearningProgress()
  const courses = courseService.getCourses(progress.completedLessonIds, progress.latestQuizResult)
  const user = courseService.getUser()
  const activeCourse = courseService.getCourse(progress.currentCourseId ?? courses[0]?.id, progress.completedLessonIds, progress.latestQuizResult) ?? courses[0]
  const continuePath = activeCourse ? getContinuePath(activeCourse, progress.completedLessonIds, progress.currentLessonId, progress.latestQuizResult) : '/courses'
  const inProgress = courses.filter((course) => course.status === 'in-progress').slice(0, 2)
  const completedCourses = courses.filter((course) => course.status === 'completed').length
  return <div className="employee-dashboard"><HeroBanner name={user.name} course={activeCourse} continuePath={continuePath} /><section className="dashboard-section"><div className="dashboard-section-heading"><div><span className="overline">Thư viện của bạn</span><h2>Khóa học của bạn</h2></div><Link className="text-link" to="/courses">Xem tất cả</Link></div>{courses.length ? <div className="course-grid dashboard-course-grid">{courses.slice(0, 4).map((course) => <CourseCard key={course.id} course={course} showRewards />)}</div> : <EmptyState title="Chưa có khóa học được xuất bản" description="Khóa học mới từ Trainer sẽ xuất hiện tại đây." />}</section>{inProgress.length > 0 && <section className="dashboard-section"><div className="dashboard-section-heading"><div><span className="overline">Quay lại đúng chỗ</span><h2>Tiếp tục học</h2></div></div><div className="continue-list">{inProgress.map((course) => { const lesson = getContinueLesson(course, progress.completedLessonIds, progress.currentLessonId); return <ContinueLearningCard key={course.id} course={course} lessonTitle={lesson?.title ?? 'Bài kiểm tra cuối khóa'} path={getContinuePath(course, progress.completedLessonIds, progress.currentLessonId, progress.latestQuizResult)} /> })}</div></section>}<section className="dashboard-section"><div className="dashboard-section-heading"><div><span className="overline">Thành tích cá nhân</span><h2>Tiến bộ của bạn</h2></div></div><div className="achievement-grid"><article><span className="achievement-icon purple"><Sparkles /></span><div><strong>{progress.totalXp}</strong><small>Tổng XP</small></div></article><article><span className="achievement-icon green"><CheckCircle2 /></span><div><strong>{completedCourses}</strong><small>Khóa hoàn thành</small></div></article><article><span className="achievement-icon orange"><Award /></span><div><strong>{progress.earnedBadgeIds.length}</strong><small>Badge đã nhận</small></div></article><article><span className="achievement-icon blue"><BookOpen /></span><div><strong>{progress.completedLessonIds.length}</strong><small>Bài đã học</small></div></article></div></section></div>
}
