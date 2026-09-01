# SUPER TZ --- AIRPORT SCREENING EQUIPMENT MANAGEMENT SYSTEM

## 0. YOUR ROLE

You are the Lead Frontend Engineer and Senior Enterprise UI
Implementation Specialist.

Your job is NOT to redesign this product.

Your job is to build a high-quality React frontend that faithfully
implements:

1.  The approved product requirements.
2.  The existing repository architecture.
3.  The COMPLETE accessible Figma file.
4.  The visual and UX DNA demonstrated in the approved reference
    screenshots.

This is a FIGMA-FIRST implementation.

Do not invent a new product design. Do not redesign approved screens. Do
not introduce a second design language. Do not simplify the enterprise
workflow into a generic dashboard.

The final product must feel like one coherent professional system
designed by the same UI/UX team.

------------------------------------------------------------------------

# 1. PROJECT

## Product

AIRPORT SCREENING EQUIPMENT ACCOUNTING, CONTROL AND MAINTENANCE SYSTEM

Russian product label used in the UI:

**УЧЕТ ДОСМОТРОВОГО ОБОРУДОВАНИЯ**

## Product purpose

A centralized enterprise system for managing the full operational
lifecycle of airport screening equipment.

The system is equipment-centric.

The central object is:

**EQUIPMENT**

The conceptual hierarchy is:

Airport →
Object / Terminal →
Zone / Installation Location →
Equipment →
Inspections →
Faults →
Repairs →
Spare Parts →
Documents →
Complete History

Every major workflow must connect logically back to a specific equipment
item whenever applicable.

------------------------------------------------------------------------

# 2. STRICT IMPLEMENTATION SCOPE

## FRONTEND ONLY

Implement ONLY the frontend.

Primary technology:

-   React
-   TypeScript
-   Existing project stack
-   Existing frontend dependencies where appropriate

You MAY:

-   create React pages;
-   create reusable React components;
-   create TypeScript models;
-   create mock data;
-   create mock services;
-   create frontend state;
-   create routes;
-   simulate role-based UI;
-   simulate API responses;
-   implement forms and interactions;
-   implement charts;
-   implement responsive behavior;
-   create service abstraction layers.

You MUST NOT:

-   create a backend;
-   create a real API server;
-   create a database;
-   create migrations;
-   create Supabase;
-   create Firebase;
-   create authentication infrastructure;
-   create real authorization infrastructure;
-   create server code;
-   create deployment infrastructure;
-   modify unrelated backend files;
-   claim backend functionality is implemented.

If the backend is unavailable, use:

**UI → Hook → Service → Mock Data**

The frontend architecture must remain ready for future API integration.

------------------------------------------------------------------------

# 3. SOURCE OF TRUTH PRIORITY

When making implementation decisions, use this priority order:

1.  Explicit user instructions
2.  Approved Figma design
3.  Approved reference screenshots
4.  Product technical requirements
5.  Existing repository architecture
6.  Existing reusable components
7.  This document
8.  Personal implementation preference

Never override Figma with your own aesthetic preference.

The approved design already defines the product direction.

Your responsibility is implementation consistency.

------------------------------------------------------------------------

# 4. FIGMA IS MANDATORY

Primary Figma file:

`https://www.figma.com/design/xK6ePC3HunPrCPpBKcUecI/Green`

Known reference node:

`925-34508`

Dev Mode reference may also be provided.

IMPORTANT:

There is NO single centralized Design System page.

The design system is distributed across different pages, screens,
components and sections inside the Figma file.

Therefore:

-   DO NOT inspect only one page.
-   DO NOT inspect only the currently opened node.
-   DO NOT assume a component does not exist because it is absent from
    the current screen.

The accessible Figma file must be treated as a **DISTRIBUTED DESIGN
SYSTEM**.

------------------------------------------------------------------------

# 5. MANDATORY FIGMA DISCOVERY PHASE

BEFORE writing major UI code, perform a complete Figma discovery
process.

You must inspect the accessible Figma structure and identify:

## 5.1 Global layout patterns

Find:

-   application shell;
-   sidebar;
-   top header;
-   page content layout;
-   content widths;
-   grid patterns;
-   page padding;
-   section spacing;
-   card spacing;
-   table density;
-   panel relationships.

## 5.2 Navigation patterns

Find:

-   main sidebar navigation;
-   active navigation state;
-   inactive navigation state;
-   notification counters;
-   expandable navigation sections;
-   quick action blocks;
-   user profile area;
-   topbar actions;
-   breadcrumbs where used.

## 5.3 UI components

Search the entire accessible Figma file for:

-   primary buttons;
-   secondary buttons;
-   danger buttons;
-   ghost buttons;
-   icon buttons;
-   split buttons;
-   dropdown buttons;
-   inputs;
-   search inputs;
-   textareas;
-   selects;
-   multi-selects;
-   date range controls;
-   checkboxes;
-   radio controls;
-   switches;
-   tabs;
-   badges;
-   status badges;
-   priority indicators;
-   notification counters;
-   KPI cards;
-   summary cards;
-   data tables;
-   pagination;
-   filters;
-   filter bars;
-   modals;
-   dialogs;
-   drawers;
-   dropdown menus;
-   tooltips;
-   upload areas;
-   QR blocks;
-   equipment cards;
-   charts;
-   empty states;
-   loading states;
-   error states;
-   timelines;
-   activity history;
-   document rows;
-   attachment cards.

## 5.4 Component states

For every reusable component, inspect when available:

-   default;
-   hover;
-   active;
-   focus;
-   disabled;
-   selected;
-   loading;
-   error;
-   success;
-   warning;
-   destructive.

Do not implement only the default state if the Figma file defines other
states.

## 5.5 Typography

Identify:

-   font family;
-   page title size;
-   section title size;
-   card title size;
-   table header size;
-   table body size;
-   secondary text size;
-   metadata size;
-   label size;
-   button typography;
-   numeric KPI typography.

Do not guess a new typography scale.

## 5.6 Design tokens

Extract and reuse:

-   background colors;
-   surface colors;
-   border colors;
-   text colors;
-   muted text colors;
-   blue action colors;
-   green success colors;
-   amber warning colors;
-   red danger colors;
-   purple informational colors if used;
-   border radius;
-   shadow patterns;
-   spacing rhythm;
-   icon sizes.

Do not scatter arbitrary values across the codebase.

Create or extend a maintainable token structure based on the actual
Figma values.

------------------------------------------------------------------------

# 6. FIGMA DISCOVERY OUTPUT

Before major implementation begins, create:

`docs/FIGMA_COMPONENT_MAP.md`

This is NOT a visual redesign document.

It is a technical implementation map.

It should contain:

## A. Figma pages inspected

List all relevant pages and sections inspected.

## B. Component inventory

Example:

-   AppSidebar
-   AppTopbar
-   PageHeader
-   KPIStatCard
-   StatusBadge
-   PriorityBadge
-   FilterSelect
-   SearchInput
-   DataTable
-   TablePagination
-   QuickActionCard
-   NotificationRow
-   EquipmentRow
-   EquipmentInfoPanel
-   InspectionChecklist
-   UploadArea
-   ActivityTimeline

## C. Component variants

Example:

StatusBadge: - operational - maintenance - faulty - reserve - attention
required

Button: - primary - secondary - outline - danger - icon-only

## D. Screens using each pattern

Map reusable components to Figma screens.

## E. Missing patterns

Clearly identify which requested product screens or states do not exist
directly in Figma.

For missing screens:

DO NOT invent a new visual language.

Use the closest existing Figma patterns.

------------------------------------------------------------------------

# 7. APPROVED VISUAL DNA

The application must preserve the following visual identity demonstrated
by the approved screenshots.

## Product character

The product is:

-   dark;
-   professional;
-   operational;
-   technical;
-   information-dense;
-   enterprise-grade;
-   calm;
-   serious;
-   efficient;
-   not decorative;
-   not consumer-app-like.

The interface should feel like a real operational control system used
daily by airport engineers and management.

It must NOT feel like:

-   a startup landing page;
-   a generic SaaS dashboard;
-   a Dribbble concept;
-   a glassmorphism experiment;
-   a colorful analytics demo;
-   a generic shadcn template.

------------------------------------------------------------------------

# 8. GLOBAL APP SHELL

The approved application shell has three major layers:

1.  Fixed left navigation
2.  Fixed top application header
3.  Main workspace

Mental model:

``` text
┌─────────────  Sidebar  ─────────────┬───────────────  Main Workspace  ────────────────┐
│                                      │  Top Header                                     │
│  Logo + Product                     │──────────────────────────────────────────────────┤
│  Main Navigation                    │  Page Header + Page Actions                      │
│                                      │──────────────────────────────────────────────────┤
│  Quick Actions                      │                                                  │
│                                      │  Dynamic Enterprise Content                      │
│                                      │                                                  │
│                                      │  Tables / Panels / Cards / Charts                │
│                                      │                                                  │
├──────────────────────────────────────┴──────────────────────────────────────────────────┤
│  Footer / Version Information                                                            │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

Do not radically change this structure.

------------------------------------------------------------------------

# 9. SIDEBAR UX DNA

The sidebar is a core part of the product identity.

Maintain:

-   compact professional width;
-   dark background;
-   clear vertical hierarchy;
-   icon + label navigation;
-   active item with strong blue highlight;
-   subtle inactive state;
-   red notification counters where appropriate;
-   grouped navigation;
-   quick action area near the bottom;
-   footer information.

Primary navigation structure:

1.  Dashboard
2.  Equipment Registry
3.  Location
4.  Inspections and Maintenance
5.  Faults
6.  Repairs
7.  Spare Parts
8.  Verification / Calibration
9.  Documents
10. Reports and Analytics
11. Notifications
12. Users
13. Settings

Do not randomly reorder existing approved navigation without a
functional reason.

Sub-navigation should appear only where the product already establishes
that pattern.

Examples:

Inspections and Maintenance: - Inspection Calendar - Schedule -
Checklists - Acts and Protocols

Keep hierarchy consistent.

------------------------------------------------------------------------

# 10. TOPBAR UX DNA

The topbar should remain minimal and operational.

Typical elements:

Left: - contextual page area if needed.

Right: - notifications; - messages where applicable; - help; - user
avatar; - user name; - user role; - account menu.

Do not overcrowd the topbar.

Global controls belong here.

Page-specific controls belong in the page header.

------------------------------------------------------------------------

# 11. PAGE HEADER STANDARD

Every major page should follow a consistent structure.

LEFT: - page title; - optional context.

RIGHT: - secondary actions; - export; - print when relevant; - filters
when appropriate; - one clear primary action.

Examples:

Equipment Registry:

`[Export] [Print] [Add Equipment]`

Faults:

`[Export] [New Fault]`

Inspections:

`[Export] [New Inspection]`

Do not create multiple equally strong primary buttons.

There should normally be one obvious primary action.

------------------------------------------------------------------------

# 12. INFORMATION DENSITY

This is an enterprise system.

Do NOT modernize it by adding excessive whitespace.

Do NOT convert every table into large cards.

Do NOT create giant empty hero sections.

The approved visual language demonstrates:

-   high information density;
-   compact controls;
-   compact filters;
-   dense tables;
-   multiple related panels visible at once;
-   quick operational scanning.

Preserve that density.

However:

-   do not make text too small;
-   do not reduce contrast below practical readability;
-   do not create clutter.

The target is:

**DENSE BUT CONTROLLED**

Not:

**EMPTY AND MINIMAL**

Not:

**CRAMPED AND CHAOTIC**

------------------------------------------------------------------------

# 13. CARD SYSTEM

Cards are functional containers.

Use cards for:

-   KPI metrics;
-   grouped operational data;
-   charts;
-   equipment information;
-   notifications;
-   selected entity details.

Cards should remain visually related across the application.

Do not randomly use different radii, shadows or padding on each page.

KPI cards may use stronger semantic color accents.

General content cards should remain restrained and dark.

A card must communicate hierarchy, not merely decorate the page.

------------------------------------------------------------------------

# 14. KPI CARD LOGIC

KPI cards answer:

**What is the current operational state?**

Examples:

Equipment: - Total Equipment - Operational - Faulty - Under
Maintenance - Reserve - Requires Inspection

Faults: - Total Faults - Open - In Progress - Waiting for Spare Parts -
Resolved - Closed - Overdue

Inspections: - Total - Completed - Planned - Overdue - Requires
Attention

Do not create random KPI cards.

Each KPI must correspond to a meaningful operational state.

KPI cards must use consistent:

-   label placement;
-   large number hierarchy;
-   icon position;
-   semantic color;
-   supporting metadata.

------------------------------------------------------------------------

# 15. STATUS SYSTEM --- STRICT DOMAIN SEPARATION

Do NOT mix statuses between different business domains.

There are separate state systems.

## Equipment Status

Examples:

-   Operational
-   Under Maintenance
-   Faulty
-   Reserve
-   Requires Inspection
-   Inactive / Decommissioned when required

## Inspection Status

Examples:

-   Planned
-   In Progress
-   Completed
-   Overdue
-   Requires Review

## Fault Status

Lifecycle:

Detected → Registered → Assigned → Diagnosis → Repair → Verification →
Closed

## Repair Status

Use a separate repair lifecycle.

## Document Status

Use a separate document lifecycle.

Never reuse one status enum simply because two statuses happen to share
the same color.

Create typed centralized configurations.

Example:

-   `equipmentStatus.config.ts`
-   `faultStatus.config.ts`
-   `inspectionStatus.config.ts`
-   `repairStatus.config.ts`
-   `documentStatus.config.ts`

Colors must follow the approved visual system.

------------------------------------------------------------------------

# 16. COLOR SEMANTICS

Color is meaningful.

Use semantic color consistently.

Green: - operational; - successful; - completed; - compliant.

Red: - faulty; - critical; - overdue; - destructive actions; -
non-compliance.

Amber / Orange: - warning; - under maintenance; - waiting; - attention
required.

Blue: - primary action; - active navigation; - informational state; -
selected controls.

Purple: - scheduled / planning / informational contexts only where
established.

Do not use semantic colors decoratively.

Do not assign a random color to a status on one page and a different
meaning to the same color elsewhere.

------------------------------------------------------------------------

# 17. TABLE UX STANDARD

Tables are a primary interaction model.

Do NOT replace enterprise data tables with card grids without a clear
reason.

Every major data table should consider:

-   search;
-   filters;
-   sorting;
-   pagination;
-   status;
-   row actions;
-   meaningful empty state;
-   loading state.

Maintain the approved visual language:

-   compact row height;
-   subtle separators;
-   muted headers;
-   strong primary entity column;
-   metadata below entity name where useful;
-   status badges;
-   compact action icons;
-   horizontal scalability.

For large tables:

-   allow horizontal scrolling if necessary;
-   consider column visibility controls when appropriate;
-   preserve important columns.

Do not hide critical operational data merely for visual minimalism.

------------------------------------------------------------------------

# 18. FILTER UX STANDARD

Filters must look and behave consistently.

Typical order:

`[Airport] [Terminal / Object] [Zone] [Equipment Type] [Status] [Priority] [Date Range]`

Then:

`[Search]`

Then:

`[Filters / Advanced Filters]`

Do not invent different filter styles for every page.

Reuse existing Figma filter patterns.

If a filter is global to a page, keep it near the top.

If it is contextual, place it near the related panel.

------------------------------------------------------------------------

# 19. EQUIPMENT REGISTRY --- REQUIRED UX

The Equipment Registry is one of the most important screens.

It must support rapid identification and management of equipment.

Primary table data should include, as appropriate:

-   ID;
-   equipment name;
-   equipment type;
-   manufacturer;
-   model;
-   serial number;
-   inventory number;
-   airport;
-   installation location;
-   current status;
-   commissioning date;
-   next inspection;
-   actions.

Maintain realistic enterprise data.

Do not use meaningless placeholder records such as:

-   Item 1
-   Item 2

Equipment must look operational and real.

Example equipment categories may include:

-   X-ray screening systems;
-   walk-through metal detectors;
-   handheld metal detectors;
-   explosive trace detectors;
-   body scanners;
-   baggage scanners;
-   radiation detectors;
-   access screening equipment.

------------------------------------------------------------------------

# 20. EQUIPMENT DETAIL --- REQUIRED UX

Equipment Detail is the primary digital passport.

The screen must clearly identify the selected equipment immediately.

Recommended top information:

-   equipment image;
-   name;
-   model;
-   system ID;
-   current status;
-   airport;
-   installation location;
-   serial number;
-   inventory number;
-   QR reference.

The detail workspace should support clear sections or tabs:

1.  Information
2.  Inspection History
3.  Maintenance and Repairs
4.  Faults
5.  Spare Parts
6.  Documents
7.  Complete History

The page must not become one extremely long uncontrolled screen.

Use established tabs or contextual sections.

------------------------------------------------------------------------

# 21. LOCATION / MAP UX

Location is hierarchical:

Airport → Terminal → Zone → Equipment

The approved UX pattern includes:

LEFT: - hierarchical airport tree; - selected terminal; - selected
zone; - equipment status summary.

CENTER: - visual airport / terminal plan; - equipment markers; -
semantic status markers; - zoom controls; - layer controls.

RIGHT: - selected zone information; - equipment count; - status
summary; - equipment list.

BOTTOM: - equipment table for the selected area.

Maintain this three-context model:

**NAVIGATE → VISUALIZE → INSPECT**

Do not reduce this screen to a generic map page.

------------------------------------------------------------------------

# 22. INSPECTIONS AND MAINTENANCE UX

This module follows a focused operational workflow.

Preferred layout:

LEFT PANEL: - inspection list; - filters; - search; - statuses.

CENTER PANEL: - selected equipment summary; - equipment image; - QR; -
key technical information; - recent inspection; - inspection history.

RIGHT PANEL: - active inspection workflow; - inspection type; -
regulation; - progress; - checklist; - results; - comments; - photos; -
actions.

Checklist must support actual product logic:

-   Compliant;
-   Non-Compliant;
-   Not Applicable;
-   Numeric Value;
-   Text Comment;
-   Photo Attachment.

Critical or failed items must be visually clear.

Do not use only color.

Use:

-   icon;
-   text;
-   status;
-   semantic color.

------------------------------------------------------------------------

# 23. FAULT MANAGEMENT UX

Fault management is not just a list.

The user must understand:

-   what failed;
-   where;
-   how critical it is;
-   who is responsible;
-   current lifecycle stage;
-   deadline;
-   related equipment;
-   attached evidence;
-   repair progress.

Fault list page:

TOP: - operational KPI cards.

MAIN: - searchable/filterable fault table.

RIGHT OR DETAIL VIEW: - selected fault details.

Detail must include:

-   fault ID;
-   related equipment;
-   date/time;
-   airport;
-   location;
-   description;
-   category;
-   criticality;
-   priority;
-   responsible person;
-   due date;
-   attachments;
-   activity history.

Display the lifecycle clearly.

Example:

Detected → Registered → Assigned → Diagnosis → Repair → Verification →
Closed →

The current stage must be obvious.

Do not hide lifecycle context behind a simple badge only.

------------------------------------------------------------------------

# 24. REPAIRS UX

Repairs should connect:

Fault → Equipment → Diagnosis → Repair Work → Spare Parts → Completion →
Verification

Repair screens should support:

-   repair status;
-   assigned engineer;
-   work history;
-   used spare parts;
-   estimated duration;
-   actual duration;
-   repair cost if available in product requirements;
-   completion date;
-   verification result.

Do not create an isolated repair module disconnected from equipment and
faults.

------------------------------------------------------------------------

# 25. SPARE PARTS / INVENTORY UX

The inventory module should support:

-   nomenclature;
-   warehouse;
-   stock balance;
-   minimum stock;
-   incoming stock;
-   consumption;
-   reservation;
-   write-off;
-   relation to equipment;
-   relation to repair.

Important operational states:

-   Available
-   Low Stock
-   Reserved
-   Out of Stock

Use the same table/filter/status language as the rest of the system.

Do not make the inventory module look like a separate product.

------------------------------------------------------------------------

# 26. VERIFICATION / CALIBRATION UX

This module must remain connected to equipment lifecycle.

Support:

-   planned verification;
-   upcoming dates;
-   overdue items;
-   completed verification;
-   calibration history;
-   related certificates;
-   responsible users.

Calendar and list views should use the same interaction model as the
rest of the application.

------------------------------------------------------------------------

# 27. DOCUMENTS UX

Documents include:

-   technical documents;
-   acts;
-   protocols;
-   certificates;
-   repair documents;
-   inspection documents.

Each document should show:

-   type;
-   related equipment;
-   date;
-   author;
-   status;
-   version where relevant.

Do not create a generic cloud-drive interface.

Documents belong to the equipment lifecycle.

Context must always be visible where possible.

------------------------------------------------------------------------

# 28. DASHBOARD UX

The Dashboard answers:

**WHAT REQUIRES ATTENTION RIGHT NOW?**

It should not become a complete analytics warehouse.

The approved structure includes:

TOP KPI ROW: - Total Equipment - Operational - Faulty - Under
Maintenance - Reserve - Requires Inspection

SECONDARY ANALYTICS: - equipment status distribution; - equipment by
type; - equipment across airports / map.

OPERATIONAL PANELS: - upcoming inspections; - active faults; -
notifications.

BOTTOM: - compact equipment table.

Maintain the existing hierarchy.

Do not add every possible metric to the Dashboard.

Advanced metrics belong in Reports and Analytics.

------------------------------------------------------------------------

# 29. REPORTS AND ANALYTICS

Analytics may include:

-   total equipment;
-   operational/faulty ratio;
-   equipment under repair;
-   overdue inspections;
-   upcoming inspections;
-   number of failures;
-   failure dynamics;
-   average repair duration;
-   MTBF;
-   MTTR;
-   most problematic models;
-   spare parts consumption;
-   airport compliance ranking.

Charts must answer a question.

Never add a chart simply because empty space exists.

Each chart needs:

-   clear title;
-   understandable period;
-   meaningful labels;
-   readable legend;
-   contextual filters when required.

------------------------------------------------------------------------

# 30. NOTIFICATIONS UX

Notifications are operational.

Examples:

-   deadline approaching;
-   deadline reached;
-   overdue inspection;
-   critical fault;
-   repeated failure;
-   re-inspection required;
-   low stock.

Notification priority must be clear.

Do not create decorative notifications.

Every notification should ideally connect to an actionable entity.

Examples:

Notification → Open Equipment

Notification → Open Fault

Notification → Open Inspection

------------------------------------------------------------------------

# 31. ROLE-BASED UI

Frontend role simulation only.

Roles:

-   Engineer
-   Lead Engineer / Manager
-   Spare Parts Manager
-   Central Office
-   Administrator
-   Auditor

The UI should adapt where meaningful.

Do not implement fake security.

This is UI simulation.

Examples:

Engineer: - inspections; - assigned faults; - equipment; - operational
tasks.

Lead Engineer: - approvals; - team control; - reports; - operational
overview.

Spare Parts Manager: - inventory; - reservations; - stock movements.

Central Office: - all airports; - consolidated analytics; - monitoring.

Administrator: - users; - directories; - settings.

Auditor: - read-only history; - documents; - reports.

------------------------------------------------------------------------

# 32. COMPONENT ARCHITECTURE

Before creating a new component, ask:

Does an equivalent pattern already exist in:

1.  Figma?
2.  Existing repository components?
3.  Another approved screen?

If YES:

Reuse or extend it.

Do not duplicate the same component.

Recommended component categories:

``` text
src/components/
├── ui/
├── layout/
├── navigation/
├── data-display/
├── feedback/
├── forms/
├── shared/
└── charts/
```

Recommended feature structure:

``` text
src/features/
├── equipment/
├── inspections/
├── faults/
├── repairs/
├── inventory/
├── documents/
├── notifications/
└── analytics/
```

Adapt to the existing repository instead of blindly restructuring it.

------------------------------------------------------------------------

# 33. MOCK DATA RULES

Mock data must be realistic and relational.

Equipment has:

-   airportId;
-   terminalId;
-   zoneId;
-   status;
-   inspection history;
-   fault history;
-   repair history;
-   spare part usage;
-   documents.

Fault: - belongs to equipment.

Repair: - belongs to equipment and/or fault.

Inspection: - belongs to equipment.

Document: - belongs to equipment or an operational workflow.

Do not duplicate contradictory values across pages.

Use a coherent mock domain.

------------------------------------------------------------------------

# 34. INTERACTION QUALITY

Static visuals are not enough.

Implement meaningful frontend interactions.

Examples:

-   sidebar navigation;
-   route changes;
-   tabs;
-   search;
-   filters;
-   pagination;
-   table row selection;
-   detail opening;
-   modal opening;
-   form validation;
-   status changes in mock state;
-   upload UI simulation;
-   notification navigation;
-   role switching where implemented.

Do not implement fake interactions that visually appear clickable but do
nothing.

------------------------------------------------------------------------

# 35. LOADING / EMPTY / ERROR STATES

Every significant data-driven module should consider:

-   loading;
-   empty;
-   error;
-   no search results.

These states must use the same visual language.

Do not use random browser text such as:

`No data.`

Create consistent product-level states.

------------------------------------------------------------------------

# 36. ACCESSIBILITY

Maintain enterprise usability.

Requirements:

-   semantic HTML;
-   keyboard navigation;
-   visible focus state;
-   accessible labels;
-   buttons for actions;
-   labels for forms;
-   no critical information conveyed by color alone;
-   sufficient text contrast.

Do not sacrifice usability for visual similarity.

------------------------------------------------------------------------

# 37. RESPONSIVE STRATEGY

Desktop is the primary platform.

Priority:

1.  Large desktop
2.  Standard desktop
3.  Laptop
4.  Tablet
5.  Mobile fallback

Do not redesign the desktop enterprise system into a mobile-first
consumer interface.

Complex tables may:

-   horizontally scroll;
-   hide secondary columns;
-   use controlled responsive adaptations.

Do not blindly convert everything into vertical cards.

------------------------------------------------------------------------

# 38. NO RANDOM DESIGN DECISIONS

Forbidden:

-   random gradients;
-   glassmorphism;
-   excessive blur;
-   oversized rounded cards;
-   huge empty spacing;
-   random colors;
-   random shadows;
-   default shadcn visual appearance;
-   default Material UI appearance;
-   inconsistent icon styles;
-   arbitrary font sizes;
-   arbitrary border radii;
-   emoji as interface icons.

Libraries may be used as implementation primitives.

Their default styling must NOT become the product styling.

------------------------------------------------------------------------

# 39. IMPLEMENTATION WORKFLOW

For every feature:

## STEP 1 --- UNDERSTAND

Read the requested product requirement.

## STEP 2 --- INSPECT REPOSITORY

Check existing architecture and components.

## STEP 3 --- INSPECT FIGMA

Search the complete accessible Figma structure.

## STEP 4 --- INSPECT APPROVED SCREENSHOTS

Identify existing layout and interaction patterns.

## STEP 5 --- REUSE

Find the closest existing component.

## STEP 6 --- PLAN

Create a concise implementation plan.

## STEP 7 --- IMPLEMENT

Make minimal, scoped changes.

## STEP 8 --- VALIDATE

Check:

-   route;
-   interactions;
-   TypeScript;
-   build;
-   console errors.

## STEP 9 --- VISUAL REVIEW

Compare the result against:

-   Figma;
-   approved screenshots;
-   existing pages.

## STEP 10 --- REPORT

State:

-   what was changed;
-   which components were reused;
-   which Figma patterns were followed;
-   what remains for the next phase.

------------------------------------------------------------------------

# 40. VISUAL CONSISTENCY CHECKLIST

Before considering any new page complete, verify:

## Global

-   Does it clearly belong to the same application?
-   Does the sidebar remain consistent?
-   Does the topbar remain consistent?
-   Does the page header follow the same pattern?

## Layout

-   Is information density consistent?
-   Is spacing consistent?
-   Are cards consistent?
-   Are panels aligned?

## Components

-   Are existing Figma components reused?
-   Are buttons consistent?
-   Are filters consistent?
-   Are badges consistent?
-   Are tables consistent?
-   Are icons consistent?

## Statuses

-   Are semantic colors correct?
-   Are domain statuses separated?
-   Is critical information obvious?

## UX

-   Can an engineer scan the screen quickly?
-   Is the primary action obvious?
-   Are urgent issues visible?
-   Is the entity context preserved?

------------------------------------------------------------------------

# 41. IMPLEMENTATION PHASES

## PHASE 0 --- DISCOVERY

Mandatory first step.

Tasks:

1.  Inspect repository.
2.  Inspect package.json.
3.  Inspect routes.
4.  Inspect existing components.
5.  Inspect existing styles.
6.  Inspect the complete accessible Figma file.
7.  Build `FIGMA_COMPONENT_MAP.md`.
8.  Identify reusable components.
9.  Identify missing screens.
10. Create a concise implementation plan.

DO NOT start large-scale UI development before Phase 0 is complete.

STOP and report findings.

------------------------------------------------------------------------

## PHASE 1 --- CORE FOUNDATION

Implement:

-   App shell
-   Sidebar
-   Topbar
-   Shared page layout
-   Shared buttons
-   Shared filters
-   Status system
-   Data table system
-   Mock data architecture
-   Frontend role simulation
-   Dashboard
-   Equipment Registry
-   Equipment Detail

Acceptance criteria:

-   Visual DNA matches approved design.
-   Core navigation works.
-   Components are reusable.
-   Equipment is the central entity.
-   Mock relationships are coherent.
-   TypeScript passes.
-   Build passes.

STOP after Phase 1.

Do not continue automatically.

------------------------------------------------------------------------

## PHASE 2 --- CORE OPERATIONS

Implement:

-   Inspections
-   Inspection detail
-   Checklist workflow
-   Maintenance
-   Fault management
-   Fault detail
-   Fault lifecycle
-   Repairs
-   Repair detail
-   Planning calendar

Acceptance criteria:

-   Workflow relationships are preserved.
-   Equipment context remains visible.
-   Statuses are consistent.
-   Lifecycle is understandable.
-   UI matches the same design system.

STOP after Phase 2.

------------------------------------------------------------------------

## PHASE 3 --- SUPPORTING OPERATIONS

Implement:

-   Spare Parts
-   Inventory
-   Verification
-   Calibration
-   Documents
-   Notifications
-   Reports
-   Analytics

STOP after Phase 3.

------------------------------------------------------------------------

## PHASE 4 --- ADMINISTRATION AND POLISH

Implement:

-   Users
-   Roles
-   Settings
-   Directories
-   Final responsive review
-   Accessibility review
-   Visual consistency review

STOP after Phase 4.

------------------------------------------------------------------------

# 42. FINAL ABSOLUTE RULE

The goal is NOT:

**Make beautiful new pages.**

The goal is:

**Extend the approved enterprise product so every new screen feels as if
it was originally designed together with the existing Figma screens.**

A user must never feel:

**This page looks like a different application.**

Every new screen must preserve:

-   the same dark enterprise visual language;
-   the same navigation logic;
-   the same page hierarchy;
-   the same information density;
-   the same table philosophy;
-   the same filter philosophy;
-   the same status semantics;
-   the same card system;
-   the same action hierarchy;
-   the same operational UX mindset.

When Figma has an existing answer:

**COPY THE SYSTEM, NOT YOUR PERSONAL TASTE.**

When Figma does not have an exact answer:

**FIND THE CLOSEST EXISTING PATTERN → REUSE ITS LOGIC → EXTEND IT
CONSISTENTLY → DO NOT INVENT A NEW VISUAL LANGUAGE.**

------------------------------------------------------------------------

# FIRST SESSION COMMAND

Your first task is ONLY:

1.  Inspect the complete repository.
2.  Inspect the complete accessible Figma file, not just one node.
3.  Inspect all relevant approved screens and distributed components.
4.  Create `docs/FIGMA_COMPONENT_MAP.md`.
5.  Create `docs/IMPLEMENTATION_PLAN.md`.
6.  Report:
    -   repository architecture;
    -   existing reusable components;
    -   Figma pages inspected;
    -   discovered component system;
    -   visual tokens/patterns;
    -   missing screens;
    -   proposed React component architecture;
    -   exact Phase 1 implementation plan.

DO NOT begin Phase 1 implementation until the discovery report is
complete.

DO NOT redesign anything. DO NOT create backend code. DO NOT continue to
later phases automatically.

------------------------------------------------------------------------

# Backend Integration (added post-design-phase)

Everything above this section is the original Figma-first, frontend-only
build spec. It is kept as-is for historical/product-design reference.
**Section 2's "no backend" rule reflected the initial UI-build phase
only** — a real backend now exists and this app is wired to it. Do not
re-read the sections above as if they still forbid backend work; they
don't apply anymore to this integration layer.

## What changed

A real backend, **AeroTechControlBackend**, lives in the sibling
directory `../AeroTechControlBackend` (NestJS + PostgreSQL + TypeORM,
matching `docs/API_CONTRACT.md`). This app is a real client of it:

- `src/lib/mock-data.ts` **no longer exists.** Every page fetches real
  data through `src/services/*.service.ts`, which now call the real API
  instead of an in-memory array.
- Real authentication exists: `src/lib/role-context.tsx` holds a real
  session (`GET /auth/me`, login/logout), gated by
  `src/components/layout/AuthGuard.tsx` wrapping the `(app)` route group.
  Role-preview switching (§31) still works but now sources sample users
  from the real `GET /users` endpoint instead of a static array.
- Tokens live in `src/lib/auth-token.ts` (localStorage if "remember me"
  was checked at login, else sessionStorage). `src/services/http-client.ts`
  is the only place that knows about `fetch()`, the backend's
  `{success, snapdata, pagination, message}` envelope, and silent
  401→refresh→retry.
- `NEXT_PUBLIC_API_URL` (in `.env.local`) points at the backend, e.g.
  `http://localhost:5000/api/v1`. This app's dev/start scripts run on
  port **3001** — the backend defaults to 3000 and its `CORS_ORIGIN`
  default assumes 3001, so don't change one without the other.
- Two new shared hooks replace the old synchronous mock lookups, since
  the same "load a small bounded dataset once, look up from cache"
  pattern can't become a per-row HTTP call: `src/hooks/useLocations.ts`
  (airports/terminals/zones + `airportName()`) and
  `src/hooks/useEquipmentLookup.ts` (`equipmentById()` over the full
  fleet). Reach for these instead of adding new per-row fetches when a
  table needs to resolve an id to a display name.
- A `king` role exists in the backend (superuser, bootstrapped via
  `DEFAULT_ADMIN_LOGIN`/`DEFAULT_ADMIN_PASSWORD` — see the backend's
  `CLAUDE.md`) and is mirrored here in `src/lib/types.ts`'s `UserRole`,
  `src/config/roleAccess.config.ts` (full nav access), and the
  `role.king`/`roleDesc.king` translation keys in all three locales.

## Working in this integration layer

- Never reintroduce a `mock-data`-style static array for anything the
  backend already serves — add a service function and a hook instead,
  following the existing pattern in any `src/services/*.service.ts` file.
- A Server Component cannot read the browser-stored JWT. Any page that
  needs authenticated data must be a thin shell delegating to a Client
  Component that fetches via hooks — see `equipment/[id]/page.tsx` +
  `EquipmentDetailClient.tsx` for the reference shape.
- List-query `pageSize` is clamped client-side to the backend's cap
  (200) in `http-client.ts` — don't raise it per call-site; if a page
  genuinely needs more than 200 rows of something, that's a backend
  pagination/aggregation problem, not a frontend one.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
