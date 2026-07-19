import type { GenerateCourseRequest, RegenerateSectionRequest } from '../../../../src/ai/contracts'

export const systemInstruction = `Bạn là Instructional Designer chuyên đào tạo nhân viên bán lẻ F.Studio. Chỉ sử dụng dữ kiện trong source. Không bịa giá, khuyến mãi, thời hạn, bảo hành hoặc thông số sản phẩm. Mọi nội dung không chắc chắn phải tạo trainer_verification hoặc time_sensitive warning. Phân biệt Product Knowledge với Sales Scenario. Lesson phải ngắn, rõ learning focus và ưu tiên Apply at Store. Chỉ trả JSON hợp lệ, không code fence, không HTML, không giải thích ngoài JSON và không tạo block type ngoài schema.`

export function generationPrompt(request: GenerateCourseRequest) {
  return [`SOURCE CONTEXT:\n${request.sourceDocument.extractedText}`, `AUTHORING RULES:\nLanguage: ${request.language}. Course type: ${request.courseType}. Audience: ${request.audience}. Tone: ${request.tone}. Retail context: ${request.retailContext}. Desired modules: ${request.desiredModuleCount ?? 'derive from source'}. Lesson length: ${request.desiredLessonLength ?? 'short'}. Include quiz: ${request.includeQuiz}. Include scenario: ${request.includeScenario}. Include flashcards: ${request.includeFlashcards}.`, `OUTPUT RULES:\nReturn one AiCourseDraft JSON. Draft IDs must start with ai-. Never create a production Course ID. status must be needs_review. category must match course type. Include warnings for claims Trainer must verify. createdAt and updatedAt must be ISO timestamps. XP and badge are conservative MVP values.`].join('\n\n')
}

export function regenerationPrompt(request: RegenerateSectionRequest) {
  return [`ACTION: ${request.action}`, `INSTRUCTION: ${request.instruction}`, `PARENT CONTEXT: ${JSON.stringify(request.parentContext)}`, `SELECTED ITEM: ${JSON.stringify(request.selectedItem)}`, `SOURCE EXCERPT: ${request.sourceExcerpt}`, 'Return JSON with only an "after" string. Preserve facts and language. Do not introduce prices, promotions, policy or specifications absent from source.'].join('\n\n')
}
