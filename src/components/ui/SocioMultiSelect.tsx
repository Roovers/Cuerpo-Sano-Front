import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, UserRound, X } from "lucide-react";
import type { Socio } from "../../services/sociosService";
import "./SocioMultiSelect.css";

interface Props {
  socios: Socio[];
  value: number[];
  onChange: (value: number[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxSelected?: number;
}

export default function SocioMultiSelect({
  socios,
  value,
  onChange,
  placeholder = "Seleccionar socios",
  disabled = false,
  maxSelected,
}: Props) {
  const [open, setOpen] = useState(false);
  const [buscar, setBuscar] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  const sociosSeleccionados = useMemo(() => {
    return value
      .map((id) => socios.find((socio) => socio.id === id))
      .filter(Boolean) as Socio[];
  }, [socios, value]);

  const sociosFiltrados = useMemo(() => {
    const query = buscar.trim().toLowerCase();

    if (!query) return socios;

    return socios.filter((socio) => {
      const texto = `${socio.nombre} ${socio.apellido} ${socio.dni} ${
        socio.numeroSocio || ""
      }`.toLowerCase();

      return texto.includes(query);
    });
  }, [socios, buscar]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;

      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const iniciales = (socio: Socio) => {
    return `${socio.nombre?.[0] || ""}${socio.apellido?.[0] || ""}` || "S";
  };

  const renderAvatar = (socio: Socio) => (
    <div className="socio-multi-avatar">
      {socio.fotoUrl ? (
        <img src={socio.fotoUrl} alt={`${socio.nombre} ${socio.apellido}`} />
      ) : (
        iniciales(socio)
      )}
    </div>
  );

  const toggleSocio = (socio: Socio) => {
    const selected = value.includes(socio.id);

    if (selected) {
      onChange(value.filter((id) => id !== socio.id));
      return;
    }

    if (maxSelected && value.length >= maxSelected) {
      onChange([...value.slice(1), socio.id]);
      return;
    }

    onChange([...value, socio.id]);
  };

  const quitarSocio = (id: number) => {
    onChange(value.filter((socioId) => socioId !== id));
  };

  const limpiarSeleccion = () => {
    onChange([]);
    setBuscar("");
  };

  return (
    <div
      ref={containerRef}
      className={
        disabled ? "socio-multi-select disabled" : "socio-multi-select"
      }
    >
      <button
        type="button"
        className={open ? "socio-multi-trigger active" : "socio-multi-trigger"}
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev);
        }}
        disabled={disabled}
      >
        {sociosSeleccionados.length > 0 ? (
          <div className="socio-multi-selected-preview">
            <div className="socio-multi-stack">
              {sociosSeleccionados.slice(0, 4).map((socio) => (
                <span key={socio.id}>{renderAvatar(socio)}</span>
              ))}
            </div>

            <div>
              <strong>
                {sociosSeleccionados.length === 1
                  ? `${sociosSeleccionados[0].nombre} ${sociosSeleccionados[0].apellido}`
                  : `${sociosSeleccionados.length} socios seleccionados`}
              </strong>
              <span>
                {sociosSeleccionados.length === 1
                  ? `DNI ${sociosSeleccionados[0].dni}`
                  : "Tocá para agregar o quitar alumnos"}
              </span>
            </div>
          </div>
        ) : (
          <div className="socio-multi-placeholder">
            <div className="socio-multi-avatar empty">
              <UserRound size={18} />
            </div>

            <div>
              <strong>{placeholder}</strong>
              <span>Podés seleccionar uno o varios alumnos</span>
            </div>
          </div>
        )}

        <ChevronDown size={18} className={open ? "chevron open" : "chevron"} />
      </button>

      {sociosSeleccionados.length > 0 && (
        <div className="socio-multi-chips">
          {sociosSeleccionados.map((socio) => (
            <button
              key={socio.id}
              type="button"
              onClick={() => quitarSocio(socio.id)}
            >
              {socio.nombre} {socio.apellido}
              <X size={13} />
            </button>
          ))}

          <button type="button" className="clear" onClick={limpiarSeleccion}>
            Limpiar selección
          </button>
        </div>
      )}

      {open && (
        <div className="socio-multi-dropdown">


          <div className="socio-multi-options">
            {sociosFiltrados.length === 0 ? (
              <p className="socio-multi-empty">No se encontraron socios.</p>
            ) : (
              sociosFiltrados.map((socio) => {
                const selected = value.includes(socio.id);

                return (
                  <button
                    key={socio.id}
                    type="button"
                    className={
                      selected
                        ? "socio-multi-option selected"
                        : "socio-multi-option"
                    }
                    onClick={() => toggleSocio(socio)}
                  >
                    {renderAvatar(socio)}

                    <div className="socio-multi-option-info">
                      <div className="socio-multi-name-row">
                        <strong>
                          {socio.nombre} {socio.apellido}
                        </strong>

                        <span
                          className={
                            socio.activo
                              ? "socio-multi-status active"
                              : "socio-multi-status inactive"
                          }
                        >
                          {socio.activo ? "Activo" : "Inactivo"}
                        </span>
                      </div>

                      <span>
                        DNI {socio.dni}
                        {socio.numeroSocio ? ` · ${socio.numeroSocio}` : ""}
                      </span>
                    </div>

                    <span className="socio-multi-check">
                      {selected && <Check size={16} />}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}