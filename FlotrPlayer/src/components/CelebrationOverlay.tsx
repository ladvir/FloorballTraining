import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BlurView } from 'expo-blur'
import { Image, Modal, StyleSheet, Text, View } from 'react-native'
import { Button } from './Button'
import { API_BASE_URL, xpApi } from '../api'
import { t, type StringKey } from '../i18n/strings'
import { colors, glass, radius, spacing, typography } from '../theme/tokens'
import { buildCelebrationQueue, nextCelebrationState, type Celebration } from '../utils/celebrations'
import { getCelebrationState, saveCelebrationState } from '../utils/celebrationStore'

// Pops a one-per-item celebration for every badge / level the player earned since their last login
// (#gamification). Detection is client-side: the current XP summary + earned badges are diffed
// against a tiny stored snapshot (utils/celebrations). No new endpoint — the two queries are the
// same ones PlayerCardScreen already renders, so they dedupe. The team-holder count comes from the
// badge DTO (`teamHolders`); the rank peer count is derived from the team leaderboard, fetched only
// when a progression card is actually queued.
export function CelebrationOverlay({ memberId, teamId }: { memberId: number; teamId?: number }) {
  const summaryQuery = useQuery({ queryKey: ['xp', memberId], queryFn: () => xpApi.getSummary(memberId) })
  const badgesQuery = useQuery({
    queryKey: ['xp', 'badges', memberId],
    queryFn: () => xpApi.getBadges(memberId),
  })
  const summary = summaryQuery.data
  const badges = badgesQuery.data
  // A logout→login in the same app session re-shows this screen while the badge/XP queries still
  // hold the PREVIOUS session's cached data. Only diff once both queries have actually fetched
  // after this mount, so a just-earned badge is never missed against a stale list.
  const dataReady = summaryQuery.isFetchedAfterMount && badgesQuery.isFetchedAfterMount

  const [queue, setQueue] = useState<Celebration[] | null>(null)
  const [index, setIndex] = useState(0)
  const computed = useRef(false)

  const needsRankPeers = !!queue?.some((c) => c.kind !== 'badge')
  const leaderboardQuery = useQuery({
    queryKey: ['xp', 'leaderboard', 'career', teamId],
    queryFn: () => xpApi.getLeaderboard({ sort: 'career', teamId }),
    enabled: !!teamId && needsRankPeers,
  })
  const leaderboard = leaderboardQuery.data

  useEffect(() => {
    if (computed.current || !dataReady || !summary || !badges) return
    computed.current = true
    void (async () => {
      const now = new Date().toISOString()
      const prev = await getCelebrationState(memberId)
      const q = buildCelebrationQueue(prev, summary.career, badges, now)
      // Persist the new baseline now, not after the last card — a nav-away mid-queue then costs
      // at most the rest of this one queue, never a re-play on the next login.
      await saveCelebrationState(
        memberId,
        nextCelebrationState(prev, summary.career, badges, now),
      )
      if (__DEV__) {
        console.log('[CelebrationOverlay]', {
          prev,
          earned: badges.filter((b) => b.earned).map((b) => `${b.code}@${b.earnedAt}`),
          career: summary.career,
          queued: q.map((c) => (c.kind === 'badge' ? c.badge.code : `${c.kind} ${c.level}`)),
        })
      }
      setQueue(q)
    })()
  }, [dataReady, summary, badges, memberId])

  if (!queue || !summary || !badges || index >= queue.length) return null
  const item = queue[index]
  // Hold a progression card only while its team peer count is still loading — on error it just
  // shows without that line rather than blocking the whole queue.
  if (item.kind !== 'badge' && !!teamId && leaderboardQuery.isLoading) return null

  const advance = () => setIndex(index + 1)

  const rankPeers =
    item.kind === 'badge' || !leaderboard
      ? null
      : leaderboard.rows.filter((r) => r.careerRankIndex === item.rankIndex).length

  return (
    <CelebrationCard
      item={item}
      rankPeers={rankPeers}
      step={index + 1}
      total={queue.length}
      onDismiss={advance}
    />
  )
}

function CelebrationCard({
  item,
  rankPeers,
  step,
  total,
  onDismiss,
}: {
  item: Celebration
  rankPeers: number | null
  step: number
  total: number
  onDismiss: () => void
}) {
  const isBadge = item.kind === 'badge'
  const imageUri = isBadge
    ? `${API_BASE_URL}/${item.badge.icon}`
    : `${API_BASE_URL}/badges/rank${item.rankIndex}.png`
  const title = t(
    isBadge
      ? 'celebration.badgeTitle'
      : item.kind === 'rank'
        ? 'celebration.rankTitle'
        : 'celebration.levelTitle',
  )
  const name = isBadge
    ? t(`badge.${item.badge.code}.name` as StringKey)
    : item.kind === 'rank'
      ? t(`xp.rank${item.rankIndex}` as StringKey)
      : t('xp.level', { level: String(item.level) })
  const countLine = isBadge
    ? // the player themselves holds it, so never show 0 (a teamless account reports teamHolders: 0)
      t('celebration.teamHoldersBadge', { count: String(Math.max(1, item.badge.teamHolders)) })
    : rankPeers != null
      ? t('celebration.teamHoldersRank', {
          rank: t(`xp.rank${item.rankIndex}` as StringKey),
          count: String(rankPeers),
        })
      : null

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* zIndex + pointerEvents="none" — see GlassCard.tsx: react-native-web otherwise
              paints/hit-tests this decorative blur above the real content. */}
          <BlurView
            intensity={glass.intensity}
            tint={glass.tint}
            style={styles.cardBlur}
            pointerEvents="none"
          />
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.name}>{name}</Text>
          {isBadge ? (
            <Text style={styles.criteria}>
              {t('celebration.badgeCriteria', {
                criteria: t(`badge.${item.badge.code}.desc` as StringKey),
              })}
            </Text>
          ) : null}
          <Text style={styles.congrats}>{t('celebration.congrats')}</Text>
          {countLine ? <Text style={styles.count}>{countLine}</Text> : null}
          {total > 1 ? <Text style={styles.step}>{`${step} / ${total}`}</Text> : null}
          <View style={styles.button}>
            <Button title={t('celebration.dismiss')} onPress={onDismiss} />
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: glass.fillStrong,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: radius.xl,
    overflow: 'hidden',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  cardBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  image: {
    width: 104,
    height: 104,
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.accent,
    fontSize: typography.caption.fontSize + 1,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.title.fontSize,
    fontWeight: '800',
    textAlign: 'center',
  },
  criteria: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize - 2,
    fontWeight: '600',
    textAlign: 'center',
  },
  congrats: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  count: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize + 1,
    textAlign: 'center',
  },
  step: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    marginTop: spacing.xs,
  },
  button: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
})
