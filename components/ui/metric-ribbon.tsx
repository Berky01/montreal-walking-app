import type { RouteMetric } from "@/lib/types";

export function MetricRibbon({ metrics }: { metrics: RouteMetric[] }) {
  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-card border border-outline-variant bg-surface-container-lowest sm:grid-cols-4">
      {metrics.map((metric) => (
        <div className="border-b border-outline-variant/70 p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0" key={metric.label}>
          <dt className="text-label-sm text-on-surface-variant">{metric.label}</dt>
          <dd className="mt-1 text-metric-lg text-on-surface">{metric.value}</dd>
          {metric.helper ? <p className="mt-1 text-label-sm text-on-surface-variant">{metric.helper}</p> : null}
        </div>
      ))}
    </dl>
  );
}
