import type { ManufacturerCompany } from "@/lib/types";
import { createLookupService } from "./lookup.service";

export const manufacturerCompaniesApi = createLookupService<ManufacturerCompany>(
  "/manufacturer-companies"
);
