import { Link } from 'react-router-dom'
import fstudioLogo from "../assets/brand/fstudio-logo.png";

type BrandLogoVariant = 'sidebar' | 'header'

export function BrandLogo({ variant = 'sidebar', className }: { variant?: BrandLogoVariant; className?: string }) {
  return <Link to="/" className={`brand-logo-frame brand-logo-frame--${variant}`} aria-label="F.Studio Learning Hub - Trang chủ"><img src={fstudioLogo} alt="F.Studio by FPT" className={`brand-logo brand-logo--${variant} ${className ?? ""}`} /></Link>
}
