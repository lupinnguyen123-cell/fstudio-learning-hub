import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Copy,
  GripVertical,
  MoreHorizontal,
  Plus,
  Send,
  Smartphone,
  Store,
  Users,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const metrics = [
  {
    label: "Tỷ lệ hoàn thành",
    value: "78%",
    delta: "+6.2%",
    icon: CheckCircle2,
  },
  { label: "Điểm trung bình", value: "84", delta: "+3.1", icon: BarChart3 },
  { label: "Người học hoạt động", value: "1,248", delta: "+12%", icon: Users },
  { label: "Cần hỗ trợ", value: "96", delta: "-8%", icon: AlertTriangle },
];
const blocks = [
  { type: "Heading", content: "Hiểu đúng nhu cầu trước khi tư vấn" },
  {
    type: "Paragraph",
    content:
      "Bắt đầu bằng những câu hỏi mở về việc học, phần mềm và tần suất di chuyển.",
  },
  { type: "Key Point", content: "Đừng bắt đầu cuộc trò chuyện bằng cấu hình." },
  {
    type: "Scenario",
    content: "Khách hàng là sinh viên năm nhất cần máy dùng trong 4 năm.",
  },
];

function Dashboard() {
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <span className="ui-eyebrow">Tổng quan vận hành</span>
          <h1>Chào buổi sáng, Trainer</h1>
          <p>Nắm nhanh sức khỏe học tập trong toàn hệ thống.</p>
        </div>
        <button className="button button-primary">
          <Plus />
          Tạo khóa học
        </button>
      </div>
      <div className="admin-metric-grid">
        {metrics.map(({ label, value, delta, icon: Icon }) => (
          <article className="admin-metric-card" key={label}>
            <span>
              <Icon />
            </span>
            <p>{label}</p>
            <strong>{value}</strong>
            <small>{delta} so với tháng trước</small>
          </article>
        ))}
      </div>
      <div className="admin-dashboard-grid">
        <article className="analytics-card wide">
          <div className="card-heading">
            <div>
              <h2>Xu hướng hoàn thành</h2>
              <p>12 tuần gần nhất</p>
            </div>
            <span className="badge badge-success">+6.2%</span>
          </div>
          <div className="bar-chart" aria-label="Biểu đồ xu hướng hoàn thành">
            {[42, 55, 48, 64, 58, 72, 68, 76, 70, 82, 78, 88].map(
              (height, index) => (
                <i key={index} style={{ height: `${height}%` }} />
              ),
            )}
          </div>
        </article>
        <article className="analytics-card">
          <h2>Nội dung cần cải thiện</h2>
          {[
            "Tư vấn RAM và dung lượng",
            "Xử lý câu hỏi phần mềm",
            "Hệ sinh thái Apple",
          ].map((item, index) => (
            <div className="rank-row" key={item}>
              <span>{index + 1}</span>
              <strong>{item}</strong>
              <small>{32 - index * 5}% sai</small>
            </div>
          ))}
        </article>
        <article className="analytics-card">
          <h2>Hoạt động gần đây</h2>
          {[
            "Khóa Mac BTS được cập nhật",
            "F.Studio Q1 đạt 90%",
            "24 nhân viên hoàn thành quiz",
          ].map((item, index) => (
            <div className="activity-row" key={item}>
              <Activity />
              <span>
                {item}
                <small>{index + 1} giờ trước</small>
              </span>
            </div>
          ))}
        </article>
        <article className="analytics-card wide">
          <h2>Learning heatmap</h2>
          <div className="heatmap" aria-label="Hoạt động học theo ngày">
            {Array.from({ length: 35 }, (_, i) => (
              <i key={i} style={{ opacity: 0.18 + (i % 5) * 0.16 }} />
            ))}
          </div>
        </article>
      </div>
    </>
  );
}

function CoursesAdmin() {
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <span className="ui-eyebrow">Nội dung</span>
          <h1>Quản lý khóa học</h1>
          <p>12 khóa học · 4 draft · 7 published · 1 scheduled</p>
        </div>
        <Link className="button button-primary" to="/admin/courses/new">
          <Plus />
          Tạo khóa học
        </Link>
      </div>
      <div className="admin-toolbar">
        <div className="admin-search">
          Tìm theo tên, category hoặc campaign…
        </div>
        <button className="button button-secondary">Trạng thái</button>
        <button className="button button-secondary">Category</button>
      </div>
      <div className="course-table">
        <div className="course-table-head">
          <span>Khóa học</span>
          <span>Trạng thái</span>
          <span>Hoàn thành</span>
          <span>Cập nhật</span>
          <span />
        </div>
        {[
          [
            "Tư vấn Mac mùa Back to School",
            "Published",
            "78%",
            "2 giờ trước",
            "mac",
          ],
          ["iPhone Essentials", "Draft", "—", "Hôm qua", "iphone"],
          ["Apple Watch cho người mới", "In review", "64%", "12/07", "watch"],
          ["Hệ sinh thái Apple", "Scheduled", "—", "10/07", "eco"],
        ].map(([title, status, rate, date, accent]) => (
          <Link
            to="/admin/courses/mac-back-to-school/edit"
            className={`course-table-row accent-${accent}`}
            key={title}
          >
            <span>
              <i />
              <strong>{title}</strong>
              <small>6 modules · 10 questions</small>
            </span>
            <span className="badge">{status}</span>
            <span>{rate}</span>
            <span>{date}</span>
            <MoreHorizontal />
          </Link>
        ))}
      </div>
    </>
  );
}

function Editor() {
  return (
    <div className="editor-shell">
      <div className="editor-topbar">
        <div>
          <span className="badge badge-warning">Draft</span>
          <strong>Tư vấn Mac mùa Back to School</strong>
          <small>Đã lưu lúc 10:42</small>
        </div>
        <div>
          <button className="button button-secondary">
            <Smartphone />
            Preview
          </button>
          <button className="button button-primary">
            <Send />
            Yêu cầu duyệt
          </button>
        </div>
      </div>
      <div className="editor-workspace">
        <aside className="editor-outline">
          <strong>Cấu trúc khóa học</strong>
          {[
            "Hiểu nhu cầu khách hàng",
            "MacBook Air vs Pro",
            "RAM và dung lượng",
            "Câu hỏi phần mềm",
            "Hệ sinh thái",
            "Quiz cuối khóa",
          ].map((item, index) => (
            <button className={index === 0 ? "active" : ""} key={item}>
              <span>{index + 1}</span>
              {item}
            </button>
          ))}
          <button className="add-outline">
            <Plus />
            Thêm module
          </button>
        </aside>
        <section className="editor-canvas">
          <div className="editor-title">
            <span className="ui-eyebrow">Lesson 01</span>
            <h1>Hiểu nhu cầu khách hàng</h1>
            <p>15 phút · Bắt buộc</p>
          </div>
          {blocks.map((block) => (
            <article className="editor-block" key={block.type}>
              <GripVertical />
              <div>
                <span>{block.type}</span>
                <p>{block.content}</p>
              </div>
              <div>
                <button aria-label={`Duplicate ${block.type}`}>
                  <Copy />
                </button>
                <button aria-label={`More options for ${block.type}`}>
                  <MoreHorizontal />
                </button>
              </div>
            </article>
          ))}
          <button className="add-block">
            <Plus />
            Thêm block
          </button>
        </section>
        <aside className="editor-inspector">
          <strong>Thuộc tính lesson</strong>
          <label>
            Tiêu đề
            <input value="Hiểu nhu cầu khách hàng" readOnly />
          </label>
          <label>
            Thời lượng
            <input value="15 phút" readOnly />
          </label>
          <label className="switch-row">
            Bài bắt buộc
            <input type="checkbox" checked readOnly />
          </label>
          <div className="readiness">
            <CheckCircle2 />
            <div>
              <strong>Sẵn sàng preview</strong>
              <p>4 blocks · Không có lỗi</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Analytics({ employees = false }: { employees?: boolean }) {
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <span className="ui-eyebrow">Insights</span>
          <h1>{employees ? "Employee Progress" : "Learning Analytics"}</h1>
          <p>{employees ? "Theo dõi tiến độ theo nhân viên, cửa hàng và nhóm được giao." : "Phát hiện điểm nghẽn theo nội dung, cửa hàng và khu vực."}</p>
        </div>
        <button className="button button-secondary">30 ngày gần nhất</button>
      </div>
      <div className="admin-metric-grid">
        {metrics.slice(0, 3).map(({ label, value, delta, icon: Icon }) => (
          <article className="admin-metric-card" key={label}>
            <Icon />
            <p>{label}</p>
            <strong>{value}</strong>
            <small>{delta}</small>
          </article>
        ))}
      </div>
      <div className="admin-dashboard-grid">
        <article className="analytics-card wide">
          <h2>Store performance</h2>
          {[
            ["F.Studio Quận 1", 92],
            ["F.Studio Đà Nẵng", 84],
            ["F.Studio Cần Thơ", 71],
            ["F.Studio Hải Phòng", 63],
          ].map(([store, value]) => (
            <div className="performance-row" key={store}>
              <Store />
              <span>{store}</span>
              <div>
                <i style={{ width: `${value}%` }} />
              </div>
              <strong>{value}%</strong>
            </div>
          ))}
        </article>
        <article className="analytics-card">
          <h2>Câu hỏi khó nhất</h2>
          <p>RAM ảnh hưởng trực tiếp nhất đến điều gì?</p>
          <strong className="large-stat">38%</strong>
          <small>tỷ lệ trả lời sai</small>
        </article>
        <article className="analytics-card">
          <h2>Khu vực cần chú ý</h2>
          <p>Miền Tây · 8 cửa hàng</p>
          <strong className="large-stat">67%</strong>
          <small>tỷ lệ hoàn thành</small>
        </article>
      </div>
    </>
  );
}

export function AdminPlaceholderPage() {
  const { pathname } = useLocation();
  if (pathname.includes("/edit") || pathname.includes("/new"))
    return <Editor />;
  if (pathname.includes("/analytics") || pathname.includes("/employees"))
    return <Analytics employees={pathname.includes("/employees")} />;
  if (pathname === "/admin/courses") return <CoursesAdmin />;
  return <Dashboard />;
}
