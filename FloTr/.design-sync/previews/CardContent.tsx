import { Card, CardContent } from 'flotr'

export function Basic() {
  return (
    <div style={{ maxWidth: 380 }}>
      <Card>
        <CardContent>
          <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
            Obsahová oblast karty — sem patří hlavní informace, formuláře nebo tabulky.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
