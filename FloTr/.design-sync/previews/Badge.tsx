import { Badge } from 'flotr'

export function Variants() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 8 }}>
      <Badge variant="default">Obecný</Badge>
      <Badge variant="success">Aktivní</Badge>
      <Badge variant="warning">Čeká</Badge>
      <Badge variant="danger">Zrušen</Badge>
      <Badge variant="info">Plánováno</Badge>
      <Badge variant="violet">Hlavní liga</Badge>
    </div>
  )
}

export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8 }}>
      <Badge size="md" variant="info">
        Střední
      </Badge>
      <Badge size="sm" variant="info">
        Malý
      </Badge>
    </div>
  )
}
