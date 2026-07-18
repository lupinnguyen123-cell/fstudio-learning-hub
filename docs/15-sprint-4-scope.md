# Sprint 4 Scope — Supabase Foundation

## Mục lục

- [Sprint goal](#sprint-goal)
- [In scope](#in-scope)
- [Out of scope](#out-of-scope)
- [Logical data scope](#logical-data-scope)
- [Access và operation map](#access-và-operation-map)
- [Acceptance criteria](#acceptance-criteria)
- [Definition of Done](#definition-of-done)
- [Release gates](#release-gates)

## Sprint goal

Thay nguồn dữ liệu mock/localStorage chính bằng một backend Supabase an toàn cho vertical slice học tập hiện tại, không xây CMS hoặc mở rộng sản phẩm.

## In scope

- Supabase project setup và environment configuration.
- Authentication, session restore/refresh/logout.
- Profile có primary role `employee` hoặc `trainer`.
- Store tối giản và `profiles.store_id` nullable.
- Read Course, Module, Lesson và LessonBlock.
- Employee đọc mọi published course; Trainer đọc draft và published.
- Progress read/write idempotent.
- Quiz read không chứa đáp án đúng.
- Quiz submission/grading server-side và attempt read.
- RLS, negative security tests và answer-key isolation.
- Migration files, development/staging seed và rollback strategy.
- Seed duy nhất course “Tư vấn Mac mùa Back to School”.
- Repository/service integration và controlled cutover.
- One-time localStorage progress migration với server-wins.

## Out of scope

CMS, Course Editor, content mutation, Review/Approval, full course versioning, Assignment, Certificate, Notification, Bookmark, Favorite, LearningHistory riêng, full ActivityLog, Analytics, multi-brand, multi-region, Region/Area/Department, Store Manager, Super Admin app role, multi-role, Realtime và REST API riêng.

## Logical data scope

| Resource | MVP fields/behavior | Ghi chú |
|---|---|---|
| Profile | auth user reference, display identity, primary role, nullable store_id, timestamps | Role chỉ employee/trainer |
| Store | id, code, name, status, created_at, updated_at | Không dùng làm RLS scope |
| Course | metadata hiện có, status, updated_at | draft/published; archived nếu cần read policy |
| Module | course relation, title, order | Read-only |
| Lesson | module relation, title, duration, required, order | Read-only |
| LessonBlock | lesson relation, type, payload, order | Read-only; schema version ở payload/metadata nếu cần |
| Quiz | course relation, pass score, status | Employee chỉ đọc quiz hợp lệ |
| Question | prompt, order, explanation/remediation metadata | Explanation có thể chỉ trả sau submit |
| Choice | label, order và server-only correctness | Employee read projection không có correctness |
| Progress | user, lesson, state, completed_at, updated_at | Idempotent, server timestamp |
| Attempt | user, quiz, score, passed, submitted_at | Append-only |
| Attempt answer | attempt, question, selected choice, correctness snapshot | Tạo trong transaction chấm điểm |
| Migration marker | user, migration type/version, completed_at | Chống import lặp; cách persistence chốt trong design review |

## Access và operation map

| Operation | Employee | Trainer | Cơ chế |
|---|---|---|---|
| Read own profile/session | Allow | Allow | Supabase Auth + RLS |
| Read Store metadata cần cho profile | Allow tối thiểu | Allow tối thiểu | Direct read/view có RLS |
| Read published content | Allow | Allow | Supabase client + RLS |
| Read draft content | Deny | Allow | Supabase client + role/status RLS |
| Mutate content/status | Deny | Deny | Không policy/operation Sprint 4 |
| Read/write own progress | Allow | Nếu dùng learning flow của chính mình | RLS + constrained upsert/RPC |
| Read quiz prompts/choices | Allow khi course accessible | Allow để preview kỹ thuật | Safe projection, không answer key |
| Submit quiz | Allow cho chính mình | Chỉ khi tham gia như learner nếu được hỗ trợ | PostgreSQL RPC ưu tiên |
| Read own attempts | Allow | Allow cho attempt của mình | RLS |
| Read user khác / assign role | Deny | Deny | Privileged provisioning ngoài app |

## Acceptance criteria

### Authentication và profile

- Session khôi phục sau reload và hết hạn được xử lý rõ.
- Anonymous không đọc learning data.
- Profile được tạo/liên kết đúng với Auth identity; role/store không lấy từ client làm authority.
- Employee không truy cập Trainer route; Trainer truy cập được route nhưng không có CMS mutation.

### Content

- Employee chỉ nhận course published; Trainer nhận draft + published.
- Module, Lesson và LessonBlock giữ đúng thứ tự/dữ liệu seed.
- Chỉ course Mac Back to School là published production seed.
- Direct query ngoài policy trả rỗng/deny, không lộ sự tồn tại của draft cho Employee.

### Progress

- Hoàn thành cùng lesson nhiều lần không tạo duplicate hoặc tăng tỷ lệ hai lần.
- Chỉ user owner đọc/ghi progress của mình.
- Server timestamp và lesson access được kiểm tra.
- Reload/multi-session trả cùng trạng thái nguồn server.

### Quiz

- Payload trước submit không chứa correct choice hoặc explanation nhạy cảm.
- Client không thể tự đặt score/passed/user_id.
- Submission hợp lệ tạo đúng một attempt và answer records trong một transaction.
- Retry cùng idempotency token không tạo attempt mới ngoài ý muốn.
- 79% fail, 80% pass theo policy đã chốt; câu bỏ trống được tính đúng.
- Result sau submit có score, pass/fail, correct answers và explanation được phép.
- User không đọc attempt của người khác.

### Migration và cutover

- Server có progress thì không import local.
- Server trống + local hợp lệ thì import tối đa một lần và ghi marker.
- Import lỗi không ghi marker thành công và không xóa local source.
- Sau remote hydration, UI không dùng localStorage làm nguồn thật.

## Definition of Done

- Scope và environment matrix được duyệt.
- Migrations có thứ tự, repeatable deployment procedure và rollback/forward-fix plan.
- Seed deterministic, không chứa secret/production account, chỉ có một course thật.
- Repository/service layer che chi tiết Supabase khỏi page/component.
- Auth/session, content, progress, quiz và migration có automated tests tương xứng.
- RLS tests gồm anonymous denial, cross-user denial, Employee draft denial, Trainer read allowance và content mutation denial.
- Quiz threat-model tests chứng minh answer key không thể đọc trước submit.
- TypeScript check, lint, unit/integration tests và production build pass.
- Environment secret review pass; service-role key không xuất hiện trong browser bundle/repository.
- Logging/error handling không ghi token hoặc answer key.
- QA xác minh luồng Sprint 2 không hồi quy và mobile flow vẫn hoạt động.
- Runbook cutover, rollback, account seed và incident owner hoàn tất.
- Tài liệu implementation/operations được cập nhật sau khi schema thực tế được phê duyệt.

## Release gates

| Gate | Go khi |
|---|---|
| Product | Tất cả quyết định PO-01 đến PO-11 được phản ánh đúng |
| Security | RLS negative suite và quiz answer isolation pass |
| Data | Seed, progress invariant và attempt transaction pass |
| Migration | Server-wins + one-time marker được test với mọi nhánh |
| Quality | Build/test/QA không hồi quy |
| Operations | Env, backup/rollback, monitoring và owner rõ |

Tham chiếu [Product Owner Decisions](14-product-owner-decisions.md), [Supabase Security Model](16-supabase-security-model.md) và [localStorage Migration Plan](17-localstorage-migration-plan.md).
