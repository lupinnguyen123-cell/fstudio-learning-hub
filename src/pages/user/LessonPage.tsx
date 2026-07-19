import { ArrowLeft, CheckCircle2, Clock3, ListTree, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LessonBlockRenderer } from '../../components/lesson/LessonBlockRenderer'
import { LessonNavigation } from '../../components/lesson/LessonNavigation'
import { LessonOutline } from '../../components/lesson/LessonOutline'
import { ProgressBar } from '../../components/ProgressBar'
import { useCourse } from '../../hooks/useCourse'
import { useLearningProgress } from '../../hooks/useLearningProgress'
import { isQuizUnlocked } from '../../utils/courseProgress'
import { NotFoundPage } from '../NotFoundPage'

export function LessonPage() {
  const { courseId, lessonId } = useParams()
  const course = useCourse(courseId)
  const { progress, openLesson, markLessonComplete } = useLearningProgress()
  const [feedback, setFeedback] = useState('')
  const [outlineOpen, setOutlineOpen] = useState(false)
  const lessons = course?.modules.flatMap((module) => module.lessons) ?? []
  const lessonIndex = lessons.findIndex((item) => item.id === lessonId)
  const lesson = lessons[lessonIndex]

  useEffect(() => {
    if (courseId && lessonId && lessonIndex >= 0) openLesson(courseId, lessonId)
  }, [courseId, lessonId, lessonIndex, openLesson])

  if (!course || !lesson || !courseId) return <NotFoundPage />

  const completed = progress.completedLessonIds.includes(lesson.id)
  const completedCount = lessons.filter((item) => progress.completedLessonIds.includes(item.id)).length
  const previous = lessons[lessonIndex - 1] ?? null
  const next = lessons[lessonIndex + 1] ?? null
  const moduleIndex = course.modules.findIndex((module) => module.lessons.some((item) => item.id === lesson.id))
  const complete = () => {
    markLessonComplete(course.id, lesson.id)
    setFeedback(`Tuyệt vời! Bạn đã hoàn thành bài học và nhận +${lesson.xpReward} XP.`)
  }

  return (
    <section className="lesson-page">
      <div className="container lesson-topbar">
        <Link to={`/courses/${course.id}`}><ArrowLeft />{course.title}</Link>
        <button type="button" className="button button-secondary lesson-outline-trigger" onClick={() => setOutlineOpen(true)}><ListTree />Nội dung</button>
        <span>Bài {lessonIndex + 1}/{lessons.length}</span>
      </div>
      <div className="lesson-player container">
        <aside className="lesson-outline"><LessonOutline course={course} activeLessonId={lesson.id} completedLessonIds={progress.completedLessonIds} idPrefix="desktop-outline" /></aside>
        <div className="lesson-main">
          <header className="lesson-header">
            <span className="ui-eyebrow">Module {moduleIndex + 1}</span>
            <h1>{lesson.title}</h1>
            <div className="lesson-header-meta">
              <span><Clock3 />{lesson.durationMinutes} phút</span>
              <span>Bài {lessonIndex + 1} / {lessons.length}</span>
              <strong>{course.progress}%</strong>
            </div>
            <ProgressBar value={course.progress} label={`${completedCount}/${lessons.length} bài`} />
            <a className={`lesson-header-action ${completed ? 'is-complete' : ''}`} href="#lesson-content">
              {completed ? <><CheckCircle2 />Đã hoàn thành</> : 'Tiếp tục'}
            </a>
          </header>
          <article id="lesson-content" className="lesson-article">
            {lesson.description && <p className="lead">{lesson.description}</p>}
            <div className="lesson-block-flow">{lesson.blocks.map((block) => <LessonBlockRenderer key={block.id} block={block} />)}</div>
            {feedback && <div className="lesson-feedback" role="status"><CheckCircle2 />{feedback}</div>}
          </article>
          <LessonNavigation courseId={course.id} previous={previous} next={next} completed={completed} onComplete={complete} quizUnlocked={isQuizUnlocked(course, progress.completedLessonIds)} />
        </div>
      </div>
      {outlineOpen && (
        <div className="lesson-outline-drawer">
          <button type="button" className="lesson-outline-backdrop" aria-label="Đóng danh sách bài học" onClick={() => setOutlineOpen(false)} />
          <aside>
            <header><strong>Nội dung khóa học</strong><button type="button" className="icon-button" aria-label="Đóng danh sách bài học" onClick={() => setOutlineOpen(false)}><X /></button></header>
            <LessonOutline course={course} activeLessonId={lesson.id} completedLessonIds={progress.completedLessonIds} idPrefix="drawer-outline" onNavigate={() => setOutlineOpen(false)} />
          </aside>
        </div>
      )}
    </section>
  )
}
