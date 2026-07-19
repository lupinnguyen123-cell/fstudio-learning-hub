import { ArrowRight, Award, Clock3, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Course } from '../types'
import { formatDuration, statusLabel } from '../utils/course'
import { ProgressBar } from './ProgressBar'
import { Badge } from './Badge'

export function CourseCard({ course, showRewards = false }: { course: Course; showRewards?: boolean }) {
  const lessonXp = course.modules.flatMap((module) => module.lessons).reduce((sum, lesson) => sum + lesson.xpReward, 0)
  const statusVariant = course.status === 'completed' ? 'success' : course.status === 'in-progress' ? 'blue' : 'neutral'
  return <article className="course-card"><div className="course-art" style={course.coverUrl ? { backgroundImage: `url(${course.coverUrl})` } : undefined}><Badge variant="blue">{course.category}</Badge></div><div className="course-card-body"><div className="eyebrow-row"><Badge variant={statusVariant}>{statusLabel[course.status]}</Badge><span><Clock3 size={14} />{formatDuration(course.durationMinutes)}</span></div><h3>{course.title}</h3><p>{course.description}</p><ProgressBar value={course.progress} label="Tiến độ" />{showRewards && <div className="course-rewards"><Badge variant="orange"><Sparkles />{lessonXp + course.quiz.xpReward + course.gamification.courseCompletionXp} XP</Badge><Badge variant="purple"><Award />{course.gamification.badges.length} badge</Badge></div>}<Link className="text-link course-card-link" to={`/courses/${course.id}`}>Mở khóa học <ArrowRight size={16} /></Link></div></article>
}
