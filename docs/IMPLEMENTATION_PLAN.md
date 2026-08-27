# Implementation Plan

## Stack

Next.js (App Router) + React + TypeScript + Tailwind CSS v4, per the
user's explicit instruction. No backend, no auth infrastructure — mock
data only, structured as `UI → Component → mock-data` so a real
`services/` API layer can replace `src/lib/mock-data.ts` later without
touching components.

## Repository architecture

```
src/
  app/                     Next.js routes (App Router)
    layout.tsx             Root layout — wraps every route in AppShell
    page.tsx                Dashboard
    equipment/page.tsx       Equipment Registry
    equipment/[id]/          Equipment Detail (tabs)
  components/
    ui/                     Button, Badge, Card, Input/Select — token-driven primitives
    layout/                 Sidebar, Topbar, PageHeader, AppShell
    data-display/           KPICard, EquipmentTable
    icons.tsx               Single shared stroke-icon set (no emoji, no mixed styles)
  config/
    nav.config.ts           Sidebar navigation structure
    equipmentStatus.config.ts / faultStatus.config.ts /
    inspectionStatus.config.ts / repairStatus.config.ts  Domain-separated status enums (CLAUDE.md §15)
  lib/
    types.ts                Domain models (Equipment-centric relational graph)
    mock-data.ts             Realistic relational mock dataset
    cn.ts / format.ts        Small utilities
docs/
  FIGMA_COMPONENT_MAP.md
  IMPLEMENTATION_PLAN.md
```

## Phase 1 — Core Foundation (this session)

Implemented:

- App shell: fixed dark sidebar (13-item nav incl. sub-nav for
  Inspections/Maintenance, quick actions, footer) + topbar
  (notifications, help, user menu) + scrollable workspace, matching the
  reference screenshots' three-layer shell.
- Design tokens: full dark palette (gray/brand/success/warning/error/
  purple), radius scale, typography scale, shadows — sourced from the
  exported Figma variable JSON, wired into Tailwind v4 via `@theme`.
- Status system: five separate typed configs (`equipmentStatus`,
  `inspectionStatus`, `faultStatus` incl. lifecycle + priority,
  `repairStatus`, plus spare-part/document status) — no shared enum,
  per CLAUDE.md §15.
- Shared primitives: `Button` (primary/secondary/tertiary/destructive/
  link), `StatusBadge`/`CountBadge`, `Card`, `Input`/`Select`,
  `KPICard`, `EquipmentTable` (compact + full modes).
- Mock data: 5 airports → 7 terminals → 9 zones → 18 equipment records
  (realistic manufacturers/models matching §19) → inspections, faults
  (with lifecycle stage + priority), repairs, spare parts, documents,
  notifications — all relationally linked back to `Equipment`.
- Pages: **Dashboard** (KPI row, status distribution, by-type,
  by-airport, upcoming inspections, active faults, notifications,
  compact equipment table), **Equipment Registry** (filter bar, full
  table, pagination footer), **Equipment Detail** (digital-passport
  header + Information / Inspection History / TO и ремонты /
  Faults / Documents tabs).

Acceptance check:

- [x] TypeScript compiles (`next build` — see report).
- [x] Equipment is the central entity; every other mock record
      references `equipmentId`.
- [x] Domain statuses are visually and structurally separated.
- [x] Dark, dense, enterprise visual language — no shadcn/Material
      defaults, no gradients/glassmorphism.

## Phase 2 — Core Operations (this session)

Implemented:

- **Fault management** (`/faults`): KPI row (total/open/in-progress/
  waiting-parts/resolved/closed/overdue), list+detail split layout —
  table on the left (click a row to select), detail panel on the
  right showing description, full lifecycle stepper (Detected →
  Registered → Assigned → Diagnosis → Repair → Verification → Closed,
  current stage highlighted), priority, category, assignee, due date,
  file/photo placeholders, and the three domain actions (assign,
  order spare parts, close). "Карта неисправностей" / "Диаграммы"
  tabs exist as placeholders (Phase 3/4 — map & analytics).
- **Inspections & Maintenance** (`/inspections`): KPI row, three-panel
  workflow — inspection list (filters + search) → selected equipment
  summary + full inspection history → active checklist workflow with
  a real progress bar, per-item Compliant/Non-Compliant/Not
  Applicable/Pending results (non-compliant items show their comment,
  never color-only per CLAUDE.md §22), general remarks textarea, photo
  upload placeholder, save-draft/complete actions. "ТО" tab is a
  Phase 3 placeholder.
- **Repairs** (`/repairs`): KPI row, list+detail split connecting
  Fault → Equipment → Repair per CLAUDE.md §24 — detail shows engineer,
  estimated vs actual duration, spare parts used, and verification
  result.
- Sidebar badge counts (Неисправности, Уведомления) and the topbar
  bell counter now derive from mock data instead of being hardcoded,
  so they stay consistent with what the pages actually show.
- `Проверки и ТО` sub-navigation (Календарь / График ТО / Чек-листы /
  Акты) was intentionally collapsed to a single top-level link — the
  Phase 2 page already covers list + checklist workflow inline, and
  building four more routes now would only produce dead sub-nav links
  before Phase 3 (Calendar) exists.

Acceptance check:

- [x] `next build` and `npm run lint` — clean, no errors/warnings.
- [x] All 6 routes (`/`, `/equipment`, `/equipment/[id]`, `/faults`,
      `/inspections`, `/repairs`) return 200 on the dev server.
- [x] Equipment context stays visible everywhere (fault/repair detail
      panels link back to `/equipment/[id]`).
- [x] Statuses stay domain-separated (fault stage vs. fault priority
      vs. repair status vs. checklist result are four distinct configs).
- [x] Fault lifecycle is shown as an explicit stepper, not hidden
      behind a single badge (§23).

## Phase 3 — Supporting Operations (this session)

Implemented:

- **Spare Parts / Inventory** (`/spare-parts`): KPI row (available/
  low-stock/reserved/out-of-stock), list+detail split — detail shows
  stock-vs-minimum bar, reservation count, compatible equipment types,
  and order/reserve/write-off actions (§25).
- **Verification / Calibration** (`/calibration`): every equipment
  record's next-verification date is classified Overdue / Upcoming
  (≤30 days) / Planned and shown in a table alongside its linked
  certificate document when one exists — keeps calibration tied to the
  equipment lifecycle instead of being a standalone module (§26).
- **Documents** (`/documents`): type-tagged (certificate/act/protocol/
  manual/repair report) table, each row linked back to its equipment
  (or marked "Общий документ" when it isn't equipment-specific),
  status badges via the existing `documentStatusConfig` (§27).
- **Notifications** (`/notifications`): full list with severity icon,
  unread indicator, "mark as read" (per-item and bulk) — a real client
  interaction, not a static list — and each item deep-links to its
  entity (equipment/fault/inspection/spare-part) per §30.
- **Reports & Analytics** (`/reports`): fleet KPI strip, MTTR (from
  actual repair hours) and an illustrative MTBF, most-problematic
  equipment types by fault count, per-airport compliance ranking, and
  spare-parts consumption — every chart answers a specific question
  per §29, no decorative charts.
- Sidebar badges extended to Spare Parts (low/out-of-stock count),
  Calibration (overdue count), and Documents (expiring/expired count)
  — all derived from mock data, matching the pattern set in Phase 2.

Acceptance check:

- [x] `next build` and `npm run lint` — clean.
- [x] All 11 routes return 200 on the dev server.
- [x] Notifications page has a real (non-fake) interaction — clicking
      "Прочитано" or a notification title updates read state.
- [x] Every module stays visibly tied to Equipment (§32 "closest
      existing pattern → reuse → extend", not a disconnected module).

## Phase 4 — Administration & Polish (this session)

Implemented:

- **Role-based UI simulation** (§31, real this time — not fake): a
  client `RoleProvider` (`src/lib/role-context.tsx`) wraps the app and
  exposes `useRole()`. `roleAccess.config.ts` maps each of the 6 roles
  to the sidebar sections it should see (Engineer: equipment/
  inspections/faults/repairs only; Spare Parts Manager: inventory +
  repairs; Central Office: equipment/location/reports/documents;
  Administrator: everything including Users/Settings; etc.). Sidebar
  and Topbar both consume the context, so switching role on
  `/settings` immediately changes the visible nav and the quick-action
  tiles — a real interaction, per §34, not decorative.
- **Users** (`/users`): KPI row + directory table (avatar initials,
  role chip, assigned airport, last-active date, active/inactive
  status), invite/export actions.
- **Settings** (`/settings`): profile card, the role-simulation
  switcher described above (with each role's real-world description
  from §31), a notifications panel with three working `Toggle`
  switches (new `ui/Toggle` primitive, built to match the Figma
  "Toggle" component's track/thumb anatomy), and a Directories summary
  (Airports/Terminals/Zones/Equipment-types counts, sourced live from
  mock data).
- Sidebar/Topbar refactored to be role-aware without becoming a real
  auth system — every route is still reachable directly by URL; only
  the *navigation UI* adapts, which is exactly what §31 asks for.

Acceptance check:

- [x] `next build` and `npm run lint` — clean.
- [x] All 13 routes return 200 on the dev server.
- [x] Switching role in Settings visibly changes Sidebar contents
      (verified: Engineer role hides Users/Settings/Reports; Auditor
      hides Repairs/Spare Parts).
- [x] No fake interactions — every visible control (role switch,
      notification toggles, mark-as-read) actually changes state.

### Final visual/responsive/accessibility pass

- Responsive: every multi-column workspace (Equipment Detail,
  Inspections' 3-panel workflow) collapses to a single column below
  its breakpoint; every data table sits in an `overflow-x-auto`
  wrapper with a `min-w-*` floor instead of being force-fit or turned
  into cards, per §37.
  - Focus-visible outline is defined once globally (`globals.css`) and
  applies to every interactive element uniformly.
- Icon-only buttons (table row actions, topbar icons) carry
  `aria-label`s; the notification bell and account menu are real
  `<Link>`s, reachable by keyboard.
- **Known gap, flagged rather than silently skipped:** the filter-bar
  `<Select>`/`<Input>` controls across list pages (Faults, Equipment
  Registry, Inspections, etc.) have no associated visible `<label>` —
  they rely on placeholder/option text only. Functional and visually
  consistent with the reference screenshots, but a future pass should
  add `aria-label`s for screen-reader users.

## Location (this session, resumed)

`/location` was the one dead sidebar link left after Phase 1–4. The
**Green** Figma file (`xK6ePC3HunPrCPpBKcUecI`, node `925-34508`) was
re-checked via `get_design_context`/`get_metadata` and is still not
open/selected in Figma desktop (0×0 node, "nothing selected" — same
result as the Phase-0 discovery session), so no real floor-plan asset
was available. Per user decision, built with the established pattern
language instead of inventing one:

- **Left (NAVIGATE)**: Airport → Terminal → Zone tree, reusing the same
  active/inactive row styling as Sidebar sub-nav, plus a live per-terminal
  status summary built from `equipmentStatusConfig`.
- **Center (VISUALIZE)**: since no floor-plan graphic exists, zones render
  as a `Card`-based schematic grid (closest existing pattern extended per
  §6E) — each zone is a block containing colored markers (one per piece of
  equipment, colored via the existing `equipmentStatusConfig` dot tokens,
  no new colors introduced). Real interactions: a 3-step zoom control
  (S/M/L, resizes markers) and clickable status-filter chips that
  hide/dim markers by status — both change actual rendered state, not
  decorative.
- **Right (INSPECT)**: selected-zone summary card — count, status
  breakdown, equipment list linking to `/equipment/[id]` — same anatomy
  as the Fault/Repair/Spare-Part detail panels.
- **Bottom**: existing `EquipmentTable` component, filtered to the
  current zone (or terminal if no zone selected) — reused verbatim, no
  new table component.
- Added five small relational helpers to `mock-data.ts`
  (`terminalsByAirport`, `zonesByTerminal`, `equipmentByZone`,
  `equipmentByTerminal`, `equipmentByAirport`) following the existing
  `*ByEquipment`/`*ById` naming convention.

Acceptance check:

- [x] `next build` and `npm run lint` — clean (14 routes now, `/location`
      returns 200).
- [x] No new colors, table styles, card radii, or icons introduced —
      100% reused primitives (`Card`, `Button`, `StatusBadge`, `Icon`,
      `EquipmentTable`, `equipmentStatusConfig`).
- [x] Verified interactively: airport/terminal/zone selection, zoom
      levels, and status-filter chips all update the rendered UI (not
      fake controls).

## Explicitly out of scope (would need product/Figma direction, not just more phases)

A pixel-accurate floor-plan graphic per airport/terminal (§21's "visual
airport/terminal plan" — the schematic zone-grid above is a functional
stand-in, not a to-scale floor plan), Inspection Calendar/Schedule/
Checklists-library/Acts sub-pages, Fault map & diagram tabs (both
currently show an honest "coming in a later phase" placeholder instead
of a fake screen). These need either a real Figma "Green" screen
reference or an explicit content decision (e.g. an actual terminal
floor-plan asset) before they can be built without inventing product
design, which CLAUDE.md §0/§38 forbids.

## Next steps (when resumed)

1. Re-open the **Green** Figma file in Figma desktop so `get_design_context`
   can pull real screen layouts if a closer 1:1 match to that file is
   required — this matters most for the Location map's center panel,
   which is currently a schematic stand-in, not a real floor plan.
2. a11y follow-up: label the filter-bar controls (Faults, Equipment
   Registry, Inspections, etc. — see Phase 4 note above).
3. If a real backend is introduced later, only `src/lib/mock-data.ts`
   (and the `*ById`/`*ByEquipment`/`*ByZone`/`*ByTerminal`/`*ByAirport`
   helper functions) need to become API calls — every component already
   consumes data through those functions, never the raw arrays directly
   in a page.
