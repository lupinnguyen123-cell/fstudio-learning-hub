# F.Studio Learning Hub — Architecture Freeze

## Mục lục

1. [Executive Summary](./00-executive-summary.md)
2. [Product Vision](./01-product-vision.md)
3. [Information Architecture](./02-information-architecture.md)
4. [User Flows](./03-user-flows.md)
5. [Domain Model](./04-domain-model.md)
6. [Database Blueprint](./05-database-blueprint.md)
7. [Permission Matrix](./06-permission-matrix.md)
8. [CMS Blueprint](./07-cms-blueprint.md)
9. [API Blueprint](./08-api-blueprint.md)
10. [Analytics Design](./09-analytics-design.md)
11. [Design Decisions](./10-design-decisions.md)
12. [Future Roadmap](./11-future-roadmap.md)
13. [Risk Assessment](./12-risk-assessment.md)
14. [Architecture Validation](./13-architecture-validation.md)
15. [Product Owner Decisions](./14-product-owner-decisions.md)
16. [Sprint 4 Scope](./15-sprint-4-scope.md)
17. [Supabase Security Model](./16-supabase-security-model.md)
18. [localStorage Migration Plan](./17-localstorage-migration-plan.md)

## Trạng thái

Architecture Freeze sau Sprint 3. Tài liệu là baseline cho thiết kế backend, CMS và analytics. Mọi thay đổi ảnh hưởng domain, quyền, API hoặc dữ liệu phải được ghi nhận bằng quyết định kiến trúc trước khi triển khai.

Architecture Validation ban đầu đưa ra **Conditional Go**. Các blocker đã được Product Owner chốt và ghi nhận ngày 18/07/2026; phạm vi Sprint 4 hiện ở trạng thái **Go**, theo các giới hạn trong [Sprint 4 Scope](./15-sprint-4-scope.md). Tài liệu 14–17 là decision delta và được ưu tiên khi có khác biệt với blueprint 00–12.

## Quy ước

- ID là định danh bất biến; slug chỉ phục vụ URL.
- Thời gian lưu theo UTC, hiển thị theo múi giờ cửa hàng/người dùng.
- Nội dung published là version bất biến.
- Quyền luôn được kiểm tra phía server; frontend chỉ phản ánh trạng thái.
- Dữ liệu analytics phải ghi rõ phạm vi, thời gian và cách tính.
