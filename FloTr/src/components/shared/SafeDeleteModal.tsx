import { AlertTriangle, Trash2 } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from '../ui/Button'
import { LoadingSpinner } from './LoadingSpinner'

interface SafeDeleteModalProps {
  isOpen: boolean
  title: string
  itemLabel: string
  isUsageLoading: boolean
  blocked: boolean
  blockedReason?: string
  warning?: string
  isDeleting: boolean
  serverError?: string | null
  onClose: () => void
  onConfirm: () => void
}

export function SafeDeleteModal({
  isOpen,
  title,
  itemLabel,
  isUsageLoading,
  blocked,
  blockedReason,
  warning,
  isDeleting,
  serverError,
  onClose,
  onConfirm,
}: SafeDeleteModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="space-y-3">
        {isUsageLoading ? (
          <LoadingSpinner />
        ) : blocked ? (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{blockedReason}</span>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                Opravdu chcete trvale smazat <strong>{itemLabel}</strong>? Tato akce je nevratná.
              </span>
            </div>
            {warning && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {warning}
              </div>
            )}
          </>
        )}

        {serverError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isDeleting}>
            {blocked ? 'Zavřít' : 'Zrušit'}
          </Button>
          {!blocked && !isUsageLoading && (
            <Button
              variant="danger"
              size="sm"
              onClick={onConfirm}
              loading={isDeleting}
              disabled={isDeleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Smazat trvale
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
