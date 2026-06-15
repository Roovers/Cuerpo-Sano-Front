import type { InputHTMLAttributes, ReactNode } from "react";
import { Search } from "lucide-react";
import "./SearchField.css";

interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  icon?: ReactNode;
}

export default function SearchField({ value, onChange, icon, className = "", ...props }: SearchFieldProps) {
  return (
    <div className={`cs-search-field ${className}`.trim()}>
      {icon || <Search size={18} />}
      <input value={value} onChange={(event) => onChange(event.target.value)} {...props} />
    </div>
  );
}
