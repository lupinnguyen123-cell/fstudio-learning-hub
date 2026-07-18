import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AdminGuard } from '../app/AdminGuard'
import { RoleProvider } from '../hooks/useRole'

function renderGuard(role: 'employee' | 'trainer') { localStorage.setItem('fstudio-learning-role', role); return render(<RoleProvider><MemoryRouter initialEntries={['/admin']}><Routes><Route element={<AdminGuard />}><Route path="/admin" element={<div>Admin content</div>} /></Route><Route path="/unauthorized" element={<div>Unauthorized</div>} /></Routes></MemoryRouter></RoleProvider>) }
describe('AdminGuard', () => { beforeEach(() => localStorage.clear()); it('blocks employee', () => { renderGuard('employee'); expect(screen.getByText('Unauthorized')).toBeInTheDocument() }); it('allows trainer', () => { renderGuard('trainer'); expect(screen.getByText('Admin content')).toBeInTheDocument() }) })
