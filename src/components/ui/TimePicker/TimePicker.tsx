import {
  ChevronDown,
  ChevronUp,
  Clock,
  X,
} from "lucide-react";
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type InputHTMLAttributes,
} from "react";
import "./TimePicker.css";

type TimePickerSize = "sm" | "md";
type TimeFormat = "12h" | "24h";

interface TimePickerProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "size"> {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  helperText?: string;
  error?: string;
  placeholder?: string;
  size?: TimePickerSize;
  clearable?: boolean;
  stepMinutes?: number;
  minHour?: number;
  maxHour?: number;
  format?: TimeFormat;
}

const pad = (value: number) => String(value).padStart(2, "0");

const normalizeTime = (value?: string) => {
  if (!value) return "";

  const [hours, minutes] = value.split(":");

  if (!hours || !minutes) return "";

  return `${pad(Number(hours))}:${pad(Number(minutes))}`;
};

const to24Hour = (hour: number, period: "AM" | "PM") => {
  if (period === "AM") return hour === 12 ? 0 : hour;
  return hour === 12 ? 12 : hour + 12;
};

const from24Hour = (hour24: number): { hour: number; period: "AM" | "PM" } => {
  if (hour24 === 0) return { hour: 12, period: "AM" };
  if (hour24 < 12) return { hour: hour24, period: "AM" };
  if (hour24 === 12) return { hour: 12, period: "PM" };
  return { hour: hour24 - 12, period: "PM" };
};

const roundToStep = (minute: number, stepMinutes: number) => {
  const rounded = Math.round(minute / stepMinutes) * stepMinutes;
  return rounded >= 60 ? 0 : rounded;
};

const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(
  (
    {
      value,
      onChange,
      label,
      helperText,
      error,
      placeholder = "Seleccionar hora",
      size = "md",
      clearable = true,
      stepMinutes = 5,
      minHour = 0,
      maxHour = 23,
      format = "12h",
      disabled,
      className = "",
      id,
      name,
      ...inputProps
    },
    ref,
  ) => {
    const normalizedValue = normalizeTime(value);
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    const getInitialState = () => {
      if (normalizedValue) {
        const [h, m] = normalizedValue.split(":").map(Number);

        if (format === "12h") {
          const { hour, period } = from24Hour(h);
          return { hour, minute: m, period };
        }

        return { hour: h, minute: m, period: "AM" as const };
      }

      const now = new Date();
      const currentHour = Math.min(Math.max(now.getHours(), minHour), maxHour);
      const currentMinute = roundToStep(now.getMinutes(), stepMinutes);

      if (format === "12h") {
        const { hour, period } = from24Hour(currentHour);
        return { hour, minute: currentMinute, period };
      }

      return {
        hour: currentHour,
        minute: currentMinute,
        period: "AM" as const,
      };
    };

    const [hour, setHour] = useState(() => getInitialState().hour);
    const [minute, setMinute] = useState(() => getInitialState().minute);
    const [period, setPeriod] = useState<"AM" | "PM">(
      () => getInitialState().period,
    );

    useEffect(() => {
      if (!normalizedValue) return;

      const [h, m] = normalizedValue.split(":").map(Number);

      if (format === "12h") {
        const { hour: h12, period: p } = from24Hour(h);
        setHour(h12);
        setMinute(m);
        setPeriod(p);
      } else {
        setHour(h);
        setMinute(m);
      }
    }, [normalizedValue, format]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (!rootRef.current?.contains(event.target as Node)) {
          setOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);

      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const minVisibleHour = format === "12h" ? 1 : minHour;
    const maxVisibleHour = format === "12h" ? 12 : maxHour;

    const stepHour = (dir: 1 | -1) => {
      setHour((prev) => {
        let next = prev + dir;

        if (next > maxVisibleHour) next = minVisibleHour;
        if (next < minVisibleHour) next = maxVisibleHour;

        return next;
      });
    };

    const stepMinute = (dir: 1 | -1) => {
      setMinute((prev) => {
        let next = prev + dir * stepMinutes;

        if (next >= 60) next = 0;
        if (next < 0) next = 60 - stepMinutes;

        return next;
      });
    };

    const togglePeriod = () => {
      setPeriod((prev) => (prev === "AM" ? "PM" : "AM"));
    };

    const confirm = () => {
      const hour24 = format === "12h" ? to24Hour(hour, period) : hour;
      const limitedHour = Math.min(Math.max(hour24, minHour), maxHour);

      onChange(`${pad(limitedHour)}:${pad(minute)}`);
      setOpen(false);
    };

    const clearValue = () => {
      onChange("");
      setOpen(false);
    };

    const displayValue = normalizedValue
      ? format === "12h"
        ? (() => {
            const [h, m] = normalizedValue.split(":").map(Number);
            const { hour: h12, period: p } = from24Hour(h);

            return `${pad(h12)}:${pad(m)} ${p}`;
          })()
        : normalizedValue
      : null;

    const rootClasses = [
      "cs-time-picker",
      `cs-time-picker--${size}`,
      error ? "cs-time-picker--error" : "",
      disabled ? "cs-time-picker--disabled" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={rootClasses} ref={rootRef}>
        {label && (
          <label className="cs-time-picker__label" htmlFor={id}>
            {label}
          </label>
        )}

        <div className="cs-time-picker__control">
          <Clock size={15} />

          <button
            type="button"
            className="cs-time-picker__value"
            onClick={() => !disabled && setOpen((prev) => !prev)}
            disabled={disabled}
          >
            {displayValue || <span>{placeholder}</span>}
          </button>

          {clearable && normalizedValue && !disabled ? (
            <button
              type="button"
              className="cs-time-picker__clear"
              onClick={clearValue}
              aria-label="Limpiar hora"
            >
              <X size={13} />
            </button>
          ) : (
            <ChevronDown size={14} className="cs-time-picker__chevron" />
          )}

          <input
            {...inputProps}
            ref={ref}
            id={id}
            name={name}
            type="hidden"
            value={normalizedValue}
            readOnly
          />
        </div>

        {(helperText || error) && (
          <p className="cs-time-picker__message">{error || helperText}</p>
        )}

        {open && !disabled && (
          <div className="cs-time-picker__popover">
            <div
              className={
                format === "12h"
                  ? "cs-time-picker__spinner"
                  : "cs-time-picker__spinner cs-time-picker__spinner--24h"
              }
            >
              <div className="cs-time-picker__col">
                <span className="cs-time-picker__col-label">Hora</span>

                <button
                  type="button"
                  className="cs-time-picker__spin-btn"
                  onClick={() => stepHour(1)}
                  aria-label="Aumentar hora"
                >
                  <ChevronUp size={14} />
                </button>

                <div className="cs-time-picker__spin-val">{pad(hour)}</div>

                <button
                  type="button"
                  className="cs-time-picker__spin-btn"
                  onClick={() => stepHour(-1)}
                  aria-label="Disminuir hora"
                >
                  <ChevronDown size={14} />
                </button>
              </div>

              <span className="cs-time-picker__sep">:</span>

              <div className="cs-time-picker__col">
                <span className="cs-time-picker__col-label">Min</span>

                <button
                  type="button"
                  className="cs-time-picker__spin-btn"
                  onClick={() => stepMinute(1)}
                  aria-label="Aumentar minutos"
                >
                  <ChevronUp size={14} />
                </button>

                <div className="cs-time-picker__spin-val">{pad(minute)}</div>

                <button
                  type="button"
                  className="cs-time-picker__spin-btn"
                  onClick={() => stepMinute(-1)}
                  aria-label="Disminuir minutos"
                >
                  <ChevronDown size={14} />
                </button>
              </div>

              {format === "12h" && (
                <>
                  <span className="cs-time-picker__sep cs-time-picker__sep--ghost">
                    :
                  </span>

                  <div className="cs-time-picker__col">
                    <span className="cs-time-picker__col-label">AM/PM</span>

                    <button
                      type="button"
                      className="cs-time-picker__spin-btn"
                      onClick={togglePeriod}
                      aria-label="Cambiar AM/PM"
                    >
                      <ChevronUp size={14} />
                    </button>

                    <div className="cs-time-picker__spin-val cs-time-picker__spin-val--period">
                      {period}
                    </div>

                    <button
                      type="button"
                      className="cs-time-picker__spin-btn"
                      onClick={togglePeriod}
                      aria-label="Cambiar AM/PM"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              className="cs-time-picker__confirm"
              onClick={confirm}
            >
              Confirmar
            </button>
          </div>
        )}
      </div>
    );
  },
);

TimePicker.displayName = "TimePicker";

export default TimePicker;
