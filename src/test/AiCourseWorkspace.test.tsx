import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AiCourseWorkspacePage } from '../pages/admin/AiCourseWorkspacePage'
import { contentService } from '../services/contentService'
import { aiCourseService, AI_DRAFT_STORAGE_KEY } from '../services/aiCourseService'
import { normalizeReviewDraft } from '../features/ai-authoring/aiReviewActions'

describe('AI Course Workspace approve flow', () => {
  beforeEach(() => { localStorage.clear(); contentService.reset(); vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers(); cleanup() })

  it('creates a draft course and navigates to the existing Course Editor route', async () => {
    const source = aiCourseService.analyzeSource(new File(['mock'], 'product-training.md', { type: 'text/markdown' })).source
    let ready = normalizeReviewDraft(aiCourseService.generateCourseDraft(source, 'product'))
    ready = { ...ready, review: { courseTitle: 'reviewed', courseDescription: 'reviewed', learningObjectives: 'reviewed', previewOpened: true }, warnings: ready.warnings.map((warning) => ({ ...warning, reviewed: true, resolution: 'resolved' })), modules: ready.modules.map((module) => ({ ...module, reviewStatus: 'reviewed', lessons: module.lessons.map((lesson) => ({ ...lesson, reviewStatus: 'reviewed' })) })) }
    aiCourseService.saveDraft(ready)
    render(<MemoryRouter initialEntries={['/admin/ai-course']}><Routes><Route path="/admin/ai-course" element={<AiCourseWorkspacePage />} /><Route path="/admin/courses/:courseId/edit" element={<div>Existing Course Editor</div>} /></Routes></MemoryRouter>)
    expect(screen.getByText('Advanced Review')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Approve & tạo Course/ }))
    await act(async () => { await vi.advanceTimersByTimeAsync(700) })
    expect(screen.getByText('Existing Course Editor')).toBeInTheDocument()
    const created = contentService.getStore().courses.find((course) => course.category === 'Product Training')
    expect(created?.publishStatus).toBe('draft')
    const saved = JSON.parse(localStorage.getItem(AI_DRAFT_STORAGE_KEY) ?? '{}') as { drafts?: Array<{ id: string; status: string }> }
    expect(saved.drafts?.find((draft) => draft.id === ready.id)?.status).toBe('approved')
  })
})
