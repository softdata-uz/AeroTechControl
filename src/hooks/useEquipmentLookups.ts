"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  equipmentService,
  manufacturerCompaniesApi,
  manufacturerCountriesApi,
  equipmentOperatorsApi,
} from "@/services";
import type {
  EquipmentModel,
  EquipmentOperator,
  EquipmentType,
  ManufacturerCompany,
  ManufacturerCountry,
  ProtocolTemplate,
  Regulation,
} from "@/lib/types";

// Equipment types/models and the manufacturer/operator lookups are all
// small, bounded directories — fetched once and cached here, mirroring
// useLocations.ts, so the Equipment form's Select+Add-New pickers and the
// list filter bars don't each issue their own request. Each add*() appends
// locally (no refetch) so a record just created via its modal is
// immediately selectable, and each refetch*() re-pulls the list when a
// SelectWithAddNew needs a guaranteed-fresh copy after creating.
export function useEquipmentLookups() {
  const [types, setTypes] = useState<EquipmentType[]>([]);
  const [models, setModels] = useState<EquipmentModel[]>([]);
  const [manufacturerCompanies, setManufacturerCompanies] = useState<ManufacturerCompany[]>([]);
  const [manufacturerCountries, setManufacturerCountries] = useState<ManufacturerCountry[]>([]);
  const [equipmentOperators, setEquipmentOperators] = useState<EquipmentOperator[]>([]);
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [protocolTemplates, setProtocolTemplates] = useState<ProtocolTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    // Promise.allSettled, not Promise.all: each lookup is independent, so one
    // endpoint failing (e.g. a pending migration breaking /protocol-templates)
    // must not blank every other picker fed by this hook.
    return Promise.allSettled([
      equipmentService.listEquipmentTypes(),
      equipmentService.listEquipmentModels(),
      manufacturerCompaniesApi.list(),
      manufacturerCountriesApi.list(),
      equipmentOperatorsApi.list(),
      equipmentService.listRegulations(),
      equipmentService.listProtocolTemplates(),
    ]).then(([t, m, mc, mco, op, reg, protocols]) => {
      if (t.status === "fulfilled") setTypes(t.value);
      else console.error("Failed to load equipment types", t.reason);
      if (m.status === "fulfilled") setModels(m.value);
      else console.error("Failed to load equipment models", m.reason);
      if (mc.status === "fulfilled") setManufacturerCompanies(mc.value);
      else console.error("Failed to load manufacturer companies", mc.reason);
      if (mco.status === "fulfilled") setManufacturerCountries(mco.value);
      else console.error("Failed to load manufacturer countries", mco.reason);
      if (op.status === "fulfilled") setEquipmentOperators(op.value);
      else console.error("Failed to load equipment operators", op.reason);
      if (reg.status === "fulfilled") setRegulations(reg.value);
      else console.error("Failed to load regulations", reg.reason);
      if (protocols.status === "fulfilled") setProtocolTemplates(protocols.value);
      else console.error("Failed to load protocol templates", protocols.reason);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    load().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const modelsByType = useCallback(
    (equipmentTypeId: number) => models.filter((m) => m.equipmentTypeId === equipmentTypeId),
    [models]
  );

  const regulationsByType = useCallback(
    (equipmentTypeId: number) => regulations.filter((r) => r.equipmentTypeId === equipmentTypeId),
    [regulations]
  );

  const protocolTemplateByType = useCallback(
    (equipmentTypeId: number) => protocolTemplates.find((p) => p.equipmentTypeId === equipmentTypeId) ?? null,
    [protocolTemplates]
  );

  const addType = useCallback((type: EquipmentType) => {
    setTypes((prev) => [...prev, type]);
  }, []);

  const addModel = useCallback((model: EquipmentModel) => {
    setModels((prev) => [...prev, model]);
  }, []);

  const addManufacturerCompany = useCallback((company: ManufacturerCompany) => {
    setManufacturerCompanies((prev) => [...prev, company]);
  }, []);

  const addManufacturerCountry = useCallback((country: ManufacturerCountry) => {
    setManufacturerCountries((prev) => [...prev, country]);
  }, []);

  const addEquipmentOperator = useCallback((operator: EquipmentOperator) => {
    setEquipmentOperators((prev) => [...prev, operator]);
  }, []);

  const addRegulation = useCallback((regulation: Regulation) => {
    setRegulations((prev) => [...prev, regulation]);
  }, []);

  const addProtocolTemplate = useCallback((template: ProtocolTemplate) => {
    setProtocolTemplates((prev) => [...prev, template]);
  }, []);

  return useMemo(
    () => ({
      types,
      models,
      manufacturerCompanies,
      manufacturerCountries,
      equipmentOperators,
      regulations,
      protocolTemplates,
      loading,
      modelsByType,
      regulationsByType,
      protocolTemplateByType,
      addType,
      addModel,
      addManufacturerCompany,
      addManufacturerCountry,
      addEquipmentOperator,
      addRegulation,
      addProtocolTemplate,
      refetch: load,
    }),
    [
      types,
      models,
      manufacturerCompanies,
      manufacturerCountries,
      equipmentOperators,
      regulations,
      protocolTemplates,
      loading,
      modelsByType,
      regulationsByType,
      protocolTemplateByType,
      addType,
      addModel,
      addManufacturerCompany,
      addManufacturerCountry,
      addEquipmentOperator,
      addRegulation,
      addProtocolTemplate,
      load,
    ]
  );
}

/** Lighter, types-only variant for filter-bar-only consumers (Equipment/Faults list filters). */
export function useEquipmentTypes() {
  const [types, setTypes] = useState<EquipmentType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    equipmentService
      .listEquipmentTypes()
      .then((t) => {
        if (!cancelled) setTypes(t);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => ({ types, loading }), [types, loading]);
}
