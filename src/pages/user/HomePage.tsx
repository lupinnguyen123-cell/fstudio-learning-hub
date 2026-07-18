import { ArrowRight, BookOpen, CheckCircle2, Layers3, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CourseCard } from '../../components/CourseCard'
import { ProgressBar } from '../../components/ProgressBar'
import { useLearningProgress } from '../../hooks/useLearningProgress'
import { courseService } from '../../services/courseService'
import { getContinueLesson, getContinuePath } from '../../utils/courseProgress'

export function HomePage() {
  const { progress } = useLearningProgress()
  const courses = courseService.getCourses(progress.completedLessonIds, progress.latestQuizResult)
  const user = courseService.getUser()
  const activeCourse = courseService.getCourse(progress.currentCourseId ?? courses[0]?.id, progress.completedLessonIds, progress.latestQuizResult) ?? courses[0]
  const continueLesson = activeCourse ? getContinueLesson(activeCourse, progress.completedLessonIds, progress.currentLessonId) : null
  const continuePath = activeCourse ? getContinuePath(activeCourse, progress.completedLessonIds, progress.currentLessonId, progress.latestQuizResult) : '/courses'
  const completedCourses = courses.filter((course) => course.status === 'completed').length
  return <>
    <section className="hero"><div className="container hero-grid"><div><span className="overline">Học tập hôm nay</span><h1>Chào {user.name},<br />sẵn sàng tiến thêm một bước?</h1><p>Tiếp tục hành trình nâng cao kiến thức và tạo ra trải nghiệm tư vấn tốt hơn cho khách hàng.</p>{activeCourse && <Link className="button button-primary" to={continuePath}>Tiếp tục học <ArrowRight size={18} /></Link>}</div>{activeCourse && <div className="hero-progress"><div className="hero-progress-top"><span><BookOpen /></span><div><small>Khóa học gần nhất</small><strong>{activeCourse.title}</strong></div></div><ProgressBar value={activeCourse.progress} label="Tiến độ khóa học" /><div className="next-lesson"><span>Bước tiếp theo</span><strong>{continueLesson?.title ?? (progress.latestQuizResult?.courseId === activeCourse.id ? 'Xem kết quả gần nhất' : 'Làm bài kiểm tra cuối khóa')}</strong></div></div>}</div></section>
    <section className="section container"><div className="stats-grid four"><article><span className="stat-icon blue"><Layers3 /></span><div><strong>{courses.length}</strong><span>Tổng khóa học</span></div></article><article><span className="stat-icon orange"><BookOpen /></span><div><strong>{courses.filter((course) => course.status === 'in-progress').length}</strong><span>Đang học</span></div></article><article><span className="stat-icon green"><CheckCircle2 /></span><div><strong>{completedCourses}</strong><span>Đã hoàn thành</span></div></article><article><span className="stat-icon blue"><Sparkles /></span><div><strong>{progress.totalXp} XP</strong><span>{progress.earnedBadgeIds.length} badge đã nhận</span></div></article></div></section>
    <section className="section container"><div className="section-heading"><div><span className="overline">Khám phá tiếp</span><h2>Khóa học đề xuất</h2></div><Link className="text-link" to="/courses">Xem tất cả <ArrowRight size={16} /></Link></div><div className="course-grid">{courses.slice(1).map((course) => <CourseCard key={course.id} course={course} />)}</div></section>
  </>
}
