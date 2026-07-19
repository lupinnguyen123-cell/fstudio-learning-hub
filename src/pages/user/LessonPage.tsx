import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LessonBlockRenderer } from '../../components/lesson/LessonBlockRenderer'
import { LessonNavigation } from '../../components/lesson/LessonNavigation'
import { useCourse } from '../../hooks/useCourse'
import { useLearningProgress } from '../../hooks/useLearningProgress'
import { isQuizUnlocked } from '../../utils/courseProgress'
import { NotFoundPage } from '../NotFoundPage'

export function LessonPage() {
  const { courseId, lessonId } = useParams(); const course = useCourse(courseId); const { progress, openLesson, markLessonComplete } = useLearningProgress(); const [feedback, setFeedback] = useState('')
  const lessons = course?.modules.flatMap((module) => module.lessons) ?? []; const lessonIndex = lessons.findIndex((item) => item.id === lessonId); const lesson = lessons[lessonIndex]
  useEffect(() => { if (courseId && lessonId && lessonIndex >= 0) openLesson(courseId, lessonId) }, [courseId, lessonId, lessonIndex, openLesson])
  if (!course || !lesson || !courseId) return <NotFoundPage />
  const completed = progress.completedLessonIds.includes(lesson.id); const previous = lessons[lessonIndex - 1] ?? null; const next = lessons[lessonIndex + 1] ?? null; const moduleIndex = course.modules.findIndex((module) => module.lessons.some((item) => item.id === lesson.id))
  const complete = () => { markLessonComplete(course.id, lesson.id); setFeedback(`Tuyệt vời! Bạn đã hoàn thành bài học và nhận +${lesson.xpReward} XP.`) }
  return <section className="lesson-page"><div className="container lesson-topbar"><Link to={`/courses/${course.id}`}><ArrowLeft />Quay lại khóa học</Link><span>Bài {lessonIndex + 1}/{lessons.length}</span></div><article className="lesson-article"><span className="overline">Module {moduleIndex + 1}</span><h1>{lesson.title}</h1><p className="lead">Nắm vững nền tảng và áp dụng vào cuộc trò chuyện tư vấn thực tế tại cửa hàng.</p>{lesson.blocks.map((block) => <LessonBlockRenderer key={block.id} block={block} />)}{feedback && <div className="lesson-feedback" role="status"><CheckCircle2 />{feedback}</div>}</article><LessonNavigation courseId={course.id} previous={previous} next={next} completed={completed} onComplete={complete} quizUnlocked={isQuizUnlocked(course, progress.completedLessonIds)} /></section>
}
