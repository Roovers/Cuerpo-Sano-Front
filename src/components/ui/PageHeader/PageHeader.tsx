import type { ReactNode } from "react";
import "./PageHeader.css";

interface PageHeaderProps {
  kicker?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionIcon?: ReactNode;
  onAction?: () => void;
  actions?: ReactNode;
  className?: string;
}

export default function PageHeader({
  kicker,
  title,
  description,
  actionLabel,
  actionIcon,
  onAction,
  actions,
  className = "",
}: PageHeaderProps) {
  const hasDefaultAction = actionLabel && onAction;

  return (
    <header className={`cs-page-header ${className}`.trim()}>
      <div className="cs-page-header__copy">
        {kicker && <span className="cs-section-kicker">{kicker}</span>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>

      {(actions || hasDefaultAction) && (
        <div className="cs-page-header__actions">
          {actions}

          {hasDefaultAction && (
            <button type="button" className="cs-button cs-button--primary" onClick={onAction}>
              {actionIcon}
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </header>
  );
}
