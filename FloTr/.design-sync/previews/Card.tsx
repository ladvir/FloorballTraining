import { Card, CardHeader, CardContent } from 'flotr'

export function WithHeader() {
  return (
    <div style={{ maxWidth: 380 }}>
      <Card>
        <CardHeader>
          <div style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>Trénink — středa</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>18. 6. 2026 · 17:00</div>
        </CardHeader>
        <CardContent>
          <p style={{ margin: 0, fontSize: 14, color: '#374151' }}>
            Florbalový trénink zaměřený na přihrávky a hru v přesilovce.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export function ContentOnly() {
  return (
    <div style={{ maxWidth: 380 }}>
      <Card>
        <CardContent>
          <p style={{ margin: 0, fontSize: 14, color: '#374151' }}>
            Jednoduchá karta bez záhlaví — vhodná pro informační bloky.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
