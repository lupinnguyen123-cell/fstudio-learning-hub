import { ArrowLeft, CheckCircle2, Clock3, ListTree, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LessonBlockRenderer } from '../../components/lesson/LessonBlockRenderer'
import { LessonNavigation } from '../../components/lesson/LessonNavigation'
import { ProgressBar } from '../../components/ProgressBar'
import { useCourse } from '../../hooks/useCourse'
import { useLearningProgress } from '../../hooks/useLearningProgress'
import { isQuizUnlocked } from '../../utils/courseProgress'
import { NotFoundPage } from '../NotFoundPage'

export function LessonPage() {
  const { courseId, lessonId } = useParams(); const course = useCourse(courseId); const { progress, openLesson, markLessonComplete } = useLearningProgress(); const [feedback, setFeedback] = useState(''); const [outlineOpen, setOutlineOpen] = useState(false)
  const lessons = course?.modules.flatMap((module) => module.lessons) ?? []; const lessonIndex = lessons.findIndex((item) => item.id === lessonId); const lesson = lessons[lessonIndex]
  useEffect(() => { if (courseId && lessonId && lessonIndex >= 0) openLesson(courseId, lessonId) }, [courseId, lessonId, lessonIndex, openLesson])
  if (!course || !lesson || !courseId) return <NotFoundPage />
  const completed = progress.completedLessonIds.includes(lesson.id); const previous = lessons[lessonIndex - 1] ?? null; const next = lessons[lessonIndex + 1] ?? null; const moduleIndex = course.modules.findIndex((module) => module.lessons.some((item) => item.id === lesson.id))
  const complete = () => { markLessonComplete(course.id, lesson.id); setFeedback(`Tuyệt vời! Bạn đã hoàn thành bài học và nhận +${lesson.xpReward} XP.`) }
  const outline = <nav className="lesson-outline-nav" aria-label="Nội dung khóa học">{course.modules.map((module, index) => <section key={module.id}><span>Module {index + 1}</span><strong>{module.title}</strong>{module.lessons.map((item) => { const done = progress.completedLessonIds.includes(item.id); return <Link key={item.id} aria-current={item.id === lesson.id ? 'page' : undefined} className={item.id === lesson.id ? 'current' : ''} to={`/learn/${course.id}/${item.id}`} onClick={() => setOutlineOpen(false)}>{done ? <CheckCircle2 /> : <span>{lessons.findIndex((value) => value.id === item.id) + 1}</span>}<small>{item.title}</small></Link> })}</section>)}</nav>
  return <section className="lesson-page"><div className="container lesson-topbar"><Link to={`/courses/${course.id}`}><ArrowLeft />{course.title}</Link><button type="button" className="button button-secondary lesson-outline-trigger" onClick={() => setOutlineOpen(true)}><ListTree />Nội dung</button><span>Bài {lessonIndex + 1}/{lessons.length}</span></div><div className="lesson-player container"><aside className="lesson-outline">{outline}</aside><div className="lesson-main"><header className="lesson-header"><span className="overline">Module {moduleIndex + 1} · {course.modules[moduleIndex]?.title}</span><h1>{lesson.title}</h1><div><span><Clock3 />{lesson.durationMinutes} phút</span><span>{completed ? <><CheckCircle2 />Đã hoàn thành</> : 'Đang học'}</span></div><ProgressBar value={course.progress} label="Tiến độ khóa học" /></header><article className="lesson-article">{lesson.description && <p className="lead">{lesson.description}</p>}{lesson.blocks.map((block) => <LessonBlockRenderer key={block.id} block={block} />)}{feedback && <div className="lesson-feedback" role="status"><CheckCircle2 />{feedback}</div>}</article><LessonNavigation courseId={course.id} previous={previous} next={next} completed={completed} onComplete={complete} quizUnlocked={isQuizUnlocked(course, progress.completedLessonIds)} /></div></div>{outlineOpen && <div className="lesson-outline-drawer"><button type="button" className="lesson-outline-backdrop" aria-label="Đóng danh sách bài học" onClick={() => setOutlineOpen(false)} /><aside><header><strong>Nội dung khóa học</strong><button type="button" className="icon-button" aria-label="Đóng danh sách bài học" onClick={() => setOutlineOpen(false)}><X /></button></header>{outline}</aside></div>}</section>
}
