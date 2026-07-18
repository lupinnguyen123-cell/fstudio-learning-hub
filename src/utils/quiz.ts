import type { Question, QuizAnswerValue, QuizResult } from '../types'

export const PASS_SCORE = 80
export const isPassingScore = (score: number, passScore = PASS_SCORE): boolean => score >= passScore
export const getNextAttemptNumber = (courseId: string, attempts: Array<{ result: { courseId: string } }>): number => attempts.filter((attempt) => attempt.result.courseId === courseId).length + 1
export function gradeQuiz(courseId: string, questions: Question[], answers: Record<string, QuizAnswerValue>, attemptNumber: number, passScore = PASS_SCORE, now = new Date()): QuizResult {
  const reviews = questions.map((question) => {
    const value = answers[question.id]; const selectedOptionIndexes = value === undefined ? [] : Array.isArray(value) ? [...value].sort((a, b) => a - b) : [value]; const correctOptionIndexes = [...question.correctOptionIndexes].sort((a, b) => a - b); const isCorrect = selectedOptionIndexes.length === correctOptionIndexes.length && selectedOptionIndexes.every((item, index) => item === correctOptionIndexes[index])
    return { questionId: question.id, selectedOptionIndex: selectedOptionIndexes[0] ?? null, selectedOptionIndexes, correctOptionIndex: question.correctOptionIndex, correctOptionIndexes, isCorrect, explanation: question.explanation, relatedModuleId: question.relatedModuleId, relatedLessonId: question.relatedLessonId }
  })
  const correctAnswers = reviews.filter((answer) => answer.isCorrect).length
  const unanswered = reviews.filter((answer) => answer.selectedOptionIndexes.length === 0).length
  const totalPoints = questions.reduce((sum, question) => sum + question.points, 0); const earnedPoints = questions.reduce((sum, question, index) => sum + (reviews[index].isCorrect ? question.points : 0), 0); const score = totalPoints ? Math.round((earnedPoints / totalPoints) * 100) : 0
  return { courseId, score, correctAnswers, incorrectAnswers: questions.length - correctAnswers - unanswered, unanswered, totalQuestions: questions.length, passed: isPassingScore(score, passScore), completedAt: now.toISOString(), attemptNumber, answers: reviews }
}
