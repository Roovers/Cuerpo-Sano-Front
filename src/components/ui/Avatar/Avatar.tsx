import "./Avatar.css";

interface AvatarProps {
  src?: string;
  alt?: string;
  initials: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Avatar({ src, alt = "", initials, size = "md", className = "" }: AvatarProps) {
  return <div className={`cs-avatar cs-avatar--${size} ${className}`.trim()}>{src ? <img src={src} alt={alt} /> : initials}</div>;
}
