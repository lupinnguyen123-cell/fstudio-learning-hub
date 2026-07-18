import type { Course, LearningProgress, QuizDraft, QuizResult } from '../types'
import { addCompletedLesson } from '../utils/courseProgress'

export const PROGRESS_STORAGE_KEY = 'fstudio-learning-progress'
export const PROGRESS_SCHEMA_VERSION = 3
const now = () => new Date().toISOString()
export const createDefaultProgress = (): LearningProgress => ({ completedLessonIds: [], currentLessonId: null, currentCourseId: null, courseProgress: {}, quizDraft: null, quizAttempts: [], latestQuizResult: null, totalXp: 0, earnedBadgeIds: [], rewardedLessonIds: [], rewardedModuleIds: [], rewardedQuizCourseIds: [], updatedAt: now(), schemaVersion: PROGRESS_SCHEMA_VERSION })

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function isValidDraft(value: unknown): boolean { return isRecord(value) && typeof value.courseId === 'string' && isRecord(value.answers) && Object.values(value.answers).every((answer) => typeof answer === 'number' || (Array.isArray(answer) && answer.every((item) => typeof item === 'number'))) && typeof value.currentQuestionIndex === 'number' && typeof value.updatedAt === 'string' }
function isValidResult(value: unknown): boolean { return isRecord(value) && typeof value.courseId === 'string' && typeof value.score === 'number' && typeof value.passed === 'boolean' && typeof value.completedAt === 'string' && Array.isArray(value.answers) }
export function isValidProgress(value: unknown): value is LearningProgress {
  if (!isRecord(value)) return false
  return value.schemaVersion === PROGRESS_SCHEMA_VERSION && Array.isArray(value.completedLessonIds) && value.completedLessonIds.every((id) => typeof id === 'string') &&
    (value.currentLessonId === null || typeof value.currentLessonId === 'string') && (value.currentCourseId === null || typeof value.currentCourseId === 'string') &&
    isRecord(value.courseProgress) && Object.values(value.courseProgress).every((progress) => typeof progress === 'number' && progress >= 0 && progress <= 100) &&
    (value.quizDraft === null || isValidDraft(value.quizDraft)) && Array.isArray(value.quizAttempts) && value.quizAttempts.every((attempt) => isRecord(attempt) && typeof attempt.id === 'string' && isValidResult(attempt.result)) && typeof value.totalXp === 'number' && Array.isArray(value.earnedBadgeIds) && Array.isArray(value.rewardedLessonIds) && Array.isArray(value.rewardedModuleIds) && Array.isArray(value.rewardedQuizCourseIds) &&
    (value.latestQuizResult === null || isValidResult(value.latestQuizResult)) && typeof value.updatedAt === 'string'
}

export interface StorageAdapter { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
const browserStorage = (): StorageAdapter | null => { try { return window.localStorage } catch { return null } }
export function readProgress(storage: StorageAdapter | null = browserStorage()): LearningProgress {
  if (!storage) return createDefaultProgress()
  try { const raw = storage.getItem(PROGRESS_STORAGE_KEY); if (!raw) return createDefaultProgress(); const parsed: unknown = JSON.parse(raw); if (isValidProgress(parsed)) return parsed } catch { /* reset below */ }
  const safe = createDefaultProgress(); try { storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(safe)) } catch { /* in-memory fallback */ } return safe
}
export function writeProgress(progress: LearningProgress, storage: StorageAdapter | null = browserStorage()): LearningProgress {
  const next = { ...progress, updatedAt: now(), schemaVersion: PROGRESS_SCHEMA_VERSION }
  try { storage?.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(next)) } catch { /* in-memory state remains available */ }
  return next
}
export function resetProgress(storage: StorageAdapter | null = browserStorage()): LearningProgress { try { storage?.removeItem(PROGRESS_STORAGE_KEY) } catch { /* ignore */ } return createDefaultProgress() }
export function startLesson(progress: LearningProgress, courseId: string, lessonId: string): LearningProgress { return { ...progress, currentCourseId: courseId, currentLessonId: lessonId } }
export function completeLesson(progress: LearningProgress, lessonId: string, courseId: string, courseProgress: number): LearningProgress { return { ...progress, completedLessonIds: addCompletedLesson(progress.completedLessonIds, lessonId), currentCourseId: courseId, courseProgress: { ...progress.courseProgress, [courseId]: courseProgress } } }
export function saveQuizDraft(progress: LearningProgress, draft: QuizDraft): LearningProgress { return { ...progress, quizDraft: draft } }
export function saveQuizResult(progress: LearningProgress, result: QuizResult): LearningProgress { return { ...progress, latestQuizResult: result, quizDraft: null, quizAttempts: [...progress.quizAttempts, { id: `${result.courseId}-${result.attemptNumber}`, result }] } }
export function rewardLessonCompletion(progress: LearningProgress, course: Course, lessonId: string): LearningProgress {
  if (progress.rewardedLessonIds.includes(lessonId)) return progress
  const module = course.modules.find((item) => item.lessons.some((lesson) => lesson.id === lessonId)); const lesson = module?.lessons.find((item) => item.id === lessonId); if (!lesson || !module) return progress
  const firstBadge = course.gamification.badges.find((badge) => badge.condition === 'first_lesson'); const moduleCompleted = module.lessons.every((item) => !item.required || progress.completedLessonIds.includes(item.id)); const rewardModule = moduleCompleted && !progress.rewardedModuleIds.includes(module.id); const moduleBadge = rewardModule ? course.gamification.badges.find((badge) => badge.condition === 'module_complete') : undefined
  return { ...progress, totalXp: progress.totalXp + lesson.xpReward + (rewardModule ? module.xpReward : 0), rewardedLessonIds: [...progress.rewardedLessonIds, lessonId], rewardedModuleIds: rewardModule ? [...progress.rewardedModuleIds, module.id] : progress.rewardedModuleIds, earnedBadgeIds: [...new Set([...progress.earnedBadgeIds, ...(firstBadge ? [firstBadge.id] : []), ...(moduleBadge ? [moduleBadge.id] : [])])] }
}
export function rewardQuizPass(progress: LearningProgress, course: Course, result: QuizResult): LearningProgress {
  if (!result.passed || progress.rewardedQuizCourseIds.includes(result.courseId)) return progress
  const badges = course.gamification.badges.filter((badge) => badge.condition === 'quiz_passed' || badge.condition === 'course_complete').map((badge) => badge.id)
  return { ...progress, totalXp: progress.totalXp + course.quiz.xpReward + course.gamification.courseCompletionXp, rewardedQuizCourseIds: [...progress.rewardedQuizCourseIds, result.courseId], earnedBadgeIds: [...new Set([...progress.earnedBadgeIds, ...badges])] }
}

if (import.meta.env.DEV) Object.assign(window, { resetFStudioLearningProgress: () => resetProgress() })
