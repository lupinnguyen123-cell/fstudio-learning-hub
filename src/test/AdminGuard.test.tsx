import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AdminGuard } from '../app/AdminGuard'
import { EmployeeGuard } from '../app/EmployeeGuard'
import { RoleProvider } from '../hooks/useRole'

function renderGuard(role: 'employee' | 'trainer') { localStorage.setItem('fstudio-learning-role', role); return render(<RoleProvider><MemoryRouter initialEntries={['/admin']}><Routes><Route element={<AdminGuard />}><Route path="/admin" element={<div>Admin content</div>} /></Route><Route path="/" element={<div>Employee content</div>} /></Routes></MemoryRouter></RoleProvider>) }
afterEach(cleanup)
describe('AdminGuard', () => { beforeEach(() => localStorage.clear()); it('safely redirects employee to Employee Home', () => { renderGuard('employee'); expect(screen.getByText('Employee content')).toBeInTheDocument() }); it('allows trainer', () => { renderGuard('trainer'); expect(screen.getByText('Admin content')).toBeInTheDocument() }) })

describe('EmployeeGuard', () => {
  beforeEach(() => localStorage.clear())

  it('allows employee without redirecting', () => {
    localStorage.setItem('fstudio-learning-role', 'employee')
    render(<RoleProvider><MemoryRouter initialEntries={['/']}><Routes><Route element={<EmployeeGuard />}><Route path="/" element={<div>Employee content</div>} /></Route><Route path="/admin/courses" element={<div>Admin content</div>} /></Routes></MemoryRouter></RoleProvider>)
    expect(screen.getByText('Employee content')).toBeInTheDocument()
  })

  it('redirects a persisted trainer role to admin without a loop', () => {
    localStorage.setItem('fstudio-learning-role', 'trainer')
    render(<RoleProvider><MemoryRouter initialEntries={['/']}><Routes><Route element={<EmployeeGuard />}><Route path="/" element={<div>Employee content</div>} /></Route><Route path="/admin/courses" element={<div>Admin content</div>} /></Routes></MemoryRouter></RoleProvider>)
    expect(screen.getByText('Admin content')).toBeInTheDocument()
    expect(screen.queryByText('Employee content')).not.toBeInTheDocument()
  })
})
