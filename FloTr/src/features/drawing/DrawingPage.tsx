import { PageHeader } from '../../components/shared/PageHeader'
import DrawingComponent from '../../components/ui/drawing/DrawingComponent'

export function DrawingPage() {
  return (
    <div>
      <PageHeader title="Kreslení" />
      <DrawingComponent />
    </div>
  )
}
