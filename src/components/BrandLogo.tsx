import { Link } from 'react-router-dom'

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return <Link to="/" className={`brand-logo${compact ? ' compact' : ''}`} aria-label="F.Studio Learning Hub - Trang chủ"><img src="/fstudio-logo.png" alt="F.Studio by FPT" width="1800" height="318" /></Link>
}
