import type { LessonStatus, Module } from '../../types'
import { LessonRow } from './LessonRow'
export function CourseModule({ courseId, module, index, getStatus }: { courseId: string; module: Module; index: number; getStatus: (lessonId: string) => LessonStatus }) {
  return <article className="module-card"><div className="module-number">{String(index + 1).padStart(2, '0')}</div><div className="module-content"><h3>{module.title}</h3>{module.lessons.map((lesson) => <LessonRow key={lesson.id} courseId={courseId} lesson={lesson} status={getStatus(lesson.id)} />)}</div></article>
}
