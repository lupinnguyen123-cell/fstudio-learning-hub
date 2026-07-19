import { Award, BookOpenCheck, CheckCircle2, Sparkles, Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CourseCard } from '../../components/CourseCard'
import { HeroBanner } from '../../components/HeroBanner'
import { ProgressBar } from '../../components/ProgressBar'
import { EmptyState } from '../../components/States'
import { SectionHeader } from '../../components/SectionHeader'
import { useContent } from '../../context/ContentContext'
import { useLearningProgress } from '../../hooks/useLearningProgress'
import { courseService } from '../../services/courseService'
import { getActiveLearningCourse, getContinueLesson, getContinuePath, getRequiredLessons, isQuizUnlocked } from '../../utils/courseProgress'

const TODAY_XP_GOAL = 100

export function HomePage() {
  useContent()
  const { progress } = useLearningProgress()
  const courses = courseService.getCourses(progress.completedLessonIds, progress.latestQuizResult)
  const user = courseService.getUser()
  const activeCourse = getActiveLearningCourse(courses, progress.currentCourseId)
  const continueLesson = activeCourse ? getContinueLesson(activeCourse, progress.completedLessonIds, progress.currentLessonId) : null
  const continuePath = activeCourse ? getContinuePath(activeCourse, progress.completedLessonIds, progress.currentLessonId, progress.latestQuizResult) : '/courses'
  const remainingMinutes = activeCourse
    ? activeCourse.modules.flatMap((module) => module.lessons).filter((lesson) => !progress.completedLessonIds.includes(lesson.id)).reduce((sum, lesson) => sum + lesson.durationMinutes, 0)
    : 0
  const recentlyPublished = [...courses].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 3)
  const completedCourses = courses.filter((course) => course.status === 'completed').length
  const requiredLessons = courses.flatMap(getRequiredLessons)
  const completedRequiredLessons = requiredLessons.filter((lesson) => progress.completedLessonIds.includes(lesson.id)).length
  const overallProgress = requiredLessons.length ? Math.round((completedRequiredLessons / requiredLessons.length) * 100) : 0
  const quizReady = activeCourse ? isQuizUnlocked(activeCourse, progress.completedLessonIds) : false
  const latestQuizPassed = activeCourse && progress.latestQuizResult?.courseId === activeCourse.id && progress.latestQuizResult.passed

  return <div className="employee-dashboard">
    <HeroBanner name={user.name} course={activeCourse} lesson={continueLesson} continuePath={continuePath} remainingMinutes={remainingMinutes} />

    <section className="dashboard-section">
      <SectionHeader eyebrow="Kế hoạch ngắn gọn" title="Học hôm nay" accent="blue" />
      <div className="learning-today-grid">
        <article><span className="today-icon"><BookOpenCheck aria-hidden="true" /></span><div><small>Bài nên học</small><strong>{continueLesson?.title ?? (activeCourse ? 'Hoàn thành bài kiểm tra' : 'Chưa có bài được giao')}</strong></div></article>
        <article><span className="today-icon"><CheckCircle2 aria-hidden="true" /></span><div><small>Quiz cần làm</small><strong>{latestQuizPassed ? 'Đã hoàn thành' : quizReady ? 'Sẵn sàng làm bài' : activeCourse ? 'Mở sau khi học xong' : 'Chưa có quiz'}</strong></div></article>
        <article><span className="today-icon"><Target aria-hidden="true" /></span><div><small>Mục tiêu XP</small><strong>{TODAY_XP_GOAL} XP</strong></div></article>
      </div>
    </section>

    <section className="dashboard-section">
      <SectionHeader eyebrow="Nội dung mới" title="Mới xuất bản" accent="blue" action={<Link className="text-link" to="/courses">Xem tất cả</Link>} />
      {recentlyPublished.length ? <div className="course-grid dashboard-course-grid">{recentlyPublished.map((course) => <CourseCard key={course.id} course={course} />)}</div> : <EmptyState title="Chưa có khóa học mới" description="Khóa học được Trainer xuất bản sẽ xuất hiện tại đây." />}
    </section>

    <section className="dashboard-section">
      <SectionHeader eyebrow="Dấu mốc cá nhân" title="Thành tích" accent="blue" />
      <div className="achievement-grid">
        <article><span className="achievement-icon"><CheckCircle2 aria-hidden="true" /></span><div><strong>{completedCourses}</strong><small>Khóa hoàn thành</small></div></article>
        <article><span className="achievement-icon"><Sparkles aria-hidden="true" /></span><div><strong>{progress.totalXp}</strong><small>Tổng XP</small></div></article>
        <article><span className="achievement-icon"><Award aria-hidden="true" /></span><div><strong>{progress.earnedBadgeIds.length}</strong><small>Badge đã nhận</small></div></article>
      </div>
    </section>

    <section className="dashboard-section learning-progress-card" aria-labelledby="learning-progress-title">
      <div><span className="dashboard-kicker">Tổng quan</span><h2 id="learning-progress-title">Tiến độ học tập của tôi</h2><p>{completedRequiredLessons} trên {requiredLessons.length} bài bắt buộc đã hoàn thành</p></div>
      <ProgressBar value={overallProgress} label="Tiến độ tổng" />
    </section>
  </div>
}
