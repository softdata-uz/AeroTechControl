"use client";

import { useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { useTranslations } from "@/lib/locale-context";
import type { Equipment, EquipmentStatus, Zone } from "@/lib/types";
import type { StatusVisual } from "@/config/equipmentStatus.config";

/**
 * Generic architectural terminal cross-section (gates -> waiting area ->
 * passport control -> security screening -> check-in hall -> baggage
 * claim / main entrance), rendered as SVG. No real per-airport floor-plan
 * geometry exists yet, so the room layout is a fixed template; only the
 * Security Screening lanes and equipment markers are data-driven (one
 * lane per zone). See "How to swap in a real airport SVG" in this file's
 * bottom comment for what to replace when real drawings are available.
 */

const VB_W = 900;
const VB_H = 640;
const MARGIN_X = 40;
const CONTENT_W = VB_W - MARGIN_X * 2;

const GATE_LABEL_Y = 22;
const GATE_CONNECTOR_Y0 = 32;
const WAITING_Y0 = 60;
const WAITING_Y1 = 148;
const PASSPORT_Y0 = 148;
const PASSPORT_Y1 = 210;
const SECURITY_Y0 = 210;
const SECURITY_Y1 = 436;
const CHECKIN_Y0 = 436;
const CHECKIN_Y1 = 536;
const BOTTOM_Y0 = 536;
const BOTTOM_Y1 = 606;

const ZOOM_STEPS = [0.75, 1, 1.25, 1.5];

const STATUS_FILL: Record<EquipmentStatus, string> = {
  operational: "var(--color-success-500)",
  maintenance: "var(--color-warning-500)",
  faulty: "var(--color-error-500)",
  requires_inspection: "var(--color-purple-500)",
  reserve: "var(--color-brand-400)",
  decommissioned: "var(--color-gray-500)",
};

const STORAGE_KEY = "atz-location-marker-positions";

type Positions = Record<string, { x: number; y: number }>;

function loadPositions(): Positions {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Positions) : {};
  } catch {
    return {};
  }
}

function savePositions(positions: Positions) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {
    // localStorage unavailable — edits still apply for this session.
  }
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

interface Props {
  zones: Zone[];
  equipment: Equipment[];
  selectedZoneId: string | null;
  onSelectZone: (id: string) => void;
  statusConfig: Record<EquipmentStatus, StatusVisual>;
}

export function TerminalMap({ zones, equipment, selectedZoneId, onSelectZone, statusConfig }: Props) {
  const t = useTranslations();
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);

  const [zoomIndex, setZoomIndex] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [editMode, setEditMode] = useState(false);
  // Empty on first render (matches SSR — localStorage doesn't exist
  // server-side); a layout effect corrects from storage before paint, same
  // hydration-safe pattern as locale-context.tsx.
  const [positions, setPositions] = useState<Positions>({});
  const [openMarkerId, setOpenMarkerId] = useState<string | null>(null);

  const dragId = useRef<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const panFrom = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  useLayoutEffect(() => {
    const stored = loadPositions();
    if (Object.keys(stored).length > 0) setPositions(stored);
  }, []);

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

  const laneCount = Math.max(zones.length, 1);
  const laneWidth = CONTENT_W / laneCount;
  const lanes = zones.map((zone, i) => ({
    zone,
    x0: MARGIN_X + i * laneWidth,
    width: laneWidth,
    items: equipment.filter((e) => e.zoneId === zone.id),
  }));

  function defaultPosition(lane: (typeof lanes)[number], index: number) {
    const total = lane.items.length;
    const cols = total > 4 ? 2 : 1;
    const rows = Math.ceil(total / cols);
    const col = index % cols;
    const row = Math.floor(index / cols);
    const padX = lane.width * 0.2;
    const innerW = lane.width - padX * 2;
    const x = lane.x0 + padX + (cols === 1 ? innerW / 2 : (col / (cols - 1)) * innerW);
    const areaTop = SECURITY_Y0 + 48;
    const areaBottom = SECURITY_Y1 - 34;
    const innerH = areaBottom - areaTop;
    const y = areaTop + (rows === 1 ? innerH / 2 : (row / (rows - 1)) * innerH);
    return { x, y };
  }

  function handleMarkerPointerDown(e: ReactPointerEvent<SVGGElement>, eq: Equipment, def: { x: number; y: number }) {
    e.stopPropagation();
    if (!editMode) return;
    (e.target as Element).setPointerCapture(e.pointerId);
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
      const nx = clamp(p.x - dragOffset.current.x, MARGIN_X + 8, VB_W - MARGIN_X - 8);
      const ny = clamp(p.y - dragOffset.current.y, SECURITY_Y0 + 14, SECURITY_Y1 - 10);
      setPositions((prev) => ({ ...prev, [id]: { x: nx, y: ny } }));
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
      dragId.current = null;
      setPositions((prev) => {
        savePositions(prev);
        return prev;
      });
    }
    panFrom.current = null;
    setIsPanning(false);
  }

  function resetView() {
    setPan({ x: 0, y: 0 });
    setZoomIndex(1);
  }

  const gateXs = [0.18, 0.4, 0.62, 0.84].map((f) => MARGIN_X + CONTENT_W * f);
  const openMarker = openMarkerId
    ? equipment.find((e) => e.id === openMarkerId)
    : null;
  const openMarkerLane = openMarker ? lanes.find((l) => l.zone.id === openMarker.zoneId) : null;
  const openMarkerIndex = openMarker && openMarkerLane ? openMarkerLane.items.indexOf(openMarker) : -1;
  const openMarkerPos =
    openMarker && openMarkerLane && openMarkerIndex >= 0
      ? positions[openMarker.id] ?? defaultPosition(openMarkerLane, openMarkerIndex)
      : null;

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
            {/* Outer terminal shell */}
            <rect
              x={MARGIN_X - 14}
              y={GATE_CONNECTOR_Y0 - 6}
              width={CONTENT_W + 28}
              height={BOTTOM_Y1 - GATE_CONNECTOR_Y0 + 16}
              rx={6}
              fill="none"
              stroke="var(--color-border-primary)"
              strokeWidth={2}
            />

            {/* Gates */}
            {gateXs.map((gx, i) => (
              <g key={i}>
                <text
                  x={gx}
                  y={GATE_LABEL_Y}
                  textAnchor="middle"
                  fill="var(--color-text-quaternary)"
                  style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}
                >
                  {t("location.gate")} {i + 1}
                </text>
                <line
                  x1={gx}
                  y1={GATE_CONNECTOR_Y0}
                  x2={gx}
                  y2={WAITING_Y0}
                  stroke="var(--color-border-secondary)"
                  strokeWidth={1.5}
                />
              </g>
            ))}

            {/* Waiting area */}
            <RoomBand y0={WAITING_Y0} y1={WAITING_Y1} label={t("location.waitingArea")} />
            {[0, 1, 2].map((i) => (
              <g key={i} transform={`translate(${MARGIN_X + 60 + i * ((CONTENT_W - 120) / 2)} ${WAITING_Y0 + 58})`}>
                {[0, 1, 2, 3, 4].map((s) => (
                  <rect
                    key={s}
                    x={s * 16}
                    y={0}
                    width={12}
                    height={16}
                    rx={2}
                    fill="var(--color-bg-tertiary)"
                    stroke="var(--color-border-secondary)"
                  />
                ))}
              </g>
            ))}

            {/* Passport control */}
            <RoomBand y0={PASSPORT_Y0} y1={PASSPORT_Y1} label={t("location.passportControl")} />
            {[0, 1, 2, 3].map((i) => (
              <rect
                key={i}
                x={MARGIN_X + 60 + i * ((CONTENT_W - 120) / 3)}
                y={PASSPORT_Y0 + 30}
                width={26}
                height={16}
                rx={2}
                fill="var(--color-bg-tertiary)"
                stroke="var(--color-border-secondary)"
              />
            ))}

            {/* Security screening */}
            <RoomBand y0={SECURITY_Y0} y1={SECURITY_Y1} label={t("location.securityScreening")} />
            {lanes.map((lane, i) => {
              const isActive = lane.zone.id === selectedZoneId;
              return (
                <g key={lane.zone.id}>
                  {i > 0 && (
                    <line
                      x1={lane.x0}
                      y1={SECURITY_Y0 + 4}
                      x2={lane.x0}
                      y2={SECURITY_Y1 - 4}
                      stroke="var(--color-border-secondary)"
                      strokeDasharray="3 4"
                    />
                  )}
                  <rect
                    x={lane.x0 + 4}
                    y={SECURITY_Y0 + 22}
                    width={lane.width - 8}
                    height={SECURITY_Y1 - SECURITY_Y0 - 32}
                    rx={5}
                    fill={isActive ? "var(--chip-brand-bg)" : "transparent"}
                    stroke={isActive ? "var(--color-brand-500)" : "transparent"}
                    strokeWidth={1.5}
                    onClick={() => onSelectZone(lane.zone.id)}
                    style={{ cursor: "pointer" }}
                  />
                  <text
                    x={lane.x0 + lane.width / 2}
                    y={SECURITY_Y0 + 36}
                    textAnchor="middle"
                    fill={isActive ? "var(--color-text-primary)" : "var(--color-text-quaternary)"}
                    style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.4, cursor: "pointer" }}
                    onClick={() => onSelectZone(lane.zone.id)}
                  >
                    {lane.zone.name.length > 20 ? `${lane.zone.name.slice(0, 19)}…` : lane.zone.name}
                  </text>
                  {/* conveyor line */}
                  <line
                    x1={lane.x0 + lane.width * 0.18}
                    y1={SECURITY_Y1 - 22}
                    x2={lane.x0 + lane.width * 0.82}
                    y2={SECURITY_Y1 - 22}
                    stroke="var(--color-border-secondary)"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeDasharray="1 6"
                  />
                </g>
              );
            })}

            {/* Equipment markers */}
            {lanes.flatMap((lane) =>
              lane.items.map((eq, idx) => {
                const def = defaultPosition(lane, idx);
                const pos = positions[eq.id] ?? def;
                const radius = editMode ? 8 : 7;
                return (
                  <g
                    key={eq.id}
                    transform={`translate(${pos.x} ${pos.y})`}
                    onPointerDown={(e) => handleMarkerPointerDown(e, eq, def)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!editMode) setOpenMarkerId((cur) => (cur === eq.id ? null : eq.id));
                    }}
                    style={{ cursor: editMode ? "grab" : "pointer" }}
                  >
                    <circle r={radius} fill={STATUS_FILL[eq.status]} stroke="var(--color-bg-secondary)" strokeWidth={2} />
                  </g>
                );
              })
            )}

            {/* Check-in hall */}
            <RoomBand y0={CHECKIN_Y0} y1={CHECKIN_Y1} label={t("location.checkInHall")} />
            {[0, 1].map((group) => (
              <g key={group} transform={`translate(${MARGIN_X + 60 + group * (CONTENT_W - 120 - 130)} ${CHECKIN_Y0 + 32})`}>
                {[0, 1, 2, 3, 4, 5].map((s) => (
                  <rect
                    key={s}
                    x={s * 22}
                    y={0}
                    width={16}
                    height={20}
                    rx={2}
                    fill="var(--color-bg-tertiary)"
                    stroke="var(--color-border-secondary)"
                  />
                ))}
              </g>
            ))}

            {/* Bottom: baggage claim | main entrance */}
            <line
              x1={MARGIN_X + CONTENT_W * 0.28}
              y1={BOTTOM_Y0}
              x2={MARGIN_X + CONTENT_W * 0.28}
              y2={BOTTOM_Y1}
              stroke="var(--color-border-primary)"
              strokeWidth={2}
            />
            <RoomBand y0={BOTTOM_Y0} y1={BOTTOM_Y1} x0={MARGIN_X} x1={MARGIN_X + CONTENT_W * 0.28} label={t("location.baggageClaim")} small />
            <RoomBand
              y0={BOTTOM_Y0}
              y1={BOTTOM_Y1}
              x0={MARGIN_X + CONTENT_W * 0.28}
              x1={MARGIN_X + CONTENT_W}
              label={t("location.mainEntrance")}
              small
            />
          </g>
        </svg>

        {openMarker && openMarkerPos && (
          <MarkerTooltip
            equipment={openMarker}
            statusLabel={statusConfig[openMarker.status].label}
            x={(openMarkerPos.x + pan.x) * scale}
            y={(openMarkerPos.y + pan.y) * scale}
            onClose={() => setOpenMarkerId(null)}
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

function RoomBand({
  y0,
  y1,
  x0 = MARGIN_X,
  x1 = MARGIN_X + CONTENT_W,
  label,
  small,
}: {
  y0: number;
  y1: number;
  x0?: number;
  x1?: number;
  label: string;
  small?: boolean;
}) {
  return (
    <g>
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="none" stroke="var(--color-border-primary)" strokeWidth={1.5} />
      <text
        x={x0 + (x1 - x0) / 2}
        y={y0 + (small ? 20 : 16)}
        textAnchor="middle"
        fill="var(--color-text-quaternary)"
        style={{ fontSize: small ? 10 : 10, fontWeight: 700, letterSpacing: 0.6 }}
      >
        {label.toUpperCase()}
      </text>
    </g>
  );
}

function MarkerTooltip({
  equipment,
  statusLabel,
  x,
  y,
  onClose,
}: {
  equipment: Equipment;
  statusLabel: string;
  x: number;
  y: number;
  onClose: () => void;
}) {
  return (
    <div
      className="pointer-events-none absolute z-10 w-44 -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-lg border border-border-primary bg-bg-secondary p-2.5 shadow-lg"
      style={{ left: x, top: y }}
    >
      <button
        onClick={onClose}
        className="pointer-events-auto absolute right-1.5 top-1.5 text-text-quaternary hover:text-text-primary"
        aria-label="Close"
      >
        <Icon name="x" size={12} />
      </button>
      <p className="truncate pr-4 text-xs font-semibold text-text-primary">{equipment.name}</p>
      <p className="mt-0.5 truncate text-[11px] text-text-tertiary">{equipment.code}</p>
      <p className="mt-1 text-[11px] font-medium text-text-secondary">{statusLabel}</p>
      <a
        href={`/equipment/${equipment.id}`}
        className="pointer-events-auto mt-1.5 block text-[11px] font-medium text-brand-400 hover:text-brand-300"
      >
        →
      </a>
    </div>
  );
}

/**
 * HOW TO REPLACE THIS WITH A REAL AIRPORT SVG:
 * 1. Get the real floor-plan SVG (walls, gates, room boundaries) at the
 *    same viewBox proportions (or adjust VB_W/VB_H above to match).
 * 2. Replace the fixed `RoomBand` rects/gate ticks with the real artwork
 *    (import it as a background <image> or inline the real <path>s).
 * 3. Keep the Security Screening lane rects (or replace with real room
 *    polygons per zone) — equipment markers are positioned relative to
 *    `SECURITY_Y0`/`SECURITY_Y1` and each lane's `x0`/`width`; update
 *    `defaultPosition()` to reference the new geometry instead.
 * 4. Marker drag/pan/zoom math (`toLocalPoint`, `handlePointerMove`) is
 *    geometry-agnostic — it works against whatever the <g> contains.
 */
