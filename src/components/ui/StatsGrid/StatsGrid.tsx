import type { ReactNode } from "react";
import "./StatsGrid.css";

interface StatsGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export default function StatsGrid({ children, columns = 3, className = "" }: StatsGridProps) {
  return <section className={`cs-stats-grid cs-stats-grid--${columns} ${className}`.trim()}>{children}</section>;
}
