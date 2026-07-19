import { BookOpen, Copy, Edit3, Plus, Trash2 } from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { useContent } from '../../context/ContentContext'
import { contentService } from '../../services/contentService'

export function CoursesAdminPage() {
  const { store, refresh, warning } = useContent()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const courses = store.courses
  const deletingCourse = courses.find((course) => course.id === deletingId)
  return <section><ConfirmDialog open={Boolean(deletingCourse)} title="Xóa khóa học?" description={`“${deletingCourse?.title ?? ''}” và toàn bộ nội dung bên trong sẽ bị xóa khỏi trình duyệt.`} onCancel={() => setDeletingId(null)} onConfirm={() => { if (deletingId) contentService.deleteCourse(deletingId); setDeletingId(null); refresh() }} /><div className="admin-page-heading"><div><span className="ui-eyebrow">Content CMS MVP</span><h1>Khóa học tương tác</h1><p>{courses.length} khóa học · {courses.filter((course) => course.publishStatus === 'published').length} published</p></div><Link className="button button-primary" to="/admin/courses/new"><Plus />Tạo khóa học</Link></div>{warning && <div className="cms-warning" role="alert">{warning}<button onClick={() => { contentService.clearWarning(); refresh() }}>Đóng</button></div>}{courses.length ? <div className="cms-course-grid">{courses.map((course) => <article className="cms-course-card" key={course.id} style={{ '--course-accent': course.accentColor } as CSSProperties}><span className={`badge ${course.publishStatus === 'published' ? 'badge-success' : 'badge-warning'}`}>{course.publishStatus}</span><BookOpen /><h2>{course.title}</h2><p>{course.modules.length} modules · {course.modules.flatMap((module) => module.lessons).length} lessons · {course.quiz.questions.length} quiz questions</p><small>Cập nhật {new Date(course.updatedAt).toLocaleString('vi-VN')}</small><div className="course-card-actions"><Link className="button button-secondary" to={`/admin/courses/${course.id}/edit`}><Edit3 />Mở Builder</Link><button className="button button-secondary" onClick={() => { contentService.duplicateCourse(course.id); refresh() }}><Copy />Nhân bản</button><button className="icon-button danger" aria-label={`Xóa ${course.title}`} onClick={() => setDeletingId(course.id)}><Trash2 /></button></div></article>)}</div> : <div className="empty-product-state"><BookOpen /><h2>Chưa có khóa học</h2><p>Tạo khóa học đầu tiên để bắt đầu pilot.</p><Link className="button button-primary" to="/admin/courses/new"><Plus />Tạo khóa học</Link></div>}</section>
}
