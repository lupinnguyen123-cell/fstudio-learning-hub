# F.Studio Learning Hub

Nền tảng E-learning nội bộ cho F.Studio với hai trải nghiệm:

- **Employee Learning:** học lesson tương tác, làm quiz, theo dõi progress, XP và badge.
- **Trainer CMS MVP:** tạo Course → Module → Lesson → LessonBlock, preview, publish và import/export JSON.

Phiên bản hiện tại vẫn lưu content và learning progress bằng localStorage, chưa có Supabase hoặc authentication thật. AI Course Authoring gọi provider qua Netlify Functions; secret không đi vào React bundle.

## Công nghệ

- React 19, Vite và TypeScript
- React Router
- Tailwind CSS và CSS design tokens
- Lucide React
- ESLint và Vitest
- Netlify

## Run local

Yêu cầu Node.js phiên bản LTS hiện hành và npm.

```bash
npm install
npm run dev
```

Mở URL Vite hiển thị trong terminal, mặc định là `http://localhost:5173`.

Các quality checks:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm audit
```

Để kiểm tra AI Functions local, cài/chạy Netlify CLI theo nhu cầu và dùng:

```bash
npx netlify dev
```

`npm run dev` vẫn dùng cho frontend thông thường, nhưng các endpoint `/.netlify/functions/*` chỉ hoạt động khi chạy qua Netlify Dev hoặc trên site đã deploy.

## Build

```bash
npm run build
```

Production output được tạo tại `dist/`. Có thể kiểm tra locally bằng:

```bash
npm run preview
```

## Trainer CMS

1. Dùng role switcher trên header và chọn **Trainer**.
2. Mở `/admin/courses`.
3. Chọn **Tạo khóa học** hoặc mở một course hiện có.
4. Cấu hình course, module, lesson, blocks, quiz, XP và badge.
5. Dùng Preview để kiểm tra cùng renderer với Employee.
6. Nhấn **Lưu**, sau đó **Publish**.

CMS dùng localStorage key `fstudio-learning-content`. Course Trainer tạo chỉ tồn tại trong browser profile hiện tại; chưa được đồng bộ giữa thiết bị.

## Employee Learning

1. Chọn role **Nhân viên**.
2. Mở `/courses` và chọn một published course.
3. Hoàn thành lesson bắt buộc để mở quiz.
4. Làm các hoạt động tương tác và quiz cuối khóa.
5. XP, badge, progress và quiz attempts được giữ sau reload.

Learning state dùng localStorage key `fstudio-learning-progress`. Mock role dùng key `fstudio-learning-role`. Route guard hiện tại chỉ phục vụ pilot frontend, không phải authorization bảo mật.

## Import / Export JSON

Trong Course Builder, mở tab **Import / Export**:

- **Export course:** tải JSON của course đang mở.
- **Export tất cả:** tải toàn bộ content store và `schemaVersion`.
- **Import:** chọn file JSON hợp lệ, sau đó chọn ghi đè, tạo bản sao hoặc hủy khi ID bị trùng.
- **Reset content:** khôi phục content seed mặc định.

Nên export backup trước khi reset hoặc import ghi đè. Không commit file dữ liệu cá nhân hoặc JSON chứa nội dung nhạy cảm.

## Deploy Netlify

Project đã có `netlify.toml`:

- Build command: `npm run build`
- Publish directory: `dist`
- SPA fallback: mọi route được redirect về `/index.html` với status 200

Triển khai từ Netlify UI:

1. Push repository lên GitHub.
2. Trong Netlify, chọn **Add new site → Import an existing project**.
3. Kết nối repository.
4. Xác nhận build command và publish directory từ `netlify.toml`.
5. Deploy, sau đó smoke test `/`, `/courses`, một lesson route, quiz route và `/admin/courses`.

### Cấu hình AI provider

Trong **Site configuration → Environment variables**, cấu hình các biến server-side sau:

| Biến | Giá trị đề xuất |
|---|---|
| `AI_PROVIDER` | `openai` |
| `AI_API_KEY` | Secret API key; không thêm tiền tố `VITE_` |
| `AI_MODEL` | Model hỗ trợ Structured Outputs, ví dụ `gpt-4.1-mini` |
| `AI_REQUEST_TIMEOUT_MS` | `60000` |
| `AI_MAX_SOURCE_CHARS` | `30000` |
| `AI_ENABLE_MOCK_FALLBACK` | `false` trong production |

Sau khi thay đổi biến môi trường, trigger deploy mới. File [`.env.example`](./.env.example) chỉ chứa tên biến và cấu hình không nhạy cảm. Không commit `.env`, `.env.local` hoặc `.netlify/.env`.

AI thật hiện chỉ nhận nội dung Trainer dán, TXT hoặc Markdown có text hợp lệ. PDF, PPTX và DOCX chưa được parse; UI không gửi phần metadata/mock text tới provider. Nếu provider chưa được cấu hình, production hiển thị lỗi rõ ràng. Development có thể chọn tạo mock draft thủ công và draft đó luôn được gắn nhãn mô phỏng.

Không commit `.env`, `.env.local`, `node_modules` hoặc `dist`.

## Routes chính

| Nhóm | Routes |
|---|---|
| Employee | `/`, `/courses`, `/courses/:courseId`, `/journey`, `/profile` |
| Learning | `/learn/:courseId/:lessonId`, `/quiz/:courseId`, `/results/:courseId` |
| Trainer | `/admin/courses`, `/admin/courses/new`, `/admin/courses/:courseId/edit` |
| System | `/404` và fallback route |

## Architecture documentation

Bộ tài liệu Product Architecture, validation, Sprint 4 scope và security planning nằm trong [`docs/`](./docs/). Tài liệu thiết kế Sprint 3 bổ sung nằm trong [`outputs/`](./outputs/).
