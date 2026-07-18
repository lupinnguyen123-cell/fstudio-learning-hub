# Executive Summary

[← Mục lục](./README.md)

## Mục lục

- [1. Bối cảnh](#1-bối-cảnh)
- [2. Kiến trúc sản phẩm](#2-kiến-trúc-sản-phẩm)
- [3. Dữ liệu và versioning](#3-dữ-liệu-và-versioning)
- [4. Security và permission](#4-security-và-permission)
- [5. API và workflow](#5-api-và-workflow)
- [6. Analytics](#6-analytics)
- [7. Lộ trình triển khai](#7-lộ-trình-triển-khai)
- [8. Tiêu chí sẵn sàng](#8-tiêu-chí-sẵn-sàng)
- [Tài liệu liên quan](#tài-liệu-liên-quan)

## 1. Bối cảnh

F.Studio Learning Hub là nền tảng học tập nội bộ cho chuỗi bán lẻ, giúp nhân viên cửa hàng nắm kiến thức sản phẩm, kỹ năng tư vấn và chiến dịch bán hàng; đồng thời cung cấp cho Trainer công cụ quản trị nội dung và theo dõi hiệu quả đào tạo. Sprint 1–3 đã xác lập frontend, luồng học bằng dữ liệu mock, thiết kế Employee/Trainer và design system. Architecture Freeze này chuyển các quyết định sản phẩm thành hợp đồng kỹ thuật trước khi tích hợp backend.

Nền tảng phục vụ bốn nhóm vai trò. Employee học và theo dõi tiến độ cá nhân. Trainer xây nội dung, quản lý publish workflow và phân tích hiệu quả. Store Manager theo dõi đội ngũ thuộc phạm vi cửa hàng, nhắc học nhưng không chỉnh nội dung. Super Admin quản trị cấu trúc Brand–Region–Store, quyền, taxonomy và chính sách toàn hệ thống.

## 2. Kiến trúc sản phẩm

Hệ thống được chia thành sáu bounded context logic:

1. **Organization:** Brand, Region, Store, Department và membership.
2. **Identity & Access:** User, Role, Permission và phạm vi quyền.
3. **Content:** Course, Module, Lesson, LessonBlock, Quiz, Question, Choice và media reference.
4. **Learning:** Assignment, Progress, Attempt, Certificate, Bookmark, Favorite và LearningHistory.
5. **Engagement:** Notification và reminder policy.
6. **Observability:** ActivityLog và analytics projection.

Course có cấu trúc Course → Module → Lesson để phản ánh lộ trình học và hỗ trợ tái sử dụng logic điều hướng. LessonBlock là mô hình nội dung có cấu trúc, cho phép CMS block editor mở rộng mà không thay đổi bảng lesson hoặc frontend renderer cho mỗi loại nội dung mới. Quiz thuộc Course; Question liên kết ngược đến Module/Lesson để tạo remediation flow chính xác.

Assignment được tách khỏi Course vì một nội dung có thể được giao nhiều lần cho các cohort khác nhau, deadline khác nhau và chính sách bắt buộc khác nhau. Progress phản ánh trạng thái học hiện tại; LearningHistory là chuỗi sự kiện phục vụ timeline; ActivityLog là audit log cho hành động quản trị. Ba khái niệm không được gộp vì có retention, bảo mật và mục đích truy vấn khác nhau.

## 3. Dữ liệu và versioning

Nội dung được quản lý theo vòng đời Draft → Review → Published → Archived. Bản published phải bất biến. Khi chỉnh sửa nội dung đang published, CMS tạo version mới; progress và attempt tiếp tục tham chiếu version mà người học đã sử dụng. Điều này bảo vệ tính nhất quán của kết quả, certificate và analytics.

Quiz attempt phải snapshot nội dung câu hỏi, lựa chọn và đáp án đúng tại thời điểm submit. Nếu Trainer sửa quiz sau đó, lịch sử đánh giá vẫn có thể giải thích và kiểm toán. Certificate tham chiếu course version, attempt đạt và policy phát hành.

Database blueprint ưu tiên mô hình quan hệ với khóa ngoại rõ ràng. Các trường linh hoạt của LessonBlock có thể lưu payload có schema theo block type, nhưng metadata tìm kiếm, thứ tự, version và quan hệ phải là cột có cấu trúc. Soft delete chỉ dùng khi cần audit; dữ liệu nghiệp vụ không bị xóa vật lý tùy tiện.

## 4. Security và permission

Authentication và authorization sẽ được triển khai ở Sprint 4, nhưng tài liệu này đã đóng băng mô hình quyền. Quyền được đánh giá theo tổ hợp `permission + scope`: self, store, region, brand hoặc global. Store Manager chỉ xem nhân viên thuộc store được cấp; Trainer chỉ quản trị content/analytics trong brand hoặc category được giao; Super Admin có quyền cấu hình toàn hệ thống.

Frontend route guard không phải biện pháp bảo mật. Mọi API phải kiểm tra session, role, permission và scope phía server. Publish, role change, export và assignment là hành động nhạy cảm, bắt buộc ghi ActivityLog. Export nhân sự và analytics chi tiết cần giới hạn trường dữ liệu, rate limit và audit.

## 5. API và workflow

API được thiết kế resource-oriented. Read endpoint hỗ trợ pagination, filter, sort và stable error envelope. Write endpoint dùng optimistic concurrency thông qua version hoặc updated-at precondition để tránh ghi đè. Publish và review là command endpoint vì chúng biểu diễn state transition có validation và side effects, không phải cập nhật trường trạng thái tùy ý.

Progress update phải idempotent. Quiz submit cần idempotency key để tránh tạo attempt trùng khi mạng chập chờn. Assignment và notification sử dụng background job khi quy mô tăng. Analytics không đọc trực tiếp từ transaction tables cho dashboard lớn; projections/materialized aggregates sẽ được xây sau khi metric definitions ổn định.

## 6. Analytics

Trainer Dashboard tập trung vào Completion Rate, Average Score, Difficult Questions, Weak Lessons, Weak Stores, Learning Heatmap và Recent Activity. Store Manager chỉ xem Shop Progress, Employees At Risk và Quiz Performance trong phạm vi store. Employee thấy Learning Journey, Achievement và Continue Learning của chính mình.

Mỗi metric có numerator, denominator, cohort, time window, version và minimum sample threshold. Weak Store không được xếp hạng cohort quá nhỏ. Average Score phải ghi rõ dùng first attempt, latest attempt hay best attempt. Dashboard mặc định dùng latest submitted attempt, trong khi content diagnostics dùng mọi attempt hợp lệ.

## 7. Lộ trình triển khai

Sprint 4 xây Identity, Supabase foundation và server-side authorization. Sprint 5 triển khai CMS. Sprint 6 triển khai analytics. Sprint 7 thêm Assignment. Sprint 8–10 lần lượt nghiên cứu AI Mentor, Scenario Simulator và Coaching Platform. AI không được triển khai trước khi có content governance, dữ liệu chất lượng, privacy review và human escalation.

## 8. Tiêu chí sẵn sàng

Một Sprint backend chỉ bắt đầu khi entity ownership, permission scope, API contract, state machine, validation, audit requirement và metric definition tương ứng đã được phê duyệt. Bộ tài liệu này cung cấp baseline đó. Các điểm còn phụ thuộc quyết định kinh doanh—certificate policy, review separation, retention và assignment escalation—được đánh dấu trong từng tài liệu và phải được Product Owner chốt trước implementation.

## Tài liệu liên quan

[Product Vision](./01-product-vision.md) · [Domain Model](./04-domain-model.md) · [API Blueprint](./08-api-blueprint.md) · [Risk Assessment](./12-risk-assessment.md)
