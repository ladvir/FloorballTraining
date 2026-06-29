import { createPortal } from 'react-dom'
import { useConfirmStore } from '../../store/confirmStore'

export function ConfirmDialog() {
  const { isOpen, message, title, handleConfirm, handleCancel } = useConfirmStore()

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
      onClick={handleCancel}
    >
      <div
        className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <p className="text-sm font-semibold text-gray-900 mb-2">{title}</p>}
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{message}</p>
        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Zrušit
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Potvrdit
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
