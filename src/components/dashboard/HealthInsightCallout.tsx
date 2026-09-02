import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/icons";
import type { HealthInsight } from "@/services/fault-intelligence.service";

interface HealthInsightCalloutProps {
  insight: HealthInsight;
  ctaLabel?: string;
  onNavigate?: () => void;
}

const TONE = {
  spike: { icon: "bg-(--chip-warning-bg) text-(--chip-warning-text)", name: "bar-chart" as const },
  risk: { icon: "bg-(--chip-error-bg) text-(--chip-error-text)", name: "alert-triangle" as const },
};

/** AI-insight-style callout — reuses the KPICard tone/chip pattern and the
 * plain `Card` container, no new visual language. */
export function HealthInsightCallout({ insight, ctaLabel, onNavigate }: HealthInsightCalloutProps) {
  const tone = TONE[insight.kind];
  return (
    <Card className="flex items-start gap-3 p-4">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone.icon}`}>
        <Icon name={tone.name} size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-text-primary">{insight.message}</p>
        <p className="mt-1 text-xs text-text-tertiary">{insight.recommendedAction}</p>
      </div>
      {onNavigate && (
        <Button hierarchy="secondary" size="sm" onClick={onNavigate} className="shrink-0">
          {ctaLabel ?? "→"}
        </Button>
      )}
    </Card>
  );
}
