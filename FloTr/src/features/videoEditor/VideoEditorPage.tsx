import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Upload, AlertTriangle } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { Button } from '../../components/ui/Button'
import { videosApi } from '../../api/videos.api'
import type { VideoOwnerKind } from '../../types/domain.types'
import { VideoAnnotationEditor } from './VideoAnnotationEditor'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'
const VIDEO_OWNER_KINDS: VideoOwnerKind[] = ['activities', 'trainings', 'appointments']

export function VideoEditorPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [localFile, setLocalFile] = useState<File | null>(null)

  const ownerKindParam = searchParams.get('ownerKind')
  const ownerKind = VIDEO_OWNER_KINDS.includes(ownerKindParam as VideoOwnerKind)
    ? (ownerKindParam as VideoOwnerKind)
    : null
  const ownerId = Number(searchParams.get('ownerId')) || null
  const videoId = Number(searchParams.get('videoId')) || null

  const { data: systemVideos, isLoading } = useQuery({
    queryKey: ['videos', ownerKind, ownerId],
    queryFn: () => videosApi.list(ownerKind!, ownerId!),
    enabled: !!ownerKind && !!ownerId,
  })
  const systemVideo = systemVideos?.find((v) => v.id === videoId) ?? null

  const localUrl = useMemo(() => (localFile ? URL.createObjectURL(localFile) : null), [localFile])
  useEffect(() => {
    return () => {
      if (localUrl) URL.revokeObjectURL(localUrl)
    }
  }, [localUrl])

  // The editor needs direct <video> control (speed, scrubbing, drawing) — only possible for an
  // uploaded file, not a YouTube/Instagram/other-link embed (VideoType 0 = UploadedFile).
  const systemVideoUnsupported = !!systemVideo && systemVideo.videoType !== 0
  const src =
    localUrl ??
    (systemVideo && !systemVideoUnsupported ? `${API_BASE_URL}/${systemVideo.filePath}` : null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setLocalFile(file)
  }

  return (
    <div className="mx-auto max-w-5xl p-4">
      <PageHeader title={t('videoEditor.title')} description={t('videoEditor.description')} />

      {ownerKind && ownerId && isLoading && <LoadingSpinner />}

      {systemVideoUnsupported && (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-2 py-3 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {t('videoEditor.unsupportedVideoType')}
          </CardContent>
        </Card>
      )}

      {src ? (
        <VideoAnnotationEditor src={src} key={src} />
      ) : (
        !isLoading && (
          <EmptyState
            title={t('videoEditor.noVideoTitle')}
            description={t('videoEditor.noVideoDescription')}
            action={
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  {t('videoEditor.pickLocalFile')}
                </Button>
              </>
            }
          />
        )
      )}
    </div>
  )
}

export default VideoEditorPage
