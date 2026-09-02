"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { KPICard } from "@/components/data-display/KPICard";
import { RankedBarList } from "@/components/charts/RankedBarList";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { HealthInsightCallout } from "@/components/dashboard/HealthInsightCallout";
import { useHealthSummary } from "@/hooks/useHealthSummary";
import { equipment, faults, airportName } from "@/lib/mock-data";
import { useTranslations } from "@/lib/locale-context";

function scoreColor(score: number) {
  if (score < 50) return "var(--color-error-500)";
  if (score < 75) return "var(--color-warning-500)";
  return "var(--color-success-500)";
}

export function HealthOverviewClient() {
  const t = useTranslations();
  const router = useRouter();
  const { data: health, loading } = useHealthSummary();

  const totalEquipment = equipment.length;
  const criticalOpen = faults.filter((f) => f.priority === "critical" && f.stage !== "closed").length;
  const worst = health?.entities.find((e) => e.kind === "airport") ?? null;

  const terminals = (health?.entities ?? []).filter((e) => e.kind === "terminal");

  function locationHref(entity: NonNullable<typeof worst>) {
    const params = new URLSearchParams({ airportId: entity.airportId });
    if (entity.terminalId) params.set("terminalId", entity.terminalId);
    if (entity.zoneId) params.set("zoneId", entity.zoneId);
    return `/location?${params.toString()}`;
  }

  return (
    <div className="pb-8">
      <PageHeader title={t("health.title")} context={t("health.context")} />

      <div className="grid grid-cols-2 gap-3 px-6 pt-5 sm:grid-cols-4">
        <KPICard label={t("health.kpiTotalEquipment")} value={totalEquipment} icon="cpu" tone="neutral" />
        <KPICard label={t("location.maintenanceRisk")} value={health?.maintenanceRiskCount ?? "—"} icon="wrench" tone="warning" />
        <KPICard label={t("health.kpiCriticalOpen")} value={criticalOpen} icon="alert-triangle" tone="error" />
        <KPICard label={t("health.kpiWorstEntity")} value={worst?.name ?? "—"} meta={worst ? `${t("health.scoreLabel")}: ${worst.healthScore}` : undefined} icon="building" tone="brand" />
      </div>

      <div className="grid grid-cols-1 gap-4 px-6 pt-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("health.rankedTitle")}</CardTitle>
          </CardHeader>
          <div className="p-4">
            <ChartFrame loading={loading} isEmpty={terminals.length === 0} height={220}>
              <RankedBarList
                data={terminals.map((e) => ({
                  label: `${airportName(e.airportId)} — ${e.name}`,
                  value: 100 - e.healthScore,
                  color: scoreColor(e.healthScore),
                }))}
                formatValue={(v) => String(100 - v)}
              />
            </ChartFrame>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("health.insightsTitle")}</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-3 p-4">
            {loading ? (
              <div className="h-40 animate-pulse rounded-lg bg-bg-tertiary" />
            ) : !health || health.insights.length === 0 ? (
              <p className="py-6 text-center text-sm text-text-tertiary">{t("health.noInsights")}</p>
            ) : (
              health.insights.slice(0, 5).map((insight) => (
                <HealthInsightCallout
                  key={insight.id}
                  insight={insight}
                  ctaLabel={t("location.viewDetails")}
                  onNavigate={() => router.push(locationHref(insight.entity))}
                />
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
