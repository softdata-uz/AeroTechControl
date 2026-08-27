/**
 * Which chrome a data-entry form should use, picked by how many fields it
 * asks for — not by habit or by which container happened to be handy.
 *
 *   4–6 полей   → "modal"  — centered Modal (ui/Modal.tsx)
 *   6–10 полей  → "drawer" — right-side Drawer (ui/Drawer.tsx)
 *   10+ полей   → "page"   — dedicated route, its own PageHeader
 *
 * The 6-field boundary favors "modal" (a 6-field form still reads fine
 * centered); the 10-field boundary favors "page" (10 fields is already
 * long for a slide-over). Call this when *designing* a new form — it's
 * a decision helper, not something re-evaluated at runtime as a user
 * fills fields in.
 */
export type FormLayout = "modal" | "drawer" | "page";

export function pickFormLayout(fieldCount: number): FormLayout {
  if (fieldCount <= 6) return "modal";
  if (fieldCount <= 10) return "drawer";
  return "page";
}
