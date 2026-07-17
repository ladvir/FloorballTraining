import type { AiProvider } from '../../types/domain.types'

/**
 * Provider catalog for the UI. Model ids are suggestions only — the field is free
 * text end to end, so a provider's catalog change never requires a deploy.
 */
export const AI_PROVIDER = {
  Anthropic: 0,
  OpenAi: 1,
  Gemini: 2,
} as const

export interface AiProviderInfo {
  value: AiProvider
  label: string
  /** First entry is the suggested default. */
  suggestedModels: string[]
  keyPlaceholder: string
}

export const AI_PROVIDERS: AiProviderInfo[] = [
  {
    value: AI_PROVIDER.Anthropic,
    label: 'Anthropic Claude',
    suggestedModels: ['claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5'],
    keyPlaceholder: 'sk-ant-…',
  },
  {
    value: AI_PROVIDER.OpenAi,
    label: 'OpenAI (GPT)',
    suggestedModels: ['gpt-4o', 'gpt-4o-mini'],
    keyPlaceholder: 'sk-…',
  },
  {
    value: AI_PROVIDER.Gemini,
    label: 'Google Gemini',
    // Free-tier friendly models only — gemini-1.5-pro has limit 0 on the free
    // tier and fails every call with a misleading 429.
    suggestedModels: ['gemini-2.0-flash', 'gemini-2.0-flash-lite'],
    keyPlaceholder: 'AIza…',
  },
]

export function providerLabel(provider: AiProvider | null | undefined): string {
  return AI_PROVIDERS.find((p) => p.value === provider)?.label ?? '—'
}
