export type AiImportPhase = 'import' | 'processing' | 'review' | 'approved'
export type AiProcessingStage = 'Analyzing...' | 'Extracting...' | 'Creating Modules...' | 'Creating Lessons...' | 'Generating Quiz...'

export interface AiImportedFile {
  name: string
  size: number
  type: string
  estimatedModules: number
  estimatedLessons: number
}

export interface AiDraftBlock { id: string; type: 'heading' | 'paragraph' | 'key_point'; text: string }
export interface AiDraftLesson { id: string; title: string; blocks: AiDraftBlock[] }
export interface AiDraftModule { id: string; title: string; lessons: AiDraftLesson[] }
export interface AiCourseDraft { title: string; description: string; modules: AiDraftModule[] }
