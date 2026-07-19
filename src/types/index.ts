export type UserRole = 'employee' | 'trainer'
export interface User { id: string; name: string; role: UserRole; store: string }
export type LessonStatus = 'locked' | 'not_started' | 'in_progress' | 'completed'
export type CourseStatus = 'not-started' | 'in-progress' | 'completed'
export type PublishStatus = 'draft' | 'published'
export type VideoProvider = 'youtube' | 'vimeo' | 'direct'
export type BadgeCondition = 'first_lesson' | 'module_complete' | 'quiz_passed' | 'course_complete'

interface BlockBase { id: string; collapsed?: boolean }
export type ChoiceFeedback = { id: string; text: string; correct: boolean; feedback: string }
export type LessonBlock =
  | (BlockBase & { type: 'heading'; text: string; level: 2 | 3 })
  | (BlockBase & { type: 'paragraph'; text: string })
  | (BlockBase & { type: 'image'; url: string; alt: string; caption?: string; alignment?: 'left' | 'center' | 'right'; widthPercent?: 50 | 75 | 100 })
  | (BlockBase & { type: 'video'; title: string; url: string; provider: VideoProvider; description: string; durationMinutes: number; transcript?: string; required: boolean })
  | (BlockBase & { type: 'bullet_list'; title: string; items: string[] })
  | (BlockBase & { type: 'quote'; text: string; attribution?: string })
  | (BlockBase & { type: 'divider' })
  | (BlockBase & { type: 'key_point' | 'warning'; title: string; text: string })
  | (BlockBase & { type: 'attachment'; title: string; url: string; description?: string })
  | (BlockBase & { type: 'quick_question' | 'multiple_choice'; question: string; options: ChoiceFeedback[]; explanation: string })
  | (BlockBase & { type: 'true_false'; question: string; correct: boolean; correctFeedback: string; incorrectFeedback: string; explanation: string })
  | (BlockBase & { type: 'multi_select'; question: string; options: ChoiceFeedback[]; explanation: string })
  | (BlockBase & { type: 'flashcard'; title: string; cards: Array<{ id: string; front: string; back: string; imageUrl?: string }> })
  | (BlockBase & { type: 'checklist'; title: string; items: Array<{ id: string; text: string }> })
  | (BlockBase & { type: 'scenario'; context: string; customerQuote: string; options: Array<{ id: string; text: string; feedback: string; recommended: boolean }>; explanation: string })
  | (BlockBase & { type: 'dialogue'; title: string; lines: Array<{ speaker: string; text: string }> })
  | (BlockBase & { type: 'sorting'; prompt: string; items: Array<{ id: string; text: string }>; feedback: string })
  | (BlockBase & { type: 'matching'; prompt: string; pairs: Array<{ id: string; left: string; right: string }>; feedback: string; experimental: true })
  | (BlockBase & { type: 'xp_reward'; amount: number; message: string })
  | (BlockBase & { type: 'badge_reward'; badgeId: string; message: string })
  | (BlockBase & { type: 'completion_message'; title: string; message: string })
  | (BlockBase & { type: 'module_challenge'; title: string; description: string })
  | (BlockBase & { type: 'unlock_condition'; description: string })

export type LessonKind = 'content' | 'video' | 'interactive' | 'quiz'
export interface Lesson { id: string; title: string; description?: string; kind?: LessonKind; durationMinutes: number; required: boolean; xpReward: number; blocks: LessonBlock[] }
export interface Module { id: string; title: string; description?: string; xpReward: number; lessons: Lesson[] }
export type QuizQuestionType = 'multiple_choice' | 'true_false' | 'multi_select'
export interface Question {
  id: string; type: QuizQuestionType; prompt: string; options: string[]; correctOptionIndexes: number[]
  explanation: string; relatedModuleId: string; relatedLessonId: string; points: number
  /** Compatibility for the existing single-choice UI. */ correctOptionIndex: number
}
export interface CourseQuiz { id: string; passScore: number; questions: Question[]; xpReward: number }
export interface BadgeDefinition { id: string; name: string; description: string; icon?: string; condition: BadgeCondition }
export interface GamificationConfig { badges: BadgeDefinition[]; courseCompletionXp: number; completionMessage?: string }
export interface Course {
  id: string; title: string; description: string; detailedDescription?: string; audience?: string; category: string; durationMinutes: number
  level: 'Cơ bản' | 'Trung cấp' | 'Nâng cao'; objectives: string[]; modules: Module[]
  publishStatus: PublishStatus; coverUrl: string; accentColor: string; quiz: CourseQuiz; gamification: GamificationConfig
  status: CourseStatus; progress: number; createdAt: string; updatedAt: string
}
export interface ContentStore { schemaVersion: number; courses: Course[]; updatedAt: string }

export type QuizAnswerValue = number | number[]
export interface QuizDraft { courseId: string; answers: Record<string, QuizAnswerValue>; currentQuestionIndex: number; updatedAt: string }
export interface QuizAnswerReview {
  questionId: string; selectedOptionIndex: number | null; selectedOptionIndexes?: number[]; correctOptionIndex: number; correctOptionIndexes?: number[]; isCorrect: boolean
  explanation: string; relatedModuleId: string; relatedLessonId: string
}
export interface QuizResult {
  courseId: string; score: number; correctAnswers: number; incorrectAnswers: number; unanswered: number
  totalQuestions: number; passed: boolean; completedAt: string; attemptNumber: number; answers: QuizAnswerReview[]
}
export interface QuizAttempt { id: string; result: QuizResult }
export interface LearningProgress {
  completedLessonIds: string[]; currentLessonId: string | null; currentCourseId: string | null
  courseProgress: Record<string, number>; quizDraft: QuizDraft | null; quizAttempts: QuizAttempt[]
  latestQuizResult: QuizResult | null; totalXp: number; earnedBadgeIds: string[]; rewardedLessonIds: string[]; rewardedModuleIds: string[]; rewardedQuizCourseIds: string[]
  updatedAt: string; schemaVersion: number
}

export type ImportConflictStrategy = 'overwrite' | 'copy' | 'cancel'
export interface ImportPreview { valid: boolean; kind: 'course' | 'store' | null; duplicateIds: string[]; errors: string[]; payload: Course | ContentStore | null }
