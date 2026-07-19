import { Check, ChevronDown, Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Course } from '../../types'

interface LessonOutlineProps {
  course: Course
  activeLessonId: string
  completedLessonIds: string[]
  idPrefix: string
  onNavigate?: () => void
}

export function LessonOutline({ course, activeLessonId, completedLessonIds, idPrefix, onNavigate }: LessonOutlineProps) {
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
        const panelId = `${idPrefix}-module-${module.id}`

        return (
          <section key={module.id} className={expanded ? 'is-expanded' : ''}>
            <button
              type="button"
              className="lesson-outline-module"
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => setExpandedModule(expanded ? -1 : moduleIndex)}
            >
              <span>{moduleComplete ? <Check /> : moduleIndex + 1}</span>
              <span><small>Module {moduleIndex + 1}</small><strong title={module.title}>{module.title}</strong></span>
              <ChevronDown />
            </button>
            {expanded && (
              <div id={panelId} className="lesson-outline-lessons">
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
                      <span className="lesson-number">{done ? <Check /> : current ? <Play /> : lessonNumber}</span>
                      <span className="lesson-outline-title" title={lesson.title}>{lesson.title}</span>
                      <small className="lesson-outline-duration">{lesson.durationMinutes} phút</small>
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
