import { ArrowLeft, HelpCircle, LockKeyhole } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { QuizNavigation } from '../../components/quiz/QuizNavigation'
import { QuizQuestion } from '../../components/quiz/QuizQuestion'
import { useCourse } from '../../hooks/useCourse'
import { useLearningProgress } from '../../hooks/useLearningProgress'
import { quizService } from '../../services/quizService'
import type { QuizAnswerValue, QuizDraft } from '../../types'
import { isQuizUnlocked } from '../../utils/courseProgress'
import { getNextAttemptNumber } from '../../utils/quiz'
import { NotFoundPage } from '../NotFoundPage'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'

export function QuizPage() {
  const { courseId } = useParams(); const course = useCourse(courseId); const navigate = useNavigate(); const { progress, updateQuizDraft, submitQuiz } = useLearningProgress(); const questions = useMemo(() => courseId ? quizService.getQuestions(courseId) : [], [courseId])
  const existingDraft = progress.quizDraft?.courseId === courseId ? progress.quizDraft : null
  const [answers, setAnswers] = useState<Record<string, QuizAnswerValue>>(existingDraft?.answers ?? {}); const [current, setCurrent] = useState(existingDraft?.currentQuestionIndex ?? 0); const [warning, setWarning] = useState(''); const [confirmOpen, setConfirmOpen] = useState(false)
  if (!course || !courseId) return <NotFoundPage />
  if (!isQuizUnlocked(course, progress.completedLessonIds)) return <section className="system-page"><LockKeyhole /><h1>Quiz chưa được mở khóa</h1><p>Hoàn thành tất cả bài học bắt buộc trước khi làm bài kiểm tra.</p><Link className="button button-primary" to={`/courses/${course.id}`}>Về khóa học</Link></section>
  if (!questions.length) return <section className="system-page"><HelpCircle /><h1>Quiz chưa có câu hỏi</h1><p>Trainer chưa hoàn thiện bài kiểm tra cho khóa học này.</p><Link className="button button-primary" to={`/courses/${course.id}`}>Về khóa học</Link></section>
  if (progress.latestQuizResult?.courseId === courseId && !progress.quizDraft) return <Navigate to={`/results/${courseId}`} replace />
  const save = (nextAnswers: Record<string, QuizAnswerValue>, nextIndex: number) => { const draft: QuizDraft = { courseId, answers: nextAnswers, currentQuestionIndex: nextIndex, updatedAt: new Date().toISOString() }; updateQuizDraft(draft) }
  const choose = (option: number) => { const question = questions[current]; const value = question.type === 'multi_select' ? (() => { const selected = Array.isArray(answers[question.id]) ? answers[question.id] as number[] : []; return selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option] })() : option; const next = { ...answers, [question.id]: value }; setAnswers(next); save(next, current) }
  const go = (index: number) => { setCurrent(index); save(answers, index); setWarning('') }
  const unanswered = questions.filter((question) => answers[question.id] === undefined).length
  const submit = () => { setWarning(unanswered ? `Bạn còn ${unanswered} câu chưa trả lời.` : ''); setConfirmOpen(true) }
  const confirmSubmit = () => { const result = quizService.grade(courseId, questions, answers, getNextAttemptNumber(courseId, progress.quizAttempts), course.quiz.passScore); submitQuiz(result); setConfirmOpen(false); navigate(`/results/${courseId}`) }
  const question = questions[current]
  return <section className="quiz-page container"><ConfirmDialog open={confirmOpen} title="Nộp bài kiểm tra?" description={unanswered ? `Bạn còn ${unanswered} câu chưa trả lời. Các câu bỏ trống sẽ không được tính điểm.` : `Bạn đã trả lời đủ ${questions.length} câu. Điểm đạt của khóa học là ${course.quiz.passScore}%.`} confirmLabel="Nộp bài" tone="primary" onCancel={() => setConfirmOpen(false)} onConfirm={confirmSubmit} /><Link className="back-link" to={`/courses/${course.id}`}><ArrowLeft />Quay lại khóa học</Link><header className="quiz-page-header"><span className="overline">Bài kiểm tra cuối khóa</span><h1>{course.title}</h1><p>{questions.length} câu hỏi · Điểm đạt {course.quiz.passScore}%</p></header><div className="quiz-shell"><aside><span className="quiz-icon"><HelpCircle /></span><span className="overline">Tiến độ</span><h2>Câu {current + 1}/{questions.length}</h2><p>{Object.keys(answers).length}/{questions.length} câu đã trả lời</p><div className="quiz-progress"><strong>{Math.round(((current + 1) / questions.length) * 100)}%</strong><span role="progressbar" aria-label="Tiến độ bài kiểm tra" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={current + 1}><i style={{ width: `${((current + 1) / questions.length) * 100}%` }} /></span></div></aside><div><QuizQuestion question={question} questionNumber={current + 1} selected={answers[question.id]} disabled={false} onSelect={choose} /><QuizNavigation current={current} total={questions.length} answered={questions.map((item) => answers[item.id] !== undefined)} onGo={go} onSubmit={submit} />{warning && <p className="quiz-warning" role="alert">{warning}</p>}</div></div></section>
}
