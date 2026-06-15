import type { ReactNode } from "react";
import "./FilterToolbar.css";

interface FilterToolbarProps {
  children: ReactNode;
  columns?: string;
  className?: string;
}

export default function FilterToolbar({ children, columns = "1fr auto", className = "" }: FilterToolbarProps) {
  return <div className={`cs-filter-toolbar ${className}`.trim()} style={{ gridTemplateColumns: columns }}>{children}</div>;
}
