import { Link } from 'react-router-dom'

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return <Link to="/" className={`brand-logo${compact ? ' compact' : ''}`} aria-label="F.Studio Learning Hub - Trang chủ"><img src="/favicon.svg" alt="" width="42" height="42" /><span><strong>F.Studio</strong><small>Learning Hub</small></span></Link>
}
