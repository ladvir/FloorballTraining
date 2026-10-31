import type { ActivitySuggestionDto, LinkPreviewDto } from '../../types/domain.types'

/**
 * Instagram/Facebook link shared into the installed PWA (Web Share Target, see the
 * `share_target` entry in vite.config.ts). Kept in sessionStorage so it survives a
 * detour through the login page.
 */
export interface PendingShare {
  url: string
  /** Free text that came with the share (Instagram often sends caption-less text + URL). */
  text?: string
}

export type SocialSource = 'instagram' | 'facebook'

const STORAGE_KEY = 'flotr.pendingShare'

/** Same allow-list as the API's SocialLinkHelper. */
const HOSTS: Record<SocialSource, string[]> = {
  instagram: ['instagram.com'],
  facebook: ['facebook.com', 'fb.watch', 'fb.me', 'fb.com'],
}

const TRACKING_PARAMS = /^(igsh|igshid|mibextid|rdid|share_url|fbclid|utm_.*)$/i

/**
 * Android share sheets put the link in `url`, `text` or even `title` depending on the app,
 * often surrounded by other text — so take the first http(s) URL found in any of them.
 */
export function extractSharedUrl(params: URLSearchParams): string | null {
  for (const key of ['url', 'text', 'title']) {
    const match = params.get(key)?.match(/https?:\/\/[^\s"'<>]+/i)
    if (match) return match[0].replace(/[).,;!?]+$/, '')
  }
  return null
}

/** Drops share-tracking query parameters (igsh, mibextid, utm_*…) and the fragment. */
export function cleanSharedUrl(raw: string): string {
  const url = new URL(raw)
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.test(key)) url.searchParams.delete(key)
  }
  url.hash = ''
  return url.toString()
}

export function getSocialSource(raw: string | null | undefined): SocialSource | null {
  if (!raw) return null
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' || url.port !== '') return null
  const host = url.hostname.toLowerCase()
  for (const [source, hosts] of Object.entries(HOSTS) as [SocialSource, string[]][]) {
    if (hosts.some((h) => host === h || host.endsWith(`.${h}`))) return source
  }
  return null
}

/** Shared text minus the URL itself — whatever the user/app added around the link. */
export function sharedTextWithoutUrl(share: PendingShare): string {
  return (share.text ?? '').replace(/https?:\/\/[^\s"'<>]+/gi, '').trim()
}

export function savePendingShare(share: PendingShare) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(share))
  } catch {
    /* storage unavailable — the share is lost, the user can paste the link manually */
  }
}

export function loadPendingShare(): PendingShare | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PendingShare
    return typeof parsed?.url === 'string' ? parsed : null
  } catch {
    return null
  }
}

export function hasPendingShare(): boolean {
  return loadPendingShare() != null
}

export function clearPendingShare() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/** The best text we have describing the drill: parsed caption, raw OG description, shared text. */
export function bestSourceText(preview: LinkPreviewDto | undefined, share: PendingShare): string {
  return (
    preview?.caption?.trim() || preview?.description?.trim() || sharedTextWithoutUrl(share) || ''
  )
}

const NAME_MAX = 50 // matches the activity form's zod schema
const DESCRIPTION_MAX = 5000

function truncate(value: string, max: number) {
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`
}

/** Prefill for the activity form without AI: first caption line as name, caption + link as description. */
export function buildManualSuggestion(
  url: string,
  sourceText: string,
  fallbackName: string,
  sourceLabel: string
): ActivitySuggestionDto {
  const firstLine =
    sourceText
      .split('\n')
      .map((l) => l.replace(/#\S+/g, '').trim())
      .find((l) => l.length > 0) ?? ''
  const description = [sourceText, `${sourceLabel}: ${url}`].filter(Boolean).join('\n\n')

  return {
    name: truncate(firstLine || fallbackName, NAME_MAX),
    description: truncate(description, DESCRIPTION_MAX),
    durationMin: 5,
    durationMax: 20,
    personsMin: 10,
    personsMax: 30,
    tagIds: [],
    tagNames: [],
    ageGroupIds: [],
    ageGroupNames: [],
    equipmentIds: [],
    equipmentNames: [],
  }
}

/** AI suggestion keeps the AI's own description; make sure the source link is in it too. */
export function withSourceLink(
  suggestion: ActivitySuggestionDto,
  url: string,
  sourceLabel: string
): ActivitySuggestionDto {
  const description = suggestion.description.includes(url)
    ? suggestion.description
    : `${suggestion.description}\n\n${sourceLabel}: ${url}`
  return {
    ...suggestion,
    name: truncate(suggestion.name, NAME_MAX),
    description: truncate(description, DESCRIPTION_MAX),
  }
}

/** The /ai/activities/suggest endpoint accepts up to 2000 characters of criteria. */
export function buildAiCriteria(prefix: string, sourceText: string): string {
  return truncate(`${prefix}\n\n${sourceText}`, 2000)
}
