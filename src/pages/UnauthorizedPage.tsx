import { LockKeyhole } from 'lucide-react'
import { Link } from 'react-router-dom'
export function UnauthorizedPage() { return <section className="system-page"><LockKeyhole /><span className="overline">Quyền truy cập</span><h1>Khu vực dành cho Trainer</h1><p>Vai trò Nhân viên không thể truy cập trang quản trị. Đây là route guard mô phỏng ở frontend, không phải cơ chế bảo mật thật.</p><Link className="button button-primary" to="/">Về trang chủ</Link></section> }
