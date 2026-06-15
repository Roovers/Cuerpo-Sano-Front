import "./StatusBadge.css";

type StatusBadgeVariant = "success" | "danger" | "warning" | "info" | "neutral";

interface StatusBadgeProps {
  label: string;
  variant?: StatusBadgeVariant;
  className?: string;
}

export default function StatusBadge({ label, variant = "neutral", className = "" }: StatusBadgeProps) {
  return <span className={`cs-status-badge cs-status-badge--${variant} ${className}`.trim()}><i />{label}</span>;
}
