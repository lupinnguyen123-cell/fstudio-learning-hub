import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
export function NotFoundPage() { return <section className="system-page"><Compass /><span className="error-code">404</span><h1>Không tìm thấy trang</h1><p>Đường dẫn có thể đã thay đổi hoặc nội dung chưa tồn tại.</p><Link className="button button-primary" to="/">Về trang chủ</Link></section> }
