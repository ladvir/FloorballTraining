import { Fragment } from 'react'
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
// Horizontal margin needed so the widest label (an edge-aligned box at the rightmost/leftmost
// vertex) never clips outside the wrapper: margin >= CENTER + LABEL_RADIUS + LABEL_WIDTH - SIZE.
// Vertically the top/bottom labels sit just past LABEL_RADIUS (< CENTER), so a small margin is
// enough - a symmetric 46px box left big dead bands above/below the chart.
const LABEL_MARGIN_X = 46
const LABEL_MARGIN_Y = 10
const WRAPPER_WIDTH = SIZE + LABEL_MARGIN_X * 2
const WRAPPER_HEIGHT = SIZE + LABEL_MARGIN_Y * 2

export interface RadarSeries {
  categories: CategoryAverage[]
  /** Defaults to colors.accent - the single-player call site (StatsSection) never overrides it.
   * Comparison (#89) passes one color per player so overlaid polygons stay distinguishable. */
  color?: string
}

// Spec section 12: axis is inverted (plots `6 - grade`) so a bigger polygon always reads as a
// better result, even though grade 1 is best/5 is worst. Real grades stay in the legend list
// below (StatsSection) - this chart's own labels are just "which axis is which category".
//
// `series` is 1 entry for a single player's stats, 2 for player comparison (#89) - every entry
// must supply the same categories in the same order so polygons share one set of axes.
export function RadarChart({ series }: { series: RadarSeries[] }) {
  const categories = series[0].categories
  const n = categories.length
  const angleFor = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / n
  const pointFor = (i: number, value: number, radius = RADIUS) => {
    const angle = angleFor(i)
    const r = (value / 5) * radius
    return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) }
  }

  return (
    <View style={[styles.wrapper, { width: WRAPPER_WIDTH, height: WRAPPER_HEIGHT }]}>
      <View style={[styles.svgBox, { left: LABEL_MARGIN_X, top: LABEL_MARGIN_Y }]}>
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
          {series.map((s, si) => {
            const dataPoints = s.categories.map((c, i) => pointFor(i, 6 - c.average))
            const polygonPoints = dataPoints.map((p) => `${p.x},${p.y}`).join(' ')
            const color = s.color ?? colors.accent
            return (
              <Fragment key={si}>
                <Polygon points={polygonPoints} fill={color} fillOpacity={0.25} stroke={color} strokeWidth={2} />
                {dataPoints.map((p, i) => (
                  <Circle key={i} cx={p.x} cy={p.y} r={5} fill={colorForGrade(s.categories[i].average)} />
                ))}
              </Fragment>
            )
          })}
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
              { left: LABEL_MARGIN_X + point.x - offset, top: LABEL_MARGIN_Y + point.y - 12, width: LABEL_WIDTH, textAlign: align },
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
