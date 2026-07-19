import { createBlock, createCourse, createLesson, createModule } from '../../services/contentService'
import type { Course, Question } from '../../types'
import type { AiCourseDraft, AiDraftBlock, AiImportedFile, AiProcessingStage } from './types'

export const aiProcessingStages: AiProcessingStage[] = ['Analyzing...', 'Extracting...', 'Creating Modules...', 'Creating Lessons...', 'Generating Quiz...']
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

export function estimateImport(file: Pick<File, 'name' | 'size' | 'type'>): AiImportedFile {
  const sizeMb = Math.max(0.1, file.size / 1024 / 1024)
  const estimatedModules = Math.min(6, Math.max(2, Math.ceil(sizeMb / 2)))
  return { name: file.name, size: file.size, type: file.type, estimatedModules, estimatedLessons: estimatedModules * 2 }
}

function block(type: AiDraftBlock['type'], text: string): AiDraftBlock { return { id: uid('ai-block'), type, text } }

export function createMockAiDraft(file: AiImportedFile): AiCourseDraft {
  const baseName = file.name.replace(/\.(pptx|pdf|docx|txt|md|markdown)$/i, '').replace(/[-_]+/g, ' ').trim()
  return {
    title: baseName || 'Khóa học mới từ tài liệu',
    description: 'Bản nháp được mô phỏng từ tài liệu nhập. Trainer cần review trước khi sử dụng.',
    modules: [
      { id: uid('ai-module'), title: 'Nền tảng kiến thức', lessons: [
        { id: uid('ai-lesson'), title: 'Mục tiêu và bối cảnh', blocks: [block('heading', 'Mục tiêu học tập'), block('paragraph', 'Giới thiệu bối cảnh và kết quả mong đợi từ tài liệu nguồn.')] },
        { id: uid('ai-lesson'), title: 'Kiến thức cốt lõi', blocks: [block('heading', 'Điểm chính'), block('key_point', 'Tóm tắt nội dung quan trọng Trainer cần xác nhận.')] },
      ] },
      { id: uid('ai-module'), title: 'Áp dụng tại cửa hàng', lessons: [
        { id: uid('ai-lesson'), title: 'Ví dụ thực tế', blocks: [block('heading', 'Tình huống áp dụng'), block('paragraph', 'Liên hệ kiến thức với một tình huống phục vụ khách hàng.')] },
        { id: uid('ai-lesson'), title: 'Tổng kết và thực hành', blocks: [block('heading', 'Ghi nhớ'), block('key_point', 'Chốt lại hành động nhân viên có thể thực hiện ngay.')] },
      ] },
    ],
  }
}

function createQuestions(moduleIds: string[], lessonIds: string[]): Question[] {
  return [0, 1, 2].map((index) => ({
    id: uid('question'), type: index === 1 ? 'true_false' : 'multiple_choice', prompt: `Câu hỏi kiểm tra mẫu ${index + 1}`,
    options: index === 1 ? ['Đúng', 'Sai'] : ['Đáp án phù hợp', 'Đáp án cần xem lại'], correctOptionIndexes: [0], correctOptionIndex: 0,
    explanation: 'Trainer cần review câu hỏi và đáp án trước khi publish.', relatedModuleId: moduleIds[index % moduleIds.length] ?? '', relatedLessonId: lessonIds[index % lessonIds.length] ?? '', points: 1,
  }))
}

export function buildCourseFromAiDraft(draft: AiCourseDraft): Course {
  const course = createCourse(draft.title.trim() || 'Khóa học từ AI Workspace')
  course.description = draft.description
  course.category = 'AI Draft'
  course.modules = draft.modules.map((draftModule) => {
    const module = createModule(draftModule.title)
    module.lessons = draftModule.lessons.map((draftLesson) => {
      const lesson = createLesson(draftLesson.title)
      lesson.blocks = draftLesson.blocks.map((draftBlock) => {
        if (draftBlock.type === 'heading') { const result = createBlock('heading'); if (result.type === 'heading') result.text = draftBlock.text; return result }
        if (draftBlock.type === 'key_point') { const result = createBlock('key_point'); if (result.type === 'key_point') { result.title = 'Điểm cần nhớ'; result.text = draftBlock.text } return result }
        const result = createBlock('paragraph'); if (result.type === 'paragraph') result.text = draftBlock.text; return result
      })
      return lesson
    })
    return module
  })
  const lessonIds = course.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id))
  course.quiz.questions = createQuestions(course.modules.map((module) => module.id), lessonIds)
  course.publishStatus = 'draft'
  return course
}
