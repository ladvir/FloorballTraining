# FloTr Design System

Kompletní dokumentace vizuálního systému aplikace FloTr pro rekonstrukci ve Figmě.

---

## Základní nastavení

### Font
- **Rodina:** Inter (Google Fonts)
- **Váhy:** 300 (light), 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Import:** `https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap`

### Pozadí a text
- **Pozadí stránky:** `#f9fafb` (gray-50)
- **Základní text:** `#111827` (gray-900)
- **Sekundární text:** `#6b7280` (gray-500)
- **Terciární text:** `#9ca3af` (gray-400)

---

## Barevná paleta

### Primární barva (Sky)
| Token | Hex | Použití |
|-------|-----|---------|
| sky-50 | #f0f9ff | Pozadí aktivního nav-itemu, lehké zvýraznění |
| sky-100 | #e0f2fe | Avatar pozadí, badge info pozadí, unread notifikace |
| sky-400 | #38bdf8 | Selection ring |
| sky-500 | #0ea5e9 | Primární tlačítko, logo, linky, loading spinner |
| sky-600 | #0284c7 | Primární hover, aktivní nav text, avatar text |
| sky-700 | #0369a1 | Badge info text |

### Neutrální (Gray)
| Token | Hex | Použití |
|-------|-----|---------|
| gray-50 | #f9fafb | Pozadí stránky, disabled input, table header |
| gray-100 | #f3f4f6 | Hover pozadí, border (light), card header border |
| gray-200 | #e5e7eb | Border karet, input border, tabulka border |
| gray-300 | #d1d5db | Input border, outline button border |
| gray-400 | #9ca3af | Placeholder, terciární text, ikony |
| gray-500 | #6b7280 | Sekundární text, popisky |
| gray-600 | #4b5563 | Nav text (neaktivní), ghost button text |
| gray-700 | #374151 | Label text, outline button text, badge default text |
| gray-900 | #111827 | Hlavní text, nadpisy |

### Úspěch (Green)
| Token | Hex | Použití |
|-------|-----|---------|
| green-50 | #f0fdf4 | Success alert pozadí |
| green-100 | #dcfce7 | Badge success pozadí |
| green-200 | #bbf7d0 | Success border |
| green-400 | #4ade80 | Status tečka (kompletní) |
| green-700 | #15803d | Badge success text, success alert text |

### Varování (Yellow)
| Token | Hex | Použití |
|-------|-----|---------|
| yellow-50 | #fefce8 | Warning counter pozadí |
| yellow-100 | #fef9c3 | Badge warning pozadí |
| yellow-400 | #facc15 | Status tečka (koncept/draft) |
| yellow-700 | #a16207 | Badge warning text |

### Nebezpečí (Red)
| Token | Hex | Použití |
|-------|-----|---------|
| red-50 | #fef2f2 | Error alert pozadí |
| red-100 | #fee2e2 | Badge danger pozadí |
| red-200 | #fecaca | Error border |
| red-400 | #f87171 | Error ikona |
| red-500 | #ef4444 | Danger tlačítko, notifikace badge |
| red-600 | #dc2626 | Danger hover, error text |
| red-700 | #b91c1c | Badge danger text |

### Barvy štítků (Tag Colors)
```
#3b82f6  (blue)
#ef4444  (red)
#22c55e  (green)
#f59e0b  (amber)
#8b5cf6  (violet)
#ec4899  (pink)
#14b8a6  (teal)
#f97316  (orange)
#6366f1  (indigo)
#6b7280  (gray)
```

---

## Typografie

| Úroveň | Velikost | Váha | Barva | Použití |
|---------|----------|------|-------|---------|
| Page title | text-xl (20px) | font-semibold (600) | gray-900 | Nadpis stránky |
| Card title | text-base (16px) | font-semibold (600) | gray-900 | Nadpis modalu, sekce |
| Logo | text-lg (18px) | font-bold (700) | sky-500 | Sidebar logo "FloTr" |
| Body | text-sm (14px) | font-normal (400) | gray-600 | Běžný text |
| Label | text-sm (14px) | font-medium (500) | gray-700 | Popisky formulářů |
| Small | text-xs (12px) | font-medium (500) | gray-500 | Tabulkové záhlaví, badge |
| Section label | text-xs (12px) | font-semibold (600) | gray-400 | Admin sekce, uppercase, tracking-wider |
| Error | text-xs (12px) | font-normal | red-500 | Chybové hlášky |

---

## Rozměry a mezery

### Spacing škála (nejčastěji použité)
| Token | Hodnota | Použití |
|-------|---------|---------|
| gap-1 | 4px | Minimální mezera (label-input) |
| gap-2 | 8px | Mezera mezi ikonou a textem |
| gap-3 | 12px | Mezera mezi položkami seznamu, filtry |
| gap-4 | 16px | Mezera mezi form poli |
| gap-6 | 24px | Mezera mezi sekcemi |
| p-4 / px-4 py-4 | 16px | Padding karet, obsahu |
| p-6 / px-6 py-4 | 24px/16px | Padding Card komponent |
| p-8 | 32px | Padding login formuláře |
| mb-6 | 24px | Spodní mezera nadpisu |

### Border radius
| Token | Hodnota | Použití |
|-------|---------|---------|
| rounded-lg | 8px | Tlačítka, inputy, dropdown, nav-item |
| rounded-xl | 12px | Karty, tabulky, modaly |
| rounded-full | 9999px | Badge, avatar, status tečky |

### Shadows
| Token | Použití |
|-------|---------|
| shadow-sm | Karty (výchozí stav) |
| shadow-md | Karty (hover), dropdown menu |
| shadow-xl | Modaly |

---

## Komponenty

### Button

**Varianty:**

| Varianta | Pozadí | Text | Border | Hover |
|----------|--------|------|--------|-------|
| primary | sky-500 | white | — | sky-600 |
| outline | white | gray-700 | gray-300 | gray-50 |
| ghost | transparent | gray-600 | — | gray-100 |
| danger | red-500 | white | — | red-600 |

**Velikosti:**

| Velikost | Výška | Padding | Font |
|----------|-------|---------|------|
| sm | 32px (h-8) | px-3 | text-xs (12px) |
| md | 36px (h-9) | px-4 | text-sm (14px) |
| lg | 44px (h-11) | px-6 | text-base (16px) |

**Společné:** rounded-lg, font-medium, gap-2, focus ring (2px, offset 1px), disabled: opacity 50%

**Loading stav:** Spinning SVG ikona (animate-spin), tlačítko disabled

---

### Input

| Stav | Border | Ring | Pozadí |
|------|--------|------|--------|
| Default | gray-300 | — | white |
| Focus | sky-500 | sky-500/20 (2px) | white |
| Error | red-400 | red-400/20 (2px) | white |
| Disabled | gray-300 | — | gray-50 |

**Rozměry:** h-9 (36px), px-3, text-sm, rounded-lg
**Label:** text-sm, font-medium, gray-700
**Error text:** text-xs, red-500

---

### Card

| Část | Styling |
|------|---------|
| Card (obal) | rounded-xl, border gray-200, bg-white, shadow-sm |
| CardHeader | border-b gray-100, px-6, py-4 |
| CardContent | px-6, py-4 |

---

### Badge

| Varianta | Pozadí | Text |
|----------|--------|------|
| default | gray-100 | gray-700 |
| success | green-100 | green-700 |
| warning | yellow-100 | yellow-700 |
| danger | red-100 | red-700 |
| info | sky-100 | sky-700 |

**Společné:** rounded-full, px-2.5, py-0.5, text-xs, font-medium

---

### Modal

| Část | Styling |
|------|---------|
| Backdrop | bg-black/40, z-50, centered |
| Dialog | rounded-xl, bg-white, shadow-xl |
| Header | border-b gray-100, px-5, py-4 |
| Title | text-base, font-semibold, gray-900 |
| Close button | gray-400, hover: gray-600, bg-gray-100 |
| Content | px-5, py-4, overflow-y-auto |

**Šířky:** sm (max-w-sm), md (max-w-md), lg (max-w-lg)

---

### Tabulka

| Část | Styling |
|------|---------|
| Container | rounded-xl, border gray-200, overflow-hidden, bg-white |
| Header row | bg-gray-50, border-b gray-100 |
| Header cell | px-4 py-3 (nebo px-3 py-2), text-xs, font-medium, gray-500, text-left |
| Body row | border-b gray-100, hover:bg-gray-50 |
| Body cell | px-4 py-3, text-sm |
| Action cell | text-right |

---

### Sidebar (navigace)

| Část | Styling |
|------|---------|
| Container | w-56 (224px), bg-white, border-r gray-200, h-full |
| Logo | h-14 (56px), px-6, border-b gray-100 |
| Logo text | text-lg, font-bold, sky-500 |
| Nav section | py-4, px-3 |
| Nav item | rounded-lg, px-3, py-2, text-sm, font-medium, gap-3 |
| Nav item (active) | bg-sky-50, text-sky-600 |
| Nav item (inactive) | text-gray-600, hover:bg-gray-50, hover:text-gray-900 |
| Admin label | text-xs, font-semibold, uppercase, tracking-wider, gray-400 |
| Footer | border-t gray-100, px-3, py-3 |

---

### Navbar (horní lišta)

| Část | Styling |
|------|---------|
| Container | h-14 (56px), border-b gray-200, bg-white, px-4 |
| Avatar | h-7 w-7 (28px), rounded-full, bg-sky-100, text-sky-600, text-xs, font-semibold |
| Notification badge | h-5 min-w-5, rounded-full, bg-red-500, text-white, text-[10px], font-bold |
| User menu dropdown | w-48, rounded-lg, border gray-200, bg-white, shadow-md |

---

### Status indikátory

| Stav | Zobrazení |
|------|-----------|
| Draft/Koncept | Žlutá tečka (h-2 w-2, rounded-full, bg-yellow-400) |
| Complete/Kompletní | Zelená tečka (h-2 w-2, rounded-full, bg-green-400) |
| Unread notification | Malá sky-500 tečka + sky-50 pozadí, border sky-200 |
| Selection | ring-2 ring-sky-400 |

### Alert/Message boxy

| Typ | Border | Pozadí | Text | Ikona |
|-----|--------|--------|------|-------|
| Success | green-200 | green-50 | green-700 | CheckCircle |
| Error | red-200 | red-50 | red-700 | AlertTriangle |
| Warning | orange-200 | orange-50 | orange-700 | AlertTriangle |

---

### Typ události (barvy)

| Typ | Badge varianta | Barva |
|-----|----------------|-------|
| 0 - Trénink | info | sky |
| 1 - Soustředění | success | green |
| 2 - Pořádání | warning | yellow |
| 3 - Zápas | danger | red |
| 4 - Jiná | default | gray |
| 5 - Školení | info | sky |
| 6 - Pořádání akce | success | green |

---

## Layout

### Hlavní layout (AppLayout)

```
┌──────────────────────────────────────────────┐
│                 Navbar (h-14)                 │
├────────┬─────────────────────────────────────┤
│        │                                     │
│Sidebar │         Main Content                │
│ (w-56) │         (p-4 lg:p-6)               │
│        │         overflow-y-auto             │
│        │                                     │
│        │                                     │
└────────┴─────────────────────────────────────┘
```

- **Mobilní chování:** Sidebar je overlay (z-30), skrytý defaultně, toggle tlačítko v Navbar
- **Desktop:** Sidebar je statický (lg:static lg:translate-x-0)
- **Breakpoint:** lg (1024px)

### Responzivní gridy

| Kontext | Pattern |
|---------|---------|
| Dashboard | grid-cols-1 lg:grid-cols-3 gap-6 |
| Karty (týmy, kluby) | grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 |
| Aktivity/tréninky | grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 |
| Formulář (2 sloupce) | grid-cols-2 gap-3 nebo gap-4 |
| Úzký formulář | max-w-sm nebo max-w-lg, mx-auto |

---

## Stránky aplikace

### Navigační položky

| Sekce | Položky | Min. role |
|-------|---------|-----------|
| Hlavní | Dashboard, Tréninky, Aktivity, Události, Týmy, Kreslení, Notifikace | User |
| Správa | Členové | HeadCoach |
| Admin | Kluby, Vybavení, Místa, Sezóny, Tagy, Správa uživatelů | Admin |
| Zápatí | Profil a nastavení | User |

### PageHeader pattern

```
┌─────────────────────────────────────────────┐
│ Title                          [Action btn] │
│ optional description                        │
└─────────────────────────────────────────────┘
  mb-6
```

### Page body patterns

**Tabulková stránka** (Členové, Vybavení, Místa, Sezóny, Tagy, Admin):
```
PageHeader
Filtry (flex flex-wrap gap-3)
Tabulka (rounded-xl border)
```

**Grid stránka** (Aktivity, Tréninky, Týmy, Kluby):
```
PageHeader
Toolbar (view toggle, search, filters, sort)
Grid (sm:2cols lg:3cols gap-3/4)
```

**Formulářová stránka** (Login, Registrace, Profil, Nastavení):
```
Centered container (max-w-sm nebo max-w-lg)
Card(s) se sekcemi
```

**Dashboard:**
```
Greeting header + quick action buttons
3-column grid (lg:grid-cols-3)
  Column 1: Události
  Column 2: Tréninky
  Column 3: Aktivity
```

---

## Ikony

Knihovna: **Lucide React**

### Nejpoužívanější ikony

| Ikona | Kontext |
|-------|---------|
| Plus | Přidání nového záznamu |
| Pencil | Editace |
| Trash2 | Smazání |
| Eye | Detail/zobrazení |
| Search | Vyhledávání |
| Clock | Čas, doba trvání |
| MapPin | Místo/lokace |
| Users | Počet osob, tým |
| Calendar | Datum, události |
| Bell | Notifikace |
| Check, CheckCircle | Potvrzení, úspěch |
| AlertTriangle | Varování, chyba |
| ArrowLeft | Zpět |
| ArrowRight | Více, odkaz |
| ChevronLeft/Right | Navigace (kalendář) |
| X | Zavření |
| FileText | PDF |
| FileSpreadsheet | Excel export |
| Download | Stažení |
| GripVertical | Drag handle |
| Shield, ShieldCheck | Role (User, Admin) |
| Crown | Role HeadCoach |
| Dumbbell | Role Coach |
| Target | Cíle tréninku |
| ExternalLink | Externí odkaz |
| Repeat | Opakování události |
| User | Autor, vlastník |
| UserPlus | Přidání člena |
| UserX | Deaktivace |
| UserCheck | Aktivace |
| LogOut | Odhlášení |
| Settings | Nastavení |

**Velikosti ikon:**
- Malé (v textu): h-3 w-3 nebo h-3.5 w-3.5
- Výchozí: h-4 w-4
- Větší (v tlačítcích): h-5 w-5
- EmptyState: h-12 w-12
