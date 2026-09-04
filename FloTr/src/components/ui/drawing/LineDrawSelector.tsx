/* eslint-disable react-refresh/only-export-components */
import React, { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { SelectionTool } from './SelectionSelector'
import type { MovementTool } from './movementConstants'

export interface LineDrawConfig {
  dash: 'solid' | 'dotted' | 'dashed'
  thickness: number
  color: string
  /** Draw the line freehand (follows the cursor) instead of a straight segment — used as a zone separator */
  freehand: boolean
  /** Freehand only: smooth the stroke (Chaikin). false = raw polyline through the sampled points. */
  smooth: boolean
}

const DASH_OPTIONS: { id: LineDrawConfig['dash']; labelKey: string; dasharray: string }[] = [
  { id: 'solid', labelKey: 'drawing.lineSolid', dasharray: '' },
  { id: 'dotted', labelKey: 'drawing.lineDotted', dasharray: '2,4' },
  { id: 'dashed', labelKey: 'drawing.lineDashed', dasharray: '8,4' },
]

const THICKNESS_OPTIONS = [1, 2, 3, 5]

const COLOR_OPTIONS = [
  { color: '#000000', labelKey: 'drawing.colorBlack' },
  { color: '#333333', labelKey: 'drawing.colorDarkGray' },
  { color: '#888888', labelKey: 'drawing.colorGray' },
  { color: '#cc0000', labelKey: 'drawing.colorRed' },
  { color: '#0055cc', labelKey: 'drawing.colorBlue' },
  { color: '#008800', labelKey: 'drawing.colorGreen' },
  { color: '#f2ab3f', labelKey: 'drawing.colorOrange' },
  { color: '#7700aa', labelKey: 'drawing.colorPurple' },
]

/** Builds a MovementTool from line draw config so existing line infra works */
export function configToMovementTool(config: LineDrawConfig): MovementTool {
  const dashObj = DASH_OPTIONS.find((d) => d.id === config.dash) ?? DASH_OPTIONS[0]
  return {
    category: 'movement',
    // 'run-free' reuses the existing freehand draw/commit path in DrawingComponent
    toolId: config.freehand ? 'run-free' : `line-${config.dash}`,
    label: `line`,
    stroke: config.color,
    strokeWidth: config.thickness,
    strokeDasharray: dashObj.dasharray,
    arrow: false,
    smooth: config.smooth,
  }
}

interface Props {
  activeConfig: LineDrawConfig | null
  onActivate: (config: LineDrawConfig) => void
  setActivePlayerTool: (tool: null) => void
  setActiveEquipmentTool: (tool: null) => void
  setActiveSelectionTool: (tool: SelectionTool | null) => void
  setActiveTextTool: (tool: null) => void
  setActiveNumberTool: (tool: null) => void
  setActiveShapeTool: (tool: null) => void
  setSelectedItems: (items: {
    players: number[]
    equipment: number[]
    lines: number[]
    freehandLines: number[]
    texts: number[]
    numbers: number[]
  }) => void
}

const LineDrawSelector: React.FC<Props> = ({
  activeConfig,
  onActivate,
  setActivePlayerTool,
  setActiveEquipmentTool,
  setActiveSelectionTool,
  setActiveTextTool,
  setActiveNumberTool,
  setActiveShapeTool,
  setSelectedItems,
}) => {
  const { t } = useTranslation()
  const [dash, setDash] = useState<LineDrawConfig['dash']>(activeConfig?.dash ?? 'solid')
  const [thickness, setThickness] = useState(activeConfig?.thickness ?? 2)
  const [color, setColor] = useState(activeConfig?.color ?? '#000000')
  const [freehand, setFreehand] = useState(activeConfig?.freehand ?? false)
  const [smooth, setSmooth] = useState(activeConfig?.smooth ?? true)

  const clearOthers = useCallback(() => {
    setActivePlayerTool(null)
    setActiveEquipmentTool(null)
    setActiveTextTool(null)
    setActiveNumberTool(null)
    setActiveShapeTool(null)
    setSelectedItems({
      players: [],
      equipment: [],
      lines: [],
      freehandLines: [],
      texts: [],
      numbers: [],
    })
  }, [
    setActivePlayerTool,
    setActiveEquipmentTool,
    setActiveTextTool,
    setActiveNumberTool,
    setActiveShapeTool,
    setSelectedItems,
  ])

  const activate = useCallback(
    (d: LineDrawConfig['dash'], th: number, c: string, fh: boolean, sm: boolean) => {
      const config: LineDrawConfig = { dash: d, thickness: th, color: c, freehand: fh, smooth: sm }
      setDash(d)
      setThickness(th)
      setColor(c)
      setFreehand(fh)
      setSmooth(sm)
      clearOthers()
      setActiveSelectionTool(null)
      onActivate(config)
    },
    [clearOthers, setActiveSelectionTool, onActivate]
  )

  // Auto-activate on mount (when dropdown opens)
  useEffect(() => {
    if (!activeConfig) {
      activate(dash, thickness, color, freehand, smooth)
    }
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="tool-group" style={{ minWidth: 200 }}>
      {/* Straight vs freehand (separator) */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          gap: 4,
          alignItems: 'center',
          margin: '2px 0',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {[
          { fh: false, sm: true, labelKey: 'drawing.lineStraight', d: 'M0 12 L40 0' },
          {
            fh: true,
            sm: true,
            labelKey: 'drawing.lineFreehand',
            d: 'M1 10 Q 8 0, 15 7 T 30 4 T 39 9',
          },
          {
            fh: true,
            sm: false,
            labelKey: 'drawing.lineFreehandRaw',
            d: 'M1 10 L7 3 L13 9 L20 2 L27 10 L33 4 L39 9',
          },
        ].map((opt) => {
          const active = freehand === opt.fh && (!opt.fh || smooth === opt.sm)
          return (
            <button
              key={opt.labelKey}
              className={active ? 'selected' : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 11,
                border: active ? '2px solid #5c636a' : '1px solid #ccc',
                background: active ? '#e0e0e0' : 'transparent',
              }}
              onClick={() => activate(dash, thickness, color, opt.fh, opt.sm)}
              title={t(opt.labelKey)}
            >
              <svg width="40" height="12" viewBox="0 0 40 12">
                <path d={opt.d} stroke="#333" strokeWidth={2} fill="none" />
              </svg>
              {t(opt.labelKey)}
            </button>
          )
        })}
      </div>

      {/* Dash style */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          gap: 4,
          alignItems: 'center',
          margin: '2px 0',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: 11, color: '#666', width: '100%', textAlign: 'center' }}>
          {t('drawing.lineType')}
        </span>
        {DASH_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            className={dash === opt.id ? 'selected' : ''}
            style={{
              padding: '4px 8px',
              borderRadius: 4,
              cursor: 'pointer',
              border: dash === opt.id ? '2px solid #5c636a' : '1px solid #ccc',
              background: dash === opt.id ? '#e0e0e0' : 'transparent',
            }}
            onClick={() => activate(opt.id, thickness, color, freehand, smooth)}
            title={t(opt.labelKey)}
          >
            <svg width="40" height="8" viewBox="0 0 40 8">
              <line
                x1="0"
                y1="4"
                x2="40"
                y2="4"
                stroke="#333"
                strokeWidth={2}
                strokeDasharray={opt.dasharray}
              />
            </svg>
          </button>
        ))}
      </div>

      {/* Thickness */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          gap: 4,
          alignItems: 'center',
          margin: '4px 0 2px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: 11, color: '#666', width: '100%', textAlign: 'center' }}>
          {t('drawing.lineThickness')}
        </span>
        {THICKNESS_OPTIONS.map((th) => (
          <button
            key={th}
            style={{
              padding: '4px 6px',
              borderRadius: 4,
              cursor: 'pointer',
              border: thickness === th ? '2px solid #5c636a' : '1px solid #ccc',
              background: thickness === th ? '#e0e0e0' : 'transparent',
              minWidth: 32,
            }}
            onClick={() => activate(dash, th, color, freehand, smooth)}
            title={`${th}px`}
          >
            <svg width="32" height="12" viewBox="0 0 32 12">
              <line x1="2" y1="6" x2="30" y2="6" stroke="#333" strokeWidth={th} />
            </svg>
          </button>
        ))}
      </div>

      {/* Color */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          gap: 3,
          alignItems: 'center',
          margin: '4px 0 2px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: 11, color: '#666', width: '100%', textAlign: 'center' }}>
          {t('drawing.lineColor')}
        </span>
        {COLOR_OPTIONS.map((opt) => (
          <button
            key={opt.color}
            style={{
              width: 22,
              height: 22,
              borderRadius: 4,
              cursor: 'pointer',
              border: color === opt.color ? '2px solid #5c636a' : '1px solid #ccc',
              background: opt.color,
              padding: 0,
            }}
            onClick={() => activate(dash, thickness, opt.color, freehand, smooth)}
            title={t(opt.labelKey)}
          />
        ))}
      </div>
    </div>
  )
}

export default LineDrawSelector
