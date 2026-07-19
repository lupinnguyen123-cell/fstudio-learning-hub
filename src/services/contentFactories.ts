import type { Course, Lesson, Module } from '../types'

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

export function createCourse(title = 'Khóa học mới'): Course {
  const timestamp = new Date().toISOString()
  return { id: uid('course'), title, description: '', detailedDescription: '', audience: 'Nhân viên bán lẻ', category: 'Đào tạo nội bộ', durationMinutes: 30, level: 'Cơ bản', objectives: [], modules: [], publishStatus: 'draft', coverUrl: '', accentColor: '#2563eb', quiz: { id: uid('quiz'), passScore: 80, questions: [], xpReward: 100 }, gamification: { courseCompletionXp: 100, completionMessage: 'Chúc mừng bạn đã hoàn thành khóa học!', badges: [] }, status: 'not-started', progress: 0, createdAt: timestamp, updatedAt: timestamp }
}

export function createModule(title = 'Module mới'): Module { return { id: uid('module'), title, description: '', xpReward: 20, lessons: [] } }
export function createLesson(title = 'Bài học mới'): Lesson { return { id: uid('lesson'), title, description: '', kind: 'content', durationMinutes: 10, required: true, xpReward: 50, blocks: [] } }
