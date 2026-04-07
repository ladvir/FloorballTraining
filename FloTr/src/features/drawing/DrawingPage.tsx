import { PageHeader } from '../../components/shared/PageHeader'
import DrawingComponent from '../../components/ui/drawing/DrawingComponent'

export function DrawingPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] overflow-hidden">
      <PageHeader title="Kreslení" />
      <div className="flex-1 min-h-0">
        <DrawingComponent />
      </div>
    </div>
  )
}
