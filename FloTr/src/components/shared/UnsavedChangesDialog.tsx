import { Modal } from './Modal'
import { Button } from '../ui/Button'
import { AlertTriangle } from 'lucide-react'

interface Props {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function UnsavedChangesDialog({ isOpen, onConfirm, onCancel }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Neuložené změny">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
        <p className="text-sm text-gray-700">
          Máte neuložené změny. Opravdu chcete opustit stránku? Změny budou ztraceny.
        </p>
      </div>
      <div className="mt-5 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Zůstat
        </Button>
        <Button type="button" variant="danger" onClick={onConfirm}>
          Odejít bez uložení
        </Button>
      </div>
    </Modal>
  )
}
