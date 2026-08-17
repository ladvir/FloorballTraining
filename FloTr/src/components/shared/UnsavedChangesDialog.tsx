import { useTranslation } from 'react-i18next'
import { Modal } from './Modal'
import { Button } from '../ui/Button'
import { AlertTriangle } from 'lucide-react'

interface Props {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function UnsavedChangesDialog({ isOpen, onConfirm, onCancel }: Props) {
  const { t } = useTranslation()
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={t('shared.unsavedTitle')}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
        <p className="text-sm text-gray-700">{t('shared.unsavedMessage')}</p>
      </div>
      <div className="mt-5 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('shared.unsavedStay')}
        </Button>
        <Button type="button" variant="danger" onClick={onConfirm}>
          {t('shared.unsavedLeave')}
        </Button>
      </div>
    </Modal>
  )
}
