import { LayoutTemplate } from 'lucide-react'

export function LessonTemplateAction({ hasBlocks, onApply }: { hasBlocks: boolean; onApply(): void }) {
  return <button type="button" className="button button-secondary lesson-template-action" onClick={onApply}><LayoutTemplate />{hasBlocks ? 'Thêm cấu trúc mẫu' : 'Áp dụng Lesson Template'}</button>
}
