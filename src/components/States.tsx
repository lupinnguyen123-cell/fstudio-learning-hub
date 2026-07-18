import { AlertCircle, BookOpen, LoaderCircle } from 'lucide-react'

export function LoadingState({ label = 'Đang tải nội dung...' }: { label?: string }) { return <div className="state-card" role="status" aria-live="polite"><LoaderCircle className="spin" aria-hidden="true" /><p>{label}</p></div> }
export function EmptyState({ title = 'Chưa có nội dung', description = 'Nội dung mới sẽ sớm được cập nhật.' }: { title?: string; description?: string }) { return <div className="state-card"><BookOpen /><h3>{title}</h3><p>{description}</p></div> }
export function ErrorState({ message = 'Không thể tải nội dung. Vui lòng thử lại sau.' }: { message?: string }) { return <div className="state-card" role="alert"><AlertCircle /><h3>Đã xảy ra lỗi</h3><p>{message}</p></div> }
