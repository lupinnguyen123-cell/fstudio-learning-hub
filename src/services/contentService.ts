import { courseCatalog } from '../data/courses'
import type { ContentStore, Course, ImportConflictStrategy, ImportPreview, Lesson, LessonBlock, Module, PublishStatus } from '../types'

export const CONTENT_STORAGE_KEY = 'fstudio-learning-content'
export const CONTENT_SCHEMA_VERSION = 1
export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
const now = () => new Date().toISOString()
const clone = <T,>(value: T): T => structuredClone(value)
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
const defaultStore = (): ContentStore => ({ schemaVersion: CONTENT_SCHEMA_VERSION, courses: clone(courseCatalog), updatedAt: now() })
const browserStorage = (): StorageLike | null => { try { return window.localStorage } catch { return null } }
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

export interface PublishValidationIssue {
  id: string
  message: string
  tab: 'settings' | 'structure' | 'lesson' | 'quiz' | 'rewards'
  moduleId?: string
  lessonId?: string
}

export function validateCourseForPublish(course: Course): PublishValidationIssue[] {
  const issues: PublishValidationIssue[] = []
  if (!course.title.trim()) issues.push({ id: 'course-title', message: 'Nhập tên khóa học.', tab: 'settings' })
  if (!course.description.trim()) issues.push({ id: 'course-description', message: 'Nhập mô tả khóa học.', tab: 'settings' })
  if (!Number.isFinite(course.durationMinutes) || course.durationMinutes <= 0) issues.push({ id: 'course-duration', message: 'Thời lượng khóa học phải lớn hơn 0 phút.', tab: 'settings' })
  if (!course.modules.length) issues.push({ id: 'course-modules', message: 'Thêm ít nhất một module.', tab: 'structure' })
  course.modules.forEach((module, moduleIndex) => {
    if (!module.lessons.length) issues.push({ id: `module-${module.id}`, message: `Module ${moduleIndex + 1} “${module.title || 'Chưa đặt tên'}” cần ít nhất một lesson.`, tab: 'structure', moduleId: module.id })
    module.lessons.forEach((lesson, lessonIndex) => {
      if (!lesson.blocks.length) issues.push({ id: `lesson-${lesson.id}`, message: `Lesson ${lessonIndex + 1} “${lesson.title || 'Chưa đặt tên'}” cần ít nhất một block.`, tab: 'lesson', moduleId: module.id, lessonId: lesson.id })
    })
  })
  if (!course.quiz.questions.length) issues.push({ id: 'quiz-empty', message: 'Thêm ít nhất một câu hỏi quiz.', tab: 'quiz' })
  if (!Number.isFinite(course.quiz.passScore) || course.quiz.passScore < 0 || course.quiz.passScore > 100) issues.push({ id: 'quiz-pass-score', message: 'Điểm đạt quiz phải từ 0 đến 100.', tab: 'quiz' })
  course.quiz.questions.forEach((question, index) => {
    if (!question.prompt.trim()) issues.push({ id: `question-${question.id}-prompt`, message: `Câu ${index + 1}: nhập nội dung câu hỏi.`, tab: 'quiz' })
    if (question.options.length < 2 || question.options.some((option) => !option.trim())) issues.push({ id: `question-${question.id}-options`, message: `Câu ${index + 1}: cần ít nhất 2 đáp án có nội dung.`, tab: 'quiz' })
    const validIndexes = question.correctOptionIndexes.filter((answer) => Number.isInteger(answer) && answer >= 0 && answer < question.options.length)
    const expected = question.type === 'multi_select' ? validIndexes.length >= 1 : validIndexes.length === 1
    if (!expected) issues.push({ id: `question-${question.id}-answer`, message: `Câu ${index + 1}: chọn ${question.type === 'multi_select' ? 'ít nhất một' : 'đúng một'} đáp án đúng.`, tab: 'quiz' })
  })
  course.gamification.badges.forEach((badge, index) => {
    if (!badge.name.trim() || !badge.description.trim()) issues.push({ id: `badge-${badge.id}`, message: `Badge ${index + 1}: nhập đủ tên và mô tả.`, tab: 'rewards' })
  })
  return issues
}

export interface CompletenessItem { id: string; label: string; complete: boolean; tab: PublishValidationIssue['tab'] }
export function getCourseCompleteness(course: Course): { percentage: number; items: CompletenessItem[] } {
  const modulesReady = course.modules.length > 0
  const lessonsReady = modulesReady && course.modules.every((module) => module.lessons.length > 0)
  const blocksReady = lessonsReady && course.modules.every((module) => module.lessons.every((lesson) => lesson.blocks.length > 0))
  const questionsReady = course.quiz.questions.length > 0 && course.quiz.questions.every((question) => question.prompt.trim() && question.options.length >= 2 && question.correctOptionIndexes.length > 0)
  const items: CompletenessItem[] = [
    { id: 'basic', label: 'Tên, mô tả và thời lượng hợp lệ', complete: Boolean(course.title.trim() && course.description.trim() && course.durationMinutes > 0), tab: 'settings' },
    { id: 'modules', label: 'Có ít nhất một module', complete: modulesReady, tab: 'structure' },
    { id: 'lessons', label: 'Mỗi module có lesson', complete: lessonsReady, tab: 'structure' },
    { id: 'blocks', label: 'Mỗi lesson có nội dung', complete: blocksReady, tab: 'lesson' },
    { id: 'quiz', label: 'Quiz có câu hỏi và đáp án đúng', complete: questionsReady, tab: 'quiz' },
    { id: 'score', label: 'Điểm đạt từ 0 đến 100', complete: Number.isFinite(course.quiz.passScore) && course.quiz.passScore >= 0 && course.quiz.passScore <= 100, tab: 'quiz' },
    { id: 'badges', label: 'Badge đã thêm có đủ thông tin', complete: course.gamification.badges.every((badge) => badge.name.trim() && badge.description.trim()), tab: 'rewards' },
  ]
  return { items, percentage: Math.round((items.filter((item) => item.complete).length / items.length) * 100) }
}

function reIdBlock(block: LessonBlock): LessonBlock {
  const id = uid('block')
  switch (block.type) {
    case 'quick_question': case 'multiple_choice': case 'multi_select': return { ...clone(block), id, options: block.options.map((option) => ({ ...option, id: uid('option') })) }
    case 'scenario': return { ...clone(block), id, options: block.options.map((option) => ({ ...option, id: uid('option') })) }
    case 'flashcard': return { ...clone(block), id, cards: block.cards.map((card) => ({ ...card, id: uid('card') })) }
    case 'checklist': case 'sorting': return { ...clone(block), id, items: block.items.map((item) => ({ ...item, id: uid('item') })) }
    case 'matching': return { ...clone(block), id, pairs: block.pairs.map((pair) => ({ ...pair, id: uid('pair') })) }
    default: return { ...clone(block), id }
  }
}

export function duplicateBlock(source: LessonBlock): LessonBlock { return reIdBlock(source) }
export function duplicateLesson(source: Lesson): Lesson { return { ...clone(source), id: uid('lesson'), title: `${source.title} (Bản sao)`, blocks: source.blocks.map(reIdBlock) } }
export function duplicateModule(source: Module): Module { return { ...clone(source), id: uid('module'), title: `${source.title} (Bản sao)`, lessons: source.lessons.map(duplicateLesson) } }

function duplicateWithNewIds(source: Course): Course {
  const moduleIds = new Map(source.modules.map((module) => [module.id, uid('module')]))
  const lessonIds = new Map(source.modules.flatMap((module) => module.lessons).map((lesson) => [lesson.id, uid('lesson')]))
  const timestamp = now()
  return {
    ...clone(source), id: uid('course'), title: `${source.title} (Bản sao)`, publishStatus: 'draft', status: 'not-started', progress: 0, createdAt: timestamp, updatedAt: timestamp,
    modules: source.modules.map((module) => ({ ...clone(module), id: moduleIds.get(module.id)!, lessons: module.lessons.map((lesson) => ({ ...clone(lesson), id: lessonIds.get(lesson.id)!, blocks: lesson.blocks.map(reIdBlock) })) })),
    quiz: { ...clone(source.quiz), id: uid('quiz'), questions: source.quiz.questions.map((question) => ({ ...clone(question), id: uid('question'), relatedModuleId: moduleIds.get(question.relatedModuleId) ?? '', relatedLessonId: lessonIds.get(question.relatedLessonId) ?? '' })) },
    gamification: { ...clone(source.gamification), badges: source.gamification.badges.map((badge) => ({ ...badge, id: uid('badge') })) },
  }
}

export function validateCourse(value: unknown): value is Course {
  if (!isRecord(value)) return false
  return typeof value.id === 'string' && typeof value.title === 'string' && typeof value.description === 'string' &&
    (value.publishStatus === 'draft' || value.publishStatus === 'published') && Array.isArray(value.modules) &&
    value.modules.every((module) => isRecord(module) && typeof module.id === 'string' && typeof module.title === 'string' && Array.isArray(module.lessons)) &&
    isRecord(value.quiz) && Array.isArray(value.quiz.questions) && isRecord(value.gamification) && Array.isArray(value.gamification.badges)
}
export function validateStore(value: unknown): value is ContentStore {
  return isRecord(value) && value.schemaVersion === CONTENT_SCHEMA_VERSION && Array.isArray(value.courses) && value.courses.every(validateCourse) && typeof value.updatedAt === 'string'
}

export function createCourse(title = 'Khóa học mới'): Course {
  const timestamp = now()
  return { id: uid('course'), title, description: '', detailedDescription: '', audience: 'Nhân viên bán lẻ', category: 'Đào tạo nội bộ', durationMinutes: 30, level: 'Cơ bản', objectives: [], modules: [], publishStatus: 'draft', coverUrl: '', accentColor: '#2563eb', quiz: { id: uid('quiz'), passScore: 80, questions: [], xpReward: 100 }, gamification: { courseCompletionXp: 100, completionMessage: 'Chúc mừng bạn đã hoàn thành khóa học!', badges: [] }, status: 'not-started', progress: 0, createdAt: timestamp, updatedAt: timestamp }
}
export function createModule(title = 'Module mới'): Module { return { id: uid('module'), title, description: '', xpReward: 20, lessons: [] } }
export function createLesson(title = 'Bài học mới'): Lesson { return { id: uid('lesson'), title, description: '', kind: 'content', durationMinutes: 10, required: true, xpReward: 50, blocks: [] } }
export function createBlock(type: LessonBlock['type']): LessonBlock {
  const id = uid('block')
  switch (type) {
    case 'heading': return { id, type, level: 2, text: 'Tiêu đề mới' }
    case 'paragraph': return { id, type, text: 'Nội dung bài học...' }
    case 'image': return { id, type, url: '', alt: '', caption: '', alignment: 'center', widthPercent: 100 }
    case 'video': return { id, type, title: 'Video', url: '', provider: 'youtube', description: '', durationMinutes: 5, transcript: '', required: false }
    case 'bullet_list': return { id, type, title: 'Danh sách', items: ['Nội dung thứ nhất'] }
    case 'quote': return { id, type, text: 'Trích dẫn', attribution: '' }
    case 'divider': return { id, type }
    case 'key_point': case 'warning': return { id, type, title: type === 'key_point' ? 'Điểm cần nhớ' : 'Lưu ý', text: 'Nội dung quan trọng' }
    case 'attachment': return { id, type, title: 'Tài liệu', url: '', description: '' }
    case 'quick_question': case 'multiple_choice': return { id, type, question: 'Câu hỏi?', options: [{ id: uid('option'), text: 'Đáp án đúng', correct: true, feedback: 'Chính xác!' }, { id: uid('option'), text: 'Đáp án khác', correct: false, feedback: 'Hãy thử lại.' }], explanation: 'Giải thích đáp án.' }
    case 'true_false': return { id, type, question: 'Nhận định này đúng hay sai?', correct: true, correctFeedback: 'Chính xác!', incorrectFeedback: 'Chưa chính xác.', explanation: 'Giải thích.' }
    case 'multi_select': return { id, type, question: 'Chọn các đáp án đúng', options: [{ id: uid('option'), text: 'Lựa chọn 1', correct: true, feedback: '' }, { id: uid('option'), text: 'Lựa chọn 2', correct: false, feedback: '' }], explanation: 'Giải thích.' }
    case 'flashcard': return { id, type, title: 'Flashcards', cards: [{ id: uid('card'), front: 'Mặt trước', back: 'Mặt sau', imageUrl: '' }] }
    case 'checklist': return { id, type, title: 'Checklist', items: [{ id: uid('item'), text: 'Việc cần làm' }] }
    case 'scenario': return { id, type, context: 'Bối cảnh khách hàng', customerQuote: 'Câu nói của khách hàng', options: [{ id: uid('option'), text: 'Phương án được khuyến nghị', feedback: 'Phản hồi cho phương án', recommended: true }, { id: uid('option'), text: 'Phương án khác', feedback: 'Phản hồi cho phương án', recommended: false }], explanation: 'Giải thích tình huống.' }
    case 'dialogue': return { id, type, title: 'Hội thoại', lines: [{ speaker: 'Nhân viên', text: 'Xin chào, tôi có thể hỗ trợ gì?' }] }
    case 'sorting': return { id, type, prompt: 'Sắp xếp theo đúng thứ tự', items: [{ id: uid('item'), text: 'Bước 1' }, { id: uid('item'), text: 'Bước 2' }], feedback: 'Đúng thứ tự!' }
    case 'matching': return { id, type, prompt: 'Ghép các cặp phù hợp', pairs: [{ id: uid('pair'), left: 'Khái niệm', right: 'Mô tả' }], feedback: 'Ghép chính xác!', experimental: true }
    case 'xp_reward': return { id, type, amount: 25, message: 'Bạn nhận được XP!' }
    case 'badge_reward': return { id, type, badgeId: '', message: 'Bạn nhận được badge!' }
    case 'completion_message': return { id, type, title: 'Hoàn thành!', message: 'Bạn đã hoàn thành nội dung.' }
    case 'module_challenge': return { id, type, title: 'Thử thách module', description: 'Áp dụng kiến thức vào tình huống thực tế.' }
    case 'unlock_condition': return { id, type, description: 'Hoàn thành bài trước để mở khóa.' }
  }
}

export class ContentService {
  private store: ContentStore
  private warning = ''
  private storage: StorageLike | null
  constructor(storage: StorageLike | null = browserStorage()) { this.storage = storage; this.store = this.load() }
  private load(): ContentStore {
    try { const raw = this.storage?.getItem(CONTENT_STORAGE_KEY); if (!raw) return defaultStore(); const parsed: unknown = JSON.parse(raw); if (validateStore(parsed)) return clone(parsed); this.warning = 'Dữ liệu nội dung không hợp lệ. Đang dùng dữ liệu an toàn mặc định.' } catch { this.warning = 'Không thể đọc dữ liệu nội dung. Đang dùng dữ liệu an toàn mặc định.' }
    return defaultStore()
  }
  private save(next: ContentStore): ContentStore { const nextStore = { ...clone(next), updatedAt: now() }; this.storage?.setItem(CONTENT_STORAGE_KEY, JSON.stringify(nextStore)); this.store = nextStore; window.dispatchEvent(new Event('fstudio-content-change')); return this.getStore() }
  getWarning() { return this.warning }
  clearWarning() { this.warning = '' }
  getStore() { return clone(this.store) }
  getCourses(role: 'employee' | 'trainer' = 'employee') { return clone(this.store.courses.filter((course) => role === 'trainer' || course.publishStatus === 'published')) }
  getCourse(id: string, role: 'employee' | 'trainer' = 'employee') { return this.getCourses(role).find((course) => course.id === id) }
  addCourse(course = createCourse()) { return this.save({ ...this.store, courses: [...this.store.courses, course] }) }
  updateCourse(course: Course) { return this.save({ ...this.store, courses: this.store.courses.map((item) => item.id === course.id ? { ...clone(course), updatedAt: now() } : item) }) }
  upsertCourse(course: Course) { return this.store.courses.some((item) => item.id === course.id) ? this.updateCourse(course) : this.addCourse(course) }
  deleteCourse(id: string) { return this.save({ ...this.store, courses: this.store.courses.filter((course) => course.id !== id) }) }
  duplicateCourse(id: string) { const course = this.store.courses.find((item) => item.id === id); if (!course) return null; const duplicate = duplicateWithNewIds(course); this.addCourse(duplicate); return duplicate }
  setPublishStatus(id: string, status: PublishStatus) { const course = this.store.courses.find((item) => item.id === id); return course ? this.updateCourse({ ...course, publishStatus: status }) : this.getStore() }
  reset() { this.storage?.removeItem(CONTENT_STORAGE_KEY); this.warning = ''; this.store = defaultStore(); window.dispatchEvent(new Event('fstudio-content-change')); return this.getStore() }
  exportCourse(id: string) { const course = this.store.courses.find((item) => item.id === id); if (!course) throw new Error('Không tìm thấy khóa học'); return JSON.stringify(course, null, 2) }
  exportAll() { return JSON.stringify(this.store, null, 2) }
  previewImport(text: string): ImportPreview {
    try {
      const parsed: unknown = JSON.parse(text)
      if (validateCourse(parsed)) return { valid: true, kind: 'course', duplicateIds: this.store.courses.some((course) => course.id === parsed.id) ? [parsed.id] : [], errors: [], payload: clone(parsed) }
      if (validateStore(parsed)) return { valid: true, kind: 'store', duplicateIds: parsed.courses.filter((course) => this.store.courses.some((current) => current.id === course.id)).map((course) => course.id), errors: [], payload: clone(parsed) }
      return { valid: false, kind: null, duplicateIds: [], errors: ['JSON không đúng schema content hiện tại.'], payload: null }
    } catch { return { valid: false, kind: null, duplicateIds: [], errors: ['File JSON không hợp lệ.'], payload: null } }
  }
  importJson(text: string, strategy: ImportConflictStrategy): ContentStore {
    const preview = this.previewImport(text); if (!preview.valid || !preview.payload) throw new Error(preview.errors.join(' ')); if (strategy === 'cancel') return this.getStore()
    const incoming = preview.kind === 'course' ? [preview.payload as Course] : (preview.payload as ContentStore).courses
    const copied = incoming.map((course) => strategy === 'copy' && this.store.courses.some((item) => item.id === course.id) ? duplicateWithNewIds(course) : clone(course))
    const ids = new Set(copied.map((course) => course.id)); const retained = strategy === 'overwrite' ? this.store.courses.filter((course) => !ids.has(course.id)) : this.store.courses
    return this.save({ ...this.store, courses: [...retained, ...copied] })
  }
}

export const contentService = new ContentService()
