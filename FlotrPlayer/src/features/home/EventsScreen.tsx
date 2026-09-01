import { useNavigation } from '@react-navigation/native'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button } from '../../components/Button'
import { GlassCard } from '../../components/GlassCard'
import { Icon } from '../../components/Icon'
import { RatingWidget } from '../../components/RatingWidget'
import { Screen } from '../../components/Screen'
import { ErrorState, LoadingState } from '../../components/StatusView'
import { VideoPlayer } from '../../components/VideoPlayer'
import { appointmentsApi, playerSkillsApi } from '../../api'
import { t } from '../../i18n/strings'
import { useAuthStore } from '../../store/authStore'
import { useLiveTrainingStore } from '../../store/liveTrainingStore'
import { colors, glass, radius, spacing, typography } from '../../theme/tokens'
import type { AppointmentDto } from '../../types/domain.types'

// Admin / club admin / head coach / coach — the roles that get the coach-only event actions
// (run live, award bonuses).
const COACH_ROLES = ['Admin', 'ClubAdmin', 'HeadCoach', 'Coach']
const MATCH_TYPE = 3 // AppointmentType.Match

const pad = (n: number) => String(n).padStart(2, '0')
const formatWhen = (iso: string) => {
  const d = new Date(iso)
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// A personal (team-less) event is a self-logged home training; otherwise map the appointment type.
const typeLabel = (a: AppointmentDto) => {
  if (a.teamId == null) return t('events.typeHome')
  if (a.appointmentType === MATCH_TYPE) return t('events.typeMatch')
  if (a.appointmentType === 0) return t('events.typeTraining')
  return t('events.typeOther')
}

// "Události": upcoming team + personal events, and the entry point to log a home training (#104).
export function EventsScreen() {
  const navigation = useNavigation()
  const tabBarHeight = useBottomTabBarHeight()

  const cardQuery = useQuery({ queryKey: ['playerskills', 'me'], queryFn: playerSkillsApi.getMyCard })
  const eventsQuery = useQuery({ queryKey: ['appointments', 'upcoming'], queryFn: appointmentsApi.getUpcoming })
  const rateableQuery = useQuery({ queryKey: ['appointments', 'rateable'], queryFn: appointmentsApi.getRateable })
  // Which row's videos are expanded (#131) - at most one at a time, videos fetched on demand.
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const memberId = cardQuery.data?.memberId

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + spacing.xl }]}>
        <Text style={styles.title}>{t('events.title')}</Text>

        {memberId != null && (
          <Button
            title={t('homeTraining.log')}
            onPress={() => (navigation as any).navigate('HomeTraining', { memberId })}
          />
        )}

        <Text style={styles.sectionTitle}>{t('events.upcoming')}</Text>

        {eventsQuery.isLoading ? (
          <LoadingState inline />
        ) : eventsQuery.isError ? (
          <ErrorState
            inline
            message={t('events.loadError')}
            onRetry={() => eventsQuery.refetch()}
            retrying={eventsQuery.isRefetching}
          />
        ) : (eventsQuery.data ?? []).length === 0 ? (
          <Text style={styles.empty}>{t('events.empty')}</Text>
        ) : (
          (eventsQuery.data ?? []).map((a) => (
            <EventRow
              key={a.id}
              appointment={a}
              expanded={expandedId === a.id}
              onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)}
            />
          ))
        )}

        {/* Hidden entirely when there's nothing to rate, same convention as HomeTrainingConfirmations. */}
        {(rateableQuery.data ?? []).length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('events.toRate')}</Text>
            {rateableQuery.data!.map((a) => (
              <EventRow
                key={a.id}
                appointment={a}
                expanded={expandedId === a.id}
                onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)}
                showRating
              />
            ))}
          </>
        )}
      </ScrollView>
    </Screen>
  )
}

// One event row; tapping it toggles its video list, fetched lazily on first expand (#131).
function EventRow({
  appointment,
  expanded,
  onToggle,
  showRating,
}: {
  appointment: AppointmentDto
  expanded: boolean
  onToggle: () => void
  /** Renders the player's own rate/view/edit/delete widget below the row (recently-ended events only). */
  showRating?: boolean
}) {
  const navigation = useNavigation()
  const effectiveRole = useAuthStore((s) => s.user?.effectiveRole)
  const startLive = useLiveTrainingStore((s) => s.start)
  const liveSession = useLiveTrainingStore((s) => s.session)

  // ponytail: one videos request per visible event (N+1). Fine for a player's short event list;
  // if it grows, add `HasVideos` to the appointment list DTO and gate the expander on that instead.
  const videosQuery = useQuery({
    queryKey: ['appointments', appointment.id, 'videos'],
    queryFn: () => appointmentsApi.getVideos(appointment.id),
  })
  const videos = videosQuery.data ?? []
  const hasVideos = videos.length > 0

  const isCoach = COACH_ROLES.includes(effectiveRole ?? '')
  const canRunLive = isCoach && appointment.appointmentType === 0 && appointment.trainingId != null
  // Coach bonuses live here now (pick event → pick player), not under every player's card.
  const canAward = isCoach && appointment.teamId != null
  const liveActiveForThis =
    liveSession?.appointmentId === appointment.id && !liveSession.finished

  const openAwards = () =>
    (navigation as any).navigate('CoachAwards', {
      appointmentId: appointment.id,
      title: appointment.name || appointment.trainingName || typeLabel(appointment),
      isMatch: appointment.appointmentType === MATCH_TYPE,
    })

  const launchLive = () => {
    if (!appointment.trainingId) return
    if (!liveActiveForThis) {
      startLive({
        trainingId: appointment.trainingId,
        trainingName: appointment.trainingName || appointment.name || t('events.typeTraining'),
        appointmentId: appointment.id,
        appointmentName: appointment.name || appointment.trainingName || undefined,
      })
    }
    ;(navigation as any).navigate('LiveTraining')
  }

  return (
    <GlassCard>
      {/* Row only toggles when the event actually has videos - no expander, no "no videos" panel otherwise. */}
      <Pressable style={styles.row} onPress={onToggle} disabled={!hasVideos}>
        <View style={styles.rowIcon}>
          <Icon
            name={appointment.teamId == null ? 'home-outline' : 'people-outline'}
            size={18}
            color={colors.accent}
          />
        </View>
        <View style={styles.rowMain}>
          <Text style={styles.rowTitle}>
            {appointment.name || appointment.trainingName || typeLabel(appointment)}
          </Text>
          <Text style={styles.rowMeta}>{formatWhen(appointment.start)}</Text>
        </View>
        <Text style={styles.rowType}>{typeLabel(appointment)}</Text>
        {hasVideos && (
          <Icon name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'} size={16} color={colors.textMuted} />
        )}
      </Pressable>

      {canRunLive && (
        <Pressable style={styles.liveButton} onPress={launchLive}>
          <Icon name="play" size={14} color={colors.textPrimary} />
          <Text style={styles.liveButtonText}>
            {liveActiveForThis ? t('liveTraining.open') : t('liveTraining.launch')}
          </Text>
        </Pressable>
      )}

      {canAward && (
        <Pressable style={styles.awardButton} onPress={openAwards}>
          <Icon name="trophy-outline" size={14} color={colors.accent} />
          <Text style={styles.awardButtonText}>{t('coachAwards.title')}</Text>
        </Pressable>
      )}

      {showRating && <RatingWidget appointmentId={appointment.id} />}

      {expanded && hasVideos && (
        <View style={styles.videos}>
          {videos.map((v) => (
            <VideoPlayer key={v.id} video={v} appointmentId={appointment.id} />
          ))}
        </View>
      )}
    </GlassCard>
  )
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.md },
  title: {
    color: colors.textPrimary,
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.sm,
  },
  empty: { color: colors.textMuted, fontSize: typography.body.fontSize, textAlign: 'center', marginTop: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: glass.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowMain: { flex: 1 },
  rowTitle: { color: colors.textPrimary, fontSize: typography.bodyBold.fontSize, fontWeight: '600' },
  rowMeta: { color: colors.textMuted, fontSize: typography.caption.fontSize, marginTop: 2 },
  rowType: { color: colors.textSecondary, fontSize: typography.caption.fontSize },
  videos: { gap: spacing.md, padding: spacing.md, paddingTop: 0 },
  liveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
  },
  liveButtonText: { color: colors.textPrimary, fontSize: typography.caption.fontSize, fontWeight: '700' },
  awardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: glass.fill,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
  },
  awardButtonText: { color: colors.accent, fontSize: typography.caption.fontSize, fontWeight: '700' },
})
