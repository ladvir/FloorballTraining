import { useMemo } from 'react'
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { Icon } from './Icon'
import { t } from '../i18n/strings'
import { API_BASE_URL } from '../api/axios'
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

// UploadedFile/YouTube play in a WebView (native <video>/YouTube-embed handling); Instagram and
// other links only get a fallback open-externally button - no in-app embed widget exists for RN (#131).
export function VideoPlayer({ video }: { video: VideoDto }) {
  const embedUri = useMemo(() => {
    if (video.videoType === 0) return video.filePath ? `${API_BASE_URL}/${video.filePath}` : null
    if (video.videoType === 1) {
      const id = video.url ? extractYouTubeId(video.url) : null
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
    }
    return null
  }, [video])

  if (embedUri) {
    return (
      <View style={styles.wrapper}>
        {/* react-native-webview has no web implementation (renders a "does not support this
            platform" stub there, verified in node_modules) - the DOM already has native <video>/
            <iframe> for exactly this, so web gets those directly instead (#131). */}
        {Platform.OS === 'web' ? (
          video.videoType === 0 ? (
            <video controls src={embedUri} style={{ width: '100%', height: '100%' }} />
          ) : (
            <iframe
              src={embedUri}
              style={{ width: '100%', height: '100%', border: 0 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )
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
