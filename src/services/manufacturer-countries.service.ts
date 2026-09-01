import type { ManufacturerCountry } from "@/lib/types";
import { createLookupService } from "./lookup.service";

export const manufacturerCountriesApi = createLookupService<ManufacturerCountry>(
  "/manufacturer-countries"
);
