import type { ReactNode } from 'react'

export type BadgeVariant = 'purple' | 'blue' | 'orange' | 'green' | 'pink' | 'neutral' | 'success' | 'warning' | 'danger'

export function Badge({ children, variant = 'neutral', className = '' }: { children: ReactNode; variant?: BadgeVariant; className?: string }) {
  return <span className={`badge badge--${variant} ${className}`.trim()}>{children}</span>
}
