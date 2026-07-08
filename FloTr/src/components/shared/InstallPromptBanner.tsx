import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPromptBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!deferredPrompt || dismissed) return null

  const handleInstall = async () => {
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  return (
    <div className="fixed bottom-12 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 px-4">
      <div className="flex items-center gap-3 rounded-xl border border-sky-200 bg-white px-4 py-3 shadow-lg">
        <Download className="h-5 w-5 shrink-0 text-sky-600" />
        <p className="flex-1 text-sm text-gray-700">
          Nainstalujte FloTr pro rychlý přístup bez prohlížeče.
        </p>
        <button
          onClick={handleInstall}
          className="shrink-0 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
        >
          Instalovat
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-100"
          aria-label="Zavřít"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
