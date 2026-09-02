// Canonical list of Uzbekistan's 14 administrative regions (12 viloyats,
// Toshkent shahri, and Qoraqalpog'iston Respublikasi). The `value` of each
// entry is exactly the top-level `type` key used by the region shapes in
// `src/data/uzbekistanRegions.ts` — keeping a single shared list here (rather
// than duplicating it in the Airport form and the Dashboard map) is what
// guarantees a selected region can never drift from the shape it's supposed
// to point at (e.g. accidentally mixing up "namangan" and "navoi").

export type UzbekistanRegion =
  | "andijan"
  | "bukhara"
  | "fergana"
  | "jizzakh"
  | "namangan"
  | "navoi"
  | "qarshi"
  | "karakalpak"
  | "samarqand"
  | "sirdaryo"
  | "surxon"
  | "toshkent_sh"
  | "toshkent"
  | "khwarezm";

export const UZBEKISTAN_REGIONS: { value: UzbekistanRegion; label: string }[] = [
  { value: "andijan", label: "Andijon viloyati" },
  { value: "bukhara", label: "Buxoro viloyati" },
  { value: "fergana", label: "Farg'ona viloyati" },
  { value: "jizzakh", label: "Jizzax viloyati" },
  { value: "namangan", label: "Namangan viloyati" },
  { value: "navoi", label: "Navoiy viloyati" },
  { value: "qarshi", label: "Qashqadaryo viloyati" },
  { value: "karakalpak", label: "Qoraqalpog'iston Respublikasi" },
  { value: "samarqand", label: "Samarqand viloyati" },
  { value: "sirdaryo", label: "Sirdaryo viloyati" },
  { value: "surxon", label: "Surxondaryo viloyati" },
  { value: "toshkent_sh", label: "Toshkent shahri" },
  { value: "toshkent", label: "Toshkent viloyati" },
  { value: "khwarezm", label: "Xorazm viloyati" },
];

// Display-name lookup for every shape the Dashboard map can render/hover,
// including "orol" (the Aral Sea area) — a decorative shape with no
// `districts` that isn't a real administrative region, so it's deliberately
// left out of `UZBEKISTAN_REGIONS` (airports can't be assigned to it).
export const REGION_NAME: Record<string, string> = {
  orol: "Orolbo'yi",
  ...Object.fromEntries(UZBEKISTAN_REGIONS.map((r) => [r.value, r.label])),
};
