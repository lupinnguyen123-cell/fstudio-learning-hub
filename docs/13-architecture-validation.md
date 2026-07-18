# Architecture Validation — Pre-Sprint 4

> **Resolution update — 18/07/2026:** Product Owner đã chốt 7 blocker của validation. Kết luận `Conditional Go` bên dưới được giữ để bảo toàn lịch sử; trạng thái hiện tại là **Go cho Sprint 4 trong phạm vi đã khóa**. Xem [Product Owner Decisions](14-product-owner-decisions.md), [Sprint 4 Scope](15-sprint-4-scope.md), [Supabase Security Model](16-supabase-security-model.md) và [localStorage Migration Plan](17-localstorage-migration-plan.md).

## Mục lục

- [1. Executive verdict](#1-executive-verdict)
- [2. Inconsistencies](#2-inconsistencies)
- [3. Missing decisions](#3-missing-decisions)
- [4. Over-engineering review](#4-over-engineering-review)
- [5. MVP backend scope](#5-mvp-backend-scope)
- [6. Supabase fit assessment](#6-supabase-fit-assessment)
- [7. Architecture decision log](#7-architecture-decision-log)
- [8. Open questions for Product Owner](#8-open-questions-for-product-owner)
- [9. Go/No-Go recommendation cho Sprint 4](#9-gono-go-recommendation-cho-sprint-4)
- [10. Resolution addendum](#10-resolution-addendum)

## 1. Executive verdict

**Kết luận: Conditional Go cho Sprint 4 foundation; No-Go cho việc triển khai toàn bộ blueprint hiện tại.**

Bộ tài liệu có cấu trúc tốt, định hướng domain đúng và đủ để estimate/discovery. Các nguyên tắc quan trọng—published content bất biến, progress idempotent, attempt append-only, server-side authorization và analytics có định nghĩa—phù hợp với một nền tảng học tập nội bộ. Bốn role xuất hiện nhất quán trong Information Architecture và Permission Matrix. Thứ tự tổng thể Auth/Data → CMS → Analytics → Assignment là hợp lý.

Tuy nhiên, blueprint chưa đủ khép kín để triển khai database đầy đủ mà không tự đưa thêm quyết định. Có **13 điểm không nhất quán hoặc thiếu contract kỹ thuật**, trong đó 4 điểm mức Cao: version ownership chưa mô hình hóa được snapshot bất biến; CMS review/comment không có persistence model; quiz answer có nguy cơ lộ khi dùng Supabase client trực tiếp; và API strategy chưa thống nhất với Supabase direct client. Có **18 quyết định sản phẩm/vận hành còn mở**.

Sprint 4 nên được thu hẹp thành vertical slice Employee: authentication, profile, hai role tối thiểu, đọc course/module/lesson, ghi progress, submit/read quiz attempt, RLS, migration/seed và repository integration. CMS, Assignment, Store Manager, Super Admin, notification, certificate và analytics aggregate chưa triển khai.

Không sửa tài liệu 00–12 trong lần validation này. Mọi khác biệt được ghi tại đây để Product Owner và Technical Lead chốt trước khi tạo schema/migration.

## 2. Inconsistencies

| # | Vấn đề | File liên quan | Mức độ | Tác động | Đề xuất xử lý |
|---:|---|---|---|---|---|
| 1 | `Department` là domain entity và `users.department_id` là FK nhưng không có bảng `departments`. | 04, 05 | Cao | Không thể tạo FK hoặc membership đúng như mô tả. | Hoãn Department khỏi MVP; khi triển khai organization, thêm entity/table rõ và ownership Store. |
| 2 | Domain dùng Employee/Trainer nhưng database dùng `users` + `user_roles`; `User` không được định nghĩa như domain root. | 00, 04, 05, 10 | Trung bình | Developer có thể tạo bảng employee/trainer trùng hoặc profile không nhất quán với Auth. | Chốt `auth.users` là identity, `profiles` là app profile, role qua `user_roles`; Employee/Trainer là role projection. |
| 3 | `course_versions` tồn tại nhưng Module/Lesson/Block vẫn trỏ thẳng Course/Module; không có ownership từ version tới toàn bộ content tree. | 00, 04, 05, 07, 10 | Cao | Không thể bảo đảm bản published bất biến hoặc tái hiện attempt/certificate. | Sprint 4 dùng một published content revision; trước Sprint 5 chốt snapshot strategy và FK version xuyên suốt cây nội dung. |
| 4 | `progress` chứa `course_version_id` nhưng unique chỉ là user + lesson; tài liệu chưa nói progress mới hay giữ nguyên khi đổi version. | 00, 04, 05 | Cao | Upsert có thể ghi đè lịch sử hoặc ngăn người dùng học lại version mới. | MVP khóa progress vào content revision hiện tại; PO chốt policy re-enrollment trước Sprint 5. |
| 5 | CMS có Review, reviewer, comment, changelog và approval nhưng database không có review/comment/publication records. | 05, 06, 07, 08 | Cao | Không lưu được workflow, separation of duties hoặc audit review. | Không triển khai workflow Sprint 4; thiết kế `content_reviews`/`publications` trước Sprint 5 nếu approval được xác nhận. |
| 6 | CMS có Media Library và media usage nhưng Domain/Database không có Media/Asset entity. | 00, 05, 07 | Trung bình | Upload, reuse, replacement và archive không có ownership/metadata. | Hoãn; trước Sprint 5 thêm asset metadata và Storage object policy, không lưu binary trong DB. |
| 7 | API có persistent quiz draft nhưng Database Blueprint không có quiz draft/answer-draft model. | 05, 08 | Trung bình | Reload/cross-device draft không thể đáp ứng bằng backend đã mô tả. | Sprint 4 giữ draft local; nếu cần cross-device, bổ sung `quiz_drafts` sau quyết định PO. |
| 8 | API giả định `/api/v1` custom server cho mọi resource, còn Roadmap chọn Supabase và chưa phân loại direct client/RPC/Edge Function. | 08, 11 | Cao | Dễ xây lớp API thừa hoặc đưa logic nhạy cảm ra browser. | Dùng Supabase client cho read đơn giản; database function cho progress/quiz; Edge Function chỉ cho tác vụ privileged/integration. |
| 9 | `choices.isCorrect`/đáp án đúng nằm trong model lưu trữ, trong khi API yêu cầu không lộ đáp án. | 04, 05, 08 | Cao | Direct select sai policy sẽ lộ toàn bộ đáp án quiz. | Không cấp SELECT cột/bảng đáp án cho Employee; lấy câu hỏi qua safe view/RPC và chấm bằng server-side database function. |
| 10 | Assignment trong Domain có `targetType/targetId`, Database tách `assignment_targets`; target hỗ trợ Store/nhóm/user nhưng roadmap nói Brand/Region/Store. | 03, 04, 05, 08 | Trung bình | Không rõ cardinality và loại target hợp lệ. | Xem Domain field là conceptual; hoãn Sprint 7 và chốt target matrix trước schema. |
| 11 | Analytics yêu cầu Achievement nhưng không có entity, rule hay nguồn sự kiện tương ứng. | 02, 09 | Thấp | Dashboard Employee không thể tính nhất quán. | Để sau; chỉ thêm khi achievement catalog và rule được PO duyệt. |
| 12 | Completion Rate dùng “đủ điều kiện hoặc được assignment”, trong khi Assignment tới Sprint 7. | 01, 09, 11 | Trung bình | Denominator thay đổi làm KPI không so sánh được giữa Sprint 6 và 7. | Sprint 6 định nghĩa cohort enrollment rõ; sau Sprint 7 thêm metric assignment completion riêng. |
| 13 | Sprint 4 roadmap yêu cầu versioning, audit nền, observability và backup rehearsal, nhưng phạm vi MVP được nêu chỉ cần read/learning write và chưa có CMS. | 10, 11, 12 | Trung bình | Sprint 4 phình to, trì hoãn vertical slice. | Chỉ tạo audit/security baseline cần cho auth và mutation; full content versioning/audit workflow chuyển Sprint 5. |

### Kết quả đối chiếu bắt buộc

- **Domain ↔ Database:** đa số entity có mapping; thiếu rõ `Department`, User projection, Media và persistence của review. Employee/Trainer map gián tiếp qua user/role là hợp lý sau khi chốt.
- **Role ↔ IA/Permission:** đủ Employee, Trainer, Store Manager và Super Admin; scope của Store Manager còn là quyết định mở.
- **CMS ↔ Domain/Database:** content tree và quiz có nền; review, comment, publication, media và version snapshot chưa đủ.
- **API ↔ Entity/Permission:** resource chính có mapping; quiz draft và export job thiếu persistence; `/api/v1` chưa phù hợp strategy Supabase.
- **Analytics ↔ Source:** progress, attempts, answers và event history đủ cho metric học cơ bản; Assignment metrics, Achievement, heatmap event taxonomy và aggregate chưa sẵn sàng.
- **Roadmap dependencies:** thứ tự tổng thể đúng; Analytics trước Assignment nghĩa là không nên phát hành assignment-based KPI trong Sprint 6.
- **Thuật ngữ:** `user/employee`, `published/publish`, `version/revision`, `activity/history/event`, `scope/tenant/brand` cần glossary chính thức trước Sprint 5.

## 3. Missing decisions

| # | Giả định đang được dùng | Tác động kỹ thuật | Rủi ro nếu sai | Câu hỏi cần PO xác nhận | Mặc định đề xuất |
|---:|---|---|---|---|---|
| 1 | Trainer có thể có quyền publish hoặc cần reviewer. | Role policy, review tables, state machine. | Xây workflow thừa hoặc thiếu kiểm soát. | Mọi khóa có bắt buộc người thứ hai duyệt không? | MVP CMS: Trainer tự publish; bật approval theo cấu hình ở giai đoạn sau. |
| 2 | User có thể có nhiều role. | `user_roles`, chuyển context, RLS. | Một role column gây migration khó. | Một Trainer có đồng thời là Employee không? | Có; dùng nhiều role, một active UI context. |
| 3 | Employee chỉ có một Store hiện hành nhưng có lịch sử chuyển Store. | Profile/membership và analytics cohort. | Mất lịch sử hoặc rò scope cũ. | Có trường hợp làm nhiều Store đồng thời không? | Một membership hiện hành, lưu lịch sử; đa Store để sau. |
| 4 | Store Manager chỉ xem đúng Store được cấp. | Scope/RLS và manager membership. | Rò dữ liệu nhân sự. | Manager có quản lý nhiều Store/cụm không? | Một hoặc nhiều Store explicit; không suy từ Region. |
| 5 | Course có thể thuộc một Brand. | FK, content sharing, RLS. | Duplicate course hoặc lộ chéo brand. | Course dùng chung nhiều Brand không? | Sprint 4 single-brand; chưa gắn multi-brand policy. |
| 6 | Assignment có thể nhắm Employee, Store, Region hoặc Brand. | Polymorphic target resolver. | Fan-out và quyền rất phức tạp. | Target nào thực sự cần ở lần đầu? | Sprint 7: Employee và Store; Region/Brand sau. |
| 7 | Version mới không tự bắt người đã hoàn thành học lại. | Progress/enrollment/version FK. | Tiến độ biến mất hoặc compliance sai. | Thay đổi nào buộc re-certification? | Giữ completion cũ; assignment/re-certification mới mới yêu cầu học lại. |
| 8 | Certificate là giá trị sản phẩm thật. | Table, issuance, PDF/public verification. | Xây feature không dùng hoặc tạo nghĩa vụ compliance. | Certificate dùng nội bộ hay chứng chỉ chính thức? | Hoãn; Sprint 4 chỉ có trạng thái completed/passed. |
| 9 | Notification có in-app, email hoặc kênh khác. | Provider, queue, preference, retention. | Spam, chi phí và compliance. | Kênh bắt buộc nào? | Hoãn; Sprint 7 bắt đầu in-app, email chỉ khi được duyệt. |
| 10 | Bookmark và Favorite đều cần. | Hai table, route và synchronization. | Tăng scope ít giá trị MVP. | Nghiên cứu người dùng chứng minh nhu cầu nào? | Hoãn cả hai; ưu tiên Continue Learning. |
| 11 | Question thuộc duy nhất một Quiz. | FK và authoring model. | Không tái sử dụng question bank. | Có cần question bank dùng chung không? | MVP: thuộc một Quiz; duplicate có snapshot, không shared reference. |
| 12 | Mỗi Course có một final Quiz. | Unique/FK và UX lock. | Không hỗ trợ nhiều checkpoint/final. | Có nhiều final quiz/variant không? | MVP: tối đa một final quiz; inline quiz là LessonBlock khác. |
| 13 | Pass score, retake limit và attempt policy do Course/Quiz cấu hình. | Grading function và constraints. | Điểm/certificate không nhất quán. | Pass score mặc định và số lần làm lại? | 80%, retake không giới hạn cho training; lưu mọi attempt. |
| 14 | Lesson `required` quyết định progress; quiz không tính lesson progress. | Progress calculation/RPC. | Tỷ lệ sai và quiz mở sai. | Có khóa không có quiz hoặc optional lessons không? | Tỷ lệ chỉ lesson required; quiz là completion gate riêng khi tồn tại. |
| 15 | Employee xem mọi published course hay chỉ enrollment/assignment. | RLS/read policy và course catalog. | Lộ nội dung hoặc ngăn tự học. | Catalog mở hay assignment-only? | Sprint 4: mọi authenticated Employee thấy course seed published. |
| 16 | Quiz draft cần tồn tại cross-device. | Draft table, conflict/version policy. | Mất đáp án hoặc làm backend thừa. | Resume quiz trên thiết bị khác có bắt buộc? | Không ở Sprint 4; draft localStorage, attempt chỉ tồn tại sau submit. |
| 17 | Dữ liệu localStorage hiện tại cần migrate cho người thật. | Import mapping và trust boundary. | Upload dữ liệu demo giả thành hồ sơ thật. | Có cần bảo toàn tiến độ prototype không? | Không migrate user progress; seed content, reset state sau cutover. |
| 18 | Retention cho attempt, history, audit và PII chưa chốt. | Partition/delete/export policy. | Vi phạm privacy hoặc mất audit. | Mỗi loại dữ liệu giữ bao lâu? | Chưa xóa tự động Sprint 4; hạn chế dữ liệu và yêu cầu PO/Legal chốt trước production pilot. |

## 4. Over-engineering review

| Thành phần | Phân loại | Quyết định cho MVP | Lý do |
|---|---|---|---|
| Course, Module, Lesson, LessonBlock | Bắt buộc Sprint 4 | Triển khai read-only với seed | Khớp frontend và là content spine. |
| Progress | Bắt buộc Sprint 4 | Read/upsert qua operation an toàn | Luồng học cốt lõi. |
| Quiz, Question, Choice, Attempt, AttemptAnswer | Bắt buộc Sprint 4 | Read an toàn + submit/grading server-side | Luồng Sprint 2 cần hoạt động thật, không lộ đáp án. |
| User profile | Bắt buộc Sprint 4 | `profiles` nối `auth.users` | Auth metadata không thay thế app profile. |
| Role/Permission chi tiết | Chuẩn bị schema, UI sau | Chỉ Employee/Trainer; permission matrix chưa materialize đầy đủ | Full RBAC + scope quá lớn cho read-only MVP. |
| Department | Để sau | Không tạo bảng Sprint 4 | Chưa có use case cốt lõi; blueprint còn thiếu table. |
| Brand/Region/Multi-brand | Để sau | Vận hành single-brand; không UI quản trị | Không cần để chứng minh learning vertical slice. |
| Store | Chuẩn bị schema nếu profile bắt buộc Store | Seed Store tối thiểu, không hierarchy | Giữ profile hiện tại và mở đường scope sau. |
| Store Manager | Để sau | Không role/runtime policy Sprint 4 | Phụ thuộc Assignment/Analytics. |
| Super Admin | Chuẩn bị, chưa UI | Dùng operational admin ngoài app; không cấp role tùy tiện | App admin đầy đủ chưa cần. |
| Favorite | Có thể loại khỏi roadmap hiện tại | Không schema/API | Chưa có evidence; Course List/Continue Learning đủ. |
| Bookmark | Để sau | Không schema/API | Có ích nhưng không cốt lõi Sprint 4. |
| Certificate | Để sau | Không schema/API | Giá trị và compliance chưa xác nhận. |
| Notification | Để sau | Không schema/API | Phụ thuộc Assignment/reminder Sprint 7. |
| LearningHistory | Để sau | Dùng progress/attempt làm nguồn trước | Tách event store sớm là thừa. |
| ActivityLog | Chuẩn bị schema nhưng giới hạn | Chỉ audit mutation đặc quyền nếu có | Sprint 4 hầu như không có CMS/admin mutation. |
| Approval workflow | Để sau | Không table/API Sprint 4 | Chỉ cần khi CMS Sprint 5 và PO chốt. |
| Course versioning phức tạp | Chuẩn bị contract, triển khai Sprint 5 | MVP seed một revision bất biến | Tránh thiết kế snapshot nửa vời trước CMS. |
| API riêng `/api/v1` | Có thể loại khỏi Sprint 4 | Dùng Supabase client/RPC | Custom facade chưa mang đủ giá trị cho MVP. |

Không đề xuất xóa ngay Domain entity khỏi tài liệu baseline. `Favorite` là ứng viên loại bỏ nếu discovery không chứng minh nhu cầu; các entity còn lại được hoãn hoặc chỉ giữ như future concept, không được đưa vào migration Sprint 4.

## 5. MVP backend scope

### 5.1 Phạm vi bắt buộc

1. Tạo Supabase project cho môi trường development/staging và quy ước environment.
2. Supabase Auth, session lifecycle và profile bootstrap.
3. Hai role runtime: Employee và Trainer; Trainer ở Sprint 4 chỉ có quyền đọc learning content và truy cập shell hiện có, chưa có CMS write.
4. Đọc published Course → Module → Lesson → LessonBlock.
5. Read/write lesson progress idempotent, không vượt 100%, không tính quiz.
6. Đọc quiz không lộ đáp án; submit và đọc attempt của chính user.
7. RLS/policy tests cho anonymous, owner, authenticated user và cross-user denial.
8. Migration, seed dữ liệu hiện tại, repository/service integration, error/loading behavior và rollback plan.

### 5.2 Bảng tạo ngay

| Bảng logical | Mục đích MVP | Ghi chú |
|---|---|---|
| `profiles` | Hồ sơ ứng dụng 1–1 với `auth.users` | Thay tên `users` trong blueprint để tránh trùng Supabase Auth. |
| `roles` | Seed `employee`, `trainer` | Chưa cần full permissions catalog. |
| `user_roles` | Gán một/nhiều role cho profile | RLS chỉ cho user đọc role của mình; assignment role là privileged operation. |
| `stores` | Store tối thiểu cho profile seed | Không tạo Brand/Region/Department ở MVP nếu chưa có use case. |
| `courses` | Published course metadata | MVP chỉ published/read; có content revision marker. |
| `modules` | Ordered course modules | Read-only với authenticated users. |
| `lessons` | Required/optional lesson metadata | Read-only. |
| `lesson_blocks` | Nội dung render | Payload có discriminated block type/schema version. |
| `quizzes` | Pass score và policy tối thiểu | Tối đa một final quiz/course trong MVP. |
| `questions` | Prompt, order, lesson remediation ref | Employee không được đọc đáp án đúng. |
| `choices` | Label và order | Cột đáp án đúng không được expose qua direct Employee SELECT. |
| `progress` | Trạng thái lesson theo user | Unique user + lesson trong revision MVP. |
| `attempts` | Attempt append-only | Score/passed do server-side operation tạo. |
| `attempt_answers` | Snapshot selected/correctness | Owner đọc sau submit; không cho client tự ghi trực tiếp. |

### 5.3 Bảng để sau

`permissions`, `role_permissions`, `brands`, `regions`, `departments`, `store_memberships`, `course_versions` đầy đủ, `assignments`, `assignment_targets`, `certificates`, `notifications`, `bookmarks`, `favorites`, `activity_logs` đầy đủ, `learning_history`, CMS reviews/comments/publications, media assets, quiz drafts và analytics projections.

Nếu team chọn triển khai `activity_logs` nền ngay, chỉ ghi các operation đặc quyền do database function/Edge Function tạo; browser không có INSERT trực tiếp.

### 5.4 Role triển khai

- **Ngay:** Employee, Trainer.
- **Chỉ chuẩn bị khái niệm:** Store Manager, Super Admin. Không seed quyền runtime cho hai role này trong Sprint 4; quản trị Supabase project không đồng nghĩa app Super Admin.

### 5.5 Operation cần ngay

| Operation | Cách triển khai đề xuất |
|---|---|
| Session/profile/role self | Supabase Auth + direct SELECT với RLS hoặc một profile view an toàn. |
| Course catalog/detail | Direct SELECT/view với RLS cho content published. |
| Module/Lesson/Block read | Direct SELECT có scope published; repository ghép dữ liệu. |
| Complete lesson/read progress | Database function cho complete idempotent hoặc constrained upsert; ưu tiên function để validate lesson access/revision. |
| Read quiz questions | Safe view/database function không trả đáp án. |
| Save quiz draft | Giữ local trong Sprint 4, không API. |
| Submit quiz attempt | Database function transactionally chấm điểm và tạo attempt/answers. |
| Read own attempts/results | Direct SELECT/view với owner RLS. |
| Continue Learning | Tính trong repository từ content + progress; chưa cần endpoint riêng. |

Không cần custom API cho `/me`, `/courses`, `/lessons`, `/progress`, `/quiz-attempts` trong Sprint 4. API Blueprint là contract khái niệm cho tương lai; repository frontend không được phụ thuộc trực tiếp vào shape table rời rạc nếu có thể tránh.

### 5.6 Mock và localStorage migration

**Seed lên backend:**

- `courseCatalog`: seed khóa **Tư vấn Mac mùa Back to School**, 6 module, 6 lesson bắt buộc và toàn bộ LessonBlock.
- `quizQuestions`: seed 10 question, choices, correct answer và mapping related lesson/module.
- Hai course placeholder không có module (`service-foundations`, `visual-merchandising`) chỉ seed nếu Product muốn chúng xuất hiện dưới trạng thái “sắp ra mắt”; không coi là course học được.
- Store `F.Studio Quận 1` và profile demo chỉ dùng seed development, không dùng production identity.

**Hai key hiện tại:**

- `fstudio-learning-role`: loại bỏ khỏi nguồn authority sau Auth cutover. Không dùng làm fallback authorization. Có thể giữ tạm chỉ sau feature flag local development.
- `fstudio-learning-progress`: không upload tự động vì là dữ liệu demo không gắn danh tính đáng tin cậy. Trong migration window, chỉ đọc làm rollback/local draft; sau remote hydration thành công, clear hoặc đánh dấu migrated. Quiz draft có thể tiếp tục local trong Sprint 4; progress và submitted attempts phải lấy backend làm nguồn thật.

Không merge local và remote theo timestamp của client. Nếu PO yêu cầu bảo toàn prototype progress, phải có explicit import confirmation, content-ID validation và one-time idempotent migration.

### 5.7 Ngoài phạm vi Sprint 4

CMS write/publish, media upload, approval, Assignment, reminder/Notification, Certificate, Bookmark/Favorite, analytics dashboard, export, Store Manager/Super Admin UI/policy, Realtime, AI và custom public API gateway.

## 6. Supabase fit assessment

### 6.1 Mức độ phù hợp

| Capability | Fit | Đánh giá |
|---|---|---|
| PostgreSQL relational model | Tốt | Content tree, progress, attempts và role assignment phù hợp FK/unique/transaction. JSON payload phù hợp LessonBlock nhưng cần schema version/validation ứng dụng. |
| Supabase Auth | Tốt | Phù hợp session và identity; cần `profiles` thay vì nhồi app data vào auth metadata. |
| Row Level Security | Tốt nhưng rủi ro cao nếu sai | Owner access và published content dễ mô hình hóa; hierarchical scope cần policy/function được test kỹ. |
| Storage | Phù hợp Sprint 5 | Media CMS phù hợp signed URL/bucket policy; chưa cần trong Sprint 4. |
| Edge Functions | Dùng có chọn lọc | Hợp với email/webhook/export/media scan hoặc secret third-party; không dùng thay mọi CRUD. |
| Realtime | Chưa cần | Learning flow không cần live subscription; tăng complexity, connection và policy surface. |

### 6.2 Direct client, database function và Edge Function

**Supabase client trực tiếp:** Auth/session, self profile, published course/module/lesson/block read, own progress/attempt read. Mọi operation đều phụ thuộc RLS; anon chỉ được tối thiểu hoặc không được đọc.

**Database function:** complete lesson idempotent; submit/grade quiz transactionally; safe quiz projection không lộ đáp án; về sau publish snapshot, assignment target resolution và capability checks nếu RLS trở nên phức tạp. Function nhạy cảm phải có fixed search path, input validation, quyền execute tối thiểu và không tin `user_id` từ client.

**Edge Function có thể cần sau:** provisioning/import có service role, gửi email/reminder, export async, virus/media integration, webhook và external AI. Sprint 4 chưa cần Edge Function trừ khi auth provisioning phụ thuộc hệ thống nhân sự bên ngoài.

**Không dùng Realtime hiện tại:** course content, progress và attempt không cần đồng bộ live. Chỉ đánh giá lại cho collaborative CMS presence hoặc notification inbox sau khi có use case đo được.

### 6.3 Rủi ro bảo mật frontend → Supabase

- Supabase anon key được phép ở browser; **service-role key tuyệt đối không được đưa vào frontend**.
- RLS phải bật trước khi cấp quyền bảng. “Authenticated” không đồng nghĩa được xem mọi hàng.
- Không cho Employee SELECT nguồn chứa `correct choice`, kể cả UI không render trường đó.
- Không cho client tự ghi `score`, `passed`, `user_id`, `role`, `store_id` hoặc audit actor.
- RLS policy có subquery role dễ recursive hoặc chậm; dùng pattern được test và index FK/scope.
- `user_metadata` do user kiểm soát không dùng làm authority; role/scope nằm ở app-owned table hoặc signed claims do trusted process phát hành.
- Storage bucket public có thể làm lộ media; dùng private/signed access khi nội dung bị giới hạn.
- Client timestamp không quyết định completion/deadline/audit; dùng thời gian database.
- RPC `security definer` có blast radius lớn; revoke mặc định, grant cụ thể, xác minh caller và chống object reference ngoài scope.
- Migration/seed không được chứa production secret hoặc account thật.

## 7. Architecture decision log

Các quyết định dưới đây là kết quả validation và là baseline đề xuất cho Sprint 4; mục `Proposed` cần Technical Lead/PO phê duyệt trước migration đầu tiên.

| ID | Trạng thái | Quyết định | Lý do / hệ quả |
|---|---|---|---|
| AV-01 | Proposed | Sprint 4 là Employee learning vertical slice, không triển khai toàn domain. | Giảm rủi ro và tạo đường end-to-end có thể kiểm thử. |
| AV-02 | Proposed | Supabase `auth.users` là identity; public `profiles` chứa hồ sơ app. | Tránh bảng `users` trùng và giữ Auth tách domain. |
| AV-03 | Proposed | Employee/Trainer là role projection; user có thể có nhiều role. | Phù hợp D11 và tránh account trùng. |
| AV-04 | Proposed | Chỉ hai role Employee/Trainer hoạt động Sprint 4. | Store Manager/Super Admin phụ thuộc scope/analytics chưa có. |
| AV-05 | Proposed | Supabase client cho read đơn giản; database function cho mutation có invariant. | Không dựng API facade thừa nhưng vẫn bảo vệ grading/progress. |
| AV-06 | Proposed | Quiz answer key không bao giờ direct-select được bởi Employee. | Điều kiện security release bắt buộc. |
| AV-07 | Proposed | localStorage không phải authority sau cutover; role key bị loại, progress demo không auto-import. | Tránh giả mạo role và dữ liệu demo sai danh tính. |
| AV-08 | Proposed | Sprint 4 dùng một content revision seed; full course versioning chốt trước Sprint 5. | Không triển khai snapshot model nửa vời. |
| AV-09 | Proposed | Quiz draft tiếp tục local-only; submitted attempt lưu backend append-only. | Đủ UX Sprint 2 mà không thêm draft domain chưa được duyệt. |
| AV-10 | Proposed | Department, hierarchy Brand/Region, Assignment và engagement entities không vào migration MVP. | Không giữ schema chỉ vì khả năng tương lai. |
| AV-11 | Proposed | Continue Learning là derived application behavior trong Sprint 4. | Không cần custom endpoint khi dataset nhỏ và rule đã có. |
| AV-12 | Proposed | Store tối thiểu được seed nếu profile bắt buộc; không triển khai hierarchy. | Giữ dữ liệu profile hiện tại với chi phí thấp. |
| AV-13 | Proposed | Không sửa tài liệu Architecture Freeze cũ trong validation này. | Mâu thuẫn chưa phải lỗi production; decision log này là delta có truy vết. |

## 8. Open questions for Product Owner

### Blocker trước Sprint 4 migration

1. Employee được xem mọi published course hay chỉ course được giao?
2. Có cần bảo toàn progress prototype/localStorage cho người dùng pilot không?
3. Trainer trong Sprint 4 có chỉ đọc, hay cần bất kỳ mutation nào trước CMS Sprint 5?
4. Một người có thể đồng thời là Employee và Trainer không?
5. Store profile là bắt buộc ngay khi tạo account hay có thể để trống?
6. Pass score mặc định có chính thức là 80% và retake có giới hạn không?
7. Hai course placeholder không có lesson sẽ seed như “coming soon” hay loại khỏi catalog?

### Cần chốt trước Sprint 5–7

8. Trainer tự publish hay bắt buộc approval bởi người khác?
9. Khi version mới phát hành, điều kiện nào buộc học/certify lại?
10. Course dùng chung nhiều Brand không?
11. Employee có thể thuộc nhiều Store cùng lúc không; Store Manager quản lý bao nhiêu Store?
12. Certificate có giá trị nghiệp vụ nào và có cần tài liệu/verification không?
13. Assignment target MVP là Employee, Store, Region hay Brand?
14. Notification dùng in-app, email hay kênh doanh nghiệp khác?
15. Bookmark/Favorite có bằng chứng nhu cầu đủ để giữ roadmap không?
16. Question cần question bank tái sử dụng hay chỉ thuộc một Quiz?
17. Retention của PII, attempts, learning events và audit log là bao lâu?
18. Metric completion dùng enrollment hay assignment làm denominator chuẩn?

## 9. Go/No-Go recommendation cho Sprint 4

### Recommendation

**Conditional Go** cho setup/discovery và vertical slice đã thu hẹp. **No-Go** cho migration production hoặc custom API implementation cho tới khi 7 câu hỏi blocker được chốt và bốn acceptance gate sau có owner:

1. **Identity gate:** profile/role source of truth và account provisioning được duyệt.
2. **Data gate:** content seed, progress key, quiz attempt snapshot và revision policy MVP được duyệt.
3. **Security gate:** RLS matrix, answer-key isolation, service-role handling và cross-user negative tests được duyệt.
4. **Migration gate:** localStorage cutover, rollback, seed environments và no-regression plan được duyệt.

Sau khi bốn gate đạt, kiến trúc **đủ điều kiện bắt đầu Supabase cho Sprint 4 MVP**, nhưng chưa đủ để xây CMS/Analytics/Assignment. Không nên tạo tất cả bảng trong Database Blueprint ngay từ Sprint 4.

### Số liệu validation

- Mâu thuẫn/khoảng trống contract: **13**.
- Quyết định sản phẩm/vận hành còn mở: **18**.
- Entity đề xuất loại bỏ nếu không có evidence: **Favorite**.
- Entity/capability đề xuất hoãn: Department, Brand/Region hierarchy, Store Manager, Super Admin runtime, Permission chi tiết, Assignment, Certificate, Notification, Bookmark, LearningHistory, full ActivityLog, approval, media và analytics projections.
- Tài liệu cũ đã sửa: **0**.

## 10. Resolution addendum

Phần này ghi nhận quyết định sau validation, không xóa hoặc viết lại nhận định tại thời điểm review.

| Blocker/điểm mở | Quyết định đã chốt | Tác động kiến trúc |
|---|---|---|
| Course visibility | Employee đọc mọi published course; Trainer đọc draft + published; chưa có assignment/scope theo shop | RLS theo status + role, chưa cần assignment resolver |
| localStorage | Supabase là source of truth; import hợp lệ một lần khi server chưa có progress; server wins | Cần migration flag và operation idempotent; localStorage chỉ cache/migration |
| Trainer Sprint 4 | Login, Trainer routes và read draft/published; không có content/user mutation | Không triển khai CMS permission/write policy |
| Role model | Một primary role/profile: employee hoặc trainer | Sprint 4 không cần multi-role runtime; giữ khả năng migration schema về sau |
| Store | Bảng tối giản; `profiles.store_id` nullable; không dùng cho authorization | Không tạo Region/Area/Department |
| Quiz | Read không lộ answer key; chấm/lưu bằng PostgreSQL RPC ưu tiên | Security blocker được đưa thành release gate |
| Placeholder courses | Chỉ seed “Tư vấn Mac mùa Back to School” | Production catalog không chứa card minh họa |
| Course versioning | Hoãn full versioning; MVP chỉ `status` và `updated_at` | Không tuyên bố snapshot bất biến ở Sprint 4 |
| Review/Approval | Hoãn toàn bộ sang CMS sprint | Không có review/approval table hoặc workflow Sprint 4 |
| API strategy | Supabase client + repository; RPC cho logic nhạy cảm; không REST riêng | API Blueprint `/api/v1` là future concept, superseded cho Sprint 4 |

### Kết luận cập nhật

**Go** cho Sprint 4 implementation theo [Sprint 4 Scope](15-sprint-4-scope.md). Go không mở rộng sang CMS, analytics, assignment hoặc full versioning. Quiz answer isolation, RLS negative tests và controlled local migration là Definition of Done bắt buộc; thiếu một trong ba thì release vẫn là No-Go.
