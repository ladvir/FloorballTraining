import { useState } from 'react'
import { Modal } from './Modal'
import { Button } from '../ui/Button'

export interface PdfOptions {
  includeTrainingParameters: boolean
  includeTrainingDetails: boolean
  includeTrainingDescription: boolean
  includeComments: boolean
  includePartDescriptions: boolean
  includeActivityDescriptions: boolean
  includeImages: boolean
}

interface PdfOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (options: PdfOptions) => void
  loading?: boolean
  /** "training" shows all options, "activity" shows only description + images */
  type?: 'training' | 'activity'
}

function CheckboxRow({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
}

export function PdfOptionsModal({ isOpen, onClose, onConfirm, loading, type = 'training' }: PdfOptionsModalProps) {
  const [opts, setOpts] = useState<PdfOptions>({
    includeTrainingParameters: true,
    includeTrainingDetails: true,
    includeTrainingDescription: true,
    includeComments: true,
    includePartDescriptions: true,
    includeActivityDescriptions: true,
    includeImages: true,
  })

  const set = (key: keyof PdfOptions, value: boolean) => setOpts((prev) => ({ ...prev, [key]: value }))

  const isTraining = type === 'training'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nastavení PDF" maxWidth="sm">
      <div className="space-y-3">
        {isTraining && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Trénink</p>
            <CheckboxRow checked={opts.includeTrainingParameters} onChange={(v) => set('includeTrainingParameters', v)} label="Parametry (věk. kat., doba trvání, intenzita, obtížnost)" />
            <CheckboxRow checked={opts.includeTrainingDetails} onChange={(v) => set('includeTrainingDetails', v)} label="Detaily (zaměření, vybavení, prostředí)" />
            <CheckboxRow checked={opts.includeTrainingDescription} onChange={(v) => set('includeTrainingDescription', v)} label="Popis tréninku" />
            <CheckboxRow checked={opts.includeComments} onChange={(v) => set('includeComments', v)} label="Komentáře (před/po tréninku)" />

            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Části tréninku</p>
            </div>
            <CheckboxRow checked={opts.includePartDescriptions} onChange={(v) => set('includePartDescriptions', v)} label="Popisy částí tréninku" />
          </>
        )}

        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{isTraining ? 'Aktivity' : 'Obsah'}</p>
        <CheckboxRow checked={opts.includeActivityDescriptions} onChange={(v) => set('includeActivityDescriptions', v)} label="Popisy aktivit" />
        <CheckboxRow checked={opts.includeImages} onChange={(v) => set('includeImages', v)} label="Obrázky" />
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onClose} disabled={loading}>
          Zrušit
        </Button>
        <Button
          size="sm"
          loading={loading}
          onClick={() => onConfirm(opts)}
        >
          Stáhnout PDF
        </Button>
      </div>
    </Modal>
  )
}
