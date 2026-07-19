# AI-5 — AI Instructional Designer

## Mục tiêu

AI-5 thêm một tầng trung gian độc lập giữa `Normalized Document` và AI Course Draft:

```text
Normalized Document
  -> Instructional Analysis
  -> Content Classification
  -> Learning Objectives
  -> Instructional Graph
  -> Trainer Review / Approve
  -> sẵn sàng cho AI-6
```

Sprint này không chuyển graph thành Course, không tạo production block và không publish.

## Ranh giới kiến trúc

- Frontend gọi `analyzeInstructionalDesign`; không phụ thuộc OpenAI hay provider cụ thể.
- Netlify Function `ai-instructional-analyze` là biên server-side duy nhất gọi provider.
- Endpoint chỉ nhận `DocumentHandoff` đã chuẩn hóa, không nhận raw binary.
- Instructional Graph dùng storage riêng `fstudio_ai_instructional_graphs`, không dùng ContentService và không ghi đè AI Course Draft cũ.
- Provider output phải qua parser và `validateInstructionalGraph`.
- Khi provider không sẵn sàng, fallback chỉ chạy khi Trainer chủ động chọn trên UI hoặc cấu hình server cho phép ngoài production. Output được gắn nhãn `rule_based`.

## Traceability và explainability

Objective, classification, instructional unit, key message, interaction và assessment candidate chứa `sourceReferences`. Reference trỏ tới document, section, element và excerpt nguồn. Mỗi classification, format và sequence có lý do; confidence thấp tạo warning để Trainer xác minh.

## Approval gate

Approve chỉ mở khi:

- learning goal đã review;
- mọi objective và unit đã review;
- source coverage đã được xem;
- không còn validation error;
- mọi important warning đã resolve hoặc dismiss kèm lý do.

Kết quả approve chỉ cập nhật trạng thái Instructional Graph thành `approved`.

## Rule-based fallback

Fallback deterministic ánh xạ retail signal sang content classification, tạo objective có hành vi quan sát được, đề xuất format theo mục đích, sắp xếp từ kiến thức đến ứng dụng, tạo assessment blueprint và chấm sales relevance. Fallback không bịa dữ kiện ngoài source và luôn yêu cầu Trainer review.

## Bảo mật

- API key chỉ đọc từ environment của Netlify Function.
- Frontend không chứa provider secret.
- Endpoint có POST guard, rate limit, validation và safe error response.
- Production không tự động bật mock/rule-based fallback khi provider lỗi.

## Giới hạn đã biết

- AI-5 chưa sinh AI Course Draft; bước này thuộc AI-6.
- Rule-based classifier dựa trên retail signal từ Document Intelligence, nên độ sâu phụ thuộc chất lượng parser.
- Storage hiện là localStorage phục vụ pilot một trình duyệt, chưa có đồng bộ nhiều thiết bị.
- UI cho dismiss warning dùng lý do do Trainer nhập; chưa có audit trail backend.
