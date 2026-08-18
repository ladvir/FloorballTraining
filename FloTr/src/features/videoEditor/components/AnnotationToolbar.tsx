import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { MousePointer2, Minus, Pencil, Undo2, Redo2, Trash2 } from 'lucide-react'
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
          active={tool === 'freehand'}
          onClick={() => onToolChange('freehand')}
          title={t('videoEditor.toolFreehand')}
        >
          <Pencil className="h-4 w-4" />
        </ToolButton>
      </div>

      <div className="h-6 w-px bg-gray-200" />

      <div className="flex gap-1.5">
        {COLOR_OPTIONS.map((c) => (
          <button
            key={c}
            type="button"
            title={c}
            onClick={() => onColorChange(c)}
            className={cn(
              'h-6 w-6 rounded border',
              color === c ? 'border-2 border-sky-500' : 'border-gray-300'
            )}
            style={{ background: c }}
          />
        ))}
      </div>

      <div className="h-6 w-px bg-gray-200" />

      <div className="flex gap-1">
        {THICKNESS_OPTIONS.map((th) => (
          <button
            key={th}
            type="button"
            title={`${th}px`}
            onClick={() => onThicknessChange(th)}
            className={cn(
              'flex h-8 w-9 items-center justify-center rounded border',
              thickness === th ? 'border-sky-500 bg-sky-50' : 'border-gray-200 hover:bg-gray-50'
            )}
          >
            <svg width="24" height="10" viewBox="0 0 24 10">
              <line x1="1" y1="5" x2="23" y2="5" stroke="#333" strokeWidth={th} />
            </svg>
          </button>
        ))}
      </div>

      <div className="flex gap-1">
        {DASH_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            title={t(`videoEditor.line${opt.id.charAt(0).toUpperCase()}${opt.id.slice(1)}`)}
            onClick={() => onDashChange(opt.id)}
            className={cn(
              'flex h-8 w-9 items-center justify-center rounded border',
              dash === opt.id ? 'border-sky-500 bg-sky-50' : 'border-gray-200 hover:bg-gray-50'
            )}
          >
            <svg width="24" height="10" viewBox="0 0 24 10">
              <line
                x1="1"
                y1="5"
                x2="23"
                y2="5"
                stroke="#333"
                strokeWidth={2}
                strokeDasharray={opt.dasharray}
              />
            </svg>
          </button>
        ))}
      </div>

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
