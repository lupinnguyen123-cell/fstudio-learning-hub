import { createBlock, createLesson, createModule, validateCourseForPublish } from '../services/contentService'
import type { Course, Lesson, LessonBlock, Module } from '../types'

export type CourseTemplateId = 'product' | 'sales' | 'campaign' | 'sop' | 'soft-skills'
export type BlockLibraryId = 'knowledge' | 'image' | 'video' | 'scenario' | 'quote' | 'flashcard' | 'quiz' | 'tip' | 'warning' | 'checklist'

export interface CourseTemplate {
  id: CourseTemplateId
  name: string
  description: string
  category: string
  modules: Array<{ title: string; lessons: string[] }>
}

export const courseTemplates: CourseTemplate[] = [
  { id: 'product', name: 'Product Training', description: 'Từ kiến thức sản phẩm đến tư vấn tại cửa hàng.', category: 'Product Training', modules: [{ title: 'Nền tảng sản phẩm', lessons: ['Tổng quan sản phẩm', 'Khách hàng phù hợp'] }, { title: 'Tính năng và lợi ích', lessons: ['Điểm nổi bật', 'So sánh và lựa chọn'] }, { title: 'Tư vấn tại cửa hàng', lessons: ['Kịch bản tư vấn sản phẩm'] }] },
  { id: 'sales', name: 'Sales Training', description: 'Chuẩn hóa hành trình khám phá nhu cầu và chốt tư vấn.', category: 'Sales Training', modules: [{ title: 'Chuẩn bị tư vấn', lessons: ['Mục tiêu cuộc tư vấn'] }, { title: 'Khám phá nhu cầu', lessons: ['Đặt câu hỏi hiệu quả', 'Xác nhận nhu cầu'] }, { title: 'Đề xuất giải pháp', lessons: ['Trình bày giá trị', 'Xử lý phản đối'] }, { title: 'Kết thúc tư vấn', lessons: ['Chốt bước tiếp theo'] }] },
  { id: 'campaign', name: 'Campaign Training', description: 'Giúp đội ngũ nắm chiến dịch và triển khai đồng nhất.', category: 'Campaign Training', modules: [{ title: 'Tổng quan chiến dịch', lessons: ['Mục tiêu và thông điệp', 'Đối tượng khách hàng'] }, { title: 'Sản phẩm và ưu đãi', lessons: ['Danh mục trọng tâm', 'Cơ chế ưu đãi'] }, { title: 'Triển khai tại cửa hàng', lessons: ['Kịch bản giới thiệu', 'Checklist triển khai'] }] },
  { id: 'sop', name: 'SOP', description: 'Biến quy trình vận hành thành các bước dễ thực hiện.', category: 'SOP', modules: [{ title: 'Tổng quan quy trình', lessons: ['Mục tiêu và phạm vi'] }, { title: 'Các bước thực hiện', lessons: ['Chuẩn bị', 'Thực hiện', 'Xử lý ngoại lệ'] }, { title: 'Kiểm tra hoàn tất', lessons: ['Checklist chất lượng'] }] },
  { id: 'soft-skills', name: 'Soft Skills', description: 'Học kỹ năng qua ví dụ, thực hành và phản tư.', category: 'Soft Skills', modules: [{ title: 'Nhận thức nền tảng', lessons: ['Vì sao kỹ năng này quan trọng'] }, { title: 'Kỹ thuật cốt lõi', lessons: ['Nguyên tắc thực hành', 'Ví dụ tại cửa hàng'] }, { title: 'Luyện tập', lessons: ['Tình huống thực tế', 'Kế hoạch áp dụng'] }] },
]

function lessonFromTitle(title: string): Lesson {
  return { ...createLesson(title), description: 'Mô tả mục tiêu của bài học này.' }
}

function moduleFromTemplate(template: CourseTemplate['modules'][number]): Module {
  return { ...createModule(template.title), description: 'Mô tả ngắn nội dung module.', lessons: template.lessons.map(lessonFromTitle) }
}

export function createCourseTemplateModules(templateId: CourseTemplateId): { category: string; modules: Module[] } {
  const template = courseTemplates.find((item) => item.id === templateId) ?? courseTemplates[0]
  return { category: template.category, modules: template.modules.map(moduleFromTemplate) }
}

export function createLessonTemplateBlocks(): LessonBlock[] {
  const focus = createBlock('heading'); if (focus.type === 'heading') focus.text = 'Learning Focus'
  const knowledge = createBlock('key_point'); if (knowledge.type === 'key_point') { knowledge.title = 'Knowledge'; knowledge.text = 'Nội dung kiến thức chính Trainer cần hoàn thiện.' }
  const example = createBlock('quote'); if (example.type === 'quote') { example.text = 'Example: thêm một ví dụ cụ thể từ tình huống tại cửa hàng.'; example.attribution = 'Ví dụ thực tế' }
  const tip = createBlock('key_point'); if (tip.type === 'key_point') { tip.title = 'Tip'; tip.text = 'Mẹo ngắn giúp nhân viên ghi nhớ và áp dụng.' }
  const summary = createBlock('bullet_list'); if (summary.type === 'bullet_list') { summary.title = 'Summary'; summary.items = ['Tóm tắt ý chính của bài học'] }
  const apply = createBlock('checklist'); if (apply.type === 'checklist') { apply.title = 'Apply at Store'; apply.items = [{ ...apply.items[0], text: 'Thực hành nội dung này tại cửa hàng' }] }
  return [focus, knowledge, example, tip, summary, apply]
}

export function createLibraryBlock(id: BlockLibraryId): LessonBlock {
  if (id === 'knowledge') { const block = createBlock('key_point'); if (block.type === 'key_point') block.title = 'Knowledge'; return block }
  if (id === 'tip') { const block = createBlock('key_point'); if (block.type === 'key_point') block.title = 'Tip'; return block }
  if (id === 'quiz') return createBlock('quick_question')
  return createBlock(id)
}

export interface AuthoringChecklistItem { id: string; label: string; complete: boolean; tab: 'settings' | 'structure' | 'lesson' | 'quiz' | 'rewards' }

export function getAuthoringChecklist(course: Course): AuthoringChecklistItem[] {
  const lessons = course.modules.flatMap((module) => module.lessons)
  const quizReady = course.quiz.questions.length > 0 && !validateCourseForPublish(course).some((issue) => issue.tab === 'quiz')
  return [
    { id: 'thumbnail', label: 'Thumbnail', complete: Boolean(course.coverUrl.trim()), tab: 'settings' },
    { id: 'description', label: 'Description', complete: Boolean(course.description.trim()), tab: 'settings' },
    { id: 'lesson', label: 'Lesson', complete: course.modules.length > 0 && lessons.length > 0 && lessons.every((lesson) => lesson.blocks.length > 0), tab: 'lesson' },
    { id: 'quiz', label: 'Quiz', complete: quizReady, tab: 'quiz' },
    { id: 'xp', label: 'XP', complete: course.gamification.courseCompletionXp > 0 || course.quiz.xpReward > 0 || lessons.some((lesson) => lesson.xpReward > 0), tab: 'rewards' },
    { id: 'badge', label: 'Badge', complete: course.gamification.badges.length > 0 && course.gamification.badges.every((badge) => badge.name.trim() && badge.description.trim()), tab: 'rewards' },
    { id: 'duration', label: 'Estimated Duration', complete: Number.isFinite(course.durationMinutes) && course.durationMinutes > 0, tab: 'settings' },
  ]
}

export function isAuthoringReady(course: Course): boolean {
  return getAuthoringChecklist(course).every((item) => item.complete) && validateCourseForPublish(course).length === 0
}
