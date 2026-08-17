import { PasswordInput } from 'flotr'

export function Default() {
  return (
    <div style={{ maxWidth: 320 }}>
      <PasswordInput label="Heslo" placeholder="Zadejte heslo" />
    </div>
  )
}

export function WithError() {
  return (
    <div style={{ maxWidth: 320 }}>
      <PasswordInput
        label="Potvrďte heslo"
        defaultValue="short"
        error="Heslo musí mít alespoň 8 znaků."
      />
    </div>
  )
}
