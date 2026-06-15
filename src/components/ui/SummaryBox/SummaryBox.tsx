import type { ReactNode } from "react";
import "./SummaryBox.css";

interface SummaryBoxProps {
  label?: string;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export default function SummaryBox({
  label,
  title,
  description,
  children,
  className = "",
}: SummaryBoxProps) {
  return (
    <div className={`cs-summary-box ${className}`.trim()}>
      {label && <span>{label}</span>}
      {title && <strong>{title}</strong>}
      {description && <p>{description}</p>}
      {children}
    </div>
  );
}