# Design Decisions

## Mục lục

- [Cách đọc](#cách-đọc)
- [Quyết định nền tảng](#quyết-định-nền-tảng)
- [Hệ quả cho triển khai](#hệ-quả-cho-triển-khai)

## Cách đọc

Đây là decision log onboarding. Mỗi quyết định ghi lý do, đánh đổi và hệ quả; thay đổi quyết định cần cập nhật tài liệu liên quan và kế hoạch migration.

## Quyết định nền tảng

| ID | Quyết định | Lý do | Đánh đổi / hệ quả |
|---|---|---|---|
| D01 | Cấu trúc `Course > Module > Lesson` | Phù hợp mental model, điều hướng và tiến độ | Course đơn giản vẫn cần ít nhất một module |
| D02 | Nội dung Lesson dùng `LessonBlock` | Block editor mở rộng, reorder và render nhất quán | Payload cần schema version, validation và migration |
| D03 | Course publish theo version bất biến | Kết quả học và certificate phải tái hiện được | Tốn lưu trữ, CMS cần draft/version rõ ràng |
| D04 | Progress chỉ theo lesson bắt buộc | Tỷ lệ dễ giải thích, không trộn quiz | Quiz eligibility và completion là rule riêng |
| D05 | Attempt là snapshot append-only | Chống sửa điểm lịch sử, hỗ trợ audit | Retake tạo record mới và tăng dữ liệu |
| D06 | Assignment tách Course | Một khóa có nhiều audience/deadline; khóa vẫn học tự chọn | Cần resolve target và xử lý thay đổi tổ chức |
| D07 | Notification là domain riêng | Hộp thư, read state, đa kênh và retry độc lập | Phải chống gửi trùng và quản lý preference |
| D08 | Bookmark tách Favorite | Bookmark trỏ vị trí trong bài; Favorite trỏ course | Hai endpoint/state nhưng semantics rõ |
| D09 | LearningHistory tách ActivityLog | Một bên phục vụ hành trình học, một bên audit quản trị | Retention và quyền xem khác nhau |
| D10 | RBAC kết hợp scope | Role đơn thuần không đủ cho store/region/owned | Policy engine phức tạp hơn nhưng tránh rò dữ liệu |
| D11 | Employee/Trainer là vai trò của user | Một người có thể vừa học vừa đào tạo | UX cần chuyển context; không tạo account trùng |
| D12 | Question map về Lesson | Kết quả chỉ đúng nội dung cần cải thiện | Trainer phải duy trì mapping khi sửa quiz |
| D13 | Analytics là projection, domain record là nguồn | Dashboard nhanh mà không làm méo transaction | Có độ trễ; phải hiển thị freshness/reconcile |
| D14 | Command endpoint cho publish/archive/remind | Ý định, permission và audit rõ | Nhiều endpoint hơn generic update |
| D15 | ID ổn định, slug chỉ để hiển thị | Đổi tên không phá liên kết/lịch sử | Route cần resolve ID hoặc ID + slug |
| D16 | UTC trong lưu trữ, timezone tại biên | So sánh liên vùng chính xác | UI/report phải truyền timezone rõ |
| D17 | localStorage Sprint 2 là tạm thời | Cho prototype không backend | Sprint 4 cần migration/reset strategy, không coi là nguồn thật |

## Hệ quả cho triển khai

- Backend Sprint 4 phải ưu tiên identity, scope, version và idempotency trước CRUD diện rộng.
- CMS không được cho sửa trực tiếp bản published; preview phải dùng cùng renderer Employee.
- Analytics không đọc tùy tiện từ UI state; metric có contract và owner.
- Mọi migration từ mock/localStorage phải có compatibility window và test dữ liệu mẫu.
- Security gate bao gồm server authorization, audit, input/media validation và chống lộ scope.

Nguồn chi tiết: [Domain Model](04-domain-model.md), [Database Blueprint](05-database-blueprint.md), [CMS Blueprint](07-cms-blueprint.md) và [API Blueprint](08-api-blueprint.md).
