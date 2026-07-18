import { GraduationCap } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Brand() {
  return <Link to="/" className="brand" aria-label="F.Studio Learning Hub - Trang chủ"><span className="brand-mark"><GraduationCap size={20} /></span><span><strong>F.Studio</strong><small>Learning Hub</small></span></Link>
}
