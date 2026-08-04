import { useNavigation } from '@react-navigation/native'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { useQuery } from '@tanstack/react-query'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button } from '../../components/Button'
import { GlassCard } from '../../components/GlassCard'
import { Icon } from '../../components/Icon'
import { Screen } from '../../components/Screen'
import { ErrorState, LoadingState } from '../../components/StatusView'
import { appointmentsApi, playerSkillsApi } from '../../api'
import { t } from '../../i18n/strings'
import { colors, glass, radius, spacing, typography } from '../../theme/tokens'
import type { AppointmentDto } from '../../types/domain.types'

const pad = (n: number) => String(n).padStart(2, '0')
const formatWhen = (iso: string) => {
  const d = new Date(iso)
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// A personal (team-less) event is a self-logged home training; otherwise map the appointment type.
const typeLabel = (a: AppointmentDto) => {
  if (a.teamId == null) return t('events.typeHome')
  if (a.appointmentType === 3) return t('events.typeMatch')
  if (a.appointmentType === 0) return t('events.typeTraining')
  return t('events.typeOther')
}

// "Události": upcoming team + personal events, and the entry point to log a home training (#104).
export function EventsScreen() {
  const navigation = useNavigation()
  const tabBarHeight = useBottomTabBarHeight()

  const cardQuery = useQuery({ queryKey: ['playerskills', 'me'], queryFn: playerSkillsApi.getMyCard })
  const eventsQuery = useQuery({ queryKey: ['appointments', 'upcoming'], queryFn: appointmentsApi.getUpcoming })

  const memberId = cardQuery.data?.memberId

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + spacing.xl }]}>
        <Text style={styles.title}>{t('events.title')}</Text>

        <Button
          title={t('homeTraining.log')}
          disabled={memberId == null}
          onPress={() => (navigation as any).navigate('HomeTraining', { memberId })}
        />

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
            <GlassCard key={a.id} style={styles.row}>
              <View style={styles.rowIcon}>
                <Icon
                  name={a.teamId == null ? 'home-outline' : 'people-outline'}
                  size={18}
                  color={colors.accent}
                />
              </View>
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle}>{a.name || a.trainingName || typeLabel(a)}</Text>
                <Text style={styles.rowMeta}>{formatWhen(a.start)}</Text>
              </View>
              <Text style={styles.rowType}>{typeLabel(a)}</Text>
            </GlassCard>
          ))
        )}
      </ScrollView>
    </Screen>
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
})
