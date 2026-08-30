import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { useKeepAwake } from 'expo-keep-awake'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button } from '../../components/Button'
import { GlassCard } from '../../components/GlassCard'
import { Icon } from '../../components/Icon'
import { RatingWidget } from '../../components/RatingWidget'
import { Screen } from '../../components/Screen'
import { LoadingState } from '../../components/StatusView'
import { trainingsApi } from '../../api'
import { t } from '../../i18n/strings'
import { useLiveTrainingStore } from '../../store/liveTrainingStore'
import { colors, glass, gradeColors, radius, spacing, typography } from '../../theme/tokens'
import { signalNextPart, signalOverrun } from '../../utils/sound'
import { computeLiveStatus, formatClock, type LivePart } from './liveSchedule'
import type { TrainingGroupDto } from '../../types/domain.types'

interface RunnerPart extends LivePart {
  description?: string | null
  groups: TrainingGroupDto[]
}

function GroupList({ groups, muted }: { groups: TrainingGroupDto[]; muted?: boolean }) {
  const names = groups.map((g) => g.activity?.name).filter(Boolean) as string[]
  if (names.length === 0) return null
  return (
    <View style={styles.groups}>
      {names.map((n, i) => (
        <View key={i} style={styles.groupRow}>
          <Icon name="ellipse" size={6} color={muted ? colors.textMuted : colors.accent} />
          <Text style={[styles.groupText, muted && { color: colors.textMuted }]} numberOfLines={1}>
            {n}
          </Text>
        </View>
      ))}
    </View>
  )
}

export function LiveTrainingScreen() {
  const navigation = useNavigation()
  const session = useLiveTrainingStore((s) => s.session)
  const nextPart = useLiveTrainingStore((s) => s.nextPart)
  const finish = useLiveTrainingStore((s) => s.finish)
  const close = useLiveTrainingStore((s) => s.close)

  // Screen stays lit for as long as this screen is on top (coach is running a session).
  useKeepAwake()

  const { data: training, isLoading } = useQuery({
    queryKey: ['training', session?.trainingId],
    queryFn: () => trainingsApi.getById(session!.trainingId),
    enabled: session != null,
  })

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!session || session.finished) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [session])

  const parts: RunnerPart[] = useMemo(() => {
    const raw = training?.trainingParts ?? []
    return [...raw]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((p, i) => ({
        name: p.name || t('liveTraining.partFallback', { n: String(i + 1) }),
        durationMin: p.duration ?? 0,
        description: p.description,
        groups: p.trainingGroups ?? [],
      }))
  }, [training])

  const idx = session ? Math.min(session.currentPartIndex, Math.max(0, parts.length - 1)) : 0
  const status =
    session && parts.length > 0
      ? computeLiveStatus(parts, idx, session.sessionStartMs, session.partStartedMs, now)
      : null

  // Sound/haptics: beep on part change, one warning the moment a part runs over.
  const lastPartStartRef = useRef<number | null>(null)
  const overrunSignalledForRef = useRef<number | null>(null)
  useEffect(() => {
    if (!session || session.finished) return
    if (lastPartStartRef.current != null && lastPartStartRef.current !== session.partStartedMs) {
      signalNextPart()
    }
    lastPartStartRef.current = session.partStartedMs
    overrunSignalledForRef.current = null
  }, [session])
  useEffect(() => {
    if (!session || session.finished || !status) return
    if (status.overrunSec > 0 && overrunSignalledForRef.current !== session.currentPartIndex) {
      overrunSignalledForRef.current = session.currentPartIndex
      signalOverrun()
    }
  }, [status, session])

  // Inline confirm (not Alert.alert — that renders no actionable buttons on react-native-web,
  // which is why "ukončit" appeared to do nothing).
  const [confirmingEnd, setConfirmingEnd] = useState(false)

  const leave = () => navigation.goBack()
  const endAndClose = () => {
    close()
    navigation.goBack()
  }

  if (!session) {
    return (
      <Screen edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.empty}>{t('liveTraining.finished')}</Text>
          <Button title={t('liveTraining.done')} onPress={leave} />
        </View>
      </Screen>
    )
  }

  const drift = status?.driftSec ?? 0
  const behindLabel =
    Math.abs(drift) < 30
      ? t('liveTraining.onSchedule')
      : drift > 0
        ? t('liveTraining.behindBy', { time: formatClock(drift) })
        : t('liveTraining.aheadBy', { time: formatClock(drift) })
  const behindColor =
    Math.abs(drift) < 30 ? gradeColors[1] : drift > 0 ? colors.danger : colors.accent

  // Seconds from now until each still-upcoming part is planned to start.
  const startsInSec: Record<number, number> = {}
  if (status) {
    let acc = status.nextDueInSec
    for (let j = idx + 1; j < parts.length; j++) {
      startsInSec[j] = acc
      acc += parts[j].durationMin * 60
    }
  }

  const header = (
    <>
      <Pressable style={styles.backButton} onPress={leave}>
        <Icon name="chevron-back" size={18} color={colors.accent} />
        <Text style={styles.backText}>{t('liveTraining.close')}</Text>
      </Pressable>
      <Text style={styles.title}>{session.trainingName}</Text>
      {session.appointmentName ? <Text style={styles.subtitle}>{session.appointmentName}</Text> : null}
    </>
  )

  // ── Loading / no-parts: still let the coach end + leave ───────────────────
  if ((isLoading && !training) || parts.length === 0) {
    return (
      <Screen edges={['top', 'bottom']}>
        <View style={[styles.scroll, styles.content]}>
          {header}
          {isLoading && !training ? (
            <LoadingState inline />
          ) : (
            <Text style={styles.empty}>{t('liveTraining.emptyParts')}</Text>
          )}
        </View>
        <View style={styles.footer}>
          <Button title={t('liveTraining.finish')} variant="outline" onPress={endAndClose} />
        </View>
      </Screen>
    )
  }

  // ── Finished: rate + done ────────────────────────────────────────────────
  if (session.finished) {
    return (
      <Screen edges={['top', 'bottom']}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {header}
          <GlassCard>
            <View style={styles.card}>
              <Text style={styles.finishedTitle}>{t('liveTraining.finished')}</Text>
              {session.appointmentId ? (
                <>
                  <Text style={styles.ratePrompt}>{t('liveTraining.ratePrompt')}</Text>
                  <RatingWidget appointmentId={session.appointmentId} />
                </>
              ) : null}
              <Button title={t('liveTraining.done')} onPress={endAndClose} />
            </View>
          </GlassCard>
        </ScrollView>
      </Screen>
    )
  }

  // ── Running ─────────────────────────────────────────────────────────────
  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {header}

        <View style={[styles.statusPill, { borderColor: behindColor }]}>
          <Icon name="time-outline" size={14} color={behindColor} />
          <Text style={[styles.statusText, { color: behindColor }]}>{behindLabel}</Text>
        </View>

        <Text style={styles.kicker}>
          {t('liveTraining.allParts')} ·{' '}
          {t('liveTraining.nowLabel', { i: String(idx + 1), total: String(parts.length) })}
        </Text>

        {parts.map((p, j) => {
          const done = j < idx
          if (j === idx) {
            const progress =
              status && status.plannedPartSec > 0
                ? Math.min(1, status.elapsedInPartSec / status.plannedPartSec)
                : 0
            const over = !!status && status.overrunSec > 0
            return (
              <GlassCard key={j}>
                <View style={[styles.card, styles.currentCard]}>
                  <View style={styles.cardHead}>
                    <Text style={[styles.kicker, { color: gradeColors[1] }]}>
                      {t('liveTraining.nowLabel', { i: String(j + 1), total: String(parts.length) })}
                    </Text>
                    <Text style={[styles.clock, over && { color: colors.danger }]}>
                      {formatClock(status?.elapsedInPartSec ?? 0)}
                      <Text style={styles.clockPlanned}> / {p.durationMin} min</Text>
                    </Text>
                  </View>
                  <Text style={styles.partName}>{p.name}</Text>
                  <View style={styles.track}>
                    <View
                      style={[
                        styles.trackFill,
                        {
                          width: `${progress * 100}%`,
                          backgroundColor: over ? colors.danger : gradeColors[1],
                        },
                      ]}
                    />
                  </View>
                  <GroupList groups={p.groups} />
                  {p.description ? <Text style={styles.partDesc}>{p.description}</Text> : null}
                </View>
              </GlassCard>
            )
          }
          return (
            <View key={j} style={[styles.partRow, done && styles.partRowDone]}>
              <Icon
                name={done ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={done ? gradeColors[1] : colors.textMuted}
              />
              <View style={styles.partRowMain}>
                <View style={styles.partRowTop}>
                  <Text
                    style={[styles.partRowName, done && styles.partRowNameDone]}
                    numberOfLines={1}
                  >
                    {j + 1}. {p.name}
                  </Text>
                  <Text style={styles.partRowDur}>{p.durationMin} min</Text>
                </View>
                {!done && startsInSec[j] != null ? (
                  <Text style={styles.partRowEta}>
                    {startsInSec[j] >= 0
                      ? t('liveTraining.inTime', { time: formatClock(startsInSec[j]) })
                      : t('liveTraining.overdueBy', { time: formatClock(startsInSec[j]) })}
                  </Text>
                ) : null}
                {j === idx + 1 ? <GroupList groups={p.groups} muted /> : null}
              </View>
            </View>
          )
        })}
      </ScrollView>

      {/* Sticky footer — always reachable */}
      <View style={styles.footer}>
        {confirmingEnd ? (
          <>
            <Text style={styles.confirmText}>
              {session.appointmentId
                ? t('liveTraining.finishConfirmRate')
                : t('liveTraining.finishConfirmTitle')}
            </Text>
            <View style={styles.footerRow}>
              <View style={styles.footerEnd}>
                <Button
                  title={t('ratings.cancel')}
                  variant="outline"
                  onPress={() => setConfirmingEnd(false)}
                />
              </View>
              <View style={styles.footerNext}>
                <Button title={t('liveTraining.finish')} onPress={() => finish()} />
              </View>
            </View>
          </>
        ) : status?.isLastPart ? (
          <Button title={t('liveTraining.finish')} onPress={() => setConfirmingEnd(true)} />
        ) : (
          <View style={styles.footerRow}>
            <View style={styles.footerEnd}>
              <Button
                title={t('liveTraining.endEarly')}
                variant="outline"
                onPress={() => setConfirmingEnd(true)}
              />
            </View>
            <View style={styles.footerNext}>
              <Button title={t('liveTraining.nextPart')} onPress={() => nextPart()} />
            </View>
          </View>
        )}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xl },
  backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  backText: { color: colors.accent, fontSize: typography.body.fontSize - 1, fontWeight: '600' },
  title: { color: colors.textPrimary, fontSize: typography.title.fontSize, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: typography.caption.fontSize },
  empty: { color: colors.textMuted, fontSize: typography.body.fontSize, textAlign: 'center', marginTop: spacing.lg },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusText: { fontSize: typography.caption.fontSize, fontWeight: '700' },
  card: { padding: spacing.lg, gap: spacing.sm },
  currentCard: { borderColor: gradeColors[1], borderWidth: 2, borderRadius: radius.lg },
  cardHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  kicker: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize - 1,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  clock: { color: colors.textPrimary, fontSize: typography.bodyBold.fontSize, fontWeight: '700' },
  clockPlanned: { color: colors.textMuted, fontWeight: '400' },
  partName: { color: colors.textPrimary, fontSize: typography.title.fontSize, fontWeight: '700' },
  track: { height: 6, borderRadius: 3, backgroundColor: glass.fill, overflow: 'hidden' },
  trackFill: { height: 6, borderRadius: 3 },
  partDesc: { color: colors.textSecondary, fontSize: typography.caption.fontSize },
  groups: { gap: spacing.xs, marginTop: spacing.xs },
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  groupText: { color: colors.textSecondary, fontSize: typography.body.fontSize - 1, flex: 1 },
  partRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: glass.fill,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  partRowDone: { opacity: 0.5, backgroundColor: 'transparent' },
  partRowMain: { flex: 1, gap: 2 },
  partRowTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm },
  partRowName: { flex: 1, color: colors.textPrimary, fontSize: typography.body.fontSize, fontWeight: '600' },
  partRowNameDone: { color: colors.textMuted, textDecorationLine: 'line-through' },
  partRowDur: { color: colors.textMuted, fontSize: typography.caption.fontSize },
  partRowEta: { color: colors.textMuted, fontSize: typography.caption.fontSize },
  finishedTitle: { color: colors.textPrimary, fontSize: typography.bodyBold.fontSize, fontWeight: '700' },
  ratePrompt: { color: colors.textSecondary, fontSize: typography.caption.fontSize },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: glass.border,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  footerRow: { flexDirection: 'row', gap: spacing.sm },
  footerEnd: { flex: 1 },
  footerNext: { flex: 1 },
  confirmText: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
})
