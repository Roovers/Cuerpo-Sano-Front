import DatePicker from "../DatePicker/DatePicker";
import "./DateRangePicker.css";

interface DateRangePickerProps {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  fromLabel?: string;
  toLabel?: string;
  minYear?: number;
  maxYear?: number;
  className?: string;
}

export default function DateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
  fromLabel = "Desde",
  toLabel = "Hasta",
  minYear,
  maxYear,
  className = "",
}: DateRangePickerProps) {
  return (
    <div className={`cs-date-range-picker ${className}`.trim()}>
      <DatePicker
        value={from}
        onChange={onFromChange}
        label={fromLabel}
        minYear={minYear}
        maxYear={maxYear}
      />

      <DatePicker
        value={to}
        onChange={onToChange}
        label={toLabel}
        minYear={minYear}
        maxYear={maxYear}
      />
    </div>
  );
}