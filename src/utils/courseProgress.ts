import type { Course, Lesson, QuizResult } from '../types'

export function getRequiredLessons(course: Course): Lesson[] { return course.modules.flatMap((module) => module.lessons).filter((lesson) => lesson.required) }
export function calculateCourseProgress(course: Course, completedIds: string[]): number {
  const lessons = getRequiredLessons(course)
  if (!lessons.length) return 0
  const completed = lessons.filter((lesson) => completedIds.includes(lesson.id)).length
  return Math.round((completed / lessons.length) * 100)
}
export function courseStatusFromProgress(progress: number, quizPassed = false): Course['status'] { return progress >= 100 && quizPassed ? 'completed' : progress > 0 ? 'in-progress' : 'not-started' }
export function addCompletedLesson(completedIds: string[], lessonId: string): string[] { return [...new Set([...completedIds, lessonId])] }
export function getNextLesson(course: Course, lessonId: string): Lesson | null {
  const lessons = course.modules.flatMap((module) => module.lessons)
  const index = lessons.findIndex((lesson) => lesson.id === lessonId)
  return index >= 0 ? lessons[index + 1] ?? null : null
}
export function getContinueLesson(course: Course, completedIds: string[], currentLessonId?: string | null): Lesson | null {
  const lessons = course.modules.flatMap((module) => module.lessons)
  const current = lessons.find((lesson) => lesson.id === currentLessonId && !completedIds.includes(lesson.id))
  return current ?? lessons.find((lesson) => !completedIds.includes(lesson.id)) ?? null
}
export function isQuizUnlocked(course: Course, completedIds: string[]): boolean { return getRequiredLessons(course).every((lesson) => completedIds.includes(lesson.id)) }
export function getContinuePath(course: Course, completedIds: string[], currentLessonId: string | null, latestResult: QuizResult | null): string {
  const lesson = getContinueLesson(course, completedIds, currentLessonId)
  if (lesson) return `/learn/${course.id}/${lesson.id}`
  if (latestResult?.courseId === course.id) return `/results/${course.id}`
  return `/quiz/${course.id}`
}
export function getActiveLearningCourse(courses: Course[], currentCourseId: string | null): Course | undefined {
  const current = courses.find((course) => course.id === currentCourseId)
  if (current && current.status !== 'completed') return current
  return courses.find((course) => course.status !== 'completed')
}
