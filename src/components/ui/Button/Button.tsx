import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./Button.css";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  variant = "primary",
  icon,
  fullWidth = false,
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const classes = [
    "cs-button",
    `cs-button--${variant}`,
    fullWidth ? "cs-button--full" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button type={type} className={classes} {...props}>
      {icon}
      {children}
    </button>
  );
}
