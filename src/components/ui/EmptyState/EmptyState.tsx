import type { ReactNode } from "react";
import Button from "../Button/Button";
import "./EmptyState.css";

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description: string;
  actionLabel?: string;
  actionIcon?: ReactNode;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({ icon, title, description, actionLabel, actionIcon, onAction, className = "" }: EmptyStateProps) {
  return (
    <div className={`cs-empty-state ${className}`.trim()}>
      {icon && <div className="cs-empty-state__icon">{icon}</div>}
      {title && <strong>{title}</strong>}
      <p>{description}</p>
      {actionLabel && onAction && <Button variant="secondary" icon={actionIcon} onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}
