import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, UserRound } from "lucide-react";
import type { Socio } from "../../services/sociosService";
import "./SocioSelect.css";

interface Props {
  socios: Socio[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function SocioSelect({
  socios,
  value,
  onChange,
  placeholder = "Seleccionar socio",
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [buscar, setBuscar] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  const socioSeleccionado = useMemo(() => {
    return socios.find((socio) => socio.id === Number(value));
  }, [socios, value]);

  const sociosFiltrados = useMemo(() => {
    const query = buscar.trim().toLowerCase();

    if (!query) return socios;

    return socios.filter((socio) => {
      const texto = `${socio.nombre} ${socio.apellido} ${socio.dni} ${socio.numeroSocio || ""}`.toLowerCase();

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
    <div className="socio-select-avatar">
      {socio.fotoUrl ? (
        <img src={socio.fotoUrl} alt={`${socio.nombre} ${socio.apellido}`} />
      ) : (
        iniciales(socio)
      )}
    </div>
  );

  const seleccionarSocio = (socio: Socio) => {
    onChange(String(socio.id));
    setBuscar("");
    setOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={disabled ? "socio-select disabled" : "socio-select"}
    >
      <button
        type="button"
        className={open ? "socio-select-trigger active" : "socio-select-trigger"}
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev);
        }}
        disabled={disabled}
      >
        {socioSeleccionado ? (
          <div className="socio-select-selected">
            {renderAvatar(socioSeleccionado)}

            <div>
              <div className="socio-select-name-row">
                <strong>
                  {socioSeleccionado.nombre} {socioSeleccionado.apellido}
                </strong>

                <span
                  className={
                    socioSeleccionado.activo
                      ? "socio-select-status active"
                      : "socio-select-status inactive"
                  }
                >
                  {socioSeleccionado.activo ? "Activo" : "Inactivo"}
                </span>
              </div>

              <span>
                DNI {socioSeleccionado.dni}
                {socioSeleccionado.numeroSocio
                  ? ` · ${socioSeleccionado.numeroSocio}`
                  : ""}
              </span>
            </div>
          </div>
        ) : (
          <div className="socio-select-placeholder">
            <div className="socio-select-avatar empty">
              <UserRound size={18} />
            </div>

            <div>
              <strong>{placeholder}</strong>
              <span>Buscar por nombre, DNI o número de socio</span>
            </div>
          </div>
        )}

        <ChevronDown size={18} className={open ? "chevron open" : "chevron"} />
      </button>

      {open && (
        <div className="socio-select-dropdown">
          <div className="socio-select-search">
            <Search size={17} />
            <input
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              placeholder="Buscar socio..."
              autoFocus
            />
          </div>

          <div className="socio-select-options">
            {sociosFiltrados.length === 0 ? (
              <p className="socio-select-empty">No se encontraron socios.</p>
            ) : (
              sociosFiltrados.map((socio) => {
                const selected = String(socio.id) === value;

                return (
                  <button
                    type="button"
                    key={socio.id}
                    className={
                      selected
                        ? "socio-select-option selected"
                        : "socio-select-option"
                    }
                    onClick={() => seleccionarSocio(socio)}
                  >
                    {renderAvatar(socio)}

                    <div className="socio-select-option-info">
                      <div className="socio-select-name-row">
                        <strong>
                          {socio.nombre} {socio.apellido}
                        </strong>

                        <span
                          className={
                            socio.activo
                              ? "socio-select-status active"
                              : "socio-select-status inactive"
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

                    {selected && <Check size={17} className="socio-select-check" />}
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