import type { CourseStatus } from '../types'

export const formatDuration = (minutes: number) => minutes >= 60 ? `${Math.floor(minutes / 60)} giờ ${minutes % 60 ? `${minutes % 60} phút` : ''}`.trim() : `${minutes} phút`

export const statusLabel: Record<CourseStatus, string> = {
  'not-started': 'Chưa học',
  'in-progress': 'Đang học',
  completed: 'Hoàn thành',
}
