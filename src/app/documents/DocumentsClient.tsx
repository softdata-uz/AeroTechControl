"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { useTranslations } from "@/lib/locale-context";
import { DocumentsSection } from "./DocumentsSection";
import { InspectionsSection } from "./InspectionsSection";
import { RepairsSection } from "./RepairsSection";

const SECTION_KEYS = ["documents", "inspections", "repairs"] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

function isSectionKey(value: string | null): value is SectionKey {
  return SECTION_KEYS.includes(value as SectionKey);
}

const sectionTitleKey = {
  documents: "documents.title",
  inspections: "inspections.title",
  repairs: "repairs.title",
} as const;

export function DocumentsClient() {
  const t = useTranslations();
  const initialTab = useSearchParams().get("tab");
  const [section, setSection] = useState<SectionKey>(isSectionKey(initialTab) ? initialTab : "documents");

  const sectionTabs = [
    { key: "documents", label: t("nav.documents") },
    { key: "inspections", label: t("nav.inspections") },
    { key: "repairs", label: t("nav.repairs") },
  ] as const;

  return (
    <div className="pb-8">
      <PageHeader title={t(sectionTitleKey[section])} />

      <Tabs items={sectionTabs} value={section} onChange={setSection} className="px-6 pt-3" />

      {section === "documents" && <DocumentsSection />}
      {section === "inspections" && <InspectionsSection />}
      {section === "repairs" && <RepairsSection />}
    </div>
  );
}
