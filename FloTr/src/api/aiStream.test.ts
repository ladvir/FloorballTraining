import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { streamAi, AiStreamError } from './aiStream'
import { setAccessToken } from './token'

// axios is mocked so refreshAccessToken's POST /auth/refresh can be controlled.
vi.mock('./axios', () => ({
  refreshAccessToken: vi.fn(async () => {
    setAccessToken('refreshed-token')
    return 'refreshed-token'
  }),
}))

function sseResponse(body: string, status = 200): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(body))
      controller.close()
    },
  })
  return new Response(stream, { status })
}

describe('streamAi', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    setAccessToken('initial-token')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('dispatches status, delta and result events', async () => {
    fetchMock.mockResolvedValueOnce(
      sseResponse(
        'event: status\ndata: {"message":"generating"}\n\n' +
          'event: delta\ndata: {"text":"Ahoj "}\n\n' +
          'event: delta\ndata: {"text":"svete"}\n\n' +
          'event: result\ndata: {"value":42}\n\n'
      )
    )

    const deltas: string[] = []
    let status = ''
    let result: { value: number } | null = null

    await streamAi<{ value: number }>(
      '/ai/test',
      {},
      {
        onStatus: (m) => (status = m),
        onDelta: (text) => deltas.push(text),
        onResult: (r) => (result = r),
      }
    )

    expect(status).toBe('generating')
    expect(deltas.join('')).toBe('Ahoj svete')
    expect(result).toEqual({ value: 42 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer initial-token')
  })

  it('retries once with a refreshed token on 401', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(sseResponse('event: result\ndata: {"ok":true}\n\n'))

    let result: { ok: boolean } | null = null
    await streamAi<{ ok: boolean }>('/ai/test', {}, { onResult: (r) => (result = r) })

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const retryHeaders = fetchMock.mock.calls[1][1].headers as Record<string, string>
    expect(retryHeaders.Authorization).toBe('Bearer refreshed-token')
  })

  it('throws AiStreamError with the server code on pre-stream HTTP errors', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ code: 'aiDisabled' }), { status: 403 })
    )

    await expect(streamAi('/ai/test', {}, { onResult: () => {} })).rejects.toMatchObject({
      code: 'aiDisabled',
    })
  })

  it('throws AiStreamError with the code from an error event', async () => {
    fetchMock.mockResolvedValueOnce(sseResponse('event: error\ndata: {"code":"noJson"}\n\n'))

    await expect(streamAi('/ai/test', {}, { onResult: () => {} })).rejects.toMatchObject({
      code: 'noJson',
    })
  })

  it('throws "interrupted" when the stream ends without a result', async () => {
    fetchMock.mockResolvedValueOnce(sseResponse('event: delta\ndata: {"text":"x"}\n\n'))

    const error = await streamAi('/ai/test', {}, { onResult: () => {} }).catch((e) => e)
    expect(error).toBeInstanceOf(AiStreamError)
    expect((error as AiStreamError).code).toBe('interrupted')
  })
})
