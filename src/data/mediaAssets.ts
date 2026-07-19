import fstudioLogo from '../assets/brand/fstudio-logo.png'
import learningHero from '../assets/hero.png'
import type { MediaAsset } from '../types/media'

const trainingGuide = 'data:application/pdf;charset=utf-8,%25PDF-1.4%0A%25%20F.Studio%20Training%20Guide%20mock%20asset'
const consultationChecklist = 'data:text/plain;charset=utf-8,F.Studio%20Learning%20Hub%0AChecklist%20tu%20van%20tai%20cua%20hang'

export const mediaAssets: MediaAsset[] = [
  { id: 'image-learning-hero', kind: 'image', name: 'Không gian học tập', category: 'Learning', tags: ['hero', 'học tập', 'mac'], url: learningHero, description: 'Hình minh họa học tập dùng trong khóa pilot.', recent: true },
  { id: 'image-fstudio-brand', kind: 'image', name: 'F.Studio by FPT', category: 'Brand', tags: ['logo', 'fstudio', 'brand'], url: fstudioLogo, description: 'Logo thương hiệu chính thức trên nền sáng.', recent: false },
  { id: 'video-macbook-air', kind: 'video', name: 'Giới thiệu MacBook Air', category: 'Product', tags: ['mac', 'macbook air', 'video'], url: 'https://www.youtube.com/watch?v=0pg_Y41waaE', thumbnailUrl: 'https://i.ytimg.com/vi/0pg_Y41waaE/hqdefault.jpg', durationMinutes: 2, provider: 'youtube', description: 'Video tham khảo cho nội dung tư vấn sản phẩm.', recent: true },
  { id: 'video-consultation', kind: 'video', name: 'Kỹ thuật khám phá nhu cầu', category: 'Sales', tags: ['sales', 'tư vấn', 'video'], url: 'https://www.youtube.com/watch?v=0pg_Y41waaE', thumbnailUrl: 'https://i.ytimg.com/vi/0pg_Y41waaE/hqdefault.jpg', durationMinutes: 4, provider: 'youtube', description: 'Video mock phục vụ thiết kế lesson bán hàng.', recent: false },
  { id: 'pdf-training-guide', kind: 'pdf', name: 'Hướng dẫn đào tạo pilot', category: 'Training', tags: ['pdf', 'hướng dẫn', 'pilot'], url: trainingGuide, description: 'Tài liệu PDF mock dùng để kiểm thử luồng chọn tài liệu.', recent: true },
  { id: 'download-consultation-checklist', kind: 'download', name: 'Checklist tư vấn tại cửa hàng', category: 'Sales', tags: ['checklist', 'download', 'tư vấn'], url: consultationChecklist, description: 'Tệp tải xuống mock cho Trainer.', recent: false },
]

export const mediaCategories = [...new Set(mediaAssets.map((asset) => asset.category))].sort()
