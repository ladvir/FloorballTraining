import { Card, CardHeader } from 'flotr'

export function Basic() {
  return (
    <div style={{ maxWidth: 380 }}>
      <Card>
        <CardHeader>
          <div style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>Záhlaví karty</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
            Podtitulek nebo metadata
          </div>
        </CardHeader>
      </Card>
    </div>
  )
}
