# API Contract

This document specifies the REST API a future backend must implement to
replace the mock service layer in `src/services/*`. It is generated from
that service layer, which is the source of truth for shapes and behavior
today. Per `CLAUDE.md`, this repository is **frontend-only** — no backend
code lives here. This contract exists so backend work (in a separate
project) can proceed without renegotiating the data model.

Swapping a mock service for a real one is a one-function change: replace
the body of each exported function in `src/services/*.service.ts` with a
`fetch()`/HTTP client call of matching signature. Hooks and components
depend only on the function signatures below, not on the mock
implementation.

## Conventions

- Base path: `/api/v1`
- Auth: bearer token (see Auth). The current frontend only *simulates*
  role-based UI (`CLAUDE.md` §31) — a real backend must enforce
  authorization server-side; the frontend must not be trusted for it.
- Pagination: `?page=1&pageSize=20` → `{ items, total, page, pageSize }`
- Dates: ISO 8601 date strings (`YYYY-MM-DD`) unless noted.
- IDs: opaque strings. Human-facing codes (`EQ-0001`, `INC-00032`,
  `REP-00045`) are separate display fields, not primary keys.

## Domain model

Canonical TypeScript types: `src/lib/types.ts`. Summary:

| Entity | Key fields | Belongs to |
|---|---|---|
| `Airport` | id, name, code, city | — |
| `Terminal` | id, airportId, name | Airport |
| `Zone` | id, terminalId, name | Terminal |
| `Equipment` | id, code, type, manufacturer, model, serialNumber, inventoryNumber, status, commissionedAt, lastInspectionAt, nextInspectionAt | Airport → Terminal → Zone |
| `Inspection` | id, equipmentId, type, regulation, status, scheduledAt, completedAt, inspector, result | Equipment |
| `ChecklistItem` | id, label, result, comment | Inspection |
| `Fault` | id, equipmentId, title, description, category, priority, stage, detectedAt, dueAt, reportedBy, assignee | Equipment |
| `Repair` | id, faultId, equipmentId, status, engineer, startedAt, completedAt, estimatedHours, actualHours, partsUsed, verificationResult | Fault, Equipment |
| `SparePart` | id, name, sku, warehouse, stock, minStock, reserved, status, compatibleEquipmentTypes | — |
| `EquipmentDocument` | id, equipmentId, title, type, status, author, date, version | Equipment (optional) |
| `NotificationItem` | id, title, description, severity, createdAt, entityType, entityId, read | polymorphic (Equipment/Fault/Inspection/SparePart) |
| `AppUser` | id, fullName, email, role, airportId, active, lastActiveAt | Airport (optional) |

Calibration/verification and Reports/Analytics are not separate stored
entities — they are derived views over the entities above (see their
sections below).

Status enums are domain-separated per `CLAUDE.md` §15 — do not merge
`EquipmentStatus`, `InspectionStatus`, `FaultStage`, `RepairStatus`,
`DocumentStatus`, `SparePartStatus` into one shared enum.

## Endpoints

### Airports / Locations — `src/services/airports.service.ts`

| Method | Path | Returns |
|---|---|---|
| GET | `/airports` | `Airport[]` |
| GET | `/airports/:id/terminals` | `Terminal[]` |
| GET | `/terminals` | `Terminal[]` |
| GET | `/terminals/:id/zones` | `Zone[]` |
| GET | `/zones` | `Zone[]` |

### Equipment — `src/services/equipment.service.ts`

| Method | Path | Query/Body | Returns |
|---|---|---|---|
| GET | `/equipment` | `airportId?, terminalId?, zoneId?, type?, status?, search?, page?, pageSize?` | `Page<Equipment>` |
| GET | `/equipment/:id` | — | `Equipment` (404 if missing) |
| GET | `/equipment/types` | — | `string[]` (distinct types, for filter dropdowns) |
| PATCH | `/equipment/:id/status` | `{ status: EquipmentStatus }` | `Equipment` |

### Inspections — `src/services/inspections.service.ts`

| Method | Path | Query/Body | Returns |
|---|---|---|---|
| GET | `/inspections` | `equipmentId?, status?, page?, pageSize?` | `Page<Inspection>` |
| GET | `/equipment/:id/inspections` | — | `Inspection[]` |
| GET | `/inspections/:id` | — | `Inspection` (404) |
| GET | `/inspections/:id/checklist` | — | `ChecklistItem[]` |
| PATCH | `/inspections/:id/checklist/:itemId` | `{ result?, comment? }` | `ChecklistItem` |
| PATCH | `/inspections/:id/complete` | `{ result: "compliant" \| "non_compliant" \| "pending" \| null }` | `Inspection` |

A real backend will likely normalize checklists into
`templates → versions → steps → answers` (per the module list a
future NestJS backend would use) so that a checklist template can be
edited without mutating historical inspection answers. The frontend
contract above only requires that `GET /inspections/:id/checklist`
return the *resolved* answer set for that inspection — the backend is
free to compose it from template + version + step + answer tables
internally.

### Faults — `src/services/faults.service.ts`

| Method | Path | Query/Body | Returns |
|---|---|---|---|
| GET | `/faults` | `equipmentId?, stage?, priority?, search?, page?, pageSize?` | `Page<Fault>` |
| GET | `/equipment/:id/faults` | — | `Fault[]` |
| GET | `/faults/:id` | — | `Fault` (404) |
| POST | `/faults` | `Omit<Fault, "id" \| "detectedAt">` | `Fault` |
| PATCH | `/faults/:id/stage` | `{ stage: FaultStage }` | `Fault` |
| PATCH | `/faults/:id/assignee` | `{ assignee: string }` | `Fault` |

Stage must only move through the documented lifecycle (`CLAUDE.md`
§23): `detected → registered → assigned → diagnosis → repair →
verification → closed`. The backend should reject out-of-order
transitions; the mock service does not (it trusts the caller).

### Repairs — `src/services/repairs.service.ts`

| Method | Path | Query/Body | Returns |
|---|---|---|---|
| GET | `/repairs` | `equipmentId?, faultId?, status?, page?, pageSize?` | `Page<Repair>` |
| GET | `/faults/:id/repairs` | — | `Repair[]` |
| GET | `/repairs/:id` | — | `Repair` (404) |
| PATCH | `/repairs/:id/status` | `{ status: RepairStatus }` | `Repair` |
| PATCH | `/repairs/:id/parts` | `{ partName: string }` | `Repair` |

### Spare Parts — `src/services/spare-parts.service.ts`

| Method | Path | Query/Body | Returns |
|---|---|---|---|
| GET | `/spare-parts` | `status?, compatibleType?, search?, page?, pageSize?` | `Page<SparePart>` |
| GET | `/spare-parts/:id` | — | `SparePart` (404) |
| PATCH | `/spare-parts/:id/reserve` | `{ quantity: number }` | `SparePart` |
| PATCH | `/spare-parts/:id/consume` | `{ quantity: number }` | `SparePart` |

### Verification / Calibration — `src/services/calibration.service.ts`

| Method | Path | Query/Body | Returns |
|---|---|---|---|
| GET | `/calibration` | `airportId?, status?, search?, page?, pageSize?` | `Page<CalibrationRecord>` |

`CalibrationRecord` is `{ equipment: Equipment, status: CalibrationStatus, certificate: EquipmentDocument | null }`
— not a stored entity of its own. Per `CLAUDE.md` §26 it stays derived
from the equipment lifecycle: `status` (`overdue \| upcoming \| planned`)
is computed from `Equipment.nextInspectionAt` against today's date and a
30-day lookahead window, and `certificate` is the equipment's linked
document of type `certificate`, if any. A real backend can compute this
the same way (a view/query over `Equipment` + `Document`) rather than
introducing a new calibration table, unless calibration certificates
need their own lifecycle independent of the generic document store.

### Documents — `src/services/documents.service.ts`

| Method | Path | Query/Body | Returns |
|---|---|---|---|
| GET | `/documents` | `equipmentId?, type?, status?, page?, pageSize?` | `Page<EquipmentDocument>` |
| GET | `/documents/:id` | — | `EquipmentDocument` (404) |
| POST | `/documents` | `Omit<EquipmentDocument, "id" \| "date">` + file upload | `EquipmentDocument` |

The actual file bytes belong to a separate `files` module (object
storage) — `POST /documents` should accept `multipart/form-data` with
metadata fields plus the file, and return a document record with a
`fileUrl`. The current mock only tracks metadata.

### Notifications — `src/services/notifications.service.ts`

| Method | Path | Query/Body | Returns |
|---|---|---|---|
| GET | `/notifications` | `read?, severity?, page?, pageSize?` | `Page<NotificationItem>` |
| GET | `/notifications/unread-count` | — | `number` |
| PATCH | `/notifications/:id/read` | — | `NotificationItem` |
| PATCH | `/notifications/read-all` | — | `204 No Content` |

### Users — `src/services/users.service.ts`

| Method | Path | Query/Body | Returns |
|---|---|---|---|
| GET | `/users` | `role?, airportId?, active?, search?, page?, pageSize?` | `Page<AppUser>` |
| GET | `/users/:id` | — | `AppUser` (404) |
| PATCH | `/users/:id/active` | `{ active: boolean }` | `AppUser` |
| PATCH | `/users/:id/role` | `{ role: UserRole }` | `AppUser` |

### Auth — `src/services/auth.service.ts`

| Method | Path | Query/Body | Returns |
|---|---|---|---|
| GET | `/auth/me` | — | `AppUser` |
| POST | `/auth/login` | `{ email, password }` | `{ accessToken, user: AppUser }` — **not implemented in the mock**; the frontend currently simulates the signed-in user via `currentUser` in `src/lib/mock-data.ts` and has no login form. |

Real authentication/authorization (issuing tokens, verifying
credentials, enforcing role checks server-side) is explicitly out of
scope for this frontend repository (`CLAUDE.md` §2, §31). The
`switchToUser` mock helper exists only for demoing role-based UI in
development and has no backend equivalent — a real backend must not
expose an unauthenticated "become another user" endpoint.

### Reports / Analytics — `src/services/reports.service.ts`

| Method | Path | Query/Body | Returns |
|---|---|---|---|
| GET | `/reports/summary` | `period?: "30d" \| "90d" \| "year"` (default `"30d"`) | `ReportsSummary` |

`ReportsSummary` aggregates fleet KPIs, MTTR/MTBF, fault/parts trends,
per-airport compliance, and a 3-airport radar comparison — see
`ReportsSummary` in `reports.service.ts` for the exact shape. Two
different time semantics apply within the same response and a real
backend must preserve the distinction:

- **Current-state fields** (`total`, `operational`, `faulty`,
  `underRepair`, `overdueInspections`, `upcomingInspections`,
  `complianceByAirport`) reflect the fleet *right now* and are **not**
  windowed by `period`.
- **Trend fields** (`mttrHours`, `mtbfHours`, `byTypeFaultCount`,
  `partsConsumption`, `dailyFaults`, and the fault-derived leg of
  `radarSeries`) are computed only from faults/repairs whose date falls
  within the selected `period`.

`GET /spare-parts?...` (or an equivalent stock lookup) covers the
`getSparePartStockByName` helper this service also exports — that
helper just annotates parts-consumption rows with current stock and is
not itself a distinct endpoint.

### Settings — `src/services/settings.service.ts`

| Method | Path | Query/Body | Returns |
|---|---|---|---|
| GET | `/settings/directories/summary` | — | `{ airports, terminals, zones, equipmentTypes }` (counts) |
| GET | `/settings/notification-preferences` | — | `NotificationPreferences` |
| PATCH | `/settings/notification-preferences` | `Partial<NotificationPreferences>` | `NotificationPreferences` |

`NotificationPreferences` is `{ email: boolean, push: boolean, sms:
boolean }`, scoped to the current user. The mock keeps this in a
module-level variable (resets on reload); a real backend should persist
it per-`AppUser`. Role simulation (`useRole`) and theme (`useTheme`) are
deliberately **not** covered here — they are client-only UI/demo state
per `CLAUDE.md` §31, not backend-shaped resources.

## Coverage status

Every page now reads through `src/services/*` via a hook — there is no
remaining page importing `src/lib/mock-data.ts` directly for its primary
data. Two things are still intentionally outside the service layer, by
design rather than by omission:

- **Role simulation and theme** (`useRole`, `useTheme`) — pure
  client-side UI/demo state (`CLAUDE.md` §31), not backend resources.
- **Auth** — `POST /auth/login` above is speculative; there is no login
  form or token issuance in this frontend, only `GET /auth/me` and the
  dev-only `switchToUser` helper.
