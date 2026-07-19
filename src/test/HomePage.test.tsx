import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ContentProvider } from '../context/ContentContext'
import { LearningProgressProvider } from '../context/LearningProgressContext'
import { HomePage } from '../pages/user/HomePage'
import { contentService } from '../services/contentService'

function renderHome() {
  return render(<ContentProvider><LearningProgressProvider><MemoryRouter><HomePage /></MemoryRouter></LearningProgressProvider></ContentProvider>)
}

describe('Employee learning journey dashboard', () => {
  beforeEach(() => {
    localStorage.clear()
    contentService.reset()
  })
  afterEach(cleanup)

  it('puts the next learning action first and keeps a single primary continue CTA', () => {
    renderHome()
    expect(screen.getByRole('heading', { level: 1, name: 'Nhu cầu học tập phổ biến' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Tiếp tục học/ })).toHaveAttribute('href', '/learn/mac-back-to-school/lesson-needs')
    expect(screen.getAllByRole('link', { name: /Tiếp tục học/ })).toHaveLength(1)
    expect(screen.getByText('Còn khoảng 1 giờ 38 phút')).toBeInTheDocument()
  })

  it('shows the five agreed dashboard sections with progress derived from required lessons', () => {
    renderHome()
    expect(screen.getByRole('heading', { name: 'Học hôm nay' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Mới xuất bản' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Thành tích' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tiến độ học tập của tôi' })).toBeInTheDocument()
    expect(screen.getByText('0 trên 7 bài bắt buộc đã hoàn thành')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Tiến độ tổng' })).toHaveAttribute('aria-valuenow', '0')
  })
})
