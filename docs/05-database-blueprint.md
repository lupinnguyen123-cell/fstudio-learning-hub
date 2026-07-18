# Database Blueprint

## Mục lục

- [Nguyên tắc](#nguyên-tắc)
- [Bảng lõi](#bảng-lõi)
- [Bảng liên kết cần thiết](#bảng-liên-kết-cần-thiết)
- [Quy tắc dữ liệu](#quy-tắc-dữ-liệu)

## Nguyên tắc

Đây là blueprint khái niệm, không phải schema hay SQL. Mọi bảng dùng khóa định danh ổn định, thời gian UTC, trường tạo/cập nhật và cơ chế archive khi phù hợp. Dữ liệu tổ chức và nội dung phải có phạm vi tenant/brand ngay từ thiết kế.

## Bảng lõi

| Bảng | Purpose | Primary Key | Foreign Keys | Index gợi ý |
|---|---|---|---|---|
| users | Danh tính và hồ sơ chung | id | store_id, department_id | email unique; employee_code; store_id + status |
| roles | Nhóm quyền | id | — | code unique; status |
| permissions | Hành động nguyên tử | id | — | resource + action + scope_type unique |
| brands | Thương hiệu | id | — | code unique; status |
| regions | Vùng thuộc thương hiệu | id | brand_id | brand_id + code unique |
| stores | Cửa hàng thuộc vùng | id | region_id | region_id + code unique; status |
| courses | Metadata và vòng đời khóa | id | owner_id, brand_id | status + published_at; category; owner_id |
| modules | Cấu trúc cấp module | id | course_id | course_id + position unique |
| lessons | Đơn vị học | id | module_id | module_id + position unique; required |
| lesson_blocks | Nội dung có thứ tự | id | lesson_id | lesson_id + position unique; type |
| quizzes | Chính sách đánh giá | id | course_id | course_id + version unique; status |
| questions | Câu hỏi và trọng số | id | quiz_id, lesson_ref_id | quiz_id + position; lesson_ref_id |
| choices | Phương án câu hỏi | id | question_id | question_id + position unique |
| progress | Tiến độ bài học | id | user_id, lesson_id, course_version_id | user_id + lesson_id unique; user_id + status |
| attempts | Lần nộp quiz | id | user_id, quiz_id, course_version_id | user_id + quiz_id + submitted_at; passed |
| assignments | Yêu cầu học và hạn | id | course_id, created_by | status + due_at; course_id |
| certificates | Chứng nhận | id | user_id, course_id, course_version_id | certificate_no unique; user_id + course_id |
| notifications | Hộp thông báo | id | user_id | user_id + read_at + created_at; type |
| bookmarks | Điểm lưu bài học | id | user_id, lesson_id, block_id | user_id + lesson_id; user_id + block_id unique |
| favorites | Khóa yêu thích | id | user_id, course_id | user_id + course_id unique |
| activity_logs | Audit hành động quản trị | id | actor_id | actor_id + occurred_at; resource_type + resource_id |
| learning_history | Dòng thời gian học | id | user_id, course_id, lesson_id | user_id + occurred_at; course_id + event_type |

## Bảng liên kết cần thiết

Các bảng sau bổ sung để mô hình có thể triển khai nhất quán; chúng không thay đổi danh sách domain:

| Bảng | Mục đích | Ràng buộc/index chính |
|---|---|---|
| user_roles | Gán nhiều role cho user theo scope | unique user_id + role_id + scope_type + scope_id |
| role_permissions | Ánh xạ role–permission | unique role_id + permission_id |
| store_memberships | Lịch sử người dùng thuộc cửa hàng/phòng ban | user_id + effective_from; chỉ một membership hiện hành |
| course_versions | Đóng băng nội dung đã publish | unique course_id + version; status + published_at |
| assignment_targets | Một assignment nhắm region/store/department/user | assignment_id + target_type + target_id unique |
| attempt_answers | Snapshot câu trả lời khi nộp | attempt_id + question_id unique |

## Quy tắc dữ liệu

- Nội dung publish chỉ đọc; draft mới không làm thay đổi trải nghiệm đang học.
- Unique constraint bảo vệ idempotency cho progress, favorite, bookmark và certificate.
- Xóa nghiệp vụ mặc định là archive/soft delete; audit log không được cập nhật hoặc xóa từ luồng ứng dụng.
- Câu trả lời attempt lưu snapshot nội dung cần chấm để kết quả không đổi khi quiz có version mới.
- Index ưu tiên truy vấn có scope và thời gian; kiểm tra query plan trước khi thêm index tổng hợp.
- PII tối thiểu, có thời hạn lưu, export và xóa theo chính sách tổ chức.

Quan hệ nghiệp vụ ở [Domain Model](04-domain-model.md); quyền truy cập ở [Permission Matrix](06-permission-matrix.md).
