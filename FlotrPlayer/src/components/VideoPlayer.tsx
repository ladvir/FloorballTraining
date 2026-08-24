import { useEvent } from 'expo'
import { useVideoPlayer, VideoView } from 'expo-video'
import { useQuery } from '@tanstack/react-query'
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { Icon } from './Icon'
import { VideoAnnotationOverlay, type VideoAnnotationState } from './VideoAnnotationOverlay'
import { t } from '../i18n/strings'
import { API_BASE_URL } from '../api/axios'
import { videoAnnotationsApi } from '../api/videoAnnotations.api'
import { colors, glass, radius, spacing, typography } from '../theme/tokens'
import type { VideoDto } from '../types/domain.types'

/** Mirrors VideoLinkClassifier.ExtractYouTubeId on the backend (#127) and FloTr's VideoPlayer. */
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
  return (
    <Pressable style={styles.openButton} onPress={() => Linking.openURL(url)}>
      <Icon name="open-outline" size={16} color={colors.textSecondary} />
      <Text style={styles.openButtonText}>{t('videos.openVideo')}</Text>
    </Pressable>
  )
}

function parseAnnotationState(dataJson: string): VideoAnnotationState | null {
  try {
    const parsed = JSON.parse(dataJson) as Partial<VideoAnnotationState>
    return { lines: parsed.lines ?? [], freehandLines: parsed.freehandLines ?? [] }
  } catch {
    // Malformed data shouldn't block playback - just show the video without annotations.
    return null
  }
}

// UploadedFile plays via expo-video everywhere (web included) so annotations (#142) can sync to
// its currentTime; YouTube still plays in a WebView/iframe embed; Instagram and other links only
// get a fallback open-externally button - no in-app embed widget exists for those (#131).
export function VideoPlayer({ video, appointmentId }: { video: VideoDto; appointmentId: number }) {
  const uploadedFileUri =
    video.videoType === 0 && video.filePath ? `${API_BASE_URL}/${video.filePath}` : null
  const player = useVideoPlayer(uploadedFileUri)
  const timeUpdate = useEvent(player, 'timeUpdate', null)
  const currentTime = timeUpdate?.currentTime ?? player.currentTime
  const statusChange = useEvent(player, 'statusChange', null)
  const status = statusChange?.status ?? player.status
  const naturalSize = status === 'readyToPlay' ? (player.videoTrack?.size ?? null) : null

  // Annotations only ever exist for uploaded videos - the web editor doesn't support YouTube/
  // Instagram/other-link sources either (VideoAnnotationEditor.tsx systemVideoUnsupported check).
  const annotationQuery = useQuery({
    queryKey: ['video-annotation', appointmentId, video.id],
    queryFn: () => videoAnnotationsApi.get(appointmentId, video.id),
    enabled: video.videoType === 0,
  })
  const annotationState = annotationQuery.data
    ? parseAnnotationState(annotationQuery.data.dataJson)
    : null

  if (uploadedFileUri) {
    return (
      <View style={styles.wrapper}>
        <VideoView player={player} style={styles.videoView} nativeControls />
        {annotationState && naturalSize && (
          <VideoAnnotationOverlay
            state={annotationState}
            currentMs={Math.round(currentTime * 1000)}
            viewBoxWidth={naturalSize.width}
            viewBoxHeight={naturalSize.height}
          />
        )}
      </View>
    )
  }

  const youTubeId = video.videoType === 1 && video.url ? extractYouTubeId(video.url) : null
  const embedUri = youTubeId ? `https://www.youtube-nocookie.com/embed/${youTubeId}` : null

  if (embedUri) {
    return (
      <View style={styles.wrapper}>
        {/* react-native-webview has no web implementation (renders a "does not support this
            platform" stub there, verified in node_modules) - the DOM already has a native
            <iframe> for exactly this, so web gets it directly instead (#131). */}
        {Platform.OS === 'web' ? (
          <iframe
            src={embedUri}
            style={{ width: '100%', height: '100%', border: 0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <WebView
            source={{ uri: embedUri }}
            style={styles.webview}
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction={false}
          />
        )}
      </View>
    )
  }

  return video.url ? <OpenVideoButton url={video.url} /> : null
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  webview: { flex: 1, backgroundColor: '#000' },
  videoView: { width: '100%', height: '100%' },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: glass.fill,
  },
  openButtonText: { color: colors.textSecondary, fontSize: typography.caption.fontSize },
})
