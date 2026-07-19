import { describe, expect, it } from 'vitest'
import { courseCatalog, quizQuestions } from '../data/courses'
import { createDefaultProgress, readProgress, resetProgress, writeProgress, type StorageAdapter } from '../services/progressService'
import { addCompletedLesson, calculateCourseProgress, courseStatusFromProgress, getActiveLearningCourse, getContinueLesson, getContinuePath, getNextLesson, isQuizUnlocked } from '../utils/courseProgress'
import { getNextAttemptNumber, gradeQuiz, isPassingScore, PASS_SCORE } from '../utils/quiz'

const course = courseCatalog[0]
describe('learning progress', () => {
  it('starts at zero and never exceeds 100 percent', () => { expect(calculateCourseProgress(course, [])).toBe(0); expect(calculateCourseProgress(course, [...course.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id)), 'unknown', 'lesson-1'])).toBe(100) })
  it('calculates course percentage from required lessons', () => expect(calculateCourseProgress(course, ['lesson-needs', 'lesson-segments', 'lesson-air'])).toBe(43))
  it('ignores optional lessons in the percentage', () => { const optionalCourse = structuredClone(course); optionalCourse.modules[0].lessons.push({ ...optionalCourse.modules[0].lessons[0], id: 'optional-1', required: false }); expect(calculateCourseProgress(optionalCourse, ['optional-1'])).toBe(0) })
  it('does not duplicate completed lessons', () => expect(addCompletedLesson(['lesson-1'], 'lesson-1')).toEqual(['lesson-1']))
  it('finds the next lesson', () => expect(getNextLesson(course, 'lesson-segments')?.id).toBe('lesson-air'))
  it('determines continue learning', () => expect(getContinueLesson(course, ['lesson-needs'], 'lesson-needs')?.id).toBe('lesson-segments'))
  it('routes continue learning to first lesson, quiz, then results', () => { const allIds = course.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id)); expect(getContinuePath(course, [], null, null)).toBe('/learn/mac-back-to-school/lesson-needs'); expect(getContinuePath(course, allIds, 'lesson-quiz-intro', null)).toBe('/quiz/mac-back-to-school'); const passed = gradeQuiz(course.id, quizQuestions, Object.fromEntries(quizQuestions.map((question) => [question.id, question.correctOptionIndex])), 1); expect(getContinuePath(course, allIds, 'lesson-quiz-intro', passed)).toBe('/results/mac-back-to-school') })
  it('prefers the current unfinished course and skips completed courses', () => { const first = { ...course, id: 'first', status: 'completed' as const }; const second = { ...course, id: 'second', status: 'in-progress' as const }; const third = { ...course, id: 'third', status: 'not-started' as const }; expect(getActiveLearningCourse([first, second, third], 'third')?.id).toBe('third'); expect(getActiveLearningCourse([first, second, third], 'first')?.id).toBe('second'); expect(getActiveLearningCourse([first], 'first')).toBeUndefined() })
  it('locks and unlocks quiz', () => { expect(isQuizUnlocked(course, ['lesson-needs'])).toBe(false); expect(isQuizUnlocked(course, course.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id)))).toBe(true) })
  it('marks a course complete only after lesson progress and a passed quiz', () => { expect(courseStatusFromProgress(100, false)).toBe('in-progress'); expect(courseStatusFromProgress(99, true)).toBe('in-progress'); expect(courseStatusFromProgress(100, true)).toBe('completed') })
})

describe('quiz grading', () => {
  it('grades quiz accurately', () => { const answers = Object.fromEntries(quizQuestions.map((question) => [question.id, question.correctOptionIndex])); expect(gradeQuiz(course.id, quizQuestions, answers, 1).score).toBe(100) })
  it('passes at exactly 80 percent', () => { const answers = Object.fromEntries(quizQuestions.slice(0, 8).map((question) => [question.id, question.correctOptionIndex])); const result = gradeQuiz(course.id, quizQuestions, answers, 1); expect(result.score).toBe(PASS_SCORE); expect(result.passed).toBe(true) })
  it('fails at 79 and passes at 80', () => { expect(isPassingScore(79)).toBe(false); expect(isPassingScore(80)).toBe(true) })
  it('uses the pass score configured by the trainer', () => { const answers = Object.fromEntries(quizQuestions.slice(0, 8).map((question) => [question.id, question.correctOptionIndex])); expect(gradeQuiz(course.id, quizQuestions, answers, 1, 90).passed).toBe(false); expect(gradeQuiz(course.id, quizQuestions, answers, 1, 80).passed).toBe(true) })
  it('counts unanswered answers and attempts per course', () => { const result = gradeQuiz(course.id, quizQuestions, {}, 1); expect(result.unanswered).toBe(10); expect(result.incorrectAnswers).toBe(0); expect(getNextAttemptNumber(course.id, [{ result: { courseId: 'other' } }, { result: { courseId: course.id } }])).toBe(2) })
})

describe('progress storage', () => {
  it('recovers safely from corrupted storage', () => { const values = new Map([['fstudio-learning-progress', '{broken']]); const storage: StorageAdapter = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value) }, removeItem: (key) => { values.delete(key) } }; expect(readProgress(storage)).toMatchObject({ schemaVersion: createDefaultProgress().schemaVersion, completedLessonIds: [] }) })
  it('resets storage to the initial state', () => { const values = new Map([['fstudio-learning-progress', '{}']]); const storage: StorageAdapter = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value) }, removeItem: (key) => { values.delete(key) } }; expect(resetProgress(storage)).toMatchObject({ completedLessonIds: [], currentLessonId: null, currentCourseId: null, quizAttempts: [] }); expect(values.has('fstudio-learning-progress')).toBe(false) })
  it('preserves lesson progress across a storage reload', () => { const values = new Map<string, string>(); const storage: StorageAdapter = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value) }, removeItem: (key) => { values.delete(key) } }; writeProgress({ ...createDefaultProgress(), completedLessonIds: ['lesson-needs'], courseProgress: { [course.id]: 14 } }, storage); expect(readProgress(storage)).toMatchObject({ completedLessonIds: ['lesson-needs'], courseProgress: { [course.id]: 14 } }) })
})
