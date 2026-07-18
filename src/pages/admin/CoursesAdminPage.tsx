import { BookOpen, Edit3, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useContent } from '../../context/ContentContext'
import { contentService } from '../../services/contentService'

export function CoursesAdminPage() {
  const { store, refresh, warning } = useContent(); const courses = contentService.getCourses('trainer')
  return <section><div className="admin-page-heading"><div><span className="overline">Content CMS MVP</span><h1>Khóa học tương tác</h1><p>{courses.length} khóa học · {courses.filter((course) => course.publishStatus === 'published').length} published</p></div><Link className="button button-primary" to="/admin/courses/new"><Plus />Tạo khóa học</Link></div>{warning && <div className="cms-warning" role="alert">{warning}<button onClick={() => { contentService.clearWarning(); refresh() }}>Đóng</button></div>}<div className="cms-course-grid">{courses.map((course) => <article className="cms-course-card" key={course.id} style={{ '--course-accent': course.accentColor } as React.CSSProperties}><span className={`badge ${course.publishStatus === 'published' ? 'badge-success' : 'badge-warning'}`}>{course.publishStatus}</span><BookOpen /><h2>{course.title}</h2><p>{course.modules.length} modules · {course.modules.flatMap((module) => module.lessons).length} lessons · {course.quiz.questions.length} quiz questions</p><Link className="button button-secondary" to={`/admin/courses/${course.id}/edit`}><Edit3 />Mở Course Builder</Link></article>)}</div>{!store.courses.length && <p>Chưa có khóa học. Hãy tạo khóa đầu tiên.</p>}</section>
}
