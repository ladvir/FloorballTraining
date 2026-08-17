import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../components/shared/PageHeader'
import DrawingComponent from '../../components/ui/drawing/DrawingComponent'

export function DrawingPage() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] overflow-hidden">
      <PageHeader title={t('drawing.title')} />
      <div className="flex-1 min-h-0">
        <DrawingComponent />
      </div>
    </div>
  )
}
