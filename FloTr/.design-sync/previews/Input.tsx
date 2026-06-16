import { Input } from 'flotr'

export function Default() {
  return (
    <div style={{ maxWidth: 320 }}>
      <Input label="Jméno hráče" placeholder="Karel Novák" />
    </div>
  )
}

export function WithError() {
  return (
    <div style={{ maxWidth: 320 }}>
      <Input
        label="E-mail"
        placeholder="jmeno@flotr.cz"
        defaultValue="neplatny-email"
        error="Zadejte platnou e-mailovou adresu."
      />
    </div>
  )
}

export function Disabled() {
  return (
    <div style={{ maxWidth: 320 }}>
      <Input label="Klub" defaultValue="SK Floorball Praha" disabled />
    </div>
  )
}
