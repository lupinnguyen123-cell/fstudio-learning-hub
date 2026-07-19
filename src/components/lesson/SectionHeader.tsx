interface SectionHeaderProps {
  eyebrow?: string
  title: string
  level?: 2 | 3
  description?: string
}

export function SectionHeader({ eyebrow = 'Kiến thức chính', title, level = 2, description }: SectionHeaderProps) {
  const Heading = level === 2 ? 'h2' : 'h3'

  return (
    <header className="lesson-section-header">
      <span>{eyebrow}</span>
      <Heading>{title}</Heading>
      {description && <p>{description}</p>}
    </header>
  )
}
