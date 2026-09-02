"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import regions, { type UzRegion } from "@/data/uzbekistanRegions";
import { REGION_NAME } from "@/config/regions.config";
import { cn } from "@/lib/cn";

const VB_W = 970;
const VB_H = 590;

export interface UzMapMarker {
  id: string;
  /**
   * The `type` field of the target region/district in `uzbekistanRegions.ts`
   * (e.g. "toshkent_sh"). The marker is centered on that shape's own
   * bounding-box centroid — computed from the real path geometry via
   * `getBBox()` — so it always lands exactly on the shape it names instead
   * of a hand-guessed percentage.
   */
  regionType: string;
  label: string;
  render: () => React.ReactNode;
}

interface UzbekistanMapProps {
  markers?: UzMapMarker[];
  className?: string;
}

function findRegionByType(list: UzRegion[], type: string): UzRegion | null {
  for (const region of list) {
    if (region.type === type) return region;
    if (region.districts?.length) {
      const found = findRegionByType(region.districts, type);
      if (found) return found;
    }
  }
  return null;
}

interface Layout {
  scale: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

/**
 * Interactive administrative map of Uzbekistan (regions), rendered from the
 * `uzbekistanRegions` path dataset. Hover highlights a region with the same
 * gradient fill used by the original reference widget.
 *
 * Markers are positioned by real geometry, not guessed percentages: each one
 * names a region/district `type`, its shape's centroid is measured with
 * `getBBox()`, and that viewBox-space point is converted to a container-
 * relative percentage using the same letterbox math the browser applies to
 * the SVG's `preserveAspectRatio` (measured live via `ResizeObserver`, since
 * the map's aspect ratio rarely matches its card's). That keeps every pin
 * exactly on its city regardless of the card's width, height, or resizing.
 */
export function UzbekistanMap({ markers = [], className }: UzbekistanMapProps) {
  const [hovered, setHovered] = useState<{ id: number; type: string } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRefs = useRef<Map<string, SVGPathElement>>(new Map());
  const [layout, setLayout] = useState<Layout | null>(null);
  const [centroids, setCentroids] = useState<Record<string, { x: number; y: number }>>({});

  const uniqueTypes = Array.from(new Set(markers.map((m) => m.regionType)));
  const typesKey = uniqueTypes.join(",");

  useLayoutEffect(() => {
    const next: Record<string, { x: number; y: number }> = {};
    for (const type of uniqueTypes) {
      const el = pathRefs.current.get(type);
      if (!el) continue;
      const box = el.getBBox();
      next[type] = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    }
    setCentroids(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typesKey]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function measure() {
      const { clientWidth: width, clientHeight: height } = el!;
      if (!width || !height) return;
      const scale = Math.min(width / VB_W, height / VB_H);
      setLayout({
        scale,
        offsetX: (width - VB_W * scale) / 2,
        offsetY: (height - VB_H * scale) / 2,
        width,
        height,
      });
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function markerStyle(regionType: string): React.CSSProperties | null {
    const centroid = centroids[regionType];
    if (!centroid || !layout) return null;
    const px = layout.offsetX + centroid.x * layout.scale;
    const py = layout.offsetY + centroid.y * layout.scale;
    return {
      left: `${(px / layout.width) * 100}%`,
      top: `${(py / layout.height) * 100}%`,
    };
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    // Viewport (client) coordinates, not container-relative — the tooltip
    // is portaled to <body> with `position: fixed`, so it needs the same
    // coordinate space as the mouse event itself.
    setMousePos({ x: e.clientX, y: e.clientY });
  }

  function renderRegion(region: UzRegion, isHovered: boolean) {
    return (
      <g key={region.id}>
        <path
          fill={region.g[0]?.fill || "var(--bg-tertiary)"}
          fillOpacity={region.g[0]?.fill_opacity || undefined}
          d={region.g[0]?.d}
        />
        {region.g[1] && (
          <path
            d={region.g[1].d}
            fill={isHovered ? "url(#uzMapHover)" : "transparent"}
            stroke={isHovered ? "var(--color-brand-400)" : region.g[1].stroke || "var(--border-primary)"}
            strokeOpacity={region.g[1].stroke_opacity || undefined}
            strokeWidth={isHovered ? "1.5" : region.g[1].stroke_width || "1"}
            className="cursor-pointer transition-colors"
            onMouseEnter={() => setHovered({ id: region.id, type: region.type })}
            onMouseLeave={() => setHovered((h) => (h?.id === region.id ? null : h))}
          />
        )}
      </g>
    );
  }

  const tooltipStyle: React.CSSProperties | undefined =
    hovered && mousePos
      ? {
          left: mousePos.x,
          top: mousePos.y - 14,
        }
      : undefined;

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHovered(null)}
    >
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {(regions as UzRegion[]).map((region) => renderRegion(region, hovered?.id === region.id))}

        {/* SVG has no z-index — paint order is purely document order, so a
            later region can visually cover an earlier one's hover highlight
            wherever their shapes touch/overlap (e.g. Tashkent shahri sitting
            right against Tashkent viloyat). Re-rendering the hovered region
            here, last, guarantees its highlight and border paint above every
            other region regardless of where it sits in the source data. */}
        {hovered && (() => {
          const region = (regions as UzRegion[]).find((r) => r.id === hovered.id);
          return region ? renderRegion(region, true) : null;
        })()}

        {/* Invisible geometry-only paths, purely so getBBox() can measure each
            marker's target shape — never painted or hit-tested. */}
        {uniqueTypes.map((type) => {
          const region = findRegionByType(regions as UzRegion[], type);
          const d = region?.g[0]?.d ?? region?.g[1]?.d;
          if (!d) return null;
          return (
            <path
              key={type}
              ref={(el) => {
                if (el) pathRefs.current.set(type, el);
                else pathRefs.current.delete(type);
              }}
              d={d}
              fill="none"
              stroke="none"
              style={{ visibility: "hidden", pointerEvents: "none" }}
            />
          );
        })}

        <defs>
          <linearGradient id="uzMapHover" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-brand-600)" />
            <stop offset="100%" stopColor="var(--color-brand-400)" />
          </linearGradient>
        </defs>
      </svg>

      {markers.map((marker) => {
        const style = markerStyle(marker.regionType);
        if (!style) return null;
        return (
          <div key={marker.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={style}>
            {marker.render()}
          </div>
        );
      })}

      {hovered &&
        tooltipStyle &&
        createPortal(
          // Portaled to <body> with `position: fixed` (viewport coordinates)
          // so it renders above everything and is never clipped by an
          // ancestor `overflow-hidden` (the Dashboard map card has one).
          <div
            className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-border-primary bg-bg-secondary px-2.5 py-1.5 text-xs font-medium text-text-primary shadow-lg"
            style={tooltipStyle}
          >
            {REGION_NAME[hovered.type] ?? hovered.type}
          </div>,
          document.body
        )}
    </div>
  );
}
