import type { AiCourseDraft, AiDraftBlock } from '../features/ai-authoring/types'

const blockTypes = new Set(['heading', 'paragraph', 'key_point', 'warning', 'bullet_list', 'checklist', 'sorting', 'flashcard', 'quick_question', 'scenario'])
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const texts = (value: unknown): value is string[] => Array.isArray(value) && value.length > 0 && value.every(text)

function validBlock(value: unknown): value is AiDraftBlock {
  if (!record(value) || !text(value.id) || !text(value.type) || !blockTypes.has(value.type) || !['high', 'medium', 'low'].includes(String(value.confidence))) return false
  if (value.type === 'heading' || value.type === 'paragraph') return text(value.text)
  if (value.type === 'key_point' || value.type === 'warning') return text(value.title) && text(value.text)
  if (value.type === 'bullet_list' || value.type === 'checklist') return text(value.title) && texts(value.items)
  if (value.type === 'sorting') return text(value.prompt) && texts(value.items) && text(value.feedback)
  if (value.type === 'flashcard') return text(value.title) && Array.isArray(value.cards) && value.cards.length > 0 && value.cards.every((item) => record(item) && text(item.id) && text(item.front) && text(item.back))
  if (value.type === 'quick_question') return text(value.question) && text(value.explanation) && Array.isArray(value.options) && value.options.length >= 2 && value.options.every((item) => record(item) && text(item.id) && text(item.text) && typeof item.correct === 'boolean' && text(item.feedback))
  return text(value.context) && text(value.customerQuote) && text(value.explanation) && Array.isArray(value.options) && value.options.length >= 2 && value.options.every((item) => record(item) && text(item.id) && text(item.text) && text(item.feedback) && typeof item.recommended === 'boolean')
}

export function parseCourseDraft(value: unknown): AiCourseDraft {
  if (!record(value)) throw new Error('AI_SCHEMA_VALIDATION_FAILED')
  const requiredText = ['id', 'sourceDocumentId', 'preset', 'title', 'shortDescription', 'longDescription', 'category', 'audience', 'confidence', 'createdAt', 'updatedAt', 'status']
  if (requiredText.some((key) => !text(value[key])) || !texts(value.learningObjectives) || !Number.isFinite(value.estimatedDuration)) throw new Error('AI_SCHEMA_VALIDATION_FAILED')
  if (!Array.isArray(value.modules) || !value.modules.length || !value.modules.every((module) => record(module) && text(module.id) && text(module.title) && ['high', 'medium', 'low'].includes(String(module.confidence)) && Array.isArray(module.lessons) && module.lessons.length > 0 && module.lessons.every((lesson) => record(lesson) && text(lesson.id) && text(lesson.title) && ['high', 'medium', 'low'].includes(String(lesson.confidence)) && Array.isArray(lesson.blocks) && lesson.blocks.length > 0 && lesson.blocks.every(validBlock)))) throw new Error('AI_SCHEMA_VALIDATION_FAILED')
  if (!record(value.quiz) || !Number.isFinite(value.quiz.passScore) || !Array.isArray(value.quiz.questions) || !value.quiz.questions.length || !value.quiz.questions.every((question) => record(question) && text(question.id) && ['multiple_choice', 'true_false', 'multi_select'].includes(String(question.type)) && text(question.prompt) && Array.isArray(question.options) && question.options.length >= 2 && question.options.every((option) => record(option) && text(option.id) && text(option.text)) && Array.isArray(question.correctOptionIndexes) && question.correctOptionIndexes.length > 0 && question.correctOptionIndexes.every(Number.isInteger) && text(question.explanation) && Number.isFinite(question.points))) throw new Error('AI_SCHEMA_VALIDATION_FAILED')
  if (!record(value.xp) || !Number.isFinite(value.xp.lesson) || !Number.isFinite(value.xp.quiz) || !Number.isFinite(value.xp.course) || !record(value.badge) || !text(value.badge.id) || !text(value.badge.name) || !text(value.badge.description) || value.badge.condition !== 'course_complete' || !Array.isArray(value.warnings)) throw new Error('AI_SCHEMA_VALIDATION_FAILED')
  const draft = structuredClone(value) as unknown as AiCourseDraft
  const ids = [draft.id, draft.badge.id, ...draft.warnings.map((item) => item.id), ...draft.modules.flatMap((module) => [module.id, ...module.lessons.flatMap((lesson) => [lesson.id, ...lesson.blocks.flatMap((block) => [block.id, ...('options' in block ? block.options.map((item) => item.id) : []), ...('cards' in block ? block.cards.map((item) => item.id) : [])])])]), ...draft.quiz.questions.flatMap((question) => [question.id, ...question.options.map((item) => item.id)])]
  if (ids.some((item) => !item.startsWith('ai-')) || new Set(ids).size !== ids.length) throw new Error('AI_SCHEMA_VALIDATION_FAILED')
  return draft
}

export function parseJsonObject(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  try { return JSON.parse(trimmed) as unknown } catch { throw new Error('AI_INVALID_RESPONSE') }
}
