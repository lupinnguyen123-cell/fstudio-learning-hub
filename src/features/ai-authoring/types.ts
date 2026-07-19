export type AiImportPhase = 'import' | 'processing' | 'review' | 'approved' | 'failed' | 'discarded'
export type AiProcessingStage = 'Analyzing...' | 'Extracting...' | 'Creating Modules...' | 'Creating Lessons...' | 'Generating Quiz...'
export type AiDraftStatus = 'analyzing' | 'ready' | 'needs_review' | 'approved' | 'discarded'
export type AiConfidence = 'high' | 'medium' | 'low'
export type AiPresetId = 'product' | 'sales' | 'campaign'
export type AiReviewStatus = 'unreviewed' | 'reviewed' | 'needs_changes' | 'approved'

export interface AiSourceDocument {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  extractedText: string
  importedAt: string
  sourceLanguage: 'vi' | 'en' | 'unknown'
  pageCount?: number
  slideCount?: number
  metadata: { extractionMode: 'mock'; note: string }
}

export interface AiImportedFile {
  source: AiSourceDocument
  estimatedModules: number
  estimatedLessons: number
  suggestedPreset: AiPresetId
}

interface AiBlockBase { id: string; confidence: AiConfidence; reviewStatus?: AiReviewStatus }
export type AiDraftBlock =
  | (AiBlockBase & { type: 'heading' | 'paragraph'; text: string })
  | (AiBlockBase & { type: 'key_point' | 'warning'; title: string; text: string })
  | (AiBlockBase & { type: 'bullet_list' | 'checklist'; title: string; items: string[] })
  | (AiBlockBase & { type: 'sorting'; prompt: string; items: string[]; feedback: string })
  | (AiBlockBase & { type: 'flashcard'; title: string; cards: Array<{ id: string; front: string; back: string }> })
  | (AiBlockBase & { type: 'quick_question'; question: string; options: Array<{ id: string; text: string; correct: boolean; feedback: string }>; explanation: string })
  | (AiBlockBase & { type: 'scenario'; context: string; customerQuote: string; options: Array<{ id: string; text: string; feedback: string; recommended: boolean }>; explanation: string })

export interface AiDraftLesson { id: string; title: string; confidence: AiConfidence; reviewStatus?: AiReviewStatus; blocks: AiDraftBlock[] }
export interface AiDraftModule { id: string; title: string; confidence: AiConfidence; reviewStatus?: AiReviewStatus; lessons: AiDraftLesson[] }
export interface AiDraftQuestion { id: string; type: 'multiple_choice' | 'true_false' | 'multi_select'; prompt: string; options: Array<{ id: string; text: string }>; correctOptionIndexes: number[]; explanation: string; points: number }
export interface AiDraftQuiz { passScore: number; questions: AiDraftQuestion[] }
export type AiWarningDismissReason = 'Trainer đã xác minh' | 'Nội dung vẫn phù hợp' | 'Sẽ cập nhật sau' | 'Không áp dụng' | 'Lý do khác'
export interface AiDraftWarning { id: string; code: 'source_short' | 'objective_unclear' | 'quiz_insufficient' | 'empty_lesson' | 'quiz_invalid' | 'trainer_verification' | 'time_sensitive'; message: string; reviewed: boolean; resolution?: 'open' | 'resolved' | 'dismissed'; dismissReason?: AiWarningDismissReason; relatedItemId?: string }
export interface AiDraftReviewMeta { courseTitle: AiReviewStatus; courseDescription: AiReviewStatus; learningObjectives: AiReviewStatus; previewOpened: boolean }

export interface AiCourseDraft {
  id: string
  sourceDocumentId: string
  preset: AiPresetId
  title: string
  shortDescription: string
  longDescription: string
  category: string
  audience: string
  learningObjectives: string[]
  estimatedDuration: number
  modules: AiDraftModule[]
  quiz: AiDraftQuiz
  xp: { lesson: number; quiz: number; course: number }
  badge: { id: string; name: string; description: string; condition: 'course_complete' }
  warnings: AiDraftWarning[]
  confidence: AiConfidence
  createdAt: string
  updatedAt: string
  status: AiDraftStatus
  review?: AiDraftReviewMeta
}

export interface AiValidationIssue { id: string; path: string; message: string }
export interface AiDraftValidation { status: 'error' | 'warning' | 'ready'; errors: AiValidationIssue[]; warnings: AiValidationIssue[] }
export type AiReviewSelection = { type: 'course' } | { type: 'module'; moduleId: string } | { type: 'lesson'; moduleId: string; lessonId: string } | { type: 'block'; moduleId: string; lessonId: string; blockId: string }
export interface AiReviewRule { id: string; label: string; passed: boolean }
export interface AiHealthSection { id: 'structure' | 'content' | 'assessment' | 'sales' | 'review' | 'validation'; label: string; passed: number; total: number; rules: AiReviewRule[] }
export interface AiApprovalItem { id: string; label: string; complete: boolean }
