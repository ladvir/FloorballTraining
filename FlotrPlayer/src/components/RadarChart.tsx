import Svg, { Circle, Line, Polygon } from 'react-native-svg'
import { StyleSheet, Text, View } from 'react-native'
import { colorForGrade, colors } from '../theme/tokens'
import type { CategoryAverage } from '../utils/statsSummary'

const SIZE = 210
const CENTER = SIZE / 2
const RADIUS = 74
const RINGS = 4
// Category names (spec section 8, e.g. "Komunikace a organizace obrany") don't fit SVG <Text>,
// which can't wrap - labels are plain RN Text absolutely positioned just outside the chart, sized
// to always fit within a fixed-size wrapper regardless of screen width (see LABEL_MARGIN below).
const LABEL_RADIUS = RADIUS + 14
const LABEL_WIDTH = 60
// Margin needed so the widest label (an edge-aligned box at the rightmost/leftmost vertex)
// never clips outside the wrapper: margin >= CENTER + LABEL_RADIUS + LABEL_WIDTH - SIZE.
const LABEL_MARGIN = 46
const WRAPPER_SIZE = SIZE + LABEL_MARGIN * 2

// Spec section 12: axis is inverted (plots `6 - grade`) so a bigger polygon always reads as a
// better result, even though grade 1 is best/5 is worst. Real grades stay in the legend list
// below (StatsSection) - this chart's own labels are just "which axis is which category".
export function RadarChart({ categories }: { categories: CategoryAverage[] }) {
  const n = categories.length
  const angleFor = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / n
  const pointFor = (i: number, value: number, radius = RADIUS) => {
    const angle = angleFor(i)
    const r = (value / 5) * radius
    return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) }
  }

  const dataPoints = categories.map((c, i) => pointFor(i, 6 - c.average))
  const polygonPoints = dataPoints.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <View style={[styles.wrapper, { width: WRAPPER_SIZE, height: WRAPPER_SIZE }]}>
      <View style={[styles.svgBox, { left: LABEL_MARGIN, top: LABEL_MARGIN }]}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {Array.from({ length: RINGS }, (_, ring) => {
            const level = ring + 1
            const ringPoints = categories
              .map((_, i) => pointFor(i, (level / RINGS) * 5))
              .map((p) => `${p.x},${p.y}`)
              .join(' ')
            return (
              <Polygon key={level} points={ringPoints} fill="none" stroke={colors.textMuted} strokeOpacity={0.3} strokeWidth={1} />
            )
          })}
          {categories.map((_, i) => {
            const edge = pointFor(i, 5)
            return (
              <Line key={i} x1={CENTER} y1={CENTER} x2={edge.x} y2={edge.y} stroke={colors.textMuted} strokeOpacity={0.3} strokeWidth={1} />
            )
          })}
          <Polygon points={polygonPoints} fill={colors.accent} fillOpacity={0.25} stroke={colors.accent} strokeWidth={2} />
          {dataPoints.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={5} fill={colorForGrade(categories[i].average)} />
          ))}
        </Svg>
      </View>

      {categories.map((c, i) => {
        const cos = Math.cos(angleFor(i))
        const align: 'left' | 'center' | 'right' = cos > 0.3 ? 'left' : cos < -0.3 ? 'right' : 'center'
        const offset = align === 'left' ? 0 : align === 'right' ? LABEL_WIDTH : LABEL_WIDTH / 2
        const point = pointFor(i, 5, LABEL_RADIUS)
        return (
          <Text
            key={c.categoryId}
            numberOfLines={2}
            style={[
              styles.label,
              { left: LABEL_MARGIN + point.x - offset, top: LABEL_MARGIN + point.y - 12, width: LABEL_WIDTH, textAlign: align },
            ]}
          >
            {c.name}
          </Text>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
  },
  svgBox: {
    position: 'absolute',
  },
  label: {
    position: 'absolute',
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 12,
  },
})
