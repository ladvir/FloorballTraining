import { getAccessToken } from './token'
import { refreshAccessToken } from './axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

/** Coded failure from an AI endpoint (pre-stream HTTP error or an `error` SSE event). */
export class AiStreamError extends Error {
  code: string
  /** Raw provider detail (safe — never contains prompt content), for display/debugging. */
  detail?: string
  constructor(code: string, detail?: string) {
    super(`AI stream failed: ${code}`)
    this.code = code
    this.detail = detail
  }
}

export interface AiStreamHandlers<TResult> {
  onStatus?: (message: string) => void
  onDelta?: (text: string) => void
  onResult: (result: TResult) => void
}

/**
 * POSTs to an SSE endpoint and dispatches its events. axios can't consume streams,
 * so this uses fetch + ReadableStream — which also means the axios interceptors don't
 * apply: the Bearer header and a single 401→refresh→retry are handled here.
 * Abort via the signal on unmount; errors surface as AiStreamError with a code
 * the caller can localize.
 */
export async function streamAi<TResult>(
  path: string,
  body: unknown,
  handlers: AiStreamHandlers<TResult>,
  signal?: AbortSignal
): Promise<void> {
  const doFetch = (token: string | null) =>
    fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal,
    })

  let response = await doFetch(getAccessToken())
  if (response.status === 401) {
    const token = await refreshAccessToken()
    response = await doFetch(token)
  }

  if (!response.ok) {
    let code = `http${response.status}`
    try {
      const data = (await response.json()) as { code?: string }
      if (data.code) code = data.code
    } catch {
      /* non-JSON error body */
    }
    throw new AiStreamError(code)
  }

  if (!response.body) throw new AiStreamError('noBody')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let eventName: string | null = null
  let gotResult = false

  const dispatch = (name: string | null, data: string) => {
    switch (name) {
      case 'status':
        handlers.onStatus?.((JSON.parse(data) as { message: string }).message)
        break
      case 'delta':
        handlers.onDelta?.((JSON.parse(data) as { text: string }).text)
        break
      case 'result':
        gotResult = true
        handlers.onResult(JSON.parse(data) as TResult)
        break
      case 'error': {
        const parsed = JSON.parse(data) as { code?: string; message?: string }
        throw new AiStreamError(parsed.code ?? 'unexpected', parsed.message ?? undefined)
      }
    }
  }

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let newlineIndex: number
    while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newlineIndex).replace(/\r$/, '')
      buffer = buffer.slice(newlineIndex + 1)

      if (line === '') {
        eventName = null
      } else if (line.startsWith('event: ')) {
        eventName = line.slice('event: '.length)
      } else if (line.startsWith('data: ')) {
        dispatch(eventName, line.slice('data: '.length))
      }
    }
  }

  // A stream that ended without result or error (proxy cut, app-pool recycle).
  if (!gotResult) throw new AiStreamError('interrupted')
}
