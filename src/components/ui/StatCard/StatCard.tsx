import type { ReactNode } from "react";
import "./StatCard.css";

interface StatCardProps {
  label: string;
  value: ReactNode;
  helper?: string;
  icon?: ReactNode;
  featured?: boolean;
  className?: string;
}

export default function StatCard({ label, value, helper, icon, featured = false, className = "" }: StatCardProps) {
  const classes = ["cs-stat-card", featured ? "cs-stat-card--featured" : "", className].filter(Boolean).join(" ");
  return (
    <article className={classes}>
      <div className="cs-stat-card__header">
        <span>{label}</span>
        {icon && <div className="cs-stat-card__icon">{icon}</div>}
      </div>
      <strong>{value}</strong>
      {helper && <p>{helper}</p>}
    </article>
  );
}
