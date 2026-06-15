import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import {
  BadgeCheck,
  CalendarDays,
  Clock,
  Dumbbell,
  UserRoundCheck,
  X,
} from "lucide-react";
import type { Actividad } from "../../../services/actividadesService";
import type { Entrenador } from "../../../services/entrenadoresService";
import type { Horario, HorarioRequest } from "../../../services/horariosService";
import {
  Button,
  DateRangePicker,
  StatusBadge,
} from "../../../components/ui";
import "./HorarioModal.css";
import { TimePicker } from "../../../components/ui";

interface Props {
  open: boolean;
  horario?: Horario | null;
  actividades: Actividad[];
  entrenadores: Entrenador[];
  onClose: () => void;
  onSubmit: (data: HorarioRequest | HorarioRequest[]) => Promise<void>;
}

const fechaActualInput = () => {
  const hoy = new Date();
  const offset = hoy.getTimezoneOffset() * 60000;

  return new Date(hoy.getTime() - offset).toISOString().split("T")[0];
};

const fechaMasDiasInput = (dias: number) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  const offset = fecha.getTimezoneOffset() * 60000;

  return new Date(fecha.getTime() - offset).toISOString().split("T")[0];
};

const diasSemana = [
  { id: 1, nombre: "Lunes", corto: "Lun" },
  { id: 2, nombre: "Martes", corto: "Mar" },
  { id: 3, nombre: "Miércoles", corto: "Mié" },
  { id: 4, nombre: "Jueves", corto: "Jue" },
  { id: 5, nombre: "Viernes", corto: "Vie" },
  { id: 6, nombre: "Sábado", corto: "Sáb" },
];

const initialForm: HorarioRequest = {
  diaSemana: 1,
  horaInicio: "09:00:00",
  horaFin: "10:00:00",
  fechaDesde: fechaActualInput(),
  fechaHasta: fechaMasDiasInput(90),
  actividadId: 0,
  entrenadorId: 0,
  activo: true,
};

const horaCorta = (hora?: string) => {
  return hora?.substring(0, 5) || "--:--";
};

export default function HorarioModal({
  open,
  horario,
  actividades,
  entrenadores,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<HorarioRequest>(initialForm);
  const [diasSeleccionados, setDiasSeleccionados] = useState<number[]>([1]);
  const [loading, setLoading] = useState(false);

  const editando = Boolean(horario);

  const actividadSeleccionada = useMemo(() => {
    return actividades.find((actividad) => actividad.id === Number(form.actividadId));
  }, [actividades, form.actividadId]);

  const entrenadoresCompatibles = useMemo(() => {
    if (!form.actividadId) return [];

    return entrenadores.filter((entrenador) => {
      return (
        entrenador.activo &&
        entrenador.certificado &&
        Number(entrenador.especialidadId) === Number(form.actividadId)
      );
    });
  }, [entrenadores, form.actividadId]);

  const entrenadorSeleccionado = useMemo(() => {
    return entrenadores.find((entrenador) => entrenador.id === Number(form.entrenadorId));
  }, [entrenadores, form.entrenadorId]);

  const nombreDia = useMemo(() => {
    if (!editando && diasSeleccionados.length > 1) {
      return `${diasSeleccionados.length} días seleccionados`;
    }

    const dia = editando ? form.diaSemana : diasSeleccionados[0];
    return diasSemana.find((item) => item.id === Number(dia))?.nombre || "Día";
  }, [editando, diasSeleccionados, form.diaSemana]);

  const nombreEntrenador = useMemo(() => {
    return entrenadorSeleccionado
      ? `${entrenadorSeleccionado.nombre} ${entrenadorSeleccionado.apellido}`
      : "Entrenador no seleccionado";
  }, [entrenadorSeleccionado]);

  const entrenadorDisponible = Boolean(
    entrenadorSeleccionado?.activo &&
      entrenadorSeleccionado?.certificado &&
      Number(entrenadorSeleccionado?.especialidadId) === Number(form.actividadId)
  );

  useEffect(() => {
    if (horario) {
      setForm({
        diaSemana: horario.diaSemana,
        horaInicio: horario.horaInicio?.substring(0, 8) || "09:00:00",
        horaFin: horario.horaFin?.substring(0, 8) || "10:00:00",
        fechaDesde: horario.fechaDesde || fechaActualInput(),
        fechaHasta: horario.fechaHasta || fechaMasDiasInput(90),
        actividadId: horario.actividadId,
        entrenadorId: horario.entrenadorId,
        activo: horario.activo,
      });
      setDiasSeleccionados([horario.diaSemana || 1]);
    } else {
      setForm(initialForm);
      setDiasSeleccionados([1]);
    }
  }, [horario, open]);

  useEffect(() => {
    if (!form.entrenadorId || !form.actividadId) return;

    const sigueSiendoCompatible = entrenadoresCompatibles.some(
      (entrenador) => entrenador.id === Number(form.entrenadorId),
    );

    if (!sigueSiendoCompatible) {
      setForm((prev) => ({
        ...prev,
        entrenadorId: 0,
      }));
    }
  }, [form.actividadId, form.entrenadorId, entrenadoresCompatibles]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const toggleDia = (diaId: number) => {
    if (editando) {
      setDiasSeleccionados([diaId]);
      setForm((prev) => ({
        ...prev,
        diaSemana: diaId,
      }));
      return;
    }

    setDiasSeleccionados((prev) => {
      if (prev.includes(diaId)) {
        const restantes = prev.filter((item) => item !== diaId);
        return restantes.length > 0 ? restantes : prev;
      }

      return [...prev, diaId].sort((a, b) => a - b);
    });
  };

  const seleccionarTodosLosDias = () => {
    setDiasSeleccionados(diasSemana.map((dia) => dia.id));
  };

  const limpiarDias = () => {
    setDiasSeleccionados([1]);
  };

  const handleActividadChange = (actividadId: number) => {
    setForm((prev) => ({
      ...prev,
      actividadId,
      entrenadorId: 0,
    }));
  };

  const handleSubmit = async () => {
    if (!editando && diasSeleccionados.length === 0) {
      toast.error("Seleccioná al menos un día de clase.");
      return;
    }

    if (editando && (form.diaSemana === undefined || form.diaSemana === null)) {
      toast.error("Seleccioná el día de la clase.");
      return;
    }

    if (!form.actividadId) {
      toast.error("Seleccioná una actividad.");
      return;
    }

    if (entrenadoresCompatibles.length === 0) {
      toast.error("No hay entrenadores activos y certificados compatibles con esta actividad.");
      return;
    }

    if (!form.entrenadorId) {
      toast.error("Seleccioná un entrenador compatible con la actividad.");
      return;
    }

    if (!form.horaInicio || !form.horaFin) {
      toast.error("Completá la hora de inicio y fin.");
      return;
    }

    if (!form.fechaDesde || !form.fechaHasta) {
      toast.error("Completá la fecha desde y fecha hasta.");
      return;
    }

    if (form.fechaHasta < form.fechaDesde) {
      toast.error("La fecha hasta no puede ser menor a la fecha desde.");
      return;
    }

    if (form.horaInicio >= form.horaFin) {
      toast.error("La hora de inicio debe ser anterior a la hora de fin.");
      return;
    }

    if (!entrenadorDisponible) {
      toast.error("El entrenador seleccionado no es compatible con la actividad.");
      return;
    }

    const basePayload = {
      ...form,
      actividadId: Number(form.actividadId),
      entrenadorId: Number(form.entrenadorId),
      horaInicio: form.horaInicio.substring(0, 8),
      horaFin: form.horaFin.substring(0, 8),
      fechaDesde: form.fechaDesde,
      fechaHasta: form.fechaHasta,
      activo: Boolean(form.activo),
    };

    const payload: HorarioRequest | HorarioRequest[] = editando
      ? {
          ...basePayload,
          diaSemana: Number(form.diaSemana),
        }
      : diasSeleccionados.map((diaSemana) => ({
          ...basePayload,
          diaSemana,
        }));

    try {
      setLoading(true);
      await onSubmit(payload);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="horario-modal-portal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="horario-modal horario-modal-portal-card"
        role="dialog"
        aria-modal="true"
        aria-label={horario ? "Editar clase" : "Nueva clase"}
        onClick={(event) => event.stopPropagation()}
      >
        <button onClick={onClose} className="horario-modal-close" aria-label="Cerrar">
          <X size={20} />
        </button>

        <div className="modal-header horario-modal-header">
          <div>
            <span>{horario ? "Editar clase" : "Nueva clase"}</span>
            <h3>{horario ? "Modificar clase" : "Programar clase"}</h3>
            <p>
              Definí el día, horario, actividad y entrenador responsable para la agenda semanal.
            </p>
          </div>
        </div>

        <div className="schedule-modal-layout">
          <div className="modal-grid schedule-form-grid">
            <div className="schedule-days-field full">
              <div className="schedule-days-header">
                <span>{editando ? "Día de la clase" : "Días de la clase"}</span>

                {!editando && (
                  <div className="schedule-days-actions">
                    <button type="button" onClick={seleccionarTodosLosDias}>
                      Todos
                    </button>
                    <button type="button" onClick={limpiarDias}>
                      Limpiar
                    </button>
                  </div>
                )}
              </div>

              <div className="schedule-days-grid">
                {diasSemana.map((dia) => {
                  const active = editando
                    ? Number(form.diaSemana) === dia.id
                    : diasSeleccionados.includes(dia.id);

                  return (
                    <button
                      key={dia.id}
                      type="button"
                      className={active ? "schedule-day-chip active" : "schedule-day-chip"}
                      onClick={() => toggleDia(dia.id)}
                    >
                      <strong>{dia.corto}</strong>
                      <span>{dia.nombre}</span>
                    </button>
                  );
                })}
              </div>

              {!editando && (
                <p>
                  Se creará una clase independiente por cada día seleccionado, sin modificar el backend actual.
                </p>
              )}
            </div>

            <div className="schedule-compact-row">
              <label>
                Hora inicio
                <TimePicker
                  value={form.horaInicio.substring(0, 5)}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      horaInicio: `${value}:00`,
                    }))
                  }
                  minHour={6}
                  maxHour={23}
                  stepMinutes={15}
                  format="12h"
                />
              </label>

              <label>
                Hora fin
                <TimePicker
                  value={form.horaFin.substring(0, 5)}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      horaFin: `${value}:00`,
                    }))
                  }
                  minHour={6}
                  maxHour={23}
                  stepMinutes={15}
                  format="12h"
                />
              </label>
            </div>

            <div className="full">
              <DateRangePicker
                from={form.fechaDesde}
                to={form.fechaHasta}
                onFromChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    fechaDesde: value,
                  }))
                }
                onToChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    fechaHasta: value,
                  }))
                }
                fromLabel="Fecha desde"
                toLabel="Fecha hasta"
                minYear={2024}
                maxYear={new Date().getFullYear() + 2}
              />
            </div>

            <label className="full">
              Actividad
              <select
                value={form.actividadId}
                onChange={(e) => handleActividadChange(Number(e.target.value))}
              >
                <option value={0}>Seleccionar actividad</option>
                {actividades.map((actividad) => (
                  <option key={actividad.id} value={actividad.id}>
                    {actividad.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="full">
              Entrenador compatible
              <select
                value={form.entrenadorId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    entrenadorId: Number(e.target.value),
                  }))
                }
                disabled={!form.actividadId || entrenadoresCompatibles.length === 0}
              >
                <option value={0}>
                  {!form.actividadId
                    ? "Primero seleccioná una actividad"
                    : entrenadoresCompatibles.length === 0
                      ? "No hay entrenadores compatibles"
                      : "Seleccionar entrenador compatible"}
                </option>

                {entrenadoresCompatibles.map((entrenador) => (
                  <option key={entrenador.id} value={entrenador.id}>
                    {entrenador.nombre} {entrenador.apellido}
                  </option>
                ))}
              </select>
            </label>

            {form.actividadId > 0 && entrenadoresCompatibles.length === 0 && (
              <div className="schedule-warning full">
                No hay entrenadores activos, certificados y compatibles con la actividad seleccionada.
              </div>
            )}
          </div>

          <aside className="schedule-preview">
            <div className="schedule-preview-top">
              <div className="schedule-preview-icon">
                <CalendarDays size={26} />
              </div>

              <StatusBadge
                variant={form.activo ? "success" : "danger"}
                label={form.activo ? "Activo" : "Inactivo"}
              />
            </div>

            <span className="preview-day">{nombreDia}</span>

            <h4>
              {actividadSeleccionada?.nombre || "Actividad no seleccionada"}
            </h4>

            <div className="preview-time">
              <Clock size={20} />
              <strong>
                {horaCorta(form.horaInicio)} - {horaCorta(form.horaFin)}
              </strong>
            </div>

            <div className="preview-details">
              <div>
                <CalendarDays size={16} />
                <span>{form.fechaDesde} al {form.fechaHasta}</span>
              </div>

              <div>
                <Dumbbell size={16} />
                <span>{actividadSeleccionada?.nombre || "Sin actividad"}</span>
              </div>

              <div>
                <UserRoundCheck size={16} />
                <span>{nombreEntrenador}</span>
              </div>
            </div>

            <div
              className={
                entrenadorDisponible
                  ? "preview-trainer-check"
                  : "preview-trainer-check warning"
              }
            >
              <BadgeCheck size={16} />
              <span>
                {entrenadorDisponible
                  ? "Entrenador activo, certificado y compatible."
                  : "Seleccioná una actividad y un entrenador compatible."}
              </span>
            </div>
          </aside>
        </div>

        <div className="modal-actions horario-modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>

          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading
              ? "Guardando..."
              : horario
                ? "Guardar cambios"
                : diasSeleccionados.length > 1
                  ? `Crear ${diasSeleccionados.length} clases`
                  : "Crear clase"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
