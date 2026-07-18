/* eslint-disable react-refresh/only-export-components -- Context and hook form one public module. */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { courseService } from '../services/courseService'
import { completeLesson, readProgress, resetProgress, rewardLessonCompletion, rewardQuizPass, saveQuizDraft, saveQuizResult, startLesson, writeProgress } from '../services/progressService'
import type { LearningProgress, QuizDraft, QuizResult } from '../types'
import { addCompletedLesson, calculateCourseProgress } from '../utils/courseProgress'

interface LearningContextValue {
  progress: LearningProgress
  openLesson(courseId: string, lessonId: string): void
  markLessonComplete(courseId: string, lessonId: string): void
  updateQuizDraft(draft: QuizDraft): void
  submitQuiz(result: QuizResult): void
  clearProgress(): void
}
const LearningContext = createContext<LearningContextValue | null>(null)

export function LearningProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(readProgress)
  const commit = useCallback((updater: (current: LearningProgress) => LearningProgress) => setProgress((current) => writeProgress(updater(current))), [])
  const openLesson = useCallback((courseId: string, lessonId: string) => commit((current) => startLesson(current, courseId, lessonId)), [commit])
  const markLessonComplete = useCallback((courseId: string, lessonId: string) => commit((current) => {
    const completedIds = addCompletedLesson(current.completedLessonIds, lessonId)
    const course = courseService.getCourse(courseId, completedIds)
    const next = completeLesson(current, lessonId, courseId, course ? calculateCourseProgress(course, completedIds) : 0)
    return course ? rewardLessonCompletion(next, course, lessonId) : next
  }), [commit])
  const updateQuizDraft = useCallback((draft: QuizDraft) => commit((current) => saveQuizDraft(current, draft)), [commit])
  const submitQuiz = useCallback((result: QuizResult) => commit((current) => {
    const next = saveQuizResult(current, result); const course = courseService.getCourse(result.courseId, current.completedLessonIds, result)
    return course ? rewardQuizPass(next, course, result) : next
  }), [commit])
  const clearProgress = useCallback(() => setProgress(resetProgress()), [])
  const value = useMemo<LearningContextValue>(() => ({
    progress, openLesson, markLessonComplete, updateQuizDraft, submitQuiz, clearProgress,
  }), [clearProgress, markLessonComplete, openLesson, progress, submitQuiz, updateQuizDraft])
  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>
}

export function useLearningProgress() {
  const context = useContext(LearningContext)
  if (!context) throw new Error('useLearningProgress must be used within LearningProgressProvider')
  return context
}
