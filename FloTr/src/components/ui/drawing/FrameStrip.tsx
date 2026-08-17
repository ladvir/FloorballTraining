import React from 'react'
import { useTranslation } from 'react-i18next'
import type { Frame } from './DrawingTypes'

interface FrameStripProps {
  frames: Frame[]
  activeFrameIndex: number
  onSelectFrame: (index: number) => void
  onAddFrame: () => void
  onDeleteActiveFrame: () => void
  onMoveActiveFrame: (direction: -1 | 1) => void
  onDurationChange: (index: number, durationMs: number) => void
  onPlay?: () => void
}

const FrameStrip: React.FC<FrameStripProps> = ({
  frames,
  activeFrameIndex,
  onSelectFrame,
  onAddFrame,
  onDeleteActiveFrame,
  onMoveActiveFrame,
  onDurationChange,
  onPlay,
}) => {
  const { t } = useTranslation()

  return (
    <div id="frame-strip">
      {frames.map((frame, i) => (
        <React.Fragment key={i}>
          <div className="frame-chip-group">
            <button
              type="button"
              className={`frame-chip${i === activeFrameIndex ? ' selected' : ''}`}
              onClick={() => onSelectFrame(i)}
            >
              {t('drawing.frameLabel', { n: i + 1 })}
            </button>
            {i === activeFrameIndex && (
              <div className="frame-chip-actions">
                <button
                  type="button"
                  onClick={() => onMoveActiveFrame(-1)}
                  disabled={i === 0}
                  title={t('drawing.moveFrameLeft')}
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => onMoveActiveFrame(1)}
                  disabled={i === frames.length - 1}
                  title={t('drawing.moveFrameRight')}
                >
                  ›
                </button>
                {frames.length > 1 && (
                  <button
                    type="button"
                    onClick={onDeleteActiveFrame}
                    title={t('drawing.deleteFrame')}
                  >
                    ×
                  </button>
                )}
              </div>
            )}
          </div>
          {i < frames.length - 1 && (
            <div className="frame-duration">
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={frame.durationMs / 1000}
                onChange={(e) => onDurationChange(i, Math.round(Number(e.target.value) * 1000))}
                title={t('drawing.frameDurationTitle')}
              />
              <span>{t('drawing.frameDurationUnit')}</span>
            </div>
          )}
        </React.Fragment>
      ))}
      <button type="button" className="frame-add-btn" onClick={onAddFrame}>
        + {t('drawing.addFrame')}
      </button>
      {onPlay && frames.length > 1 && (
        <button type="button" className="frame-play-btn" onClick={onPlay}>
          ▶ {t('drawing.playAnimation')}
        </button>
      )}
    </div>
  )
}

export default FrameStrip
