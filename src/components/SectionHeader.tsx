import type { ReactNode } from 'react'

export type SectionAccent = 'blue' | 'purple' | 'orange' | 'green' | 'pink'

export function SectionHeader({ eyebrow, title, description, accent = 'blue', action }: { eyebrow: string; title: string; description?: string; accent?: SectionAccent; action?: ReactNode }) {
  return <div className={`section-header section-header--${accent}`}><div><span className="section-header__eyebrow">{eyebrow}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>
}
