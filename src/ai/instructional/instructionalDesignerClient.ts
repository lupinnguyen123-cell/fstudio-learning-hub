import { InstructionalClientError } from './contracts'
import type { InstructionalAnalysisRequest, InstructionalAnalysisResponse } from './instructionalGraph'

export async function analyzeInstructionalDesign(request: InstructionalAnalysisRequest, signal?: AbortSignal): Promise<InstructionalAnalysisResponse> {
  try { const response = await fetch('/.netlify/functions/ai-instructional-analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request), signal }); const payload: unknown = await response.json().catch(() => null); if (!response.ok) { const code = typeof payload === 'object' && payload !== null && 'error' in payload && typeof payload.error === 'object' && payload.error !== null && 'code' in payload.error ? String(payload.error.code) : 'INSTRUCTIONAL_ANALYSIS_FAILED'; throw new InstructionalClientError(code as InstructionalClientError['code'], 'Không thể phân tích instructional design.') } return payload as InstructionalAnalysisResponse }
  catch (error) { if (error instanceof InstructionalClientError) throw error; if (signal?.aborted) throw new InstructionalClientError('INSTRUCTIONAL_TIMEOUT', 'Đã hủy hoặc hết thời gian phân tích.'); throw new InstructionalClientError('INSTRUCTIONAL_ANALYSIS_FAILED', 'Không thể kết nối Instructional Designer.') }
}
