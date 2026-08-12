import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RotateCw } from 'lucide-react'

/**
 * Plays a SMIL-animated SVG via <object> (own document per instance — avoids id
 * collisions between drawings, e.g. `player-0`, that inline-in-DOM SVG would cause
 * when several drawings render on one page). Animation autoplays (SMIL begin="0s");
 * the replay button remounts the <object> to restart it, since fill="freeze" leaves
 * it stuck on the last frame otherwise.
 */
export function AnimatedSvgPlayer({
  svg,
  className,
  alt,
  onClick,
}: {
  svg: string
  className?: string
  alt?: string
  onClick?: () => void
}) {
  const { t } = useTranslation()
  const [replayKey, setReplayKey] = useState(0)
  // Create and revoke the blob URL in the same effect (not split from a useMemo) —
  // StrictMode's dev-only mount→cleanup→mount double-invoke would otherwise revoke
  // the URL that's still assigned to the <object> below, right after creating it.
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    const blobUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: must be created here, see comment above
    setUrl(blobUrl)
    return () => URL.revokeObjectURL(blobUrl)
  }, [svg])

  if (!url) return <div className={className} />

  return (
    <div className="relative h-full w-full">
      <object
        key={replayKey}
        data={url}
        type="image/svg+xml"
        className={`bg-white ${className ?? ''}`}
        aria-label={alt}
      />
      {onClick && (
        <button
          type="button"
          className="absolute inset-0 cursor-zoom-in"
          aria-label={alt}
          onClick={onClick}
        />
      )}
      <button
        type="button"
        title={t('activities.replayAnimation')}
        onClick={(e) => {
          e.stopPropagation()
          setReplayKey((k) => k + 1)
        }}
        className="absolute right-1 top-1 rounded-full bg-white/80 p-1 text-gray-600 shadow-sm hover:bg-sky-50 hover:text-sky-600"
      >
        <RotateCw className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
