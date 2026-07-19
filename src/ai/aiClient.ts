import { AiClientError, type AiErrorPayload, type GenerateCourseRequest, type GenerateCourseResponse, type RegenerateSectionRequest, type RegenerateSectionResponse } from './contracts'

const messages: Record<string, string> = {
  AI_NOT_CONFIGURED: 'AI chưa được cấu hình trên máy chủ.', AI_UNAUTHORIZED: 'Cấu hình AI không hợp lệ. Hãy liên hệ quản trị viên.', AI_RATE_LIMITED: 'AI đang nhận quá nhiều yêu cầu. Vui lòng thử lại sau.', AI_TIMEOUT: 'AI xử lý quá thời gian cho phép.', AI_PROVIDER_ERROR: 'AI provider tạm thời không khả dụng.', AI_INVALID_RESPONSE: 'AI trả về dữ liệu không đọc được.', AI_SCHEMA_VALIDATION_FAILED: 'AI trả về cấu trúc khóa học không hợp lệ.', AI_SOURCE_TOO_SHORT: 'Nội dung nguồn quá ngắn.', AI_SOURCE_TOO_LARGE: 'Nội dung nguồn vượt giới hạn.', AI_UNSUPPORTED_SOURCE: 'Nguồn chưa có nội dung text để AI xử lý.', AI_NETWORK_ERROR: 'Không thể kết nối tới dịch vụ AI.',
}

async function request<T>(endpoint: string, body: unknown, signal?: AbortSignal): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal })
      const payload: unknown = await response.json().catch(() => null)
      if (!response.ok) {
        const detail = payload as AiErrorPayload | null
        const code = detail?.error?.code ?? 'AI_PROVIDER_ERROR'
        throw new AiClientError(code, messages[code] ?? 'Không thể xử lý yêu cầu AI.', Boolean(detail?.error?.retryable))
      }
      return payload as T
    } catch (error) {
      if (error instanceof AiClientError) throw error
      if (signal?.aborted) throw new AiClientError('AI_TIMEOUT', messages.AI_TIMEOUT)
      if (attempt === 0) continue
      throw new AiClientError('AI_NETWORK_ERROR', messages.AI_NETWORK_ERROR, true)
    }
  }
  throw new AiClientError('AI_NETWORK_ERROR', messages.AI_NETWORK_ERROR, true)
}

export const aiClient = {
  generateCourse: (input: GenerateCourseRequest, signal?: AbortSignal) => request<GenerateCourseResponse>('/.netlify/functions/ai-course-generate', input, signal),
  regenerateSection: (input: RegenerateSectionRequest, signal?: AbortSignal) => request<RegenerateSectionResponse>('/.netlify/functions/ai-course-regenerate', input, signal),
}
