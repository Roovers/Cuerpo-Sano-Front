import { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import type { EventClickArg, EventInput } from "@fullcalendar/core";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import {
  CalendarDays,
  Clock,
  Dumbbell,
  Edit,
  ListChecks,
  Plus,
  RefreshCcw,
  Trash2,
  UserRoundCheck,
  X,
} from "lucide-react";
import {
  getActividades,
  type Actividad,
} from "../../services/actividadesService";
import {
  getEntrenadores,
  type Entrenador,
} from "../../services/entrenadoresService";
import {
  actualizarHorario,
  crearHorario,
  eliminarHorario,
  getHorarios,
  type Horario,
  type HorarioRequest,
} from "../../services/horariosService";
import {
  Button,
  EmptyState,
  FilterToolbar,
  PageHeader,
  PageTabs,
  StatCard,
  StatsGrid,
  StatusBadge,
  type PageTabItem,
} from "../../components/ui";
import HorarioModal from "./components/HorarioModal";
import "./HorariosPage.css";
import { useAuthSession } from "../../auth/AuthSessionContext";

const diasSemana = [
  { id: 0, nombre: "Domingo", corto: "Dom" },
  { id: 1, nombre: "Lunes", corto: "Lun" },
  { id: 2, nombre: "Martes", corto: "Mar" },
  { id: 3, nombre: "Miércoles", corto: "Mié" },
  { id: 4, nombre: "Jueves", corto: "Jue" },
  { id: 5, nombre: "Viernes", corto: "Vie" },
  { id: 6, nombre: "Sábado", corto: "Sáb" },
];

const diasOperativos = diasSemana.filter((dia) => dia.id !== 0);

const tabs: PageTabItem<"gestion" | "calendario">[] = [
  {
    value: "gestion",
    label: "Gestión de clases",
    icon: <ListChecks size={16} />,
  },
  {
    value: "calendario",
    label: "Calendario",
    icon: <CalendarDays size={16} />,
  },
];

const horaCorta = (hora?: string) => {
  return hora?.substring(0, 5) || "--:--";
};

const sumarUnDia = (fecha?: string) => {
  if (!fecha) return undefined;

  const parsed = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return undefined;

  parsed.setDate(parsed.getDate() + 1);

  return parsed.toISOString().split("T")[0];
};

const obtenerMensajeError = (error: unknown, fallback: string) => {
  const data = (error as any)?.response?.data;

  if (typeof data === "string" && data.trim()) return data;
  if (typeof data?.mensaje === "string" && data.mensaje.trim()) return data.mensaje;
  if (typeof data?.message === "string" && data.message.trim()) return data.message;

  return fallback;
};

export default function HorariosPage() {
  const { hasAction } = useAuthSession();
  const canCreateClases = hasAction("clases.crear");
  const canEditClases = hasAction("clases.editar");
  const canDeactivateClases = hasAction("clases.desactivar");
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [entrenadores, setEntrenadores] = useState<Entrenador[]>([]);

  const [actividadFiltro, setActividadFiltro] = useState("");
  const [entrenadorFiltro, setEntrenadorFiltro] = useState("");
  const [diaFiltro, setDiaFiltro] = useState("");
  const [activeTab, setActiveTab] = useState<"gestion" | "calendario">(
    "gestion",
  );

  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedHorario, setSelectedHorario] = useState<Horario | null>(null);

  const nombreActividad = (id: number) => {
    const actividad = actividades.find((a) => a.id === id);
    return actividad ? actividad.nombre : `Actividad N.º ${id}`;
  };

  const getEntrenador = (id: number) => {
    return entrenadores.find((e) => e.id === id);
  };

  const nombreEntrenador = (id: number) => {
    const entrenador = getEntrenador(id);
    return entrenador
      ? `${entrenador.nombre} ${entrenador.apellido}`
      : `Entrenador N.º ${id}`;
  };

  const fotoEntrenador = (id: number) => {
    const entrenador = getEntrenador(id);
    return entrenador?.fotoUrl || "";
  };

  const inicialesEntrenador = (id: number) => {
    const entrenador = getEntrenador(id);
    if (!entrenador) return "E";

    const nombre = entrenador.nombre?.trim()?.[0] || "";
    const apellido = entrenador.apellido?.trim()?.[0] || "";

    return `${nombre}${apellido}`.toUpperCase() || "E";
  };

  const nombreDia = (id: number) => {
    return diasSemana.find((d) => d.id === id)?.nombre || `Día ${id}`;
  };

  const horariosFiltrados = useMemo(() => {
    return horarios.filter((horario) => {
      const coincideActividad =
        !actividadFiltro || horario.actividadId === Number(actividadFiltro);

      const coincideEntrenador =
        !entrenadorFiltro || horario.entrenadorId === Number(entrenadorFiltro);

      const coincideDia = !diaFiltro || horario.diaSemana === Number(diaFiltro);

      return coincideActividad && coincideEntrenador && coincideDia;
    });
  }, [horarios, actividadFiltro, entrenadorFiltro, diaFiltro]);

  const diasConDomingo = useMemo(() => {
    return horariosFiltrados.some((horario) => horario.diaSemana === 0);
  }, [horariosFiltrados]);

  const diasBoard = useMemo(() => {
    return diasConDomingo ? diasSemana : diasOperativos;
  }, [diasConDomingo]);

  const horariosPorDia = useMemo(() => {
    return diasBoard.map((dia) => ({
      ...dia,
      horarios: horariosFiltrados
        .filter((horario) => horario.diaSemana === dia.id)
        .sort((a, b) => {
          const horaCompare = a.horaInicio.localeCompare(b.horaInicio);
          if (horaCompare !== 0) return horaCompare;

          return nombreActividad(a.actividadId).localeCompare(
            nombreActividad(b.actividadId),
            "es",
          );
        }),
    }));
  }, [diasBoard, horariosFiltrados, actividades]);

  const horariosActivos = useMemo(
    () => horarios.filter((horario) => horario.activo).length,
    [horarios],
  );

  const diasConClases = useMemo(() => {
    return new Set(
      horarios.filter((horario) => horario.activo).map((h) => h.diaSemana),
    ).size;
  }, [horarios]);

  const actividadPrincipal = useMemo(() => {
    if (horarios.length === 0) return "Sin datos";

    const conteo = horarios.reduce<Record<number, number>>((acc, horario) => {
      acc[horario.actividadId] = (acc[horario.actividadId] || 0) + 1;
      return acc;
    }, {});

    const [actividadId] =
      Object.entries(conteo).sort(([, a], [, b]) => b - a)[0] || [];

    return actividadId ? nombreActividad(Number(actividadId)) : "Sin datos";
  }, [horarios, actividades]);

  const calendarEvents = useMemo<EventInput[]>(() => {
    return horariosFiltrados.map((horario) => {
      const actividad = nombreActividad(horario.actividadId);
      const entrenador = nombreEntrenador(horario.entrenadorId);

      return {
        id: String(horario.id),
        title: actividad,
        daysOfWeek: [String(horario.diaSemana)],
        startTime: horario.horaInicio,
        endTime: horario.horaFin,
        startRecur: horario.fechaDesde,
        endRecur: sumarUnDia(horario.fechaHasta),
        extendedProps: {
          horario,
          actividad,
          entrenador,
          activo: horario.activo,
        },
        classNames: horario.activo
          ? ["schedule-calendar-event", "active"]
          : ["schedule-calendar-event", "inactive"],
      };
    });
  }, [horariosFiltrados, actividades, entrenadores]);

  const handleCalendarEventClick = (eventInfo: EventClickArg) => {
    const horario = eventInfo.event.extendedProps.horario as
      | Horario
      | undefined;

    if (horario && canEditClases) {
      abrirEditar(horario);
    }
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [horariosData, actividadesData, entrenadoresData] =
        await Promise.all([
          getHorarios(),
          getActividades(true),
          getEntrenadores(),
        ]);

      setHorarios(horariosData);
      setActividades(actividadesData);
      setEntrenadores(entrenadoresData);
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar las clases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirNuevo = () => {
    if (!canCreateClases) {
      toast.error("No tenés permiso para crear clases.");
      return;
    }

    setSelectedHorario(null);
    setModalOpen(true);
  };

  const abrirEditar = (horario: Horario) => {
    if (!canEditClases) {
      toast.error("No tenés permiso para editar clases.");
      return;
    }

    setSelectedHorario(horario);
    setModalOpen(true);
  };

  const guardarHorario = async (data: HorarioRequest | HorarioRequest[]) => {
    if (selectedHorario && !canEditClases) {
      toast.error("No tenés permiso para editar clases.");
      return;
    }

    if (!selectedHorario && !canCreateClases) {
      toast.error("No tenés permiso para crear clases.");
      return;
    }

    try {
      if (selectedHorario) {
        const payload = Array.isArray(data) ? data[0] : data;

        await actualizarHorario(selectedHorario.id, payload);
        toast.success("Clase actualizada correctamente.");
      } else {
        const payloads = Array.isArray(data) ? data : [data];

        for (const payload of payloads) {
          await crearHorario(payload);
        }

        toast.success(
          payloads.length > 1
            ? `${payloads.length} clases programadas correctamente.`
            : "Clase programada correctamente.",
        );
      }

      await cargarDatos();
    } catch (error) {
      console.error(error);
      toast.error(
        obtenerMensajeError(
          error,
          "No se pudo guardar la clase. Verificá actividad, entrenador, certificación y superposición horaria.",
        ),
      );
    }
  };

  const borrarHorario = async (horario: Horario) => {
    if (!canDeactivateClases) {
      toast.error("No tenés permiso para dar de baja clases.");
      return;
    }

    const resultado = await Swal.fire({
      title: "¿Dar de baja clase?",
      text: `Se dará de baja la clase de ${nombreActividad(
        horario.actividadId,
      )} del día ${nombreDia(horario.diaSemana)}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, dar de baja",
      cancelButtonText: "Cancelar",
      background: "rgba(15, 23, 42, 0.96)",
      color: "#fff",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#334155",
      customClass: {
        popup: "glass-alert",
        confirmButton: "glass-alert-confirm",
        cancelButton: "glass-alert-cancel",
      },
    });

    if (!resultado.isConfirmed) return;

    try {
      await eliminarHorario(horario.id);
      toast.success("Clase dada de baja correctamente.");
      await cargarDatos();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo dar de baja la clase.");
    }
  };

  const limpiarFiltros = () => {
    setActividadFiltro("");
    setEntrenadorFiltro("");
    setDiaFiltro("");
  };

  const hayFiltros = actividadFiltro || entrenadorFiltro || diaFiltro;

  return (
    <div className="horarios-page">
      <PageHeader
        kicker="Programación de clases"
        title="Clases"
        description="Gestioná la programación semanal de clases, entrenadores y franjas horarias disponibles."
        actionLabel="Nueva clase"
        actionIcon={<Plus size={16} />}
        onAction={abrirNuevo}
      />

      <StatsGrid columns={4}>
        <StatCard
          label="Total programadas"
          value={horarios.length}
          helper="Clases por día"
          icon={<CalendarDays size={18} />}
        />

        <StatCard
          label="Clases activas"
          value={horariosActivos}
          helper="Disponibles para asistencia"
          icon={<ListChecks size={18} />}
        />

        <StatCard
          label="Días con clases"
          value={diasConClases}
          helper="Distribución semanal"
          icon={<Clock size={18} />}
        />

        <StatCard
          label="Actividad principal"
          value={actividadPrincipal}
          helper="Con mayor presencia semanal"
          icon={<Dumbbell size={18} />}
          featured
        />
      </StatsGrid>

      <PageTabs value={activeTab} tabs={tabs} onChange={setActiveTab} />

      {activeTab === "gestion" ? (
        <section className="weekly-manager">
          <FilterToolbar columns="minmax(170px, 1fr) minmax(190px, 1fr) 180px auto auto">
            <select
              value={actividadFiltro}
              onChange={(e) => setActividadFiltro(e.target.value)}
            >
              <option value="">Todas las actividades</option>
              {actividades.map((actividad) => (
                <option key={actividad.id} value={actividad.id}>
                  {actividad.nombre}
                </option>
              ))}
            </select>

            <select
              value={entrenadorFiltro}
              onChange={(e) => setEntrenadorFiltro(e.target.value)}
            >
              <option value="">Todos los entrenadores</option>
              {entrenadores.map((entrenador) => (
                <option key={entrenador.id} value={entrenador.id}>
                  {entrenador.nombre} {entrenador.apellido}
                </option>
              ))}
            </select>

            <select
              value={diaFiltro}
              onChange={(e) => setDiaFiltro(e.target.value)}
            >
              <option value="">Todos los días</option>
              {diasSemana.map((dia) => (
                <option key={dia.id} value={dia.id}>
                  {dia.nombre}
                </option>
              ))}
            </select>

            <Button variant="primary" icon={<RefreshCcw size={16} />} onClick={cargarDatos}>
              Actualizar
            </Button>

            <Button
              variant="secondary"
              icon={<X size={16} />}
              onClick={limpiarFiltros}
              disabled={!hayFiltros}
            >
              Limpiar
            </Button>
          </FilterToolbar>

          {loading ? (
            <EmptyState
              icon={<CalendarDays size={30} />}
              description="Cargando clases..."
            />
          ) : horariosFiltrados.length === 0 ? (
            <EmptyState
              icon={<Clock size={30} />}
              title="Sin resultados"
              description="No se encontraron clases con ese criterio."
            />
          ) : (
            <div className="weekly-board-shell">
              <div className="weekly-board-header">
                <div>
                  <span className="cs-section-kicker">Agenda operativa</span>
                  <strong>Tablero semanal de clases</strong>
                </div>

                <p>
                  {horariosFiltrados.length} clases · {horariosActivos} activas
                </p>
              </div>

              <div className="weekly-board-scroll">
                <div
                  className="weekly-board"
                  style={{
                    gridTemplateColumns: `repeat(${diasBoard.length}, minmax(220px, 1fr))`,
                    minWidth: `${diasBoard.length * 230}px`,
                  }}
                >
                  {horariosPorDia.map((dia) => (
                    <section key={dia.id} className="weekly-day-column">
                      <header>
                        <div>
                          <span>{dia.corto}</span>
                          <strong>{dia.nombre}</strong>
                        </div>
                        <em>{dia.horarios.length}</em>
                      </header>

                      <div className="weekly-day-list">
                        {dia.horarios.length === 0 ? (
                          <div className="weekly-empty-slot">
                            Sin clases
                          </div>
                        ) : (
                          dia.horarios.map((horario) => (
                            <article
                              key={horario.id}
                              className={
                                horario.activo
                                  ? "weekly-class-card"
                                  : "weekly-class-card inactive"
                              }
                            >
                              <div className="weekly-class-head">
                                <div className="weekly-trainer-avatar">
                                  {fotoEntrenador(horario.entrenadorId) ? (
                                    <img
                                      src={fotoEntrenador(horario.entrenadorId)}
                                      alt={nombreEntrenador(horario.entrenadorId)}
                                    />
                                  ) : (
                                    <span>{inicialesEntrenador(horario.entrenadorId)}</span>
                                  )}
                                </div>

                                <div className="weekly-class-identity">
                                  <h3>{nombreActividad(horario.actividadId)}</h3>
                                  <div className="weekly-class-trainer">
                                    <UserRoundCheck size={14} />
                                    <span>{nombreEntrenador(horario.entrenadorId)}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="weekly-class-time">
                                <Clock size={14} />
                                <strong>
                                  {horaCorta(horario.horaInicio)} - {horaCorta(horario.horaFin)}
                                </strong>
                              </div>

                              <div className="weekly-class-vigencia">
                                <CalendarDays size={14} />
                                <span>{horario.fechaDesde || "Sin inicio"} al {horario.fechaHasta || "Sin fin"}</span>
                              </div>

                              <div className="weekly-class-bottom">
                                <StatusBadge
                                  variant={horario.activo ? "success" : "danger"}
                                  label={horario.activo ? "Activa" : "Inactiva"}
                                />

                                {(canEditClases || canDeactivateClases) && (
                                  <div className="weekly-class-actions">
                                    {canEditClases && (
                                      <button
                                        type="button"
                                        onClick={() => abrirEditar(horario)}
                                        aria-label="Editar clase"
                                      >
                                        <Edit size={14} />
                                      </button>
                                    )}

                                    {canDeactivateClases && (
                                      <button
                                        type="button"
                                        className="danger"
                                        onClick={() => borrarHorario(horario)}
                                        aria-label="Dar de baja clase"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </article>
                          ))
                        )}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="schedule-calendar-shell">
          <div className="schedule-calendar-summary">
            <div>
              <span className="cs-section-kicker">Agenda semanal</span>
              <strong>Calendario de clases</strong>
            </div>

            <p>
              {horariosFiltrados.length} clases programadas · {horariosActivos}{" "}
              activas
            </p>
          </div>

          <div className="schedule-calendar-card">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              locale={esLocale}
              firstDay={1}
              allDaySlot={false}
              nowIndicator={true}
              height="auto"
              slotMinTime="07:00:00"
              slotMaxTime="22:00:00"
              slotDuration="00:30:00"
              expandRows
              weekends
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              buttonText={{
                today: "Hoy",
                month: "Mes",
                week: "Semana",
                day: "Día",
              }}
              events={calendarEvents}
              eventClick={handleCalendarEventClick}
              dayMaxEvents={3}
              eventDisplay="block"
              eventContent={(eventInfo) => {
                const horario = eventInfo.event.extendedProps.horario as Horario;
                const entrenador = eventInfo.event.extendedProps
                  .entrenador as string;
                const activo = eventInfo.event.extendedProps.activo as boolean;
                const isMonth = eventInfo.view.type === "dayGridMonth";

                return (
                  <div
                    className={
                      isMonth
                        ? "schedule-calendar-event-content calendar-event-month"
                        : "schedule-calendar-event-content calendar-event-premium"
                    }
                  >
                    {isMonth ? (
                      <>
                        <span className="calendar-event-month-time">
                          {eventInfo.timeText}
                        </span>
                        <strong>{eventInfo.event.title}</strong>
                        {!activo && <em>Inactiva</em>}
                      </>
                    ) : (
                      <>
                        <div className="calendar-event-accent" />

                        <div className="calendar-event-main">
                          <div className="calendar-event-avatar">
                            {fotoEntrenador(horario.entrenadorId) ? (
                              <img
                                src={fotoEntrenador(horario.entrenadorId)}
                                alt={entrenador}
                              />
                            ) : (
                              <span>{inicialesEntrenador(horario.entrenadorId)}</span>
                            )}
                          </div>

                          <div className="calendar-event-copy">
                            <strong>{eventInfo.event.title}</strong>
                            <small>{entrenador}</small>
                          </div>
                        </div>

                        <div className="calendar-event-footer">
                          <span>{eventInfo.timeText}</span>
                          {!activo && <em>Inactiva</em>}
                        </div>
                      </>
                    )}
                  </div>
                );
              }}
            />
          </div>
        </section>
      )}

      <HorarioModal
        open={modalOpen}
        horario={selectedHorario}
        actividades={actividades}
        entrenadores={entrenadores}
        onClose={() => setModalOpen(false)}
        onSubmit={guardarHorario}
      />
    </div>
  );
}
