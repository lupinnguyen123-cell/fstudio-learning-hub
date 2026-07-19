import { Check, ChevronDown, Circle, Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Course } from '../../types'

interface LessonOutlineProps {
  course: Course
  activeLessonId: string
  completedLessonIds: string[]
  onNavigate?: () => void
}

export function LessonOutline({ course, activeLessonId, completedLessonIds, onNavigate }: LessonOutlineProps) {
  const activeModuleIndex = course.modules.findIndex((module) => module.lessons.some((lesson) => lesson.id === activeLessonId))
  const [expandedModule, setExpandedModule] = useState(activeModuleIndex)
  const lessons = course.modules.flatMap((module) => module.lessons)

  useEffect(() => setExpandedModule(activeModuleIndex), [activeModuleIndex])

  return (
    <nav className="lesson-outline-nav" aria-label="Nội dung khóa học">
      {course.modules.map((module, moduleIndex) => {
        const expanded = moduleIndex === expandedModule
        const completedCount = module.lessons.filter((lesson) => completedLessonIds.includes(lesson.id)).length
        const moduleComplete = module.lessons.length > 0 && completedCount === module.lessons.length

        return (
          <section key={module.id} className={expanded ? 'is-expanded' : ''}>
            <button
              type="button"
              className="lesson-outline-module"
              aria-expanded={expanded}
              onClick={() => setExpandedModule(expanded ? -1 : moduleIndex)}
            >
              <span>{moduleComplete ? <Check /> : moduleIndex + 1}</span>
              <span><small>Module {moduleIndex + 1}</small><strong>{module.title}</strong></span>
              <ChevronDown />
            </button>
            {expanded && (
              <div className="lesson-outline-lessons">
                {module.lessons.map((lesson) => {
                  const done = completedLessonIds.includes(lesson.id)
                  const current = lesson.id === activeLessonId
                  const lessonNumber = lessons.findIndex((item) => item.id === lesson.id) + 1
                  return (
                    <Link
                      key={lesson.id}
                      aria-current={current ? 'page' : undefined}
                      className={current ? 'current' : done ? 'completed' : 'upcoming'}
                      to={`/learn/${course.id}/${lesson.id}`}
                      onClick={onNavigate}
                    >
                      <span className="lesson-number">{done ? <Check /> : current ? <Play /> : <Circle />}<b>{!done && !current ? lessonNumber : null}</b></span>
                      <span><strong>{lesson.title}</strong><small>{lesson.durationMinutes} phút</small></span>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>
        )
      })}
    </nav>
  )
}
