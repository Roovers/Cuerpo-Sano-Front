import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./IconButton.css";

type IconButtonVariant = "default" | "danger";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  variant?: IconButtonVariant;
  label?: string;
}

export default function IconButton({
  icon,
  variant = "default",
  label,
  className = "",
  type = "button",
  ...props
}: IconButtonProps) {
  const classes = ["cs-icon-button", `cs-icon-button--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      aria-label={label}
      title={label}
      {...props}
    >
      {icon}
    </button>
  );
}