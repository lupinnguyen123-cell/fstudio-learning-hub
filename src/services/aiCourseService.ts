import { createCourse, createLesson, createModule, type StorageLike } from './contentService'
import type { Course, LessonBlock, Question } from '../types'
import type { AiCourseDraft, AiDraftBlock, AiDraftModule, AiDraftQuestion, AiDraftValidation, AiDraftWarning, AiImportedFile, AiPresetId, AiProcessingStage, AiSourceDocument } from '../features/ai-authoring/types'

export const AI_DRAFT_STORAGE_KEY = 'fstudio_ai_course_drafts'
export const aiProcessingStages: AiProcessingStage[] = ['Analyzing...', 'Extracting...', 'Creating Modules...', 'Creating Lessons...', 'Generating Quiz...']
const supportedExtensions = ['pptx', 'pdf', 'docx', 'txt', 'md', 'markdown']
const supportedBlockTypes = new Set<AiDraftBlock['type']>(['heading', 'paragraph', 'key_point', 'warning', 'bullet_list', 'checklist', 'sorting', 'flashcard', 'quick_question', 'scenario'])
const browserStorage = (): StorageLike | null => { try { return window.localStorage } catch { return null } }
const now = () => new Date().toISOString()
const normalize = (value: string) => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const slug = (value: string) => normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 34) || 'draft'

function createDraftIdFactory(scope: string) { let index = 0; return (kind: string) => `ai-${slug(scope)}-${kind}-${++index}` }
let productionCounter = 0
let sourceCounter = 0
function productionId(kind: string) { productionCounter += 1; const uuid = globalThis.crypto?.randomUUID?.(); return `${kind}-${uuid ?? `${Date.now().toString(36)}-${productionCounter}`}` }
function clone<T>(value: T): T { return structuredClone(value) }

function suggestedPreset(text: string): AiPresetId {
  const value = normalize(text)
  if (/campaign|chien dich|khuyen mai|chuong trinh/.test(value)) return 'campaign'
  if (/sales|ban hang|tu van|phan doi/.test(value)) return 'sales'
  return 'product'
}

const presetBlueprints: Record<AiPresetId, { title: string; category: string; modules: Array<{ title: string; lesson: string; focus: string }> }> = {
  product: { title: 'Đào tạo sản phẩm', category: 'Product Training', modules: [
    { title: 'Tổng quan sản phẩm', lesson: 'Bối cảnh và giá trị sản phẩm', focus: 'Product Knowledge' }, { title: 'Tính năng chính', lesson: 'Tính năng và lợi ích', focus: 'Key Selling Point' },
    { title: 'Đối tượng phù hợp', lesson: 'Nhu cầu khách hàng', focus: 'Customer Need' }, { title: 'Tình huống tư vấn', lesson: 'Xử lý phản đối', focus: 'Sales Objection' },
    { title: 'Kiểm tra cuối khóa', lesson: 'Tổng kết và áp dụng', focus: 'Store Application' },
  ] },
  sales: { title: 'Kỹ năng tư vấn bán hàng', category: 'Sales Training', modules: [
    { title: 'Khám phá nhu cầu', lesson: 'Đặt câu hỏi đúng', focus: 'Customer Need' }, { title: 'Trình bày giá trị', lesson: 'Kết nối lợi ích', focus: 'Key Selling Point' },
    { title: 'Xử lý phản đối', lesson: 'Phản đối phổ biến', focus: 'Sales Objection' }, { title: 'Áp dụng tại cửa hàng', lesson: 'Kịch bản tư vấn', focus: 'Consultation Scenario' },
  ] },
  campaign: { title: 'Đào tạo chiến dịch', category: 'Campaign Training', modules: [
    { title: 'Tổng quan chiến dịch', lesson: 'Mục tiêu và đối tượng', focus: 'Campaign Condition' }, { title: 'Điều kiện chương trình', lesson: 'Cơ chế và lưu ý', focus: 'Campaign Condition' },
    { title: 'Tư vấn chiến dịch', lesson: 'Kịch bản giới thiệu', focus: 'Consultation Scenario' }, { title: 'Triển khai tại cửa hàng', lesson: 'Checklist thực hiện', focus: 'Store Application' },
  ] },
}

function baseBlocks(id: (kind: string) => string, focus: string, lessonTitle: string): AiDraftBlock[] {
  return [
    { id: id('block'), type: 'heading', text: 'Learning Focus', confidence: 'high' },
    { id: id('block'), type: 'paragraph', text: `${focus}: nội dung ngắn được đề xuất cho “${lessonTitle}”. Trainer cần đối chiếu với tài liệu nguồn.`, confidence: 'medium' },
    { id: id('block'), type: 'key_point', title: 'Điểm cần nhớ', text: `Ghi nhớ trọng tâm của ${lessonTitle.toLocaleLowerCase('vi')}.`, confidence: 'medium' },
  ]
}

function applyRetailHeuristics(blocks: AiDraftBlock[], sourceText: string, id: (kind: string) => string): AiDraftBlock[] {
  const text = normalize(sourceText); const next = [...blocks]
  if (/gia|ngan sach|price|objection/.test(text)) next.push({ id: id('block'), type: 'scenario', context: 'Khách hàng đang cân nhắc ngân sách.', customerQuote: 'Mức giá này cao hơn lựa chọn tôi đang xem.', options: [{ id: id('option'), text: 'Làm rõ nhu cầu và giải thích giá trị', feedback: 'Tập trung vào giá trị liên quan trực tiếp đến nhu cầu.', recommended: true }, { id: id('option'), text: 'Chỉ nhắc lại mức giá', feedback: 'Chưa giải quyết băn khoăn của khách hàng.', recommended: false }], explanation: 'Sales Objection cần được xử lý bằng nhu cầu và giá trị.', confidence: 'medium' })
  if (/tinh nang|feature|san pham|selling point/.test(text)) { next.push({ id: id('block'), type: 'flashcard', title: 'Tính năng và lợi ích', cards: [{ id: id('card'), front: 'Tính năng chính', back: 'Diễn giải thành lợi ích phù hợp nhu cầu khách hàng.' }, { id: id('card'), front: 'Sai lầm phổ biến', back: 'Liệt kê cấu hình mà chưa kết nối với nhu cầu.' }], confidence: 'medium' }); next.push({ id: id('block'), type: 'quick_question', question: 'Cách diễn giải nào kết nối đúng tính năng với nhu cầu?', options: [{ id: id('option'), text: 'Nêu lợi ích gắn với tình huống sử dụng', correct: true, feedback: 'Đúng hướng tư vấn.' }, { id: id('option'), text: 'Chỉ đọc thông số', correct: false, feedback: 'Cần kết nối với nhu cầu.' }], explanation: 'Tính năng trở nên có ý nghĩa khi được chuyển thành lợi ích.', confidence: 'medium' }) }
  if (/dieu kien|campaign|chuong trinh|khuyen mai/.test(text)) next.push({ id: id('block'), type: 'warning', title: 'Điều kiện cần xác minh', text: 'Thông tin chương trình có thể thay đổi. Trainer phải kiểm tra phiên bản hiện hành.', confidence: 'low' })
  if (/quy trinh|process|cac buoc|store application/.test(text)) next.push({ id: id('block'), type: 'checklist', title: 'Apply at Store', items: ['Chuẩn bị thông tin', 'Thực hiện đúng thứ tự', 'Xác nhận kết quả'], confidence: 'medium' })
  return next
}

function createQuiz(id: (kind: string) => string, preset: AiPresetId): AiDraftQuestion[] {
  const topics = preset === 'campaign' ? ['điều kiện chương trình', 'đối tượng áp dụng', 'triển khai tại cửa hàng'] : preset === 'sales' ? ['khám phá nhu cầu', 'trình bày giá trị', 'xử lý phản đối'] : ['tính năng', 'khách hàng phù hợp', 'tình huống tư vấn']
  return topics.map((topic, index) => ({ id: id('question'), type: index === 1 ? 'true_false' : 'multiple_choice', prompt: `Nhận định phù hợp nhất về ${topic}?`, options: [{ id: id('option'), text: 'Đáp án được đề xuất' }, { id: id('option'), text: 'Đáp án cần xem lại' }], correctOptionIndexes: [0], explanation: 'Câu hỏi mock cần Trainer xác minh trước khi publish.', points: 1 }))
}

function warning(id: (kind: string) => string, code: AiDraftWarning['code'], message: string): AiDraftWarning { return { id: id('warning'), code, message, reviewed: false } }

export class AiCourseService {
  private storage: StorageLike | null
  constructor(storage: StorageLike | null = browserStorage()) { this.storage = storage }

  analyzeSource(file: Pick<File, 'name' | 'size' | 'type'>, extractedText = ''): AiImportedFile {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!supportedExtensions.includes(extension)) throw new Error('unsupported_source_type')
    const preset = suggestedPreset(`${file.name} ${extractedText}`)
    const mockByPreset: Record<AiPresetId, string> = { product: 'Mock extraction only: product features, customer needs and price positioning.', sales: 'Mock extraction only: sales consultation, customer needs, objections and store process.', campaign: 'Mock extraction only: campaign conditions, promotion details and store process.' }
    const mockText = extractedText.trim() || mockByPreset[preset]
    sourceCounter += 1
    const source: AiSourceDocument = { id: `source-${Date.now().toString(36)}-${sourceCounter}-${slug(file.name)}`, fileName: file.name, fileType: file.type || extension, fileSize: file.size, extractedText: mockText, importedAt: now(), sourceLanguage: 'vi', metadata: { extractionMode: 'mock', note: 'Chưa parse nội dung file; extractedText là fixture mô phỏng.' } }
    const sizeMb = Math.max(.1, file.size / 1024 / 1024); const estimatedModules = Math.min(6, Math.max(2, Math.ceil(sizeMb / 2)))
    return { source, estimatedModules, estimatedLessons: estimatedModules * 2, suggestedPreset: preset }
  }

  generateCourseDraft(source: AiSourceDocument, preset: AiPresetId = suggestedPreset(`${source.fileName} ${source.extractedText}`), options?: { failureMode?: 'generation_failed' | 'missing_module' | 'invalid_quiz' }): AiCourseDraft {
    if (options?.failureMode === 'generation_failed') throw new Error('mock_generation_failed')
    const blueprint = presetBlueprints[preset]; const id = createDraftIdFactory(`${source.id}-${preset}`); const timestamp = now()
    const modules: AiDraftModule[] = blueprint.modules.map((item) => ({ id: id('module'), title: item.title, confidence: 'medium', lessons: [{ id: id('lesson'), title: item.lesson, confidence: 'medium', blocks: applyRetailHeuristics(baseBlocks(id, item.focus, item.lesson), item.focus, id) }] }))
    const warnings: AiDraftWarning[] = [warning(id, 'trainer_verification', 'Đây là đề xuất tự động mô phỏng; Trainer phải xác minh toàn bộ nội dung.')]
    if (source.extractedText.trim().length < 80) warnings.push(warning(id, 'source_short', 'Nội dung nguồn quá ngắn để suy luận đầy đủ.'))
    if (/gia|campaign|chuong trinh|khuyen mai/.test(normalize(source.extractedText))) warnings.push(warning(id, 'time_sensitive', 'Dữ liệu giá hoặc chương trình có thể lỗi thời.'))
    const draft: AiCourseDraft = { id: id('draft'), sourceDocumentId: source.id, preset, title: `${blueprint.title}: ${source.fileName.replace(/\.[^.]+$/, '')}`, shortDescription: 'Bản nháp khóa học được tạo bởi Mock AI Engine.', longDescription: 'Nội dung được cấu trúc theo heuristic đào tạo bán lẻ và cần Trainer review trước khi publish.', category: blueprint.category, audience: 'Nhân viên tư vấn F.Studio', learningObjectives: ['Nắm kiến thức trọng tâm', 'Áp dụng trong tư vấn tại cửa hàng', 'Hoàn thành bài kiểm tra cuối khóa'], estimatedDuration: modules.length * 12, modules, quiz: { passScore: 80, questions: createQuiz(id, preset) }, xp: { lesson: 40, quiz: 100, course: 100 }, badge: { id: id('badge'), name: `Hoàn thành ${blueprint.title}`, description: 'Hoàn thành khóa học và đạt quiz.', condition: 'course_complete' }, warnings, confidence: source.extractedText.length >= 120 ? 'medium' : 'low', createdAt: timestamp, updatedAt: timestamp, status: warnings.length > 1 ? 'needs_review' : 'ready' }
    if (options?.failureMode === 'missing_module') draft.modules = []
    if (options?.failureMode === 'invalid_quiz') draft.quiz.questions[0]!.correctOptionIndexes = []
    return draft
  }

  validateCourseDraft(draft: AiCourseDraft): AiDraftValidation {
    const errors: AiDraftValidation['errors'] = []; const warnings = draft.warnings.map((item) => ({ id: item.id, path: 'warnings', message: item.message })); const ids = new Set<string>()
    const checkId = (id: string, path: string) => { if (!id || ids.has(id)) errors.push({ id: `id-${path}`, path, message: !id ? 'Thiếu ID.' : 'ID bị trùng.' }); else ids.add(id) }
    checkId(draft.id, 'course'); checkId(draft.badge.id, 'badge'); draft.warnings.forEach((item, index) => checkId(item.id, `warnings.${index}`))
    if (!draft.title.trim()) errors.push({ id: 'course-title', path: 'course.title', message: 'Course cần title.' })
    if (!draft.shortDescription.trim()) errors.push({ id: 'course-description', path: 'course.shortDescription', message: 'Course cần mô tả ngắn.' })
    if (!draft.category.trim() || !draft.audience.trim()) errors.push({ id: 'course-metadata', path: 'course', message: 'Category và audience là bắt buộc.' })
    if (!Number.isFinite(draft.estimatedDuration) || draft.estimatedDuration <= 0) errors.push({ id: 'course-duration', path: 'course.estimatedDuration', message: 'Estimated duration phải lớn hơn 0.' })
    if (!draft.badge.name.trim() || !draft.badge.description.trim()) errors.push({ id: 'badge-content', path: 'badge', message: 'Badge cần tên và mô tả.' })
    if (!draft.learningObjectives.length || draft.learningObjectives.some((item) => !item.trim())) errors.push({ id: 'objectives', path: 'course.learningObjectives', message: 'Learning objectives không hợp lệ.' })
    if (!draft.modules.length) errors.push({ id: 'modules-empty', path: 'modules', message: 'Course cần ít nhất một module.' })
    draft.modules.forEach((module, moduleIndex) => { checkId(module.id, `modules.${moduleIndex}`); if (!module.title.trim()) errors.push({ id: `module-title-${module.id}`, path: `modules.${moduleIndex}.title`, message: 'Module cần title.' }); if (!module.lessons.length) errors.push({ id: `module-lessons-${module.id}`, path: `modules.${moduleIndex}.lessons`, message: 'Module cần ít nhất một lesson.' }); module.lessons.forEach((lesson, lessonIndex) => { checkId(lesson.id, `modules.${moduleIndex}.lessons.${lessonIndex}`); if (!lesson.title.trim()) errors.push({ id: `lesson-title-${lesson.id}`, path: `modules.${moduleIndex}.lessons.${lessonIndex}.title`, message: 'Lesson cần title.' }); if (!lesson.blocks.length) errors.push({ id: `lesson-blocks-${lesson.id}`, path: `modules.${moduleIndex}.lessons.${lessonIndex}.blocks`, message: 'Lesson cần ít nhất một block.' }); lesson.blocks.forEach((block, blockIndex) => { const path = `modules.${moduleIndex}.lessons.${lessonIndex}.blocks.${blockIndex}`; checkId(block.id, path); if (!supportedBlockTypes.has(block.type)) errors.push({ id: `block-type-${block.id}`, path, message: 'Block type không được hỗ trợ.' }); const text = 'text' in block ? block.text : 'title' in block ? block.title : 'question' in block ? block.question : 'context' in block ? block.context : 'prompt' in block ? block.prompt : ''; if (!text.trim()) errors.push({ id: `block-content-${block.id}`, path, message: 'Block có nội dung quan trọng rỗng.' }); if ('items' in block && (!block.items.length || block.items.some((item) => !item.trim()))) errors.push({ id: `block-items-${block.id}`, path, message: 'Block list cần item có nội dung.' }); if ('options' in block) { block.options.forEach((option, optionIndex) => checkId(option.id, `block.${block.id}.options.${optionIndex}`)); if (block.options.length < 2 || block.options.some((option) => !option.text.trim())) errors.push({ id: `block-options-${block.id}`, path, message: 'Interactive block cần ít nhất 2 lựa chọn.' }); if (block.type === 'quick_question' && block.options.filter((option) => option.correct).length !== 1) errors.push({ id: `block-answer-${block.id}`, path, message: 'Quick question cần đúng một đáp án.' }); if (block.type === 'scenario' && block.options.filter((option) => option.recommended).length !== 1) errors.push({ id: `block-recommended-${block.id}`, path, message: 'Scenario cần đúng một phương án khuyến nghị.' }) } if ('cards' in block) { block.cards.forEach((card, cardIndex) => checkId(card.id, `block.${block.id}.cards.${cardIndex}`)); if (!block.cards.length || block.cards.some((card) => !card.front.trim() || !card.back.trim())) errors.push({ id: `block-cards-${block.id}`, path, message: 'Flashcard cần đủ mặt trước và mặt sau.' }) } }) }) })
    if (!Number.isFinite(draft.quiz.passScore) || draft.quiz.passScore < 0 || draft.quiz.passScore > 100) errors.push({ id: 'quiz-pass-score', path: 'quiz.passScore', message: 'Pass score phải từ 0 đến 100.' })
    draft.quiz.questions.forEach((question, index) => { checkId(question.id, `quiz.questions.${index}`); question.options.forEach((option, optionIndex) => checkId(option.id, `quiz.questions.${index}.options.${optionIndex}`)); const valid = question.options.length >= 2 && question.options.every((option) => option.text.trim()) && question.correctOptionIndexes.length >= 1 && question.correctOptionIndexes.every((answer) => Number.isInteger(answer) && answer >= 0 && answer < question.options.length) && (question.type === 'multi_select' || question.correctOptionIndexes.length === 1); if (!question.prompt.trim() || !valid) errors.push({ id: `quiz-${question.id}`, path: `quiz.questions.${index}`, message: 'Quiz question thiếu nội dung, đáp án hoặc đáp án đúng.' }) })
    return { status: errors.length ? 'error' : warnings.length ? 'warning' : 'ready', errors, warnings }
  }

  convertDraftToCourse(draft: AiCourseDraft): Course {
    const validation = this.validateCourseDraft(draft); if (validation.errors.length) throw new Error('invalid_ai_draft')
    const course = createCourse(draft.title); course.id = productionId('course'); course.description = draft.shortDescription; course.detailedDescription = draft.longDescription; course.audience = draft.audience; course.category = draft.category; course.durationMinutes = draft.estimatedDuration; course.objectives = [...draft.learningObjectives]; course.publishStatus = 'draft'; course.status = 'not-started'; course.progress = 0
    const lessonIds: string[] = []; const moduleIds: string[] = []
    const convertBlock = (block: AiDraftBlock): LessonBlock => {
      const id = productionId('block')
      switch (block.type) {
        case 'heading': return { id, type: 'heading', text: block.text, level: 2 }
        case 'paragraph': return { id, type: 'paragraph', text: block.text }
        case 'key_point': case 'warning': return { id, type: block.type, title: block.title, text: block.text }
        case 'bullet_list': return { id, type: 'bullet_list', title: block.title, items: [...block.items] }
        case 'checklist': return { id, type: 'checklist', title: block.title, items: block.items.map((text) => ({ id: productionId('item'), text })) }
        case 'sorting': return { id, type: 'sorting', prompt: block.prompt, items: block.items.map((text) => ({ id: productionId('item'), text })), feedback: block.feedback }
        case 'flashcard': return { id, type: 'flashcard', title: block.title, cards: block.cards.map((card) => ({ id: productionId('card'), front: card.front, back: card.back })) }
        case 'quick_question': return { id, type: 'quick_question', question: block.question, options: block.options.map((option) => ({ ...option, id: productionId('option') })), explanation: block.explanation }
        case 'scenario': return { id, type: 'scenario', context: block.context, customerQuote: block.customerQuote, options: block.options.map((option) => ({ ...option, id: productionId('option') })), explanation: block.explanation }
      }
    }
    course.modules = draft.modules.map((draftModule) => { const module = createModule(draftModule.title); module.id = productionId('module'); moduleIds.push(module.id); module.lessons = draftModule.lessons.map((draftLesson) => { const lesson = createLesson(draftLesson.title); lesson.id = productionId('lesson'); lessonIds.push(lesson.id); lesson.durationMinutes = Math.max(5, Math.round(draft.estimatedDuration / Math.max(1, draft.modules.flatMap((item) => item.lessons).length))); lesson.xpReward = draft.xp.lesson; lesson.blocks = draftLesson.blocks.map(convertBlock); return lesson }); return module })
    const questions: Question[] = draft.quiz.questions.map((question, index) => ({ id: productionId('question'), type: question.type, prompt: question.prompt, options: question.options.map((option) => option.text), correctOptionIndexes: [...question.correctOptionIndexes], correctOptionIndex: question.correctOptionIndexes[0] ?? 0, explanation: question.explanation, relatedModuleId: moduleIds[index % moduleIds.length] ?? '', relatedLessonId: lessonIds[index % lessonIds.length] ?? '', points: question.points }))
    course.quiz = { ...course.quiz, id: productionId('quiz'), passScore: draft.quiz.passScore, questions, xpReward: draft.xp.quiz }
    course.gamification = { courseCompletionXp: draft.xp.course, completionMessage: 'Khóa học hoàn thành.', badges: [{ id: productionId('badge'), name: draft.badge.name, description: draft.badge.description, condition: draft.badge.condition }] }
    return course
  }

  saveDraft(draft: AiCourseDraft): AiCourseDraft { const next = { ...clone(draft), updatedAt: now() }; const drafts = this.readAll().filter((item) => item.id !== next.id); this.storage?.setItem(AI_DRAFT_STORAGE_KEY, JSON.stringify({ version: 1, drafts: [...drafts, next].slice(-5) })); return clone(next) }
  loadDraft(id?: string): AiCourseDraft | null { const drafts = this.readAll().filter((item) => item.status !== 'discarded' && item.status !== 'approved'); const found = id ? drafts.find((item) => item.id === id) : drafts.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0]; return found ? clone(found) : null }
  discardDraft(id: string): void { this.storage?.setItem(AI_DRAFT_STORAGE_KEY, JSON.stringify({ version: 1, drafts: this.readAll().filter((item) => item.id !== id) })) }
  private readAll(): AiCourseDraft[] { try { const raw = this.storage?.getItem(AI_DRAFT_STORAGE_KEY); if (!raw) return []; const value: unknown = JSON.parse(raw); if (typeof value !== 'object' || value === null || !('drafts' in value) || !Array.isArray(value.drafts)) return []; return value.drafts.filter((item): item is AiCourseDraft => typeof item === 'object' && item !== null && 'id' in item && 'modules' in item && Array.isArray(item.modules)) } catch { return [] } }
}

export const aiCourseService = new AiCourseService()
