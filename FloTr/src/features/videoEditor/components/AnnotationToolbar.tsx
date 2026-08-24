import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { MousePointer2, Minus, ArrowRight, Pencil, Type, Undo2, Redo2, Trash2 } from 'lucide-react'
import { cn } from '../../../utils/cn'
import {
  DASH_OPTIONS,
  THICKNESS_OPTIONS,
  COLOR_OPTIONS,
  type AnnotationTool,
  type DashStyle,
} from '../annotationTypes'

interface AnnotationToolbarProps {
  tool: AnnotationTool
  onToolChange: (tool: AnnotationTool) => void
  color: string
  onColorChange: (color: string) => void
  thickness: number
  onThicknessChange: (thickness: number) => void
  dash: DashStyle
  onDashChange: (dash: DashStyle) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  hasSelection: boolean
  onDeleteSelected: () => void
  selectedRangeSec: { startSec: number; endSec: number } | null
  onChangeSelectedRange: (startSec: number, endSec: number) => void
  durationSec: number
}

function ToolButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean
  onClick: () => void
  title: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-lg border',
        active
          ? 'border-sky-500 bg-sky-50 text-sky-600'
          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
      )}
    >
      {children}
    </button>
  )
}

export function AnnotationToolbar({
  tool,
  onToolChange,
  color,
  onColorChange,
  thickness,
  onThicknessChange,
  dash,
  onDashChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  hasSelection,
  onDeleteSelected,
  selectedRangeSec,
  onChangeSelectedRange,
  durationSec,
}: AnnotationToolbarProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex gap-1.5">
        <ToolButton
          active={tool === 'select'}
          onClick={() => onToolChange('select')}
          title={t('videoEditor.toolSelect')}
        >
          <MousePointer2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          active={tool === 'line'}
          onClick={() => onToolChange('line')}
          title={t('videoEditor.toolLine')}
        >
          <Minus className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          active={tool === 'arrow'}
          onClick={() => onToolChange('arrow')}
          title={t('videoEditor.toolArrow')}
        >
          <ArrowRight className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          active={tool === 'freehand'}
          onClick={() => onToolChange('freehand')}
          title={t('videoEditor.toolFreehand')}
        >
          <Pencil className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          active={tool === 'text'}
          onClick={() => onToolChange('text')}
          title={t('videoEditor.toolText')}
        >
          <Type className="h-4 w-4" />
        </ToolButton>
      </div>

      <div className="h-6 w-px bg-gray-200" />

      <div className="flex items-center gap-1.5">
        <span
          className="h-6 w-6 shrink-0 rounded border border-gray-300"
          style={{ background: color }}
        />
        <select
          aria-label={t('videoEditor.color')}
          value={color}
          onChange={(e) => onColorChange(e.target.value)}
          className="rounded border border-gray-300 px-1.5 py-1 text-xs"
        >
          {COLOR_OPTIONS.map((c) => (
            <option key={c} value={c} style={{ background: c }}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <select
        aria-label={t('videoEditor.thickness')}
        value={thickness}
        onChange={(e) => onThicknessChange(Number(e.target.value))}
        className="rounded border border-gray-300 px-1.5 py-1 text-xs"
      >
        {THICKNESS_OPTIONS.map((th) => (
          <option key={th} value={th}>
            {th}px
          </option>
        ))}
      </select>

      <select
        aria-label={t('videoEditor.lineStyle')}
        value={dash}
        onChange={(e) => onDashChange(e.target.value as DashStyle)}
        className="rounded border border-gray-300 px-1.5 py-1 text-xs"
      >
        {DASH_OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {t(`videoEditor.line${opt.id.charAt(0).toUpperCase()}${opt.id.slice(1)}`)}
          </option>
        ))}
      </select>

      <div className="h-6 w-px bg-gray-200" />

      <div className="flex gap-1.5">
        <ToolButton active={false} onClick={onUndo} title={t('common.undo')}>
          <Undo2 className={cn('h-4 w-4', !canUndo && 'opacity-30')} />
        </ToolButton>
        <ToolButton active={false} onClick={onRedo} title={t('common.redo')}>
          <Redo2 className={cn('h-4 w-4', !canRedo && 'opacity-30')} />
        </ToolButton>
        <ToolButton active={false} onClick={onDeleteSelected} title={t('common.delete')}>
          <Trash2 className={cn('h-4 w-4', !hasSelection && 'opacity-30')} />
        </ToolButton>
      </div>

      {hasSelection && selectedRangeSec && (
        <>
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>{t('videoEditor.visibleFrom')}</span>
            <input
              type="number"
              min={0}
              max={durationSec}
              step={0.1}
              value={Math.round(selectedRangeSec.startSec * 10) / 10}
              onChange={(e) =>
                onChangeSelectedRange(Number(e.target.value), selectedRangeSec.endSec)
              }
              className="w-16 rounded border border-gray-300 px-1.5 py-1"
            />
            <span>{t('videoEditor.visibleTo')}</span>
            <input
              type="number"
              min={0}
              max={durationSec}
              step={0.1}
              value={Math.round(selectedRangeSec.endSec * 10) / 10}
              onChange={(e) =>
                onChangeSelectedRange(selectedRangeSec.startSec, Number(e.target.value))
              }
              className="w-16 rounded border border-gray-300 px-1.5 py-1"
            />
            <span>{t('videoEditor.seconds')}</span>
          </div>
        </>
      )}
    </div>
  )
}
