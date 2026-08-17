import { useTranslation } from 'react-i18next'
import { useEffect, useRef } from 'react'
import { ExternalLink } from 'lucide-react'
import type { VideoDto } from '../../types/domain.types'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } }
  }
}

/** Mirrors VideoLinkClassifier.ExtractYouTubeId on the backend (#127). */
function extractYouTubeId(url: string): string | null {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return null
  }
  const host = u.hostname.toLowerCase().replace(/^www\.|^m\./, '')
  if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null
  if (host !== 'youtube.com') return null
  if (u.pathname === '/watch') return u.searchParams.get('v')
  for (const prefix of ['/shorts/', '/embed/', '/live/']) {
    if (u.pathname.startsWith(prefix)) return u.pathname.slice(prefix.length).split('/')[0] || null
  }
  return null
}

function OpenVideoButton({ url }: { url: string }) {
  const { t } = useTranslation()
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
    >
      <ExternalLink className="h-3.5 w-3.5" />
      {t('videos.openVideo')}
    </a>
  )
}

function InstagramEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLQuoteElement>(null)

  useEffect(() => {
    const process = () => window.instgrm?.Embeds.process()
    if (window.instgrm) {
      process()
      return
    }
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.instagram.com/embed.js"]'
    )
    if (existing) {
      existing.addEventListener('load', process)
      return () => existing.removeEventListener('load', process)
    }
    const script = document.createElement('script')
    script.src = 'https://www.instagram.com/embed.js'
    script.async = true
    script.onload = process
    document.body.appendChild(script)
  }, [url])

  return (
    <blockquote
      ref={ref}
      className="instagram-media"
      data-instgrm-permalink={url}
      data-instgrm-version="14"
      style={{ margin: 0 }}
    >
      <a href={url} target="_blank" rel="noopener noreferrer">
        {url}
      </a>
    </blockquote>
  )
}

/** Renders a video by VideoType — reusable, independent of the owning entity (#128). */
export function VideoPlayer({ video, className }: { video: VideoDto; className?: string }) {
  const { t } = useTranslation()
  const wrapperClass =
    className ?? 'w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50'

  switch (video.videoType) {
    case 0: // UploadedFile
      return (
        <video
          controls
          className={`${wrapperClass} aspect-video bg-black`}
          src={`${API_BASE_URL}/${video.filePath}`}
          poster={video.thumbnailUrl ? `${API_BASE_URL}/${video.thumbnailUrl}` : undefined}
        />
      )

    case 1: {
      // YouTube
      const id = video.url ? extractYouTubeId(video.url) : null
      if (!id) return video.url ? <OpenVideoButton url={video.url} /> : null
      return (
        <iframe
          className={`${wrapperClass} aspect-video border-0`}
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title={video.title || 'YouTube'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )
    }

    case 2: // Instagram
      return video.url ? <InstagramEmbed url={video.url} /> : null

    case 3: // OtherLink — embed attempt + always-visible fallback (embeds aren't guaranteed, #124)
    default:
      if (!video.url) return null
      return (
        <div className="space-y-2">
          <iframe
            className={`${wrapperClass} aspect-video border-0`}
            src={video.url}
            title={video.title || t('videos.otherLink')}
          />
          <OpenVideoButton url={video.url} />
        </div>
      )
  }
}
