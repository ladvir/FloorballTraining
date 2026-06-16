import { Button } from 'flotr'

export function Variants() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <Button variant="primary">Uložit</Button>
      <Button variant="outline">Zrušit</Button>
      <Button variant="ghost">Detail</Button>
      <Button variant="danger">Smazat</Button>
    </div>
  )
}

export function Sizes() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Button size="lg" variant="primary">
        Velký
      </Button>
      <Button size="md" variant="primary">
        Střední
      </Button>
      <Button size="sm" variant="primary">
        Malý
      </Button>
    </div>
  )
}

export function Loading() {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Button variant="primary" loading>
        Ukládám…
      </Button>
      <Button variant="outline" loading>
        Načítám…
      </Button>
    </div>
  )
}

export function Disabled() {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Button variant="primary" disabled>
        Nedostupné
      </Button>
      <Button variant="danger" disabled>
        Smazat
      </Button>
    </div>
  )
}
