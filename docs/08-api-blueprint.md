# API Blueprint

## Mục lục

- [Quy ước contract](#quy-ước-contract)
- [Endpoint catalog](#endpoint-catalog)
- [Lỗi và tính nhất quán](#lỗi-và-tính-nhất-quán)
- [Yêu cầu phi chức năng](#yêu-cầu-phi-chức-năng)

## Quy ước contract

Blueprint này mô tả hành vi, không phải mã API. Prefix version dự kiến `/api/v1`. Request/response dùng ID ổn định, thời gian UTC, pagination cursor cho danh sách lớn. Authentication nghĩa là session hợp lệ; authorization luôn kiểm tra role + permission + scope theo [Permission Matrix](06-permission-matrix.md).

## Endpoint catalog

### Session và tổ chức

| Endpoint | Request | Response | Authentication | Role requirement |
|---|---|---|---|---|
| `GET /me` | Không có body | Hồ sơ, roles, scopes, capabilities | Bắt buộc | Mọi role |
| `GET /brands` | Filter trạng thái | Danh sách brand | Bắt buộc | Super Admin; role khác chỉ scope hiện tại |
| `GET /regions` | brandId, cursor | Danh sách region | Bắt buộc | Store Manager scoped, Super Admin |
| `GET /stores` | regionId, search, cursor | Danh sách store | Bắt buộc | Trainer scoped, Store Manager, Super Admin |

### Learning và nội dung đã publish

| Endpoint | Request | Response | Authentication | Role requirement |
|---|---|---|---|---|
| `GET /courses` | search, category, status, cursor | Course cards và quyền truy cập | Bắt buộc | Mọi role theo scope |
| `GET /courses/{courseId}` | courseId | Course, module summary, progress | Bắt buộc | Người được phép xem |
| `GET /courses/{courseId}/lessons` | version, cursor | Lesson outline và trạng thái | Bắt buộc | Người được phép xem |
| `GET /lessons/{lessonId}` | version | Lesson blocks đã publish | Bắt buộc | Người được phép học/preview |
| `PATCH /progress/{lessonId}` | status, client timestamp, idempotency key | Progress khóa và course summary | Bắt buộc | Employee self |
| `GET /learning/continue` | optional courseId | Destination và reason | Bắt buộc | Employee self |
| `GET /learning/history` | filters, cursor | Timeline học | Bắt buộc | Employee self; quản lý theo scope |

### Quiz và chứng nhận

| Endpoint | Request | Response | Authentication | Role requirement |
|---|---|---|---|---|
| `GET /quizzes/{quizId}` | course version | Câu hỏi không lộ đáp án; lock status | Bắt buộc | Employee đủ điều kiện; Trainer preview |
| `PUT /quiz-drafts/{quizId}` | answers, draftVersion | Draft đáp án và version mới | Bắt buộc | Employee self |
| `POST /quiz-attempts` | quizId, answers, idempotency key | Attempt, score, pass/fail, improvement refs | Bắt buộc | Employee self |
| `GET /quiz-attempts/{attemptId}` | attemptId | Snapshot kết quả | Bắt buộc | Owner; quản lý theo quyền |
| `GET /courses/{courseId}/certificate` | courseId | Certificate hoặc trạng thái chưa đủ điều kiện | Bắt buộc | Employee self |

### CMS và publishing

| Endpoint | Request | Response | Authentication | Role requirement |
|---|---|---|---|---|
| `POST /cms/courses` | Metadata draft | Draft course + version | Bắt buộc | Trainer create; Super Admin |
| `PATCH /cms/courses/{courseId}` | Field changes, expectedVersion | Draft và version mới | Bắt buộc | Trainer owned; Super Admin |
| `POST /cms/courses/{courseId}/modules` | Title, position | Module draft | Bắt buộc | Trainer edit scoped |
| `POST /cms/modules/{moduleId}/lessons` | Metadata | Lesson draft | Bắt buộc | Trainer edit scoped |
| `PUT /cms/lessons/{lessonId}/blocks` | Ordered blocks, expectedVersion | Saved block set, validation | Bắt buộc | Trainer edit scoped |
| `PUT /cms/quizzes/{quizId}` | Policy, questions, expectedVersion | Quiz draft, validation | Bắt buộc | Trainer edit scoped |
| `POST /cms/courses/{courseId}/review` | Reviewer/comment | Review state | Bắt buộc | Trainer submit |
| `POST /cms/courses/{courseId}/publish` | expectedVersion, changelog | Published snapshot | Bắt buộc | Publish permission |
| `POST /cms/courses/{courseId}/archive` | reason | Archived state | Bắt buộc | Archive permission |

### Assignment, engagement và analytics

| Endpoint | Request | Response | Authentication | Role requirement |
|---|---|---|---|---|
| `POST /assignments` | courseId, targets, dueAt | Assignment + resolved counts | Bắt buộc | Trainer/Manager scoped; Super Admin |
| `GET /assignments` | scope, status, cursor | Assignments | Bắt buộc | Theo scope |
| `POST /assignments/{id}/reminders` | audience, message template | Dispatch summary | Bắt buộc | Store Manager/Trainer scoped |
| `PUT /bookmarks/{lessonId}` | blockId, note | Bookmark | Bắt buộc | Employee self |
| `PUT /favorites/{courseId}` | favorite boolean | Favorite state | Bắt buộc | Employee self |
| `GET /notifications` | unread, cursor | Notification inbox | Bắt buộc | Self |
| `PATCH /notifications/{id}` | read state | Notification | Bắt buộc | Self |
| `GET /analytics/overview` | scope, date range, filters | KPI + freshness | Bắt buộc | Trainer/Manager/Admin scoped |
| `POST /exports` | dataset, filters, reason | Export job reference | Bắt buộc | Export permission; audit |

## Lỗi và tính nhất quán

- Error contract gồm stable code, thông báo an toàn, field errors, correlation ID và retryability; không trả stack trace.
- `401` cho session không hợp lệ, `403` cho thiếu quyền, `404` không tiết lộ tài nguyên ngoài scope, `409` cho version conflict, `422` cho validation.
- Mutation dễ lặp dùng idempotency key; submit attempt và publish không được tạo trùng.
- Update CMS dùng expected version/ETag; conflict trả phiên bản hiện tại để UI giải quyết.
- Command có tác động (`publish`, `archive`, `reminders`) dùng endpoint hành động rõ thay vì cập nhật trạng thái tùy ý.

## Yêu cầu phi chức năng

- Rate limit theo user/IP và nghiêm hơn cho login, submit, export, reminder.
- Log có correlation ID nhưng không ghi đáp án nhạy cảm/token; hành động quản trị ghi audit.
- Analytics và export có thể bất đồng bộ; response nêu freshness và trạng thái job.
- Contract được version hóa; thay đổi breaking cần migration window và telemetry.

Xem [Database Blueprint](05-database-blueprint.md), [CMS Blueprint](07-cms-blueprint.md) và [Analytics Design](09-analytics-design.md).
