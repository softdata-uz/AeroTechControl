# Figma Component Map

## A. Figma sources inspected

- **Green** file (`xK6ePC3HunPrCPpBKcUecI`, node `925-34508`) — could not be
  read this session: the desktop bridge returned empty (0×0) nodes and
  `get_design_context` reported "nothing selected." The file was not open
  in Figma desktop during this session.
- **Blue** file (`nZpflHF85MaGUGo85YtfbM`, node `18666-2032`, frame
  "Main components") — successfully read via `get_metadata`. This is an
  Untitled UI–derived master component sheet containing every base
  component and its variants as symbols.
- Exported variable collections (provided as JSON, used as the token
  source of truth):
  - `_Primitives.json` — full primitive color ramps (gray/blue/success/
    warning/error/purple/teal/… 25–950), spacing scale, width scale.
  - `1. Color modes.json` — semantic tokens (`bg-*`, `text-*`,
    `border-*`, `fg-*`) with Light mode / Dark mode resolved values.
  - `2. Radius.json` — `radius-none` … `radius-full` (0–24px, full 9999px).
  - `3. Spacing.json` — `spacing-none` … `spacing-11xl` (0–160px).
  - `4. Widths.json`, `5. Containers.json` — layout width tokens.
  - `6. Typography.json` — Inter family, weight names, `text-xs` …
    `display-2xl` sizes/line-heights.

## B. Component inventory (from "Main components" frame)

Top-level component groups found (each is a Figma component-set with
many variants — size / hierarchy / state / icon-only, etc.):

- Buttons/Button, Button close X, Button destructive, Button utility,
  Button loading icon, `_Button group base`
- Badge, Badge group
- Tag, `_Tag close X`, `_Tag count`, `_Tag checkbox`
- Dropdown, Select
- Input field, Textarea input field
- Toggle, Checkbox, Radio group item, Radio group
- Tooltip
- Progress bar, Progress circle
- File upload
- Sidebar navigation, Header navigation
- Metric item
- Pagination dot group, Pagination
- `_Feed item base`, Message, `_Message reaction`, `_Message action
  button`, Message action, `_Message status icon`
- `_Tab button base`
- Table
- Breadcrumbs
- Alert, Notification
- `_Date picker menu`, Date picker dropdown, Calendar
- Loading indicator
- Empty state

## C. Component variants (representative — Button)

`Buttons/Button` alone exposes: Size (`md`, …), Hierarchy (`Primary`,
`Secondary`, `Tertiary`, `Link color`, `Link gray`), State (`Default`,
`Hover`, `Focused`, `Disabled`), Icon only (`True`/`False`). This
variant grammar (Size × Hierarchy × State) is mirrored by every other
component in the sheet and is what the React `Button`/`Badge`/etc.
primitives in `src/components/ui` implement as typed props.

## D. Screens using each pattern

No product screens (Dashboard, Registry, Equipment Detail, etc.) exist
in either accessible Figma file — only the raw component sheet was
reachable. Screen layout therefore follows the five approved reference
screenshots supplied in chat (Dashboard, Equipment Registry, Location,
Inspections & Maintenance, Faults) per CLAUDE.md §7–§9, §17–§23, using
the component sheet only for token/primitive fidelity (colors, radius,
spacing, button/badge/table anatomy).

## E. Missing patterns

- No dedicated "Green" product screens were reachable this session —
  the visual DNA for actual pages comes from the reference screenshots,
  not from Figma directly. If the Green file is reopened in Figma
  desktop in a future session, re-run discovery and reconcile.
- Sidebar navigation / Header navigation component variants exist in
  the sheet but weren't individually inspected (`get_design_context`
  wasn't run per-symbol, due to session scope/token budget) — the
  built `Sidebar`/`Topbar` follow the reference screenshots directly.
- Equipment-domain components (KPI card, equipment row/card, QR block,
  status pill per domain) have no direct Figma equivalent — they are
  built by extending Badge/Card/Table primitives per §6E's rule
  ("closest existing pattern → reuse its logic → extend consistently").

## Design tokens extracted → implementation

All tokens live in `src/app/globals.css` as CSS custom properties,
exposed to Tailwind v4 via an inline `@theme` block (so
`bg-bg-primary`, `text-text-secondary`, `border-border-primary`,
`rounded-xl` (→ `radius-xl` = 12px), `bg-brand-600`, `bg-success-600`,
etc. are all real utility classes). The product is dark-only per
CLAUDE.md §7, so the **Dark mode** resolved values from
`1. Color modes.json` were taken as the sole `:root` palette (no
light/dark toggle).
