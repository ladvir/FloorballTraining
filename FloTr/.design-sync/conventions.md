# FloTr UI — Design Agent Conventions

## No wrapper needed

Components render standalone — no provider, no ThemeProvider, no router context.
Every component is self-styled and works without any app-level setup.
`Modal` renders via `createPortal` to `document.body`; always pass `isOpen={true}` and a no-op `onClose` for static renders.

## Styling idiom — Tailwind CSS v4 utility classes

All styling goes through the `className` prop. Components apply their own base classes internally and merge extras you pass via `className`.

Key class families (verified in shipped CSS):

| Purpose                  | Classes                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| Primary colour           | `bg-sky-500 text-white hover:bg-sky-600 ring-sky-500`                                       |
| Danger colour            | `bg-red-500 text-white hover:bg-red-600`                                                    |
| Success / Warning / Info | `bg-green-100 text-green-700` / `bg-yellow-100 text-yellow-700` / `bg-sky-100 text-sky-700` |
| Neutral surfaces         | `bg-white bg-gray-50 bg-gray-100 text-gray-700 text-gray-500`                               |
| Borders                  | `border border-gray-200 border-gray-300`                                                    |
| Radii                    | `rounded-lg rounded-xl rounded-full`                                                        |
| Shadow                   | `shadow-sm`                                                                                 |
| Text scale               | `text-xs text-sm text-base text-xl font-medium font-semibold`                               |
| Form field sizes         | `h-8 h-9 h-11 px-3 px-4 px-6`                                                               |
| Focus ring               | `focus-visible:ring-2 focus-visible:ring-offset-1`                                          |
| Animation                | `animate-spin`                                                                              |

Do **not** invent class names that aren't in the table — all classes come from the Tailwind v4 default palette. For layout glue between components (gaps, padding, flex containers), use standard Tailwind utilities like `flex gap-4 p-6 max-w-sm`.

## Where the truth lives

- Component API: `components/<group>/<Name>/<Name>.d.ts` — the `<Name>Props` interface.
- Usage guide: `components/<group>/<Name>/<Name>.prompt.md` — prop documentation and examples.
- Compiled styles: `_ds_bundle.css` (component classes) + `styles.css` (imports fonts and bundle CSS).
- Fonts: Inter loaded from Google Fonts at runtime via `@import url(https://fonts.googleapis.com/...)`.

## Idiomatic build example

```tsx
import { Button, Badge, Card, CardHeader, CardContent, PageHeader } from 'flotr'

function TrainingCard() {
  return (
    <div className="max-w-sm">
      <PageHeader
        title="Trénink"
        action={
          <Button size="sm" variant="outline">
            Upravit
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-gray-900">SK Florbal Praha</span>
            <Badge variant="success">Aktivní</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Středa 18. 6. 2026 · 17:00</p>
        </CardContent>
      </Card>
    </div>
  )
}
```

This example uses: Tailwind layout glue (`max-w-sm flex items-center justify-between`), component `className` extensions (`font-semibold text-sm text-gray-900`), and the four core component families (PageHeader, Button, Card suite, Badge).
