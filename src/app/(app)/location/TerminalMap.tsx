"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { useTranslations } from "@/lib/locale-context";
import type { Equipment, EquipmentStatus, Zone } from "@/lib/types";
import type { StatusVisual } from "@/config/equipmentStatus.config";
import type { TranslationKey } from "@/lib/i18n/translations";
import { updateEquipmentPosition } from "@/services/equipment.service";
import { BuildingMap, BUILDING_MAP_VB_W, BUILDING_MAP_VB_H } from "./BuildingMap";

/**
 * Terminal floor-plan: the real extracted vector floor plan
 * (`public/2d.svg`, rendered via `BuildingMap.tsx`) instead of the
 * earlier `schema.jpg` photo — no more "extract the drawing from its own
 * paper background" blend-mode workaround, since the SVG's background is
 * simply transparent and it themes itself. Static Cyrillic-style room
 * labels are overlaid at each band (not tied to real per-pixel room
 * boundaries — the ROOMS fractions below approximate them); zones from
 * data are assigned to a band by keyword and rendered as interactive
 * lanes within it.
 */

const VB_W = BUILDING_MAP_VB_W;
const VB_H = BUILDING_MAP_VB_H;

const MARGIN_X = VB_W * 0.03;
const CONTENT_X0 = VB_W * 0.14;
const CONTENT_X1 = VB_W * 0.895;

const GATE_LABEL_Y = VB_H * 0.045;
const GATE_CONNECTOR_Y0 = VB_H * 0.08;
const WAITING_Y0 = VB_H * 0.1;
const WAITING_Y1 = VB_H * 0.3;
const PASSPORT_Y0 = VB_H * 0.3;
const PASSPORT_Y1 = VB_H * 0.4;
const SECURITY_Y0 = VB_H * 0.4;
const SECURITY_Y1 = VB_H * 0.66;
const CHECKIN_Y0 = VB_H * 0.66;
const CHECKIN_Y1 = VB_H * 0.8;
const BOTTOM_Y0 = VB_H * 0.82;
const BOTTOM_Y1 = VB_H * 0.96;

// Full interior bounds a marker can be dragged within — the whole
// building footprint, not just the band it started in.
const INTERIOR_X0 = VB_W * 0.03;
const INTERIOR_X1 = VB_W * 0.97;
const INTERIOR_Y0 = GATE_CONNECTOR_Y0;
const INTERIOR_Y1 = BOTTOM_Y1;

const ZOOM_STEPS = [0.75, 1, 1.25, 1.5, 2];

const STATUS_FILL: Record<EquipmentStatus, string> = {
  faulty: "var(--color-error-500)",
  operational: "var(--color-success-500)",
  good: "var(--color-success-500)",
  satisfactory: "var(--color-warning-500)",
  unsatisfactory: "var(--color-error-500)",
  overdue: "var(--color-error-500)",
  not_connected: "var(--color-gray-500)",
};

// Same 20x20 "cpu" glyph used everywhere else in the app for equipment
// (icons.tsx) — reused inline here rather than importing, since markers
// render as raw SVG shapes, not <Icon>.
const EQUIPMENT_ICON_PATH = "M8 3v2M12 3v2M8 15v2M12 15v2M3 8h2M3 12h2M15 8h2M15 12h2M7 7h6v6H7V7Z";

export interface MarkerRecord {
  x: number;
  y: number;
  /** Zone the marker was last auto-detected (or started) in. */
  zoneId?: number;
}

type Positions = Record<number, MarkerRecord>;

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

// ---- Room template: every zone is assigned to exactly one of these
// bands by matching keywords in the zone's name (falls back to Security
// Screening). Arrivals/Customs have no matching mock zone keywords — they
// render as static labels only, same as the reference image shows them.
interface Room {
  key: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  labelKey: TranslationKey;
  keywords: string[];
  /** Static-label-only bands (no zone ever assigns here) skip lane/click rendering. */
  static?: boolean;
}

const ROOMS: Room[] = [
  {
    key: "waiting",
    x0: CONTENT_X0,
    x1: CONTENT_X1,
    y0: WAITING_Y0,
    y1: WAITING_Y1,
    labelKey: "location.waitingArea",
    keywords: ["вылет", "departure", "ожидан", "kutish", "waiting"],
  },
  {
    key: "passport",
    x0: CONTENT_X0,
    x1: CONTENT_X1,
    y0: PASSPORT_Y0,
    y1: PASSPORT_Y1,
    labelKey: "location.passportControl",
    keywords: ["паспорт", "pasport", "passport"],
  },
  {
    key: "security",
    x0: CONTENT_X0,
    x1: CONTENT_X1,
    y0: SECURITY_Y0,
    y1: SECURITY_Y1,
    labelKey: "location.securityScreening",
    keywords: ["досмотр", "tekshiruv", "screening", "линия", "line"],
  },
  {
    key: "checkin",
    x0: CONTENT_X0,
    x1: CONTENT_X1,
    y0: CHECKIN_Y0,
    y1: CHECKIN_Y1,
    labelKey: "location.checkInHall",
    keywords: ["регистрац", "ro'yxat", "check-in", "checkin"],
  },
  {
    key: "arrivals",
    x0: MARGIN_X,
    x1: MARGIN_X + (CONTENT_X1 - CONTENT_X0) * 0.15,
    y0: BOTTOM_Y0,
    y1: BOTTOM_Y1,
    labelKey: "location.arrivalsZone",
    keywords: ["прилет", "kelish", "arrival"],
    static: true,
  },
  {
    key: "baggage",
    x0: MARGIN_X + (CONTENT_X1 - CONTENT_X0) * 0.15,
    x1: MARGIN_X + (CONTENT_X1 - CONTENT_X0) * 0.3,
    y0: BOTTOM_Y0,
    y1: BOTTOM_Y1,
    labelKey: "location.baggageClaim",
    keywords: ["багаж", "bagaj", "baggage"],
  },
  {
    key: "entrance",
    x0: MARGIN_X + (CONTENT_X1 - CONTENT_X0) * 0.3,
    x1: MARGIN_X + (CONTENT_X1 - CONTENT_X0) * 0.75,
    y0: BOTTOM_Y0,
    y1: BOTTOM_Y1,
    labelKey: "location.mainEntrance",
    keywords: ["вход", "kirish", "entrance"],
  },
  {
    key: "customs",
    x0: MARGIN_X + (CONTENT_X1 - CONTENT_X0) * 0.75,
    x1: CONTENT_X1,
    y0: BOTTOM_Y0,
    y1: BOTTOM_Y1,
    labelKey: "location.customsControl",
    keywords: ["таможен", "bojxona", "customs"],
    static: true,
  },
];

function assignRoom(zoneName: string): Room {
  const lower = zoneName.toLowerCase();
  return ROOMS.find((r) => !r.static && r.keywords.some((kw) => lower.includes(kw))) ?? ROOMS[2]; // default: security
}

interface Lane {
  zone: Zone;
  room: Room;
  x0: number;
  width: number;
  items: Equipment[];
}

function buildLanes(zones: Zone[], equipment: Equipment[]): Lane[] {
  const byRoom = new Map<Room, Zone[]>();
  for (const zone of zones) {
    const room = assignRoom(zone.name);
    const list = byRoom.get(room) ?? [];
    list.push(zone);
    byRoom.set(room, list);
  }
  const lanes: Lane[] = [];
  for (const [room, roomZones] of byRoom) {
    const laneWidth = (room.x1 - room.x0) / roomZones.length;
    roomZones.forEach((zone, i) => {
      lanes.push({
        zone,
        room,
        x0: room.x0 + i * laneWidth,
        width: laneWidth,
        items: equipment.filter((e) => e.zone?.id === zone.id),
      });
    });
  }
  return lanes;
}

/** Which lane (if any) a full-plan point falls inside — used to
 * auto-detect the new zone when a marker is dropped somewhere else. */
function laneAt(lanes: Lane[], x: number, y: number): Lane | null {
  for (const lane of lanes) {
    if (x >= lane.x0 && x <= lane.x0 + lane.width && y >= lane.room.y0 && y <= lane.room.y1) {
      return lane;
    }
  }
  return null;
}

function defaultPosition(lane: Lane, index: number) {
  const total = lane.items.length;
  const cols = total > 4 ? 2 : 1;
  const rows = Math.ceil(total / cols);
  const col = index % cols;
  const row = Math.floor(index / cols);
  const padX = lane.width * 0.2;
  const innerW = lane.width - padX * 2;
  const x = lane.x0 + padX + (cols === 1 ? innerW / 2 : (col / (cols - 1)) * innerW);
  const areaTop = lane.room.y0 + (lane.room.key === "security" ? 30 : 22);
  const areaBottom = lane.room.y1 - 10;
  const innerH = Math.max(areaBottom - areaTop, 1);
  const y = areaTop + (rows === 1 ? innerH / 2 : (row / (rows - 1)) * innerH);
  return { x, y };
}

export type ZoneHealthTone = "success" | "warning" | "error";

const ZONE_HEALTH_FILL: Record<ZoneHealthTone, string> = {
  success: "var(--chip-success-bg)",
  warning: "var(--chip-warning-bg)",
  error: "var(--chip-error-bg)",
};

interface Props {
  zones: Zone[];
  equipment: Equipment[];
  selectedZoneId: number | null;
  onSelectZone: (id: number) => void;
  /** Set when the terminal has a custom uploaded map — swaps the background
   * image and disables the default map's room-band overlay + auto zone
   * detection (a fixed overlay tuned to the one built-in floor plan can't
   * be trusted to line up with an arbitrary uploaded image). */
  mapImageUrl?: string | null;
  /** Called after a marker's position (and possibly zone) is saved to the
   * backend, so the parent can refetch equipment with fresh data. */
  onPositionSaved?: () => void;
  statusConfig: Record<EquipmentStatus, StatusVisual>;
  /** Optional zoneId -> health tone, tinted subtly behind each lane. */
  zoneHealth?: Record<number, ZoneHealthTone>;
}

export function TerminalMap({
  zones,
  equipment,
  onSelectZone,
  mapImageUrl,
  onPositionSaved,
  statusConfig,
  zoneHealth,
}: Props) {
  const t = useTranslations();
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);

  const [zoomIndex, setZoomIndex] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [editMode, setEditMode] = useState(false);
  const [positions, setPositions] = useState<Positions>({});
  const [openMarkerId, setOpenMarkerId] = useState<number | null>(null);

  const dragId = useRef<number | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const panFrom = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  // Positions come from the backend now (each equipment's `position` field),
  // not localStorage — reseed local drag state whenever the fetched
  // equipment list changes (new terminal selected, refetch after a save).
  useEffect(() => {
    const next: Positions = {};
    for (const eq of equipment) {
      if (eq.position) {
        next[eq.id] = { x: eq.position.x, y: eq.position.y, zoneId: eq.position.zoneId ?? undefined };
      }
    }
    setPositions(next);
  }, [equipment]);

  const scale = ZOOM_STEPS[zoomIndex] ?? 1;

  function toLocalPoint(clientX: number, clientY: number) {
    const svg = svgRef.current;
    const g = gRef.current;
    if (!svg || !g) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = g.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  }

  // Inverse of toLocalPoint: SVG-space coordinates -> viewport pixels
  // (client coordinates, same space as getBoundingClientRect/MouseEvent).
  // Using the real screen CTM (rather than manually multiplying by `scale`)
  // accounts for the browser's own viewBox-to-container fit, not just our
  // pan/zoom state — the tooltip's pixel position must go through this, or
  // it drifts off wherever the container's rendered size doesn't happen to
  // match the viewBox 1:1. Returned as viewport coordinates (not relative
  // to the map container) since the tooltip is portaled to <body> with
  // `position: fixed`, to escape the map's `overflow-hidden` clipping.
  function toScreenPoint(svgX: number, svgY: number) {
    const svg = svgRef.current;
    const g = gRef.current;
    if (!svg || !g) return null;
    const pt = svg.createSVGPoint();
    pt.x = svgX;
    pt.y = svgY;
    const ctm = g.getScreenCTM();
    if (!ctm) return null;
    const screenPt = pt.matrixTransform(ctm);
    return { x: screenPt.x, y: screenPt.y };
  }

  // Room bands/lanes only apply to the default built-in map — a custom
  // uploaded image has no matching geometry for them.
  const lanes = mapImageUrl ? [] : buildLanes(zones, equipment);

  // Shared by both the marker-rendering loop and the hover tooltip lookup —
  // previously the tooltip used a narrower fallback that only worked for
  // lane-matched markers, so it silently failed to show for anything on a
  // custom map (no lanes at all).
  function defaultPositionFor(eq: Equipment, eqIndex: number): { x: number; y: number } {
    const lane = lanes.find((l) => l.zone.id === eq.zone?.id);
    const idx = lane ? lane.items.indexOf(eq) : -1;
    if (lane && idx >= 0) return defaultPosition(lane, idx);
    // No lane match (either a custom map, or default-map equipment whose
    // zone didn't land in any room) — spread unpositioned markers in a
    // simple grid instead of stacking them all on the same point.
    return {
      x: VB_W * 0.2 + (eqIndex % 6) * (VB_W * 0.1),
      y: VB_H * 0.2 + Math.floor(eqIndex / 6) * (VB_H * 0.12),
    };
  }

  function handleMarkerPointerDown(e: ReactPointerEvent<SVGGElement>, eq: Equipment, def: { x: number; y: number }) {
    e.stopPropagation();
    if (!editMode) return;
    try {
      (e.target as Element).setPointerCapture(e.pointerId);
    } catch {
      // No active pointer session to capture (e.g. a synthetic/edge-case
      // event) — dragging still works via the window-level move/up
      // listeners below, this only loses capture-outside-bounds tracking.
    }
    const p = toLocalPoint(e.clientX, e.clientY);
    const current = positions[eq.id] ?? def;
    dragId.current = eq.id;
    dragOffset.current = { x: p.x - current.x, y: p.y - current.y };
  }

  function handleBackgroundPointerDown(e: ReactPointerEvent<SVGSVGElement>) {
    setOpenMarkerId(null);
    panFrom.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    setIsPanning(true);
  }

  function handlePointerMove(e: ReactPointerEvent<SVGSVGElement>) {
    if (dragId.current) {
      const p = toLocalPoint(e.clientX, e.clientY);
      const id = dragId.current;
      // Full-plan freeform coordinates — clamped to the building footprint,
      // not to the marker's originating band, so it can be dropped
      // anywhere on the drawing.
      const nx = clamp(p.x - dragOffset.current.x, INTERIOR_X0, INTERIOR_X1);
      const ny = clamp(p.y - dragOffset.current.y, INTERIOR_Y0, INTERIOR_Y1);
      setPositions((prev) => ({ ...prev, [id]: { ...prev[id], x: nx, y: ny } }));
      return;
    }
    if (panFrom.current) {
      const dx = (e.clientX - panFrom.current.x) / scale;
      const dy = (e.clientY - panFrom.current.y) / scale;
      setPan({ x: panFrom.current.panX + dx, y: panFrom.current.panY + dy });
    }
  }

  function handlePointerUp() {
    if (dragId.current) {
      const id = dragId.current;
      dragId.current = null;
      // Read from `positions` state (closure) rather than a setState
      // updater function — pointermove already committed the latest
      // coordinates in an earlier render, and side-effecting (the API
      // call) here, outside any updater, avoids React's "cannot update a
      // component while rendering a different component" error.
      const rec = positions[id];
      if (rec) {
        // Zone auto-detection only applies to the default built-in map —
        // a custom uploaded map has no room-band overlay to detect against,
        // so dragging there only repositions the pin.
        const hit = mapImageUrl ? null : laneAt(lanes, rec.x, rec.y);
        const nextZoneId = hit ? hit.zone.id : rec.zoneId;
        const next = { ...positions, [id]: { ...rec, zoneId: nextZoneId } };
        setPositions(next);
        updateEquipmentPosition(id, {
          x: rec.x,
          y: rec.y,
          zoneId: mapImageUrl ? undefined : nextZoneId,
        })
          .then(() => onPositionSaved?.())
          .catch(() => {
            // Keep the optimistic local position even if the save failed —
            // the next successful fetch will reconcile it.
          });
      }
    }
    panFrom.current = null;
    setIsPanning(false);
  }

  function resetView() {
    setPan({ x: 0, y: 0 });
    setZoomIndex(1);
  }

  const gateXs = [0.18, 0.4, 0.62, 0.84].map((f) => CONTENT_X0 + (CONTENT_X1 - CONTENT_X0) * f);
  const openMarkerIndex = openMarkerId ? equipment.findIndex((e) => e.id === openMarkerId) : -1;
  const openMarker = openMarkerIndex >= 0 ? equipment[openMarkerIndex] : null;
  const openMarkerSvgPos = openMarker
    ? positions[openMarker.id] ?? defaultPositionFor(openMarker, openMarkerIndex)
    : null;
  const openMarkerPos = openMarkerSvgPos ? toScreenPoint(openMarkerSvgPos.x, openMarkerSvgPos.y) : null;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border-secondary px-3 py-2">
        <p className="text-xs text-text-tertiary">
          {editMode ? t("location.editModeHint") : t("location.panHint")}
        </p>
        <div className="flex items-center gap-1">
          <button
            aria-label={t("location.zoomOut")}
            disabled={zoomIndex === 0}
            onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border-primary text-text-tertiary hover:bg-bg-tertiary disabled:opacity-30"
          >
            −
          </button>
          <span className="w-11 text-center text-xs text-text-quaternary">{Math.round(scale * 100)}%</span>
          <button
            aria-label={t("location.zoomIn")}
            disabled={zoomIndex === ZOOM_STEPS.length - 1}
            onClick={() => setZoomIndex((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border-primary text-text-tertiary hover:bg-bg-tertiary disabled:opacity-30"
          >
            +
          </button>
          <button
            aria-label={t("location.resetView")}
            onClick={resetView}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border-primary text-text-tertiary hover:bg-bg-tertiary"
          >
            <Icon name="maximize" size={14} />
          </button>
          <button
            onClick={() => setEditMode((v) => !v)}
            className={cn(
              "ml-1 flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors",
              editMode
                ? "border-brand-600 bg-(--chip-brand-bg) text-(--chip-brand-text)"
                : "border-border-primary text-text-tertiary hover:bg-bg-tertiary"
            )}
          >
            <Icon name="edit" size={13} />
            {t("location.editMode")}
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden bg-bg-primary" style={{ height: 480 }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="h-full w-full touch-none"
          style={{ cursor: isPanning ? "grabbing" : "grab" }}
          onPointerDown={handleBackgroundPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <g ref={gRef} transform={`translate(${pan.x} ${pan.y}) scale(${scale})`}>
            {mapImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- SVG child, not an <img>; renders a backend-served map image at an arbitrary origin
              <image href={mapImageUrl} x={0} y={0} width={VB_W} height={VB_H} preserveAspectRatio="xMidYMid meet" />
            ) : (
              <BuildingMap />
            )}

            {/* Gates + room bands only make sense against the one default
                built-in floor plan. */}
            {!mapImageUrl && gateXs.map((gx, i) => (
              <g key={i}>
                <text
                  x={gx}
                  y={GATE_LABEL_Y}
                  textAnchor="middle"
                  fill="var(--color-text-tertiary)"
                  style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}
                >
                  {t("location.gate")} {i + 1}
                </text>
              </g>
            ))}

            {/* Static architectural labels — one per room, always visible,
                matching the approved reference. */}
            {!mapImageUrl && ROOMS.map((room) => (
              <text
                key={room.key}
                x={room.x0 + (room.x1 - room.x0) / 2}
                y={room.y0 + 14}
                textAnchor="middle"
                fill="var(--color-text-secondary)"
                style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}
              >
                {t(room.labelKey).toUpperCase()}
              </text>
            ))}

            {/* Zone lanes — interactive within their assigned room; static
                rooms (arrivals/customs) never get one since no zone maps
                there. */}
            {lanes.map((lane) => {
              const roomLanes = lanes.filter((l) => l.room === lane.room);
              const laneIdx = roomLanes.indexOf(lane);
              return (
                <g key={lane.zone.id}>
                  {laneIdx > 0 && (
                    <line
                      x1={lane.x0}
                      y1={lane.room.y0 + 4}
                      x2={lane.x0}
                      y2={lane.room.y1 - 4}
                      stroke="var(--color-border-secondary)"
                      strokeDasharray="3 4"
                    />
                  )}
                  {/* Health tint — subtle, non-interactive, painted behind
                      the click target below so it never affects hit-testing
                      or the floor-plan's own line drawing. */}
                  {zoneHealth?.[lane.zone.id] && (
                    <rect
                      x={lane.x0 + 4}
                      y={lane.room.y0 + 20}
                      width={lane.width - 8}
                      height={lane.room.y1 - lane.room.y0 - 26}
                      rx={5}
                      fill={ZONE_HEALTH_FILL[zoneHealth[lane.zone.id]]}
                      fillOpacity={0.35}
                      pointerEvents="none"
                    />
                  )}
                  {/* Invisible click target for zone selection — no fill/
                      stroke paint, on purpose: the floor-plan drawing stays
                      unobstructed. `transparent` (not `none`) so it still
                      hit-tests clicks. Selection is still shown elsewhere
                      (Zone panel, equipment table), just not painted here. */}
                  <rect
                    x={lane.x0 + 4}
                    y={lane.room.y0 + 20}
                    width={lane.width - 8}
                    height={lane.room.y1 - lane.room.y0 - 26}
                    rx={5}
                    fill="transparent"
                    onClick={() => onSelectZone(lane.zone.id)}
                    style={{ cursor: "pointer" }}
                  />
                </g>
              );
            })}

            {/* Equipment markers — square badges with the app's standard
                equipment glyph, matching the reference's marker style. */}
            {equipment.map((eq, eqIndex) => {
              const def = defaultPositionFor(eq, eqIndex);
              const pos = positions[eq.id] ?? def;
              const size = editMode ? 20 : 18;
              return (
                <g
                  key={eq.id}
                  transform={`translate(${pos.x} ${pos.y})`}
                  onPointerDown={(e) => handleMarkerPointerDown(e, eq, def)}
                  onPointerEnter={() => {
                    if (!editMode) setOpenMarkerId(eq.id);
                  }}
                  onPointerLeave={() => {
                    setOpenMarkerId((cur) => (cur === eq.id ? null : cur));
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ cursor: editMode ? "grab" : "pointer" }}
                >
                  <rect
                    x={-size / 2}
                    y={-size / 2}
                    width={size}
                    height={size}
                    rx={4}
                    fill={STATUS_FILL[eq.status]}
                    stroke="var(--color-bg-primary)"
                    strokeWidth={1.5}
                  />
                  <g transform={`translate(${-size * 0.32} ${-size * 0.32}) scale(${size * 0.032})`}>
                    <path
                      d={EQUIPMENT_ICON_PATH}
                      fill="none"
                      stroke="white"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                </g>
              );
            })}
          </g>
        </svg>

        {openMarker && openMarkerPos && (
          <MarkerTooltip
            equipment={openMarker}
            statusLabel={statusConfig[openMarker.status].label}
            x={openMarkerPos.x}
            y={openMarkerPos.y}
            onMouseEnter={() => setOpenMarkerId(openMarker.id)}
            onMouseLeave={() => setOpenMarkerId(null)}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border-secondary px-4 py-2.5">
        {(Object.keys(STATUS_FILL) as EquipmentStatus[]).map((status) => (
          <span key={status} className="flex items-center gap-1.5 text-xs text-text-tertiary">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_FILL[status] }} />
            {statusConfig[status].label}
          </span>
        ))}
      </div>
    </div>
  );
}

function MarkerTooltip({
  equipment,
  statusLabel,
  x,
  y,
  onMouseEnter,
  onMouseLeave,
}: {
  equipment: Equipment;
  statusLabel: string;
  x: number;
  y: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  // Portaled to <body> with `position: fixed` (viewport coordinates) so it
  // renders above everything and is never clipped by the map's
  // `overflow-hidden` pan/zoom container.
  return createPortal(
    <div
      className="pointer-events-auto fixed z-50 w-44 -translate-x-1/2 -translate-y-[calc(100%+8px)]"
      style={{ left: x, top: y }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="relative rounded-lg border border-border-primary bg-bg-secondary p-2.5 shadow-lg">
        <p className="truncate text-xs font-semibold text-text-primary">{equipment.name}</p>
        <p className="mt-0.5 truncate text-[11px] text-text-tertiary">{equipment.code}</p>
        <p className="mt-1 text-[11px] font-medium text-text-secondary">{statusLabel}</p>
        <a
          href={`/equipment/${equipment.id}`}
          className="mt-1.5 block text-[11px] font-medium text-brand-400 hover:text-brand-300"
        >
          →
        </a>
        {/* Pointer nub connecting the card to the marker it belongs to. */}
        <span
          className="absolute left-1/2 top-full -mt-px h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-border-primary bg-bg-secondary"
          aria-hidden
        />
      </div>
    </div>,
    document.body
  );
}

/**
 * HOW TO RECALIBRATE ONCE REAL ROOM COORDINATES ARE KNOWN:
 * The `ROOMS` array (top of this file) is the only thing guessing at the
 * drawing's real geometry — each entry's `{x0,x1,y0,y1}` (as fractions of
 * `VB_W`/`VB_H`) positions both its static label and, for non-`static`
 * rooms, where zones assigned there render their lanes. Adjust those
 * fractions to match the actual room boundaries once confirmed; pan/zoom/
 * drag math and zone auto-detection (`laneAt`) are agnostic to them.
 */
