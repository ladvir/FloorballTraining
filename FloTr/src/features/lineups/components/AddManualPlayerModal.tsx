import { useState } from 'react'
import { Button } from '../../../components/ui/Button'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: (name: string) => void
}

export function AddManualPlayerModal({ open, onClose, onConfirm }: Props) {
  const [name, setName] = useState('')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Přidat hosta</h3>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jméno a příjmení"
          className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.trim()) {
              onConfirm(name.trim())
              setName('')
            }
          }}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => { setName(''); onClose() }}>Zrušit</Button>
          <Button
            size="sm"
            disabled={!name.trim()}
            onClick={() => { onConfirm(name.trim()); setName('') }}
          >
            Přidat
          </Button>
        </div>
      </div>
    </div>
  )
}
