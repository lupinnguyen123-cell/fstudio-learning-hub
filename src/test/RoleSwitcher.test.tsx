import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { FormEvent } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RoleSwitcher } from '../components/RoleSwitcher'
import { RoleProvider, useRole } from '../hooks/useRole'

function CurrentState() {
  const { role } = useRole()
  const location = useLocation()
  return <output>{`${role}:${location.pathname}`}</output>
}

function renderSwitcher(initialPath = '/') {
  return render(
    <RoleProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <RoleSwitcher />
        <CurrentState />
        <Routes>
          <Route path="*" element={null} />
        </Routes>
      </MemoryRouter>
    </RoleProvider>,
  )
}

describe('RoleSwitcher', () => {
  beforeEach(() => localStorage.clear())
  afterEach(cleanup)

  it('switches Employee to Trainer, persists the role and opens an admin route', () => {
    renderSwitcher('/')
    fireEvent.change(screen.getByRole('combobox', { name: 'Vai trò mô phỏng' }), { target: { value: 'trainer' } })
    expect(screen.getByText('trainer:/admin/courses')).toBeInTheDocument()
    expect(localStorage.getItem('fstudio-learning-role')).toBe('trainer')
  })

  it('switches Trainer to Employee, persists the role and opens Employee Home', () => {
    localStorage.setItem('fstudio-learning-role', 'trainer')
    renderSwitcher('/admin/courses/course-1/edit')
    fireEvent.change(screen.getByRole('combobox', { name: 'Vai trò mô phỏng' }), { target: { value: 'employee' } })
    expect(screen.getByText('employee:/')).toBeInTheDocument()
    expect(localStorage.getItem('fstudio-learning-role')).toBe('employee')
  })

  it('restores the persisted role on reload', () => {
    localStorage.setItem('fstudio-learning-role', 'trainer')
    renderSwitcher('/admin/courses')
    expect(screen.getByText('trainer:/admin/courses')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveValue('trainer')
  })

  it('does not submit a surrounding form when the role changes', () => {
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault())
    render(
      <RoleProvider>
        <MemoryRouter>
          <form onSubmit={onSubmit}><RoleSwitcher /></form>
        </MemoryRouter>
      </RoleProvider>,
    )
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'trainer' } })
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
