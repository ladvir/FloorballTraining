import { LoadingSpinner } from 'flotr'

export function Default() {
  return <LoadingSpinner />
}

export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <LoadingSpinner size="sm" />
      <LoadingSpinner size="md" />
      <LoadingSpinner size="lg" />
    </div>
  )
}
