import { Link } from 'react-router-dom'
import { AlertTriangle, GitCompare, X } from 'lucide-react'
import type { SimilarTrainingDto } from '../../types/domain.types'

interface Props {
  matches: SimilarTrainingDto[]
  isChecking?: boolean
  onDismiss?: () => void
  onCompare?: () => void
}

export function SimilarityBanner({ matches, isChecking, onDismiss, onCompare }: Props) {
  if (isChecking) {
    return (
      <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-500">
        Kontrola podobných tréninků...
      </div>
    )
  }

  if (matches.length === 0) return null

  const tierA = matches.filter((m) => m.tier === 'A')
  const tierB = matches.filter((m) => m.tier === 'B')
  const hasTierA = tierA.length > 0
  const color = hasTierA ? 'red' : 'amber'
  const headline = hasTierA
    ? `Nalezen ${tierA.length === 1 ? 'duplicitní trénink' : `${tierA.length} duplicitních tréninků`} (stejné aktivity)`
    : `Nalezen ${tierB.length === 1 ? 'podobný trénink' : `${tierB.length} podobných tréninků`}`

  return (
    <div
      className={`mb-4 rounded-lg border px-4 py-3 ${
        color === 'red'
          ? 'border-red-200 bg-red-50'
          : 'border-amber-200 bg-amber-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
            color === 'red' ? 'text-red-500' : 'text-amber-500'
          }`}
        />
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium ${
              color === 'red' ? 'text-red-800' : 'text-amber-800'
            }`}
          >
            {headline}
          </p>
          <ul className="mt-1.5 space-y-1">
            {matches.slice(0, 5).map((m) => (
              <li key={m.id} className="flex items-center gap-2 text-xs">
                <span
                  className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    m.tier === 'A'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                  title={
                    m.tier === 'A'
                      ? 'Stejné aktivity, délka v toleranci'
                      : `Podobnost ${Math.round(m.score * 100)} %`
                  }
                >
                  {m.tier}
                </span>
                <Link
                  to={`/trainings/${m.id}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`truncate hover:underline ${
                    color === 'red' ? 'text-red-700' : 'text-amber-700'
                  }`}
                >
                  {m.name}
                </Link>
                <span className="text-gray-500 whitespace-nowrap">
                  {m.duration} min
                  {m.isDraft && ' · rozpracovaný'}
                  {m.matchedByAuthor ? ' · váš' : m.matchedByClub ? ' · klub' : ''}
                </span>
              </li>
            ))}
            {matches.length > 5 && (
              <li className="text-xs text-gray-500">
                … a dalších {matches.length - 5}
              </li>
            )}
          </ul>
          {onCompare && (
            <button
              type="button"
              onClick={onCompare}
              className={`mt-3 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium shadow-sm transition-colors ${
                color === 'red'
                  ? 'border-red-300 bg-white text-red-700 hover:bg-red-100'
                  : 'border-amber-300 bg-white text-amber-700 hover:bg-amber-100'
              }`}
              title="Otevřít porovnání aktuálního tréninku s nalezenými podobnými"
            >
              <GitCompare className="h-3.5 w-3.5" />
              Porovnat
            </button>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className={`rounded p-0.5 ${
              color === 'red'
                ? 'text-red-400 hover:bg-red-100 hover:text-red-600'
                : 'text-amber-400 hover:bg-amber-100 hover:text-amber-600'
            }`}
            title="Skrýt upozornění"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
