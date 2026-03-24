# FloTr Design System Rules for Figma Integration

## 1. Token Definitions

Design tokens are defined via **Tailwind CSS v4** defaults (no custom theme overrides). All tokens come from Tailwind's built-in design system.

**Key tokens used in this project:**

### Colors
```
Primary:     sky-500 (#0ea5e9), sky-600 (#0284c7)
Success:     green-100/700
Warning:     yellow-100/700
Danger:      red-500/600, red-100/700
Info:        sky-100/700
Neutral:     gray-50 through gray-900

Background:  #f9fafb (gray-50)
Text:        #111827 (gray-900)
Secondary:   #6b7280 (gray-500)
Borders:     gray-200 (cards), gray-300 (inputs)
```

### Typography
```
Font:        Inter (Google Fonts), weights: 300-700
Page title:  text-xl (20px), font-semibold
Section:     text-base (16px), font-semibold
Body:        text-sm (14px), font-normal
Label:       text-sm (14px), font-medium, gray-700
Small:       text-xs (12px), font-medium
```

### Spacing
```
Component gap: gap-2 (8px), gap-3 (12px), gap-4 (16px)
Section gap:   gap-6 (24px)
Card padding:  px-6 py-4
Page padding:  p-4 (mobile), p-6 (desktop)
```

### Border Radius
```
Buttons/Inputs: rounded-lg (8px)
Cards/Modals:   rounded-xl (12px)
Badges/Avatars: rounded-full
```

### Shadows
```
Cards:     shadow-sm
Hover:     shadow-md
Dropdowns: shadow-md
Modals:    shadow-xl
```

## 2. Component Library

Components are in `src/components/` with this structure:

```
src/components/
  ui/          — Atomic UI primitives
    Button.tsx    — 4 variants × 3 sizes
    Input.tsx     — With label + error state
    Card.tsx      — Card, CardHeader, CardContent
    Badge.tsx     — 5 color variants
    drawing/      — SVG drawing canvas system
  layout/      — App shell
    AppLayout.tsx — Sidebar + Navbar + Content
    Sidebar.tsx   — Navigation, role-based items
    Navbar.tsx    — Top bar, avatar, notifications
  shared/      — Reusable complex components
    Modal.tsx          — Dialog with backdrop
    LoadingSpinner.tsx — 3 sizes
    PageHeader.tsx     — Title + description + action
    EmptyState.tsx     — Empty data placeholder
    PdfOptionsModal.tsx — PDF export options
```

### Component Patterns

**Button:**
```tsx
<Button variant="primary|outline|ghost|danger" size="sm|md|lg" loading={boolean}>
  <Icon /> Label
</Button>
```

**Input:**
```tsx
<Input label="Label" error="Error message" placeholder="..." />
```

**Card:**
```tsx
<Card>
  <CardHeader>Header content</CardHeader>
  <CardContent className="space-y-4 py-4">Body</CardContent>
</Card>
```

**Badge:**
```tsx
<Badge variant="default|success|warning|danger|info">Text</Badge>
```

**Modal:**
```tsx
<Modal isOpen={bool} onClose={fn} title="Title" maxWidth="sm|md|lg">
  Content
</Modal>
```

## 3. Frameworks & Libraries

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4.2 via `@tailwindcss/vite` |
| Bundler | Vite |
| Router | React Router v7 |
| State | Zustand (auth), TanStack Query (server) |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| HTTP | Axios |

## 4. Asset Management

- No image assets in the frontend (images come from API as base64/SVG)
- Icons from `lucide-react` package (tree-shaken imports)
- Font loaded from Google Fonts CDN
- PDF assets (icons like group.png, sandglass.png) are in the .NET `Reporting` project

## 5. Icon System

**Library:** Lucide React

**Import pattern:**
```tsx
import { Plus, Pencil, Trash2, Eye, Search, Clock } from 'lucide-react'
```

**Sizing convention:**
```
In text/buttons: className="h-3.5 w-3.5" or "h-4 w-4"
Standalone:      className="h-5 w-5"
Empty state:     className="h-12 w-12"
```

**Common icons:**
- CRUD: Plus, Pencil, Trash2, Eye
- Navigation: ArrowLeft, ArrowRight, ChevronLeft, ChevronRight
- Status: Check, CheckCircle, AlertTriangle, X
- Data: Clock, MapPin, Users, Calendar, Target, User
- Actions: Search, Download, FileText, FileSpreadsheet, LogOut
- Roles: Shield, ShieldCheck (Admin), Crown (HeadCoach), Dumbbell (Coach)

## 6. Styling Approach

**Methodology:** Utility-first with Tailwind CSS

**Class composition:** via `cn()` utility (like clsx):
```tsx
import { cn } from '../../utils/cn'
cn('base-classes', condition && 'conditional-class', className)
```

**Global styles** (`src/index.css`):
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
@import "tailwindcss";
body {
  font-family: 'Inter', system-ui, sans-serif;
  background-color: #f9fafb;
  color: #111827;
}
```

**Responsive design:** Mobile-first with `lg:` breakpoint (1024px):
- Sidebar: hidden on mobile, overlay with toggle; static on desktop
- Grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Content padding: `p-4 lg:p-6`

## 7. Project Structure

```
FloTr/src/
  api/           — API clients (axios instances)
  components/
    ui/          — Button, Input, Card, Badge, drawing/
    layout/      — AppLayout, Sidebar, Navbar
    shared/      — Modal, PageHeader, EmptyState, LoadingSpinner
  features/      — Feature modules (page per feature)
    auth/        — Login, Register, Profile pages
    dashboard/   — Dashboard page
    trainings/   — List, Form, ScheduleModal
    activities/  — List, Form (with drawing/media)
    appointments/— Calendar/List, Form, Detail, Export modals
    teams/       — List, Form (with members management)
    members/     — List, Detail
    clubs/       — List (admin)
    admin/       — User management
    notifications/— Notification list
    equipment/   — CRUD table
    places/      — CRUD table
    seasons/     — CRUD table + form
    tags/        — CRUD table with colors
    drawing/     — Standalone drawing page
    settings/    — User preferences
  store/         — Zustand stores (authStore)
  router/        — React Router config with role guards
  types/         — TypeScript interfaces (domain.types.ts)
  utils/         — cn.ts utility
```

### Page Layout Patterns

**Table pages** (Equipment, Places, Seasons, Tags, Members, Admin Users):
```
PageHeader (title + action button)
Filter bar (optional)
Table (rounded-xl border overflow-hidden)
```

**Grid pages** (Activities, Trainings, Teams, Clubs):
```
PageHeader (title + action button)
Toolbar (view toggle + search + filters + sort)
Responsive grid (sm:2 lg:3 cols)
```

**Form pages** (Login, Register, Profile, Settings):
```
Centered container (max-w-sm or max-w-lg)
Card(s) with form sections
```

**Dashboard:**
```
Greeting + quick actions
3-column grid (events | trainings | activities)
```

### Key Design Decisions

1. **No custom Tailwind theme** — uses all default Tailwind tokens
2. **sky-500 as primary** — consistent across buttons, links, active states, loading
3. **Status dots** — yellow-400 (draft), green-400 (complete)
4. **Role-based UI** — sidebar items, action buttons, routes conditionally shown
5. **Consistent card pattern** — rounded-xl, border-gray-200, bg-white, shadow-sm
6. **Table pattern** — rounded-xl container, gray-50 header, hover:bg-gray-50 rows
