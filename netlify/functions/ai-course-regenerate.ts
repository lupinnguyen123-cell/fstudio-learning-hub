import { createProvider, readProviderConfig } from './_shared/ai/providerFactory'
import { enforceRateLimit, errorResponse, json, logResult, parseBody, requirePost } from './_shared/ai/http'
import { validateRegenerateRequest } from './_shared/ai/requestValidation'

export default async (request: Request) => {
  let requestId: string | undefined
  try {
    requirePost(request); enforceRateLimit(request, 20); const config = readProviderConfig(); const body = await parseBody(request); requestId = typeof body === 'object' && body !== null && 'requestId' in body ? String(body.requestId) : undefined; const input = validateRegenerateRequest(body, config.maxSourceChars); const response = await createProvider(config).regenerateSection(input)
    logResult({ requestId, provider: response.provider, model: response.model, status: 'success', latencyMs: response.latencyMs, sourceLength: input.sourceExcerpt.length, valid: true }); return json(response)
  } catch (error) { return errorResponse(error, requestId) }
}
