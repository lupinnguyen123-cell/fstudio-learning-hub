import pilotCover from '../assets/hero.png'
import type { Course, LessonBlock, User } from '../types'
import { courseCatalog as rawCourseCatalog, PILOT_COVER_ASSET } from './courseCatalog'

export { quizQuestions } from './courseCatalog'

const hydrateBlock = (block: LessonBlock): LessonBlock => block.type === 'image' && block.url === PILOT_COVER_ASSET ? { ...block, url: pilotCover } : block

// Frontend-only asset hydration. Server code must import courseCatalog.ts directly.
export const courseCatalog: Course[] = rawCourseCatalog.map((course) => ({
  ...course,
  coverUrl: course.coverUrl === PILOT_COVER_ASSET ? pilotCover : course.coverUrl,
  modules: course.modules.map((module) => ({ ...module, lessons: module.lessons.map((lesson) => ({ ...lesson, blocks: lesson.blocks.map(hydrateBlock) })) })),
}))

export const currentUser: User = { id: 'user-01', name: 'Minh Anh', role: 'employee', store: 'F.Studio Quận 1' }
