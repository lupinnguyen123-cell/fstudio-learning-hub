import { describe, expect, it } from 'vitest'
import { ContentService, CONTENT_STORAGE_KEY, createBlock, createCourse, createLesson, createModule, type StorageLike } from '../services/contentService'
import { createDefaultProgress, rewardLessonCompletion, rewardQuizPass } from '../services/progressService'
import { gradeQuiz } from '../utils/quiz'

function memoryStorage(seed?: string): StorageLike { const values = new Map<string, string>(); if (seed !== undefined) values.set(CONTENT_STORAGE_KEY, seed); return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value) }, removeItem: (key) => { values.delete(key) } } }

describe('ContentService CMS MVP', () => {
  it('creates a course, module, lesson and block then publishes it', () => {
    const service = new ContentService(memoryStorage()); const course = createCourse('Pilot'); const module = createModule('Module 1'); const lesson = createLesson('Lesson 1'); lesson.blocks.push(createBlock('paragraph')); module.lessons.push(lesson); course.modules.push(module)
    service.addCourse(course); service.setPublishStatus(course.id, 'published')
    expect(service.getCourse(course.id, 'trainer')?.modules[0].lessons[0].blocks).toHaveLength(1)
    expect(service.getCourses('employee').some((item) => item.id === course.id)).toBe(true)
  })
  it('keeps draft courses hidden from employees', () => { const service = new ContentService(memoryStorage()); const course = createCourse('Draft only'); service.addCourse(course); expect(service.getCourses('employee').some((item) => item.id === course.id)).toBe(false); expect(service.getCourses('trainer').some((item) => item.id === course.id)).toBe(true) })
  it('reorders blocks without data loss', () => { const first = createBlock('heading'); const second = createBlock('paragraph'); const reordered = [first, second]; [reordered[0], reordered[1]] = [reordered[1], reordered[0]]; expect(reordered.map((item) => item.id)).toEqual([second.id, first.id]) })
  it('exports and imports valid JSON', () => { const source = new ContentService(memoryStorage()); const course = createCourse('Export me'); source.addCourse(course); const target = new ContentService(memoryStorage()); target.importJson(source.exportCourse(course.id), 'overwrite'); expect(target.getCourse(course.id, 'trainer')?.title).toBe('Export me') })
  it('does not mutate content when import JSON is invalid', () => { const service = new ContentService(memoryStorage()); const before = service.exportAll(); expect(() => service.importJson('{broken', 'overwrite')).toThrow(); expect(service.exportAll()).toBe(before) })
  it('recovers from corrupted localStorage without crashing', () => { const service = new ContentService(memoryStorage('{broken')); expect(service.getCourses('employee')).toHaveLength(1); expect(service.getWarning()).toContain('Không thể đọc') })
})

describe('gamification', () => {
  it('awards lesson and completed-module XP only once', () => { const course = new ContentService(memoryStorage()).getCourses('employee')[0]; const base = { ...createDefaultProgress(), completedLessonIds: ['lesson-1'] }; const once = rewardLessonCompletion(base, course, 'lesson-1'); const twice = rewardLessonCompletion(once, course, 'lesson-1'); expect(twice.totalXp).toBe(course.modules[0].lessons[0].xpReward + course.modules[0].xpReward); expect(twice.earnedBadgeIds).toContain('badge-first-lesson') })
  it('awards quiz XP and badges only for a passing result', () => { const course = new ContentService(memoryStorage()).getCourses('employee')[0]; const answers = Object.fromEntries(course.quiz.questions.map((question) => [question.id, question.correctOptionIndex])); const result = gradeQuiz(course.id, course.quiz.questions, answers, 1); const rewarded = rewardQuizPass(createDefaultProgress(), course, result); expect(rewarded.totalXp).toBe(course.quiz.xpReward + course.gamification.courseCompletionXp); expect(rewarded.earnedBadgeIds).toEqual(expect.arrayContaining(['badge-quiz', 'badge-course'])) })
})
