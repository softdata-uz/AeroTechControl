"use client";

import { useState } from "react";
import regions, { type UzRegion } from "@/data/uzbekistanRegions";
import { cn } from "@/lib/cn";

export interface UzMapMarker {
  id: string;
  /** Percent of the 970×590 map viewBox, left/top style values (e.g. "71.6%"). */
  left: string;
  top: string;
  label: string;
  render: () => React.ReactNode;
}

interface UzbekistanMapProps {
  markers?: UzMapMarker[];
  className?: string;
}

/**
 * Interactive administrative map of Uzbekistan (regions), rendered from the
 * `uzbekistanRegions` path dataset. Hover highlights a region with the same
 * gradient fill used by the original reference widget; markers (airport
 * pins, etc.) are absolutely positioned on top using percent coordinates.
 */
export function UzbekistanMap({ markers = [], className }: UzbekistanMapProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  return (
    <div className={cn("relative", className)}>
      <svg viewBox="0 0 970 590" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {(regions as UzRegion[]).map((region) => (
          <g key={region.id}>
            <path
              fill={region.g[0]?.fill || "var(--bg-tertiary)"}
              fillOpacity={region.g[0]?.fill_opacity || undefined}
              d={region.g[0]?.d}
            />
            {region.g[1] && (
              <path
                d={region.g[1].d}
                fill={hoveredId === region.id ? "url(#uzMapHover)" : "transparent"}
                stroke={region.g[1].stroke || "var(--border-primary)"}
                strokeOpacity={region.g[1].stroke_opacity || undefined}
                strokeWidth={region.g[1].stroke_width || "1"}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredId(region.id)}
                onMouseLeave={() => setHoveredId((id) => (id === region.id ? null : id))}
              >
                <title>{region.type}</title>
              </path>
            )}
          </g>
        ))}
        <defs>
          <linearGradient id="uzMapHover" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-brand-600)" />
            <stop offset="100%" stopColor="var(--color-brand-400)" />
          </linearGradient>
        </defs>
      </svg>

      {markers.map((marker) => (
        <div
          key={marker.id}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ top: marker.top, left: marker.left }}
        >
          {marker.render()}
        </div>
      ))}
    </div>
  );
}
