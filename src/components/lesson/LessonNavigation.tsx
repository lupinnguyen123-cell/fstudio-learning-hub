import { ArrowLeft, ArrowRight, CheckCircle2, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Lesson } from '../../types'

interface LessonNavigationProps {
  courseId: string
  previous: Lesson | null
  next: Lesson | null
  completed: boolean
  onComplete: () => void
  quizUnlocked: boolean
}

export function LessonNavigation({ courseId, previous, next, completed, onComplete, quizUnlocked }: LessonNavigationProps) {
  return (
    <footer className="lesson-navigation">
      <div className="lesson-complete-row">
        {previous ? <Link className="lesson-previous" to={`/learn/${courseId}/${previous.id}`}><ArrowLeft />Bài trước</Link> : <span />}
        <button type="button" className="button complete-button" onClick={onComplete} disabled={completed}><CheckCircle2 />{completed ? 'Đã hoàn thành' : 'Hoàn thành bài học'}</button>
      </div>
      {next ? (
        <Link className="next-lesson-card" to={`/learn/${courseId}/${next.id}`}>
          <span><small>Bài tiếp theo</small><strong>{next.title}</strong><span><Clock3 />{next.durationMinutes} phút</span></span>
          <span className="next-lesson-cta">Tiếp tục<ArrowRight /></span>
        </Link>
      ) : quizUnlocked ? (
        <Link className="next-lesson-card" to={`/quiz/${courseId}`}>
          <span><small>Bước cuối</small><strong>Bài kiểm tra cuối khóa</strong><span>Kiểm tra kiến thức vừa học</span></span>
          <span className="next-lesson-cta">Làm bài<ArrowRight /></span>
        </Link>
      ) : null}
    </footer>
  )
}
