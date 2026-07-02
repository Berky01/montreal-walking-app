import type { ProjectedPoint } from "./mapTypes";

export function RouteLine({ points, selected }: { points: ProjectedPoint[]; selected: boolean }) {
  if (points.length < 2) {
    return null;
  }

  return (
    <polyline
      fill="none"
      points={points.map((point) => `${point.x},${point.y}`).join(" ")}
      stroke={selected ? "#154212" : "#3f627e"}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeOpacity={selected ? 0.95 : 0.36}
      strokeWidth={selected ? 2.4 : 1.4}
      vectorEffect="non-scaling-stroke"
    />
  );
}
