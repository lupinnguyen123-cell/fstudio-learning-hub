import { ServerAiError } from './errorMapper'
import { OpenAiProvider } from './openAiProvider'
import type { AiProvider, AiProviderConfig } from './provider'

export function readProviderConfig(env: NodeJS.ProcessEnv = process.env): AiProviderConfig {
  const provider = env.AI_PROVIDER?.trim().toLowerCase()
  const apiKey = env.AI_API_KEY?.trim()
  if (!provider || !apiKey) throw new ServerAiError('AI_NOT_CONFIGURED', 503, 'AI provider is not configured.')
  if (provider !== 'openai') throw new ServerAiError('AI_NOT_CONFIGURED', 503, 'Configured AI provider is not supported.')
  return { provider, apiKey, model: env.AI_MODEL?.trim() || 'gpt-4.1-mini', timeoutMs: bounded(env.AI_REQUEST_TIMEOUT_MS, 60_000, 5_000, 120_000), maxSourceChars: bounded(env.AI_MAX_SOURCE_CHARS, 30_000, 500, 100_000), enableMockFallback: env.AI_ENABLE_MOCK_FALLBACK === 'true' }
}

const bounded = (value: string | undefined, fallback: number, min: number, max: number) => { const parsed = Number(value); return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback }
export function createProvider(config = readProviderConfig()): AiProvider { return new OpenAiProvider(config) }
