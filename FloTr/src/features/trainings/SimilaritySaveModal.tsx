import { Modal } from '../../components/shared/Modal'
import { Button } from '../../components/ui/Button'
import { AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { SimilarTrainingDto } from '../../types/domain.types'

interface Props {
  isOpen: boolean
  matches: SimilarTrainingDto[]
  onConfirm: () => void
  onCancel: () => void
}

export function SimilaritySaveModal({ isOpen, matches, onConfirm, onCancel }: Props) {
  const tierA = matches.filter((m) => m.tier === 'A')

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Trénink se shoduje s existujícím" maxWidth="lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
        <div className="flex-1">
          <p className="text-sm text-gray-700">
            Existuje{' '}
            {tierA.length === 1
              ? 'trénink se stejnými aktivitami a délkou v toleranci'
              : `${tierA.length} tréninků se stejnými aktivitami a délkou v toleranci`}
            . Opravdu chcete uložit nový?
          </p>
          <ul className="mt-3 space-y-1.5">
            {tierA.map((m) => (
              <li key={m.id} className="flex items-center gap-2 text-sm">
                <span className="inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                  A
                </span>
                <Link
                  to={`/trainings/${m.id}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-sky-600 hover:underline"
                >
                  {m.name}
                </Link>
                <span className="text-xs text-gray-500">
                  {m.duration} min
                  {m.isDraft && ' · rozpracovaný'}
                  {m.matchedByAuthor ? ' · váš' : m.matchedByClub ? ' · klub' : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Zrušit
        </Button>
        <Button type="button" variant="danger" onClick={onConfirm}>
          Uložit i přesto
        </Button>
      </div>
    </Modal>
  )
}
