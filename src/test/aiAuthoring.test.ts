import { beforeEach, describe, expect, it } from 'vitest'
import { buildCourseFromAiDraft, createMockAiDraft, estimateImport } from '../features/ai-authoring/mockAiAuthoring'
import { contentService } from '../services/contentService'

describe('AI Course Authoring architecture', () => {
  beforeEach(() => { localStorage.clear(); contentService.reset() })

  it('estimates a supported import without reading or persisting file content', () => {
    const result = estimateImport({ name: 'sales-training.pdf', size: 3 * 1024 * 1024, type: 'application/pdf' } as File)
    expect(result).toMatchObject({ name: 'sales-training.pdf', estimatedModules: 2, estimatedLessons: 4 })
    expect(localStorage.getItem('fstudio-learning-content')).toBeNull()
  })

  it('adapts mock AI output to the existing draft Course schema', () => {
    const imported = estimateImport({ name: 'product-training.pptx', size: 1024, type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' } as File)
    const course = buildCourseFromAiDraft(createMockAiDraft(imported))
    expect(course.title).toBe('product training')
    expect(course.publishStatus).toBe('draft')
    expect(course.modules).toHaveLength(2)
    expect(course.modules.flatMap((module) => module.lessons)).toHaveLength(4)
    expect(course.modules.flatMap((module) => module.lessons).every((lesson) => lesson.blocks.length > 0)).toBe(true)
    expect(course.quiz.questions).toHaveLength(3)
  })

  it('adds the approved draft without overwriting existing courses', () => {
    const before = contentService.getStore().courses
    const imported = estimateImport({ name: 'sop.md', size: 512, type: 'text/markdown' } as File)
    const approved = buildCourseFromAiDraft(createMockAiDraft(imported))
    contentService.upsertCourse(approved)
    const after = contentService.getStore().courses
    expect(after).toHaveLength(before.length + 1)
    expect(after.some((course) => course.id === before[0]?.id)).toBe(true)
    expect(after.find((course) => course.id === approved.id)?.publishStatus).toBe('draft')
  })
})
