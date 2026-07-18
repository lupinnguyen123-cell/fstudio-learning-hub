import { ArrowRight, BookOpenCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Course } from '../types'
import { ProgressBar } from './ProgressBar'

export function HeroBanner({ name, course, continuePath }: { name: string; course?: Course; continuePath: string }) {
  return <section className="dashboard-hero"><div className="dashboard-hero-copy"><span className="dashboard-kicker"><Sparkles /> Học tập hôm nay</span><h1>Chào mừng bạn trở lại, {name}!</h1><p>Mỗi bài học ngắn là một bước giúp bạn tư vấn tự tin và tạo trải nghiệm tốt hơn cho khách hàng.</p><Link className="button button-primary" to={continuePath}>Tiếp tục học <ArrowRight /></Link></div><div className="hero-visual" aria-label="Tóm tắt tiến độ"><span className="hero-visual-icon"><BookOpenCheck /></span><div><small>{course ? 'Khóa học gần nhất' : 'Sẵn sàng bắt đầu'}</small><strong>{course?.title ?? 'Khám phá khóa học đầu tiên'}</strong></div>{course && <ProgressBar value={course.progress} label="Tiến độ" />}</div></section>
}
