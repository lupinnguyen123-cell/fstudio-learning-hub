import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AiCourseWorkspacePage } from '../pages/admin/AiCourseWorkspacePage'
import { contentService } from '../services/contentService'

describe('AI Course Workspace approve flow', () => {
  beforeEach(() => { localStorage.clear(); contentService.reset(); vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers(); cleanup() })

  it('creates a draft course and navigates to the existing Course Editor route', async () => {
    render(<MemoryRouter initialEntries={['/admin/ai-course']}><Routes><Route path="/admin/ai-course" element={<AiCourseWorkspacePage />} /><Route path="/admin/courses/:courseId/edit" element={<div>Existing Course Editor</div>} /></Routes></MemoryRouter>)
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')
    expect(input).not.toBeNull()
    fireEvent.change(input!, { target: { files: [new File(['mock'], 'product-training.md', { type: 'text/markdown' })] } })
    fireEvent.click(screen.getByRole('button', { name: /Tạo bản nháp AI/ }))
    for (let index = 0; index < 6; index += 1) await act(async () => { await vi.advanceTimersByTimeAsync(600) })
    expect(screen.getByRole('textbox', { name: 'Tên course' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Approve & tạo Course/ }))
    await act(async () => { await vi.advanceTimersByTimeAsync(700) })
    expect(screen.getByText('Existing Course Editor')).toBeInTheDocument()
    const created = contentService.getStore().courses.find((course) => course.category === 'Product Training')
    expect(created?.publishStatus).toBe('draft')
  })
})
