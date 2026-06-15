import "./ToggleSwitch.css";

type ToggleVariant = "success" | "danger" | "warning";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  checkedLabel: string;
  uncheckedLabel: string;
  variantWhenUnchecked?: ToggleVariant;
  disabled?: boolean;
  className?: string;
}

export default function ToggleSwitch({ checked, onChange, checkedLabel, uncheckedLabel, variantWhenUnchecked = "danger", disabled = false, className = "" }: ToggleSwitchProps) {
  const stateClass = checked ? "active" : variantWhenUnchecked;
  return (
    <button type="button" className={`cs-toggle-switch ${stateClass} ${className}`.trim()} onClick={() => onChange(!checked)} aria-pressed={checked} disabled={disabled}>
      <span className="cs-toggle-switch__track"><span className="cs-toggle-switch__thumb" /></span>
      <strong>{checked ? checkedLabel : uncheckedLabel}</strong>
    </button>
  );
}
