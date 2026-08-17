# Design Sync Notes — FloTr UI

## Repo-specific setup

- FloTr is a React SPA (not a library package). Synth-entry mode is used — no dist/ library entry exists.
- Tailwind CSS v4 with `@tailwindcss/vite` plugin. CSS only generates during a Vite build; there's no standalone Tailwind CLI config.
- CSS workflow: run `npm run build` → copy `dist/assets/index-*.css` → `.design-sync/flotr.css` → `cfg.cssEntry: ".design-sync/flotr.css"`. The hash changes every build; always copy fresh before syncing.
- Inter font loaded from Google Fonts (`@import url(...)` in index.css). `[FONT_REMOTE]` is expected — no action needed.
- Custom `cn` utility at `src/utils/cn.ts` (not clsx/tailwind-merge). Bundled inline by esbuild — no external dep needed.
- `lucide-react` is a direct dep (used in PasswordInput, EmptyState, Modal). Resolved from `node_modules/` normally.

## Component exclusions

- `src/components/ui/drawing/` — 31 SVG/canvas components for the floorball field drawing tool. All excluded via `componentSrcMap: null`. Too complex and specialized for a design system card.
- `src/components/layout/` — AppLayout, Sidebar, Navbar, ClubSwitcher excluded. All require React Router context, auth state, and live API data.
- `src/components/shared/PdfOptionsModal`, `SafeDeleteModal`, `UnsavedChangesDialog` — excluded. These are app-specific modals with complex state and API dependencies.

## Known component special handling

- **Modal** uses `createPortal` — set `cardMode: "single"` and explicit viewport so the open state renders inside the card. Already in `cfg.overrides.Modal`.
- **Card** exports three named exports from one file: `Card`, `CardHeader`, `CardContent`. All pinned to `src/components/ui/Card.tsx` in componentSrcMap.

## Build command (re-syncs)

The converter must be invoked with `--entry ./.ds-sync/.flotr-entry.mjs` (explicit synthetic barrel):

```
node .ds-sync/package-build.mjs --config .design-sync/config.json --node-modules ./node_modules --entry ./.ds-sync/.flotr-entry.mjs --out ./ds-bundle
```

**Why**: FloTr is an app, not a library package. Without `--entry`, the converter tries to resolve `node_modules/flotr/` (self-install) and fails with ENOENT. The `.ds-sync/.flotr-entry.mjs` barrel (gitignored) provides the entry; `.ds-sync/package.json` has no `name` field so the pkgDir walk reaches `FloTr/package.json` correctly.

The `.ds-sync/.flotr-entry.mjs` file must be recreated on a fresh clone:

```mjs
export { Button } from '../src/components/ui/Button.tsx'
export { Badge } from '../src/components/ui/Badge.tsx'
export { Input } from '../src/components/ui/Input.tsx'
export { PasswordInput } from '../src/components/ui/PasswordInput.tsx'
export { Card, CardHeader, CardContent } from '../src/components/ui/Card.tsx'
export { Modal } from '../src/components/shared/Modal.tsx'
export { PageHeader } from '../src/components/shared/PageHeader.tsx'
export { EmptyState } from '../src/components/shared/EmptyState.tsx'
export { LoadingSpinner } from '../src/components/shared/LoadingSpinner.tsx'
```

## Known render warns (from first sync — update as triaged)

- Render check skipped entirely (user chose browser review over Playwright). All 11 components confirmed visually in `.review.html`. No machine-checked screenshots exist.

## Re-sync risks

- `cfg.cssEntry` references a file (`.design-sync/flotr.css`) that is a copy of the last Vite build's CSS. If Tailwind utilities change (new component added, class used), rebuild and re-copy before re-syncing or previews will render without the new classes.
- Drawing component names in `componentSrcMap: null` must be kept in sync if new drawing components are added to `ui/drawing/`.
- Exclude list in `componentSrcMap` only covers names the converter would discover from `srcDir: "src/components"`. If a new feature creates a PascalCase export in `src/components/` that should be excluded, add it.
