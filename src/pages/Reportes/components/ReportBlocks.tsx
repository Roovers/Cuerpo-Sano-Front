import type { ReactNode } from "react";
import { ResponsiveContainer } from "recharts";
import { EmptyState } from "../../../components/ui";

export function ReportCard({
  kicker,
  title,
  description,
  children,
  className = "",
  action,
}: {
  kicker: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section className={`doc-report-card ${className}`.trim()}>
      <div className="doc-report-card__header">
        <div>
          <span className="cs-section-kicker">{kicker}</span>
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </div>

        {action}
      </div>

      {children}
    </section>
  );
}

export function ChartFrame({
  empty,
  children,
  height = 320,
}: {
  empty?: boolean;
  children: ReactNode;
  height?: number;
}) {
  const safeHeight = Math.max(height, 260);

  if (empty) {
    return (
      <div className="doc-chart-frame doc-chart-frame--empty" style={{ minHeight: safeHeight }}>
        <EmptyState
          title="Sin datos suficientes"
          description="El período seleccionado no contiene volumen suficiente para esta visualización."
          className="doc-empty-chart"
        />
      </div>
    );
  }

  return (
    <div
      className="doc-chart-frame"
      style={{
        height: safeHeight,
        minHeight: safeHeight,
        minWidth: 0,
      }}
    >
      <ResponsiveContainer
        width="100%"
        height={safeHeight}
        minWidth={1}
        minHeight={1}
        debounce={80}
      >
        {children as any}
      </ResponsiveContainer>
    </div>
  );
}

export function InsightNote({
  title,
  description,
  tone = "info",
}: {
  title: string;
  description: string;
  tone?: "info" | "success" | "warning";
}) {
  return (
    <article className={`doc-insight-note ${tone}`}>
      <span>{title}</span>
      <p>{description}</p>
    </article>
  );
}
