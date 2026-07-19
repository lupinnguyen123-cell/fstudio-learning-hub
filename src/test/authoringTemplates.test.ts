import { describe, expect, it } from 'vitest'
import { courseCatalog } from '../data/courses'
import { courseTemplates, createCourseTemplateModules, createLessonTemplateBlocks, createLibraryBlock, getAuthoringChecklist, isAuthoringReady } from '../data/authoringTemplates'
import { createCourse } from '../services/contentService'

describe('content authoring templates', () => {
  it('creates editable module and lesson structures for every course template', () => {
    expect(courseTemplates.map((template) => template.name)).toEqual(['Product Training', 'Sales Training', 'Campaign Training', 'SOP', 'Soft Skills'])
    courseTemplates.forEach((template) => {
      const first = createCourseTemplateModules(template.id)
      const second = createCourseTemplateModules(template.id)
      expect(first.modules.length).toBeGreaterThan(0)
      expect(first.modules.every((module) => module.lessons.length > 0)).toBe(true)
      expect(first.modules[0]?.id).not.toBe(second.modules[0]?.id)
      expect(first.modules[0]?.lessons[0]?.id).not.toBe(second.modules[0]?.lessons[0]?.id)
    })
  })

  it('creates the six-part lesson template with fresh block IDs', () => {
    const blocks = createLessonTemplateBlocks()
    expect(blocks).toHaveLength(6)
    expect(blocks.map((block) => block.type)).toEqual(['heading', 'key_point', 'quote', 'key_point', 'bullet_list', 'checklist'])
    expect(new Set(blocks.map((block) => block.id)).size).toBe(6)
    expect(createLessonTemplateBlocks()[0]?.id).not.toBe(blocks[0]?.id)
  })

  it('maps the primary block library without changing the lesson schema', () => {
    expect(createLibraryBlock('knowledge').type).toBe('key_point')
    expect(createLibraryBlock('quiz').type).toBe('quick_question')
    expect(createLibraryBlock('tip').type).toBe('key_point')
    expect(createLibraryBlock('scenario').type).toBe('scenario')
  })

  it('uses all seven production publish checklist requirements', () => {
    const labels = getAuthoringChecklist(structuredClone(courseCatalog[0])).map((item) => item.label)
    expect(labels).toEqual(['Thumbnail', 'Description', 'Lesson', 'Quiz', 'XP', 'Badge', 'Estimated Duration'])
    expect(isAuthoringReady(structuredClone(courseCatalog[0]))).toBe(true)
    expect(isAuthoringReady(createCourse())).toBe(false)
  })
})
