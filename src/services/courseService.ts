import { currentUser } from '../data/courses'
import { contentService } from './contentService'
import type { Course, Question, QuizResult, User } from '../types'
import { calculateCourseProgress, courseStatusFromProgress } from '../utils/courseProgress'

const clone = <T,>(value: T): T => structuredClone(value)

export const courseService = {
  getUser(): User { return clone(currentUser) },
  getCourses(completedLessonIds: string[] = [], latestResult: QuizResult | null = null): Course[] {
    return contentService.getCourses('employee').map((course) => {
      const progress = calculateCourseProgress(course, completedLessonIds)
      return clone({ ...course, progress, status: courseStatusFromProgress(progress, latestResult?.courseId === course.id && latestResult.passed) })
    })
  },
  getCourse(courseId: string, completedLessonIds: string[] = [], latestResult: QuizResult | null = null): Course | undefined {
    return this.getCourses(completedLessonIds, latestResult).find((course) => course.id === courseId)
  },
  getQuestions(courseId: string): Question[] { return clone(contentService.getCourse(courseId, 'trainer')?.quiz.questions ?? []) },
}

export const getCourses = async (): Promise<Course[]> => courseService.getCourses()
export const getCourse = async (courseId: string): Promise<Course | undefined> => courseService.getCourse(courseId)
