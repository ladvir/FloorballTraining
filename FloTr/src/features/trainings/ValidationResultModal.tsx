import { Modal } from '../../components/shared/Modal'
import { Button } from '../../components/ui/Button'

export function ValidationResultModal({
  result,
  onClose,
}: {
  result: { isDraft: boolean; errors: string[]; name: string } | null
  onClose: () => void
}) {
  if (!result) return null
  return (
    <Modal isOpen={true} onClose={onClose} title={`Validace: ${result.name}`} maxWidth="md">
      {result.isDraft ? (
        <div className="space-y-3">
          <p className="text-sm text-yellow-700">Trénink je <strong>rozpracovaný</strong> — nalezeny problémy:</p>
          <ul className="space-y-1">
            {result.errors.map((e, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-0.5 text-red-400">•</span>
                {e}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-green-700">
          Trénink je <strong>kompletní</strong> a splňuje všechny požadavky.
        </p>
      )}
      <div className="mt-4 flex justify-end">
        <Button size="sm" onClick={onClose}>Zavřít</Button>
      </div>
    </Modal>
  )
}
