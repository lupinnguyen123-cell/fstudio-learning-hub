import { Check, ChevronRight, Clock3, LockKeyhole, Play } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { CourseModule } from '../../components/course/CourseModule'
import { ProgressBar } from '../../components/ProgressBar'
import { useCourse } from '../../hooks/useCourse'
import { useLearningProgress } from '../../hooks/useLearningProgress'
import type { LessonStatus } from '../../types'
import { formatDuration } from '../../utils/course'
import { getContinueLesson, isQuizUnlocked } from '../../utils/courseProgress'
import { NotFoundPage } from '../NotFoundPage'

export function CourseDetailPage() {
  const { courseId } = useParams(); const { progress } = useLearningProgress(); const course = useCourse(courseId)
  if (!course) return <NotFoundPage />
  const lessons = course.modules.flatMap((module) => module.lessons); const continueLesson = getContinueLesson(course, progress.completedLessonIds, progress.currentLessonId); const quizUnlocked = isQuizUnlocked(course, progress.completedLessonIds)
  const getStatus = (lessonId: string): LessonStatus => { if (progress.completedLessonIds.includes(lessonId)) return 'completed'; if (progress.currentLessonId === lessonId) return 'in_progress'; const index = lessons.findIndex((lesson) => lesson.id === lessonId); const previousComplete = index === 0 || progress.completedLessonIds.includes(lessons[index - 1].id); return previousComplete ? 'not_started' : 'locked' }
  const remainingRequiredLessons = lessons.filter((lesson) => lesson.required && !progress.completedLessonIds.includes(lesson.id)).length
  return <><section className="course-hero"><div className="container"><div className="breadcrumbs"><Link to="/courses">Khóa học</Link><ChevronRight /><span>Chi tiết</span></div><span className="overline">{course.category}</span><h1>{course.title}</h1><p>{course.description}</p><div className="course-meta"><span><Clock3 />{formatDuration(course.durationMinutes)}</span><span>{course.modules.length} modules</span><span>{lessons.length} bài học</span><span>{course.level}</span></div><ProgressBar value={course.progress} label="Tiến độ khóa học" />{continueLesson && <Link className="button button-primary course-cta" to={`/learn/${course.id}/${continueLesson.id}`}><Play size={18} fill="currentColor" />{course.progress ? 'Tiếp tục học' : 'Bắt đầu khóa học'}</Link>}</div></section><section className="section container course-detail-grid"><div><div className="section-heading"><div><span className="overline">Lộ trình</span><h2>Nội dung khóa học</h2></div></div><div className="module-list">{course.modules.map((module, index) => <CourseModule key={module.id} courseId={course.id} module={module} index={index} getStatus={getStatus} />)}</div><div className={`quiz-unlock-card ${quizUnlocked ? 'unlocked' : ''}`}>{quizUnlocked ? <Check /> : <LockKeyhole />}<div><strong>{quizUnlocked ? 'Quiz đã được mở khóa' : 'Quiz cuối khóa đang bị khóa'}</strong><p>{quizUnlocked ? 'Bạn đã hoàn thành tất cả bài học bắt buộc.' : `Hoàn thành ${remainingRequiredLessons} bài học bắt buộc còn lại để mở quiz.`}</p></div>{quizUnlocked && <Link className="button button-primary" to={`/quiz/${course.id}`}>Làm quiz</Link>}</div></div><aside className="info-card"><h3>Mục tiêu học tập</h3><ul>{course.objectives.map((objective) => <li key={objective}><Check />{objective}</li>)}</ul><p>Bài gần nhất: {continueLesson?.title ?? 'Đã hoàn thành'}</p></aside></section></>
}
