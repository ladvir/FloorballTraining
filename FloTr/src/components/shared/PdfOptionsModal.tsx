import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from './Modal'
import { Button } from '../ui/Button'

export interface PdfOptions {
  includeTrainingParameters: boolean
  includeTrainingDetails: boolean
  includeTrainingDescription: boolean
  includeComments: boolean
  includePartDescriptions: boolean
  includeActivityDescriptions: boolean
  includeImages: boolean
}

interface PdfOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (options: PdfOptions) => void
  loading?: boolean
  /** "training" shows all options, "activity" shows only description + images */
  type?: 'training' | 'activity'
}

function CheckboxRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
}

export function PdfOptionsModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  type = 'training',
}: PdfOptionsModalProps) {
  const { t } = useTranslation()
  const [opts, setOpts] = useState<PdfOptions>({
    includeTrainingParameters: true,
    includeTrainingDetails: true,
    includeTrainingDescription: true,
    includeComments: true,
    includePartDescriptions: true,
    includeActivityDescriptions: true,
    includeImages: true,
  })

  const set = (key: keyof PdfOptions, value: boolean) =>
    setOpts((prev) => ({ ...prev, [key]: value }))

  const isTraining = type === 'training'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('pdf.title')} maxWidth="sm">
      <div className="space-y-3">
        {isTraining && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {t('pdf.training')}
            </p>
            <CheckboxRow
              checked={opts.includeTrainingParameters}
              onChange={(v) => set('includeTrainingParameters', v)}
              label={t('pdf.parameters')}
            />
            <CheckboxRow
              checked={opts.includeTrainingDetails}
              onChange={(v) => set('includeTrainingDetails', v)}
              label={t('pdf.details')}
            />
            <CheckboxRow
              checked={opts.includeTrainingDescription}
              onChange={(v) => set('includeTrainingDescription', v)}
              label={t('pdf.trainingDescription')}
            />
            <CheckboxRow
              checked={opts.includeComments}
              onChange={(v) => set('includeComments', v)}
              label={t('pdf.comments')}
            />

            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                {t('pdf.parts')}
              </p>
            </div>
            <CheckboxRow
              checked={opts.includePartDescriptions}
              onChange={(v) => set('includePartDescriptions', v)}
              label={t('pdf.partDescriptions')}
            />
          </>
        )}

        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {isTraining ? t('pdf.activities') : t('pdf.content')}
        </p>
        <CheckboxRow
          checked={opts.includeActivityDescriptions}
          onChange={(v) => set('includeActivityDescriptions', v)}
          label={t('pdf.activityDescriptions')}
        />
        <CheckboxRow
          checked={opts.includeImages}
          onChange={(v) => set('includeImages', v)}
          label={t('pdf.images')}
        />
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onClose} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button size="sm" loading={loading} onClick={() => onConfirm(opts)}>
          {t('pdf.download')}
        </Button>
      </div>
    </Modal>
  )
}
