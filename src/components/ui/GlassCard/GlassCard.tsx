import type { HTMLAttributes, ReactNode } from "react";
import "./GlassCard.css";

interface GlassCardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  as?: "div" | "section" | "article" | "aside";
}

export default function GlassCard({ children, as: Tag = "section", className = "", ...props }: GlassCardProps) {
  return <Tag className={`cs-glass-card ${className}`.trim()} {...props}>{children}</Tag>;
}
