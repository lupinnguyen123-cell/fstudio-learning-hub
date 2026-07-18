import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Lesson } from '../../types'
export function LessonNavigation({ courseId, previous, next, completed, onComplete, quizUnlocked }: { courseId: string; previous: Lesson | null; next: Lesson | null; completed: boolean; onComplete: () => void; quizUnlocked: boolean }) {
  return <div className="container lesson-actions"><div>{previous && <Link className="button button-secondary" to={`/learn/${courseId}/${previous.id}`}><ArrowLeft />Bài trước</Link>}</div><button type="button" className="button complete-button" onClick={onComplete} disabled={completed}><CheckCircle2 />{completed ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}</button><div>{next ? <Link className="button button-primary" to={`/learn/${courseId}/${next.id}`}>Bài tiếp theo<ArrowRight /></Link> : quizUnlocked ? <Link className="button button-primary" to={`/quiz/${courseId}`}>Làm bài kiểm tra<ArrowRight /></Link> : null}</div></div>
}
