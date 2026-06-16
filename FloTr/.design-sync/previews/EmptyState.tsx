import { EmptyState, Button } from 'flotr'

export function Default() {
  return <EmptyState />
}

export function WithAction() {
  return (
    <EmptyState
      title="Žádné tréninky"
      description="Zatím nebyly přidány žádné tréninkové jednotky."
      action={<Button size="sm">Přidat první trénink</Button>}
    />
  )
}
