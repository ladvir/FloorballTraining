import Svg, { Circle, Defs, Line, LinearGradient, Polygon, Polyline, Stop } from 'react-native-svg'
import { StyleSheet, Text, View } from 'react-native'
import { colorForGrade, colors, spacing, typography } from '../theme/tokens'
import { formatDate } from '../utils/date'
import type { PlayerSkillHistoryEntryDto } from '../types/domain.types'

const WIDTH = 320
const HEIGHT = 140
const PADDING = 16

// Grade 1 (best) plots at the top, 5 (worst) at the bottom - matches the badge/number color
// coding (spec section 9) rather than a generic ascending axis. Points are evenly spaced by
// entry order, not by actual elapsed time - sufficient for the "vývoj v čase" trend at this scale.
export function HistoryChart({ entries }: { entries: PlayerSkillHistoryEntryDto[] }) {
  const usableWidth = WIDTH - PADDING * 2
  const usableHeight = HEIGHT - PADDING * 2
  const x = (i: number) =>
    PADDING + (entries.length === 1 ? usableWidth / 2 : (usableWidth * i) / (entries.length - 1))
  const y = (grade: number) => PADDING + ((grade - 1) / 4) * usableHeight

  const points = entries.map((e, i) => ({ x: x(i), y: y(e.grade), color: colorForGrade(e.grade) }))
  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ')
  const areaPoints = `${PADDING},${HEIGHT - PADDING} ${polylinePoints} ${WIDTH - PADDING},${HEIGHT - PADDING}`

  return (
    <View style={styles.wrapper}>
      <Svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <Defs>
          <LinearGradient id="historyFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.accent} stopOpacity={0.3} />
            <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Line x1={PADDING} y1={PADDING} x2={PADDING} y2={HEIGHT - PADDING} stroke={colors.textMuted} strokeOpacity={0.25} strokeWidth={1} />
        <Line
          x1={PADDING}
          y1={HEIGHT - PADDING}
          x2={WIDTH - PADDING}
          y2={HEIGHT - PADDING}
          stroke={colors.textMuted}
          strokeOpacity={0.25}
          strokeWidth={1}
        />
        {points.length > 1 && <Polygon points={areaPoints} fill="url(#historyFill)" stroke="none" />}
        {points.length > 1 && (
          <Polyline points={polylinePoints} fill="none" stroke={colors.accent} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        )}
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={5} fill={p.color} stroke={colors.background} strokeWidth={1.5} />
        ))}
      </Svg>

      {/* Per-point detail (date + the source test's raw value, when this entry was test-derived,
          #92) - a plain RN Text list rather than SVG labels, same reasoning as RadarChart's
          category labels: SVG <Text> can't wrap/truncate on RN, and this reads better as rows
          anyway once test values get involved. Kept in the same oldest-first order as the chart's
          left-to-right points, so a row still lines up with "which point is this". */}
      <View style={styles.list}>
        {entries.map((e, i) => (
          <View key={i} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: colorForGrade(e.grade) }]} />
            <Text style={styles.date}>{formatDate(e.ratedAt)}</Text>
            <Text style={styles.grade}>{e.grade}</Text>
            {e.testValueLabel && <Text style={styles.value}>{e.testValueLabel}</Text>}
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  list: {
    marginTop: spacing.sm,
    gap: spacing.xs + 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  date: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize,
    width: 72,
  },
  grade: {
    color: colors.textPrimary,
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    width: 16,
  },
  value: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    flex: 1,
  },
})
