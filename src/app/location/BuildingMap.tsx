/**
 * The terminal's real vector floor plan lives at `public/2d.svg` (sourced
 * from `src/schema/2d.svg`) — an extracted architectural line drawing on
 * a fully transparent background, with its own `<style>` block that
 * themes itself via `prefers-color-scheme` (see that file's `:root` /
 * `@media` rules) and via a `data-theme="light"|"dark"` attribute on its
 * root `<svg>` should a caller want to force one explicitly. To replace
 * it with an updated building layout later: swap that file directly,
 * keeping its `viewBox="0 0 {BUILDING_MAP_VB_W} {BUILDING_MAP_VB_H}"`
 * (below, matched to the file's own native `1540 x 605` viewBox so it
 * renders at its authored aspect ratio) so it stays aligned with the
 * ROOMS bands in `TerminalMap.tsx` — no code changes needed here.
 */
export const BUILDING_MAP_SRC = "/2d.svg";
export const BUILDING_MAP_VB_W = 1540;
export const BUILDING_MAP_VB_H = 605;

/**
 * Renders that floor plan as the map's background layer. Loaded as an
 * external image reference (not inlined into the DOM), so it themes
 * itself purely off the browser's OS-level color-scheme preference — it
 * cannot see the app's own manual dark/light toggle state, which is an
 * accepted simplification here.
 */
export function BuildingMap() {
  return (
    <image
      href={BUILDING_MAP_SRC}
      x={0}
      y={0}
      width={BUILDING_MAP_VB_W}
      height={BUILDING_MAP_VB_H}
      preserveAspectRatio="xMidYMid meet"
    />
  );
}
