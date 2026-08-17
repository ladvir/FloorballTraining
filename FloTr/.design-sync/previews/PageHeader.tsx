import { PageHeader, Button } from 'flotr'

export function WithAction() {
  return (
    <PageHeader
      title="Tréninky"
      description="Přehled a správa tréninkových jednotek klubu."
      action={<Button size="sm">+ Přidat trénink</Button>}
    />
  )
}

export function Simple() {
  return <PageHeader title="Členové" description="Seznam aktivních členů týmu." />
}
