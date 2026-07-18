import { ArrowRight, Award, Clock3, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Course } from '../types'
import { formatDuration, statusLabel } from '../utils/course'
import { ProgressBar } from './ProgressBar'

export function CourseCard({ course, showRewards = false }: { course: Course; showRewards?: boolean }) {
  const lessonXp = course.modules.flatMap((module) => module.lessons).reduce((sum, lesson) => sum + lesson.xpReward, 0)
  return <article className="course-card"><div className="course-art" style={course.coverUrl ? { backgroundImage: `url(${course.coverUrl})` } : undefined}><span>{course.category}</span></div><div className="course-card-body"><div className="eyebrow-row"><span className={`status status-${course.status}`}>{statusLabel[course.status]}</span><span><Clock3 size={14} />{formatDuration(course.durationMinutes)}</span></div><h3>{course.title}</h3><p>{course.description}</p><ProgressBar value={course.progress} label="Tiến độ" />{showRewards && <div className="course-rewards"><span><Sparkles />{lessonXp + course.quiz.xpReward + course.gamification.courseCompletionXp} XP</span><span><Award />{course.gamification.badges.length} badge</span></div>}<Link className="text-link course-card-link" to={`/courses/${course.id}`}>Mở khóa học <ArrowRight size={16} /></Link></div></article>
}
