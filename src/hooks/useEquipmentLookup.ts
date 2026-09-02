"use client";

import { useEffect, useMemo, useState } from "react";
import { equipmentService } from "@/services";
import type { Equipment } from "@/lib/types";

// Loads the full equipment fleet once (bounded — well under the backend's
// page-size cap) so table-row contexts (Faults, Documents, Inspections,
// Repairs) can look equipment up by id synchronously, the same way the
// mock `equipmentById` helper worked, without issuing one HTTP request per
// row.
export function useEquipmentLookup() {
  const [items, setItems] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    equipmentService
      .listEquipment({ pageSize: 200 })
      .then((page) => {
        if (!cancelled) setItems(page.items);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const byId = useMemo(() => new Map(items.map((eq) => [eq.id, eq])), [items]);

  return {
    items,
    loading,
    equipmentById: (id: number | null | undefined): Equipment | undefined =>
      id ? byId.get(id) : undefined,
  };
}
