import { beforeEach, describe, expect, it } from 'vitest'
import { AiCourseService, AI_DRAFT_STORAGE_KEY } from '../services/aiCourseService'
import { ContentService, type StorageLike } from '../services/contentService'
import type { AiCourseDraft, AiPresetId } from '../features/ai-authoring/types'

class MemoryStorage implements StorageLike {
  data = new Map<string, string>()
  getItem(key: string) { return this.data.get(key) ?? null }
  setItem(key: string, value: string) { this.data.set(key, value) }
  removeItem(key: string) { this.data.delete(key) }
}

const file = (name: string, text = '') => ({ name, size: 2048, type: name.endsWith('.pdf') ? 'application/pdf' : 'text/markdown', text }) as unknown as File
const generate = (service: AiCourseService, preset: AiPresetId = 'product') => {
  const analysis = service.analyzeSource(file(`${preset}-training.pdf`))
  return service.generateCourseDraft(analysis.source, preset)
}
const collectDraftIds = (draft: AiCourseDraft) => {
  const ids = [draft.id, draft.badge.id]
  draft.modules.forEach((module) => { ids.push(module.id); module.lessons.forEach((lesson) => { ids.push(lesson.id); lesson.blocks.forEach((block) => { ids.push(block.id); if ('options' in block) block.options.forEach((option) => ids.push(option.id)); if ('cards' in block) block.cards.forEach((card) => ids.push(card.id)) }) }) })
  draft.quiz.questions.forEach((question) => { ids.push(question.id); question.options.forEach((option) => ids.push(option.id)) })
  return ids
}

describe('Mock AI Course Engine', () => {
  let storage: MemoryStorage
  let service: AiCourseService
  beforeEach(() => { storage = new MemoryStorage(); service = new AiCourseService(storage) })

  it('creates a source document without storing binary data', () => {
    const result = service.analyzeSource(file('product-training.pdf'))
    expect(result.source).toMatchObject({ fileName: 'product-training.pdf', fileSize: 2048, sourceLanguage: 'vi', metadata: { extractionMode: 'mock' } })
    expect(result.source.extractedText).toContain('Mock extraction only')
    expect(storage.getItem(AI_DRAFT_STORAGE_KEY)).toBeNull()
  })

  it.each([
    ['product', 5, 'Tổng quan sản phẩm'],
    ['sales', 4, 'Khám phá nhu cầu'],
    ['campaign', 4, 'Tổng quan chiến dịch'],
  ] as const)('generates the %s preset deterministically', (preset, moduleCount, firstModule) => {
    const draft = generate(service, preset)
    expect(draft.preset).toBe(preset)
    expect(draft.modules).toHaveLength(moduleCount)
    expect(draft.modules[0]?.title).toBe(firstModule)
    expect(draft.modules.every((module) => module.lessons.every((lesson) => lesson.blocks.length > 0))).toBe(true)
  })

  it('keeps every AI draft entity ID unique', () => {
    const ids = collectDraftIds(generate(service))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('catches a course without modules', () => {
    const draft = service.generateCourseDraft(service.analyzeSource(file('product.pdf')).source, 'product', { failureMode: 'missing_module' })
    expect(service.validateCourseDraft(draft).errors.some((issue) => issue.id === 'modules-empty')).toBe(true)
  })

  it('catches a lesson without blocks', () => {
    const draft = generate(service); draft.modules[0]!.lessons[0]!.blocks = []
    expect(service.validateCourseDraft(draft).errors.some((issue) => issue.id.startsWith('lesson-blocks'))).toBe(true)
  })

  it('catches an invalid quiz answer', () => {
    const draft = service.generateCourseDraft(service.analyzeSource(file('product.pdf')).source, 'product', { failureMode: 'invalid_quiz' })
    expect(service.validateCourseDraft(draft).errors.some((issue) => issue.id.startsWith('quiz-'))).toBe(true)
  })

  it('does not let warnings block conversion while errors do', () => {
    const draft = generate(service)
    expect(service.validateCourseDraft(draft).status).toBe('warning')
    expect(() => service.convertDraftToCourse(draft)).not.toThrow()
    draft.modules = []
    expect(service.validateCourseDraft(draft).status).toBe('error')
    expect(() => service.convertDraftToCourse(draft)).toThrow('invalid_ai_draft')
  })

  it('converts to the existing Course schema with new IDs and draft status', () => {
    const draft = generate(service); const course = service.convertDraftToCourse(draft)
    const productionIds = [course.id, course.quiz.id, ...course.modules.map((module) => module.id), ...course.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id)), ...course.modules.flatMap((module) => module.lessons.flatMap((lesson) => lesson.blocks.map((block) => block.id))), ...course.quiz.questions.map((question) => question.id), ...course.gamification.badges.map((badge) => badge.id)]
    expect(course.publishStatus).toBe('draft')
    expect(course.status).toBe('not-started')
    expect(new Set(productionIds).size).toBe(productionIds.length)
    expect(productionIds.some((id) => id.startsWith('ai-'))).toBe(false)
  })

  it('adds an AI course without overwriting an existing course', () => {
    const contentStorage = new MemoryStorage(); const content = new ContentService(contentStorage); const before = content.getStore().courses
    const course = service.convertDraftToCourse(generate(service)); content.upsertCourse(course); const after = content.getStore().courses
    expect(after).toHaveLength(before.length + 1)
    expect(after.some((item) => item.id === before[0]?.id)).toBe(true)
  })

  it('persists, resumes and discards the latest AI draft', () => {
    const draft = generate(service); service.saveDraft(draft)
    expect(new AiCourseService(storage).loadDraft()?.id).toBe(draft.id)
    service.discardDraft(draft.id)
    expect(new AiCourseService(storage).loadDraft()).toBeNull()
  })

  it('supports deterministic mock failure fixtures', () => {
    const source = service.analyzeSource(file('sales.md')).source
    expect(() => service.generateCourseDraft(source, 'sales', { failureMode: 'generation_failed' })).toThrow('mock_generation_failed')
  })
})
