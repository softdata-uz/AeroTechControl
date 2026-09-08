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
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    return Promise.all([
      equipmentService.listEquipmentTypes(),
      equipmentService.listEquipmentModels(),
      manufacturerCompaniesApi.list(),
      manufacturerCountriesApi.list(),
      equipmentOperatorsApi.list(),
      equipmentService.listRegulations(),
    ]).then(([t, m, mc, mco, op, reg]) => {
      setTypes(t);
      setModels(m);
      setManufacturerCompanies(mc);
      setManufacturerCountries(mco);
      setEquipmentOperators(op);
      setRegulations(reg);
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

  return useMemo(
    () => ({
      types,
      models,
      manufacturerCompanies,
      manufacturerCountries,
      equipmentOperators,
      regulations,
      loading,
      modelsByType,
      regulationsByType,
      addType,
      addModel,
      addManufacturerCompany,
      addManufacturerCountry,
      addEquipmentOperator,
      addRegulation,
      refetch: load,
    }),
    [
      types,
      models,
      manufacturerCompanies,
      manufacturerCountries,
      equipmentOperators,
      regulations,
      loading,
      modelsByType,
      regulationsByType,
      addType,
      addModel,
      addManufacturerCompany,
      addManufacturerCountry,
      addEquipmentOperator,
      addRegulation,
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
