import { useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Upload, Link as LinkIcon, Trash2, X } from 'lucide-react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { LoadingSpinner } from './LoadingSpinner'
import { VideoPlayer } from './VideoPlayer'
import { videosApi } from '../../api/videos.api'
import { toast } from '../../utils/toast'
import { captureVideoThumbnail } from '../../utils/videoThumbnail'
import type { VideoOwnerKind } from '../../types/domain.types'

function extractErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: unknown } })?.response?.data
  if (typeof data === 'string' && data) return data
  if (data && typeof data === 'object' && 'message' in data) {
    const msg = (data as { message?: unknown }).message
    if (typeof msg === 'string' && msg) return msg
  }
  return fallback
}

/** Reusable video list — add by upload or link, play, delete. Independent of the owning entity (#128). */
export function VideosSection({
  ownerKind,
  ownerId,
  readOnly = false,
}: {
  ownerKind: VideoOwnerKind
  ownerId: number
  /** Read-only summary for detail views — no add/delete controls, renders nothing when there are no videos (#129). */
  readOnly?: boolean
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkTitle, setLinkTitle] = useState('')
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

  const queryKey = ['videos', ownerKind, ownerId]

  const { data: videos = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => videosApi.list(ownerKind, ownerId),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey })

  const addFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const thumbnail = await captureVideoThumbnail(file)
      return videosApi.addFile(ownerKind, ownerId, file, undefined, setUploadProgress, thumbnail)
    },
    onSuccess: () => {
      invalidate()
      setUploadProgress(null)
    },
    onError: (err) => {
      setUploadProgress(null)
      toast.error(extractErrorMessage(err, t('videos.uploadFailed')))
    },
  })

  const addLinkMutation = useMutation({
    mutationFn: () =>
      videosApi.addLink(ownerKind, ownerId, linkUrl.trim(), linkTitle.trim() || undefined),
    onSuccess: () => {
      invalidate()
      setShowLinkForm(false)
      setLinkUrl('')
      setLinkTitle('')
    },
    onError: (err) => toast.error(extractErrorMessage(err, t('videos.linkFailed'))),
  })

  const deleteMutation = useMutation({
    mutationFn: (videoId: number) => videosApi.delete(ownerKind, ownerId, videoId),
    onSuccess: () => invalidate(),
    onError: (err) => toast.error(extractErrorMessage(err, t('videos.deleteFailed'))),
  })

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploadProgress(0)
    addFileMutation.mutate(file)
  }

  const handleAddLink = () => {
    if (!linkUrl.trim()) return
    addLinkMutation.mutate()
  }

  const isBusy = addFileMutation.isPending || addLinkMutation.isPending || deleteMutation.isPending

  if (readOnly) {
    if (videos.length === 0) return null
    return (
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          {t('videos.title')}
        </h4>
        <div className="grid gap-3 sm:grid-cols-2">
          {videos.map((video) => (
            <div key={video.id} className="space-y-1">
              <VideoPlayer video={video} />
              {video.title && <p className="truncate text-xs text-gray-500">{video.title}</p>}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Card data-testid="videos-section">
      <CardContent className="py-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">{t('videos.title')}</p>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              disabled={isBusy}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              {t('videos.addFile')}
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => setShowLinkForm((v) => !v)}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              <LinkIcon className="h-3.5 w-3.5" />
              {t('videos.addLink')}
            </button>
          </div>
        </div>

        {uploadProgress != null && (
          <p className="mb-2 text-xs text-sky-600">
            {t('videos.uploading', { percent: uploadProgress })}
          </p>
        )}

        {showLinkForm && (
          // A <div>, not a <form> — VideosSection lives inside the owning page's own <form>
          // (e.g. ActivityFormPage), and nested <form> elements are invalid HTML (browsers
          // silently drop them, breaking the submit button's click handler).
          <div className="mb-3 flex flex-col gap-2 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label={t('videos.linkUrlLabel')}
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddLink()
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex-1">
              <Input
                label={t('videos.linkTitleLabel')}
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleAddLink}
                loading={addLinkMutation.isPending}
                disabled={!linkUrl.trim()}
              >
                {t('common.add')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowLinkForm(false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <LoadingSpinner />
        ) : videos.length === 0 ? (
          <p className="text-sm text-gray-400">{t('videos.noVideos')}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {videos.map((video) => (
              <div key={video.id} className="space-y-1">
                <div className="relative">
                  <VideoPlayer video={video} />
                  <button
                    type="button"
                    title={t('common.delete')}
                    disabled={isBusy}
                    onClick={() => deleteMutation.mutate(video.id)}
                    className="absolute right-1.5 top-1.5 rounded bg-white/80 p-1 text-gray-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {video.title && <p className="truncate text-xs text-gray-500">{video.title}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
