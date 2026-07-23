import Svg, { Circle, Line, Polyline } from 'react-native-svg'
import { StyleSheet, View } from 'react-native'
import { colorForGrade, colors } from '../theme/tokens'
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

  return (
    <View style={styles.wrapper}>
      <Svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <Line x1={PADDING} y1={PADDING} x2={PADDING} y2={HEIGHT - PADDING} stroke={colors.textMuted} strokeWidth={1} />
        <Line
          x1={PADDING}
          y1={HEIGHT - PADDING}
          x2={WIDTH - PADDING}
          y2={HEIGHT - PADDING}
          stroke={colors.textMuted}
          strokeWidth={1}
        />
        {points.length > 1 && (
          <Polyline points={polylinePoints} fill="none" stroke={colors.accent} strokeWidth={2} />
        )}
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={5} fill={p.color} />
        ))}
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
})
