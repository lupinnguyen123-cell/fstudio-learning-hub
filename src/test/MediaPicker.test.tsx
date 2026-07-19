import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MediaPicker } from '../components/admin/MediaPicker'

describe('MediaPicker', () => {
  afterEach(cleanup)

  it('searches image assets by tag and inserts the selected asset', () => {
    const onSelect = vi.fn()
    render(<MediaPicker onSelect={onSelect} onClose={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Tìm theo tên, category hoặc tag'), { target: { value: 'mac' } })
    fireEvent.click(screen.getByRole('button', { name: /Không gian học tập/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Xong · Chèn asset' }))
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'image-learning-hero', kind: 'image' }))
  })

  it('filters recent PDF assets and exposes open and download actions', () => {
    render(<MediaPicker initialKind="pdf" onSelect={vi.fn()} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Recent' }))
    fireEvent.click(screen.getByRole('button', { name: /Hướng dẫn đào tạo pilot/ }))
    expect(screen.getByRole('link', { name: 'Mở' })).toHaveAttribute('target', '_blank')
    expect(screen.getByRole('link', { name: /Tải xuống/ })).toHaveAttribute('download')
  })

  it('closes without selecting an asset', () => {
    const onClose = vi.fn()
    render(<MediaPicker onSelect={vi.fn()} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
