import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Search } from "lucide-react";
import type { Actividad } from "../../services/actividadesService";
import type { Entrenador } from "../../services/entrenadoresService";
import type { Horario } from "../../services/horariosService";
import "./ClaseHorarioSelect.css";

interface Props {
  label: string;
  value: string;
  horarios: Horario[];
  actividades: Actividad[];
  entrenadores: Entrenador[];
  onChange: (value: string) => void;
  placeholder?: string;
}

const diasSemana = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const horaCorta = (hora?: string) => {
  return hora?.substring(0, 5) || "--:--";
};

export default function ClaseHorarioSelect({
  label,
  value,
  horarios,
  actividades,
  entrenadores,
  onChange,
  placeholder = "Seleccionar clase",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selectedHorario = useMemo(() => {
    return horarios.find((horario) => horario.id === Number(value));
  }, [horarios, value]);

  const nombreActividad = (id: number) => {
    return actividades.find((actividad) => actividad.id === id)?.nombre || `Clase N.º ${id}`;
  };

  const getEntrenador = (id: number) => {
    return entrenadores.find((entrenador) => entrenador.id === id);
  };

  const nombreEntrenador = (id: number) => {
    const entrenador = getEntrenador(id);
    return entrenador
      ? `${entrenador.nombre} ${entrenador.apellido}`
      : `Profesor N.º ${id}`;
  };

  const fotoEntrenador = (id: number) => {
    const entrenador = getEntrenador(id) as (Entrenador & { fotoUrl?: string }) | undefined;
    return entrenador?.fotoUrl || "";
  };

  const inicialesEntrenador = (id: number) => {
    const entrenador = getEntrenador(id);
    if (!entrenador) return "PR";

    const nombre = entrenador.nombre?.trim()?.[0] || "";
    const apellido = entrenador.apellido?.trim()?.[0] || "";

    return `${nombre}${apellido}`.toUpperCase() || "PR";
  };

  const nombreDia = (id: number) => {
    return diasSemana[id] || `Día ${id}`;
  };

  const horariosOrdenados = useMemo(() => {
    return [...horarios].sort((a, b) => {
      if (a.activo !== b.activo) return a.activo ? -1 : 1;

      const diaCompare = a.diaSemana - b.diaSemana;
      if (diaCompare !== 0) return diaCompare;

      return a.horaInicio.localeCompare(b.horaInicio);
    });
  }, [horarios]);

  const filteredHorarios = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return horariosOrdenados;

    return horariosOrdenados.filter((horario) => {
      const searchable = [
        nombreActividad(horario.actividadId),
        nombreEntrenador(horario.entrenadorId),
        nombreDia(horario.diaSemana),
        horaCorta(horario.horaInicio),
        horaCorta(horario.horaFin),
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [horariosOrdenados, query, actividades, entrenadores]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;

      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const renderTrainerAvatar = (horario: Horario) => {
    const foto = fotoEntrenador(horario.entrenadorId);
    const profesor = nombreEntrenador(horario.entrenadorId);

    return (
      <div className="class-hour-avatar">
        {foto ? <img src={foto} alt={profesor} /> : <span>{inicialesEntrenador(horario.entrenadorId)}</span>}
      </div>
    );
  };

  const renderContent = (horario: Horario) => (
    <div className="class-hour-content">
      {renderTrainerAvatar(horario)}

      <div className="class-hour-copy">
        <strong>
          {nombreActividad(horario.actividadId)} - {nombreDia(horario.diaSemana)} ·{" "}
          {horaCorta(horario.horaInicio)} - {horaCorta(horario.horaFin)}
        </strong>
        <span>{nombreEntrenador(horario.entrenadorId)}</span>
      </div>
    </div>
  );

  return (
    <div className="class-hour-select" ref={rootRef}>
      <span className="class-hour-label">{label}</span>

      <button
        type="button"
        className={selectedHorario ? "class-hour-trigger has-value" : "class-hour-trigger"}
        onClick={() => setOpen((prev) => !prev)}
      >
        {selectedHorario ? (
          renderContent(selectedHorario)
        ) : (
          <div className="class-hour-placeholder">
            <div className="class-hour-avatar empty">
              <CalendarDays size={18} />
            </div>

            <div className="class-hour-copy">
              <strong>{placeholder}</strong>
              <span>Buscá por clase, día, profesor u horario</span>
            </div>
          </div>
        )}
      </button>

      {open && (
        <div className="class-hour-panel">
          <div className="class-hour-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar clase, día, profesor u horario..."
              autoFocus
            />
          </div>

          <div className="class-hour-options">
            {filteredHorarios.length === 0 ? (
              <div className="class-hour-empty">
                No se encontraron clases con ese criterio.
              </div>
            ) : (
              filteredHorarios.map((horario) => (
                <button
                  key={horario.id}
                  type="button"
                  className={
                    Number(value) === horario.id
                      ? "class-hour-option active"
                      : "class-hour-option"
                  }
                  onClick={() => {
                    onChange(String(horario.id));
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  {renderContent(horario)}

                  <span className={horario.activo ? "class-hour-status active" : "class-hour-status inactive"}>
                    {horario.activo ? "Activa" : "Inactiva"}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
