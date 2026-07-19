import { BookOpen, BriefcaseBusiness, Megaphone, PackageSearch, Sparkles } from 'lucide-react'
import { courseTemplates, type CourseTemplateId } from '../../data/authoringTemplates'

const icons = { product: PackageSearch, sales: BriefcaseBusiness, campaign: Megaphone, sop: BookOpen, 'soft-skills': Sparkles }

export function CourseTemplatePicker({ onSelect }: { onSelect(templateId: CourseTemplateId): void }) {
  return (
    <section className="course-template-picker" aria-labelledby="course-template-title">
      <div><span className="ui-eyebrow">Bắt đầu nhanh</span><h2 id="course-template-title">Chọn Course Template</h2><p>Tạo sẵn module và lesson; bạn vẫn có thể chỉnh sửa toàn bộ nội dung.</p></div>
      <div className="course-template-grid">
        {courseTemplates.map((template) => {
          const Icon = icons[template.id]
          return <button type="button" key={template.id} onClick={() => onSelect(template.id)}><Icon /><strong>{template.name}</strong><small>{template.description}</small><span>{template.modules.length} module</span></button>
        })}
      </div>
    </section>
  )
}
