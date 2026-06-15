import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type InputHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import "./DatePicker.css";

type DatePickerSize = "sm" | "md";

interface DatePickerProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "size"> {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  helperText?: string;
  error?: string;
  placeholder?: string;
  size?: DatePickerSize;
  clearable?: boolean;
  minYear?: number;
  maxYear?: number;
}

const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const weekDays = ["L", "M", "M", "J", "V", "S", "D"];

const pad = (value: number) => String(value).padStart(2, "0");

const toInputDate = (date: Date) => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const parseInputDate = (value?: string) => {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return null;

  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
};

const formatDisplayDate = (value?: string) => {
  const parsed = parseInputDate(value);

  if (!parsed) return "";

  return parsed.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const sameDay = (a: Date, b: Date) => {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

function buildMonthDays(viewDate: Date) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const firstDayIndex = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - firstDayIndex);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return date;
  });
}

function getPopoverPosition(
  anchor: HTMLElement,
  popover: HTMLElement | null,
): CSSProperties {
  const margin = 12;
  const gap = 8;
  const popoverWidth = Math.min(342, window.innerWidth - margin * 2);
  const estimatedHeight = 390;

  const rect = anchor.getBoundingClientRect();
  const measuredHeight = popover?.offsetHeight || estimatedHeight;

  let left = rect.left;
  let top = rect.bottom + gap;

  if (left + popoverWidth > window.innerWidth - margin) {
    left = window.innerWidth - margin - popoverWidth;
  }

  if (left < margin) {
    left = margin;
  }

  const shouldOpenUp = top + measuredHeight > window.innerHeight - margin;

  if (shouldOpenUp) {
    top = rect.top - measuredHeight - gap;
  }

  if (top < margin) {
    top = margin;
  }

  return {
    position: "fixed",
    left,
    top,
    width: popoverWidth,
  };
}

const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      value,
      onChange,
      label,
      helperText,
      error,
      placeholder = "Seleccionar fecha",
      size = "md",
      clearable = true,
      disabled,
      minYear = 1920,
      maxYear = new Date().getFullYear() + 10,
      className = "",
      id,
      name,
      ...inputProps
    },
    ref,
  ) => {
    const parsedValue = useMemo(() => parseInputDate(value), [value]);
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [viewDate, setViewDate] = useState<Date>(() => parsedValue || new Date());
    const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});
    const rootRef = useRef<HTMLDivElement>(null);
    const controlRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const days = useMemo(() => buildMonthDays(viewDate), [viewDate]);

    useEffect(() => {
      setMounted(true);
    }, []);

    useEffect(() => {
      if (parsedValue) {
        setViewDate(parsedValue);
      }
    }, [parsedValue]);

    const updatePosition = () => {
      if (!controlRef.current) return;

      setPopoverStyle(getPopoverPosition(controlRef.current, popoverRef.current));
    };

    useLayoutEffect(() => {
      if (!open) return;

      updatePosition();

      const animationFrame = requestAnimationFrame(updatePosition);

      return () => cancelAnimationFrame(animationFrame);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, viewDate]);

    useEffect(() => {
      if (!open) return;

      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;

        if (
          rootRef.current?.contains(target) ||
          popoverRef.current?.contains(target)
        ) {
          return;
        }

        setOpen(false);
      };

      const handleReposition = () => {
        updatePosition();
      };

      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("resize", handleReposition);
      window.addEventListener("scroll", handleReposition, true);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("resize", handleReposition);
        window.removeEventListener("scroll", handleReposition, true);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const goToPreviousMonth = () => {
      setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
      setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const selectDate = (date: Date) => {
      onChange(toInputDate(date));
      setOpen(false);
    };

    const clearValue = () => {
      onChange("");
      setOpen(false);
    };

    const selectToday = () => {
      selectDate(new Date());
    };

    const years = useMemo(() => {
      const items: number[] = [];

      for (let year = maxYear; year >= minYear; year -= 1) {
        items.push(year);
      }

      return items;
    }, [minYear, maxYear]);

    const rootClasses = [
      "cs-date-picker",
      `cs-date-picker--${size}`,
      error ? "cs-date-picker--error" : "",
      disabled ? "cs-date-picker--disabled" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const popover = (
      <div
        ref={popoverRef}
        className="cs-date-picker__popover"
        style={popoverStyle}
      >
        <div className="cs-date-picker__header">
          <button
            type="button"
            onClick={goToPreviousMonth}
            aria-label="Mes anterior"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="cs-date-picker__selectors">
            <select
              value={viewDate.getMonth()}
              onChange={(event) =>
                setViewDate(
                  new Date(
                    viewDate.getFullYear(),
                    Number(event.target.value),
                    1,
                  ),
                )
              }
            >
              {monthNames.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>

            <select
              value={viewDate.getFullYear()}
              onChange={(event) =>
                setViewDate(
                  new Date(
                    Number(event.target.value),
                    viewDate.getMonth(),
                    1,
                  ),
                )
              }
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={goToNextMonth}
            aria-label="Mes siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="cs-date-picker__weekdays">
          {weekDays.map((day, index) => (
            <span key={`${day}-${index}`}>{day}</span>
          ))}
        </div>

        <div className="cs-date-picker__days">
          {days.map((date) => {
            const selected = parsedValue ? sameDay(date, parsedValue) : false;
            const today = sameDay(date, new Date());
            const outside = date.getMonth() !== viewDate.getMonth();

            return (
              <button
                key={toInputDate(date)}
                type="button"
                className={[
                  selected ? "selected" : "",
                  today ? "today" : "",
                  outside ? "outside" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => selectDate(date)}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>

        <div className="cs-date-picker__footer">
          <button type="button" onClick={selectToday}>
            Hoy
          </button>

          {clearable && (
            <button type="button" onClick={clearValue}>
              Limpiar
            </button>
          )}
        </div>
      </div>
    );

    return (
      <div className={rootClasses} ref={rootRef}>
        {label && (
          <label className="cs-date-picker__label" htmlFor={id}>
            {label}
          </label>
        )}

        <div className="cs-date-picker__control" ref={controlRef}>
          <CalendarDays size={18} />

          <button
            type="button"
            className="cs-date-picker__value"
            onClick={() => !disabled && setOpen((prev) => !prev)}
            disabled={disabled}
          >
            {value ? formatDisplayDate(value) : <span>{placeholder}</span>}
          </button>

          {clearable && value && !disabled && (
            <button
              type="button"
              className="cs-date-picker__clear"
              onClick={clearValue}
              aria-label="Limpiar fecha"
            >
              <X size={15} />
            </button>
          )}

          <input
            {...inputProps}
            ref={ref}
            id={id}
            name={name}
            type="hidden"
            value={value}
            readOnly
          />
        </div>

        {(helperText || error) && (
          <p className="cs-date-picker__message">{error || helperText}</p>
        )}

        {open && mounted ? createPortal(popover, document.body) : null}
      </div>
    );
  },
);

DatePicker.displayName = "DatePicker";

export default DatePicker;
