import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applyRegenerateProposal, calculateDraftHealth, calculateReviewProgress, createRegenerateProposal, dismissWarning, duplicateBlock, duplicateLesson, duplicateModule, getApprovalChecklist, markReviewStatus, mergeLessons, mergeModules, moveLesson, moveLessonToModule, moveModule, normalizeReviewDraft, renameLesson, renameModule, resolveWarning, restoreWarning, splitLesson } from '../features/ai-authoring/aiReviewActions'
import { useAiReviewHistory } from '../features/ai-authoring/useAiReviewHistory'
import type { AiCourseDraft } from '../features/ai-authoring/types'
import { AiCourseService } from '../services/aiCourseService'
import type { StorageLike } from '../services/contentService'

class MemoryStorage implements StorageLike {
  private data = new Map<string, string>()
  getItem(key: string) { return this.data.get(key) ?? null }
  setItem(key: string, value: string) { this.data.set(key, value) }
  removeItem(key: string) { this.data.delete(key) }
}

const sourceFile = { name: 'sales-training.md', size: 2048, type: 'text/markdown' } as File
const createDraft = () => {
  const service = new AiCourseService(new MemoryStorage())
  const source = service.analyzeSource(sourceFile, 'sales product price feature process').source
  return normalizeReviewDraft(service.generateCourseDraft(source, 'sales'))
}
const allIds = (draft: AiCourseDraft) => draft.modules.flatMap((module) => [module.id, ...module.lessons.flatMap((lesson) => [lesson.id, ...lesson.blocks.flatMap((block) => [block.id, ...('cards' in block ? block.cards.map((card) => card.id) : []), ...('options' in block ? block.options.map((option) => option.id) : [])])])])

describe('AI Review draft actions', () => {
  let draft: AiCourseDraft
  beforeEach(() => { draft = createDraft() })

  it('renames and reorders modules and lessons without mutating the source', () => {
    const firstModule = draft.modules[0]!; const secondModule = draft.modules[1]!; const firstLesson = firstModule.lessons[0]!
    const renamedModule = renameModule(draft, firstModule.id, 'Module mới')
    const renamedLesson = renameLesson(renamedModule, firstModule.id, firstLesson.id, 'Lesson mới')
    expect(draft.modules[0]!.title).not.toBe('Module mới')
    expect(renamedLesson.modules[0]!.lessons[0]!.title).toBe('Lesson mới')
    expect(moveModule(draft, firstModule.id, 1).modules[0]!.id).toBe(secondModule.id)
    const expanded = duplicateLesson(draft, firstModule.id, firstLesson.id)
    expect(moveLesson(expanded, firstModule.id, firstLesson.id, 1).modules[0]!.lessons[1]!.id).toBe(firstLesson.id)
  })

  it('moves a lesson between modules and preserves its ID', () => {
    const source = draft.modules[0]!; const destination = draft.modules[1]!; const lesson = source.lessons[0]!
    const moved = moveLessonToModule(draft, source.id, lesson.id, destination.id, 'start')
    expect(moved.modules[0]!.lessons).toHaveLength(source.lessons.length - 1)
    expect(moved.modules[1]!.lessons[0]!.id).toBe(lesson.id)
  })

  it('duplicates module, lesson and block with unique nested IDs', () => {
    const module = draft.modules[0]!; const lesson = module.lessons[0]!; const block = lesson.blocks[0]!
    const duplicated = duplicateBlock(duplicateLesson(duplicateModule(draft, module.id), module.id, lesson.id), module.id, lesson.id, block.id)
    const ids = allIds(duplicated)
    expect(new Set(ids).size).toBe(ids.length)
    expect(duplicated.modules).toHaveLength(draft.modules.length + 1)
  })

  it('merges adjacent modules and lessons without losing blocks', () => {
    const first = draft.modules[0]!; const second = draft.modules[1]!
    const mergedModules = mergeModules(draft, first.id, 'Merged Module')
    expect(mergedModules.modules[0]!.lessons).toHaveLength(first.lessons.length + second.lessons.length)
    const withTwoLessons = duplicateLesson(draft, first.id, first.lessons[0]!.id)
    const beforeBlocks = withTwoLessons.modules[0]!.lessons.slice(0, 2).reduce((count, lesson) => count + lesson.blocks.length, 0)
    const mergedLessons = mergeLessons(withTwoLessons, first.id, first.lessons[0]!.id, 'Merged Lesson')
    expect(mergedLessons.modules[0]!.lessons[0]!.blocks).toHaveLength(beforeBlocks)
  })

  it('splits only lessons that have at least two blocks', () => {
    const module = draft.modules[0]!; const lesson = module.lessons[0]!
    const split = splitLesson(draft, module.id, lesson.id, 1, 'Phần 1', 'Phần 2')
    expect(split.modules[0]!.lessons).toHaveLength(module.lessons.length + 1)
    expect(split.modules[0]!.lessons[0]!.blocks).toHaveLength(1)
    const oneBlock = { ...draft, modules: [{ ...module, lessons: [{ ...lesson, blocks: lesson.blocks.slice(0, 1) }] }, ...draft.modules.slice(1)] }
    expect(splitLesson(oneBlock, module.id, lesson.id, 1, 'A', 'B')).toEqual(oneBlock)
  })

  it('keeps regenerate as a proposal until Apply and only changes the selected item', () => {
    const selection = { type: 'module' as const, moduleId: draft.modules[0]!.id }
    const proposal = createRegenerateProposal(draft, selection, 'module_title')!
    expect(draft.modules[0]!.title).toBe(proposal.before)
    const applied = applyRegenerateProposal(draft, proposal, 'Tên đã xác nhận')
    expect(applied.modules[0]!.title).toBe('Tên đã xác nhận')
    expect(applied.modules[1]).toEqual(draft.modules[1])
  })

  it('supports undo and redo with a bounded session history', () => {
    const persist = vi.fn()
    const { result } = renderHook(() => useAiReviewHistory(draft, persist))
    act(() => result.current.commit({ ...draft, title: 'Tên mới' }))
    expect(result.current.draft.title).toBe('Tên mới')
    act(() => result.current.undo())
    expect(result.current.draft.title).toBe(draft.title)
    act(() => result.current.redo())
    expect(result.current.draft.title).toBe('Tên mới')
  })

  it('resolves, dismisses with reason and restores warnings', () => {
    const warningId = draft.warnings[0]!.id
    expect(resolveWarning(draft, warningId).warnings[0]!.resolution).toBe('resolved')
    const dismissed = dismissWarning(draft, warningId, 'Nội dung vẫn phù hợp')
    expect(dismissed.warnings[0]).toMatchObject({ resolution: 'dismissed', dismissReason: 'Nội dung vẫn phù hợp' })
    expect(restoreWarning(dismissed, warningId).warnings[0]).toMatchObject({ resolution: 'open', reviewed: false })
  })

  it('calculates review progress, rule-based health and approval checklist from data', () => {
    const service = new AiCourseService(new MemoryStorage())
    let reviewed = markReviewStatus(draft, { type: 'course' }, 'reviewed')
    reviewed.modules.forEach((module) => { reviewed = markReviewStatus(reviewed, { type: 'module', moduleId: module.id }, 'reviewed'); module.lessons.forEach((lesson) => { reviewed = markReviewStatus(reviewed, { type: 'lesson', moduleId: module.id, lessonId: lesson.id }, 'reviewed') }) })
    reviewed = { ...reviewed, review: { ...reviewed.review!, previewOpened: true }, warnings: reviewed.warnings.map((warning) => ({ ...warning, reviewed: true, resolution: 'resolved' })) }
    const validation = service.validateCourseDraft(reviewed)
    expect(calculateReviewProgress(reviewed)).toMatchObject({ modulesReviewed: reviewed.modules.length, lessonsReviewed: reviewed.modules.flatMap((module) => module.lessons).length, unresolvedWarnings: 0 })
    expect(calculateDraftHealth(reviewed, validation)).toHaveLength(6)
    expect(getApprovalChecklist(reviewed, validation).every((item) => item.complete)).toBe(true)
  })
})
