import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AdvancedAiReviewWorkspace } from '../features/ai-authoring/AdvancedAiReviewWorkspace'
import { normalizeReviewDraft } from '../features/ai-authoring/aiReviewActions'
import { AiCourseService } from '../services/aiCourseService'
import type { StorageLike } from '../services/contentService'

class MemoryStorage implements StorageLike {
  private data = new Map<string, string>()
  getItem(key: string) { return this.data.get(key) ?? null }
  setItem(key: string, value: string) { this.data.set(key, value) }
  removeItem(key: string) { this.data.delete(key) }
}

const createDraft = () => {
  const service = new AiCourseService(new MemoryStorage())
  const source = service.analyzeSource({ name: 'sales.md', size: 1000, type: 'text/markdown' } as File, 'sales price product feature process').source
  return normalizeReviewDraft(service.generateCourseDraft(source, 'sales'))
}

describe('Advanced AI Review Workspace safety', () => {
  beforeEach(() => { localStorage.clear() })
  afterEach(() => { vi.useRealTimers(); cleanup() })

  it('opens isolated preview without creating learning progress, XP or a production course', () => {
    const draft = createDraft()
    localStorage.setItem('learning-progress-sentinel', 'unchanged')
    localStorage.setItem('xp-sentinel', 'unchanged')
    const beforeContent = localStorage.getItem('fstudio_learning_content')
    render(<AdvancedAiReviewWorkspace initialDraft={draft} onApprove={vi.fn()} onDiscard={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Preview AI Draft/ }))
    expect(screen.getByRole('dialog', { name: draft.title })).toHaveTextContent('chưa được tạo thành khóa học')
    expect(localStorage.getItem('learning-progress-sentinel')).toBe('unchanged')
    expect(localStorage.getItem('xp-sentinel')).toBe('unchanged')
    expect(localStorage.getItem('fstudio_learning_content')).toBe(beforeContent)
  })

  it('blocks approval while validation errors remain', () => {
    const invalid = { ...createDraft(), title: '' }
    render(<AdvancedAiReviewWorkspace initialDraft={invalid} onApprove={vi.fn()} onDiscard={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Approve & tạo Course/ })).toBeDisabled()
  })
})
