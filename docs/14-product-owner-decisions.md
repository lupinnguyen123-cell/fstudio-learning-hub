# Product Owner Decisions — Sprint 4

## Mục lục

- [Trạng thái và quyền ưu tiên](#trạng-thái-và-quyền-ưu-tiên)
- [Quyết định đã chốt](#quyết-định-đã-chốt)
- [Quyết định hoãn](#quyết-định-hoãn)
- [Hệ quả đối với blueprint cũ](#hệ-quả-đối-với-blueprint-cũ)
- [Acceptance criteria cấp sản phẩm](#acceptance-criteria-cấp-sản-phẩm)

## Trạng thái và quyền ưu tiên

- Ngày ghi nhận: **18/07/2026**.
- Trạng thái: **Approved for Sprint 4**.
- Khi tài liệu này khác blueprint 00–12, quyết định tại đây được ưu tiên cho Sprint 4.
- Các quyết định tương lai không tự động mở rộng Sprint 4.

## Quyết định đã chốt

| ID | Chủ đề | Quyết định | Hệ quả triển khai Sprint 4 |
|---|---|---|---|
| PO-01 | Course visibility | Employee đọc tất cả course `published`; Trainer đọc `draft` và `published` | Chưa lọc theo assignment, store, region hoặc brand |
| PO-02 | Source of truth | Supabase là nguồn thật; localStorage chỉ cache và one-time migration | Server wins; không merge khi server đã có progress |
| PO-03 | Trainer | Chỉ login, Trainer routes, đọc draft/published và placeholder kỹ thuật | Không create/edit/publish/archive/delete/user management |
| PO-04 | Role | Mỗi profile có đúng một primary role: `employee` hoặc `trainer` | Không multi-role runtime; thiết kế phải cho phép migration sau này |
| PO-05 | Store | Store tối giản; `profiles.store_id` nullable; chưa tham gia authorization/analytics | Chỉ id, code, name, status, created_at, updated_at |
| PO-06 | Quiz security | Employee không đọc answer key trước submit; chấm server-side | Ưu tiên PostgreSQL RPC; Edge Function chỉ nếu RPC không đủ |
| PO-07 | Quiz result | Sau submit có thể trả correct answer và explanation trong result | Chỉ trả qua kết quả attempt được ủy quyền |
| PO-08 | Seed | Chỉ seed khóa “Tư vấn Mac mùa Back to School” | Placeholder khác không thành published production data |
| PO-09 | Versioning | Không full versioning Sprint 4; chỉ `status`, `updated_at` | Không giả lập snapshot hoặc re-enrollment policy |
| PO-10 | Review/Approval | Hoãn toàn bộ sang CMS sprint | Không review workflow/table Sprint 4 |
| PO-11 | Data access strategy | Supabase client cho read có RLS; repository/service ở frontend; RPC cho logic nhạy cảm | Không dựng REST API riêng Sprint 4 |

## Quyết định hoãn

| Chủ đề | Thời điểm xem lại | Điều kiện cần chốt |
|---|---|---|
| CMS, editor, publish/archive mutation | CMS sprint | Ownership, review model, media và audit |
| Full course versioning | Trước CMS publish | Snapshot tree, progress/relearning và rollback |
| Review/Approval | CMS sprint | Self-publish hay four-eyes, reviewer/comment persistence |
| Assignment | Assignment sprint | Target type, enrollment, deadline và reminder |
| Certificate | Product discovery | Giá trị nghiệp vụ, issuance và verification |
| Notification | Assignment/engagement sprint | Kênh, preference, cooldown và retention |
| Bookmark/Favorite | Sau user research | Evidence nhu cầu và priority |
| LearningHistory/Full ActivityLog | Analytics/CMS sprint | Event taxonomy, retention và audit scope |
| Analytics | Analytics sprint | Metric owner, denominator, projection và privacy threshold |
| Multi-brand/region | Organization discovery | Tenant boundary và content sharing |
| Store Manager/Super Admin app roles | Sau scope tương ứng | RLS hierarchy và permission matrix runtime |
| Multi-role | Khi có use case thật | UI context, role assignment và migration |

## Hệ quả đối với blueprint cũ

- Mệnh đề “published content luôn có full immutable version” là kiến trúc đích, **deferred** trong Sprint 4.
- Endpoint `/api/v1` trong API Blueprint là hướng tương lai, không phải deliverable Sprint 4.
- `user_roles` nhiều role trong Database Blueprint không phải runtime model Sprint 4; primary role có thể được biểu diễn tối giản nhưng không khóa đường nâng cấp.
- Store không tạo quan hệ Region/Brand/Department trong migration MVP.
- Permission Matrix đầy đủ vẫn là target model; Sprint 4 chỉ thực thi hai policy class Employee/Trainer.

## Acceptance criteria cấp sản phẩm

- Employee đăng nhập và chỉ thấy course published từ Supabase.
- Trainer đăng nhập, vào được Trainer routes và đọc draft/published nhưng không có mutation nội dung.
- Production seed chỉ có một course thật được duyệt.
- Tiến độ local hợp lệ chỉ import một lần khi server chưa có dữ liệu; server không bao giờ bị ghi đè.
- Employee không thể lấy answer key trước submit bằng UI, Supabase client hay direct request có session của mình.
- Result sau submit đúng, truy vết được attempt và chỉ owner đọc được.
- Không có UI/backend behavior ngoài [Sprint 4 Scope](15-sprint-4-scope.md).
