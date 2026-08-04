import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { GlassCard } from '../../components/GlassCard'
import { Icon } from '../../components/Icon'
import { homeTrainingsApi } from '../../api'
import { t } from '../../i18n/strings'
import { colors, gradeColors, radius, spacing, typography } from '../../theme/tokens'

/**
 * Guardian/coach counter-sign queue for self-reported home trainings (#104).
 * Renders nothing when there is nothing to confirm.
 */
export function HomeTrainingConfirmations() {
  const qc = useQueryClient()
  const { data: pending = [] } = useQuery({
    queryKey: ['home-training-confirmations'],
    queryFn: homeTrainingsApi.confirmations,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['home-training-confirmations'] })
    qc.invalidateQueries({ queryKey: ['guardian', 'children'] })
  }
  const confirm = useMutation({ mutationFn: (id: number) => homeTrainingsApi.confirm(id), onSuccess: invalidate })
  const reject = useMutation({ mutationFn: (id: number) => homeTrainingsApi.reject(id), onSuccess: invalidate })

  if (pending.length === 0) return null
  const busy = confirm.isPending || reject.isPending

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>{t('homeTraining.confirmQueue')}</Text>
      {pending.map((l) => (
        <GlassCard key={l.id} style={styles.row}>
          <View style={styles.main}>
            <Text style={styles.title} numberOfLines={1}>
              {l.memberName ? `${l.memberName} — ` : ''}
              {l.title}
            </Text>
            <Text style={styles.meta}>
              {l.loggedAt.slice(0, 10)}
              {l.durationMin ? ` · ${t('homeTraining.minutes', { n: String(l.durationMin) })}` : ''}
            </Text>
          </View>
          <Pressable onPress={() => confirm.mutate(l.id)} disabled={busy} style={styles.btn} hitSlop={8}>
            <Icon name="checkmark-circle" size={26} color={gradeColors[1]} />
          </Pressable>
          <Pressable onPress={() => reject.mutate(l.id)} disabled={busy} style={styles.btn} hitSlop={8}>
            <Icon name="close-circle" size={26} color={colors.danger} />
          </Pressable>
        </GlassCard>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg, gap: spacing.sm },
  heading: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm, borderRadius: radius.lg },
  main: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: typography.bodyBold.fontSize, fontWeight: '600' },
  meta: { color: colors.textMuted, fontSize: typography.caption.fontSize, marginTop: 2 },
  btn: { padding: spacing.xs },
})
