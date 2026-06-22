import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

/**
 * Listens for the 'flotr:conflict' custom DOM event dispatched by the axios
 * interceptor whenever the API returns 409 Conflict (optimistic-concurrency
 * violation).  Shows a dismissible banner at the top of the viewport.
 */
export function ConflictToast() {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ message: string }>).detail
      setMessage(
        detail?.message ??
          'Záznam byl mezitím upraven jiným uživatelem. Načtěte aktuální verzi a opakujte změny.'
      )
    }
    window.addEventListener('flotr:conflict', handler)
    return () => window.removeEventListener('flotr:conflict', handler)
  }, [])

  if (!message) return null

  return (
    <div
      role="alert"
      className="fixed left-1/2 top-4 z-50 flex w-full max-w-lg -translate-x-1/2 items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 shadow-lg"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" aria-hidden="true" />
      <p className="flex-1 text-sm text-amber-900">{message}</p>
      <button
        onClick={() => setMessage(null)}
        className="ml-2 shrink-0 rounded p-0.5 text-amber-500 hover:bg-amber-100"
        aria-label="Zavřít"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
