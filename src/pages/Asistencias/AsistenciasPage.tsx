import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  XCircle,
  RefreshCcw,
  Search,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { getSocios, type Socio } from "../../services/sociosService";
import { getHorarios, type Horario } from "../../services/horariosService";
import {
  getActividades,
  type Actividad,
} from "../../services/actividadesService";
import {
  getEntrenadores,
  type Entrenador,
} from "../../services/entrenadoresService";
import SocioSelect from "../../components/ui/SocioSelect";
import SocioMultiSelect from "../../components/ui/SocioMultiSelect";
import ClaseHorarioSelect from "../../components/ui/ClaseHorarioSelect";
import { DatePicker, DateRangePicker, PageTabs, type PageTabItem } from "../../components/ui";
import {
  getAsistenciasSocios,
  getMetodosIngreso,
  registrarAsistenciaSocio,
  getAsistenciasClases,
  guardarRegistroAsistenciaClase,
  type AsistenciaClase,
  type EstadoAsistenciaClase,
  type AsistenciaSocio,
  type MetodoIngresoOption,
} from "../../services/asistenciasService";
import {
  eliminarInscripcionClase,
  getInscripcionesClases,
  inscribirSocioAClase,
  type InscripcionClase,
} from "../../services/inscripcionesClasesService";
import "./AsistenciasPage.css";
import { useAuthSession } from "../../auth/AuthSessionContext";

type AttendanceTab = "gimnasio" | "inscripciones" | "clases";

const tabs: PageTabItem<AttendanceTab>[] = [
  {
    value: "gimnasio",
    label: "Ingreso al gimnasio",
    icon: <UserCheck size={16} />,
  },
  {
    value: "inscripciones",
    label: "Inscripciones",
    icon: <CalendarDays size={16} />,
  },
  {
    value: "clases",
    label: "Asistencia a clases",
    icon: <Activity size={16} />,
  },
];

const diasSemana = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const formatearFecha = (fecha: string) => {
  return new Date(fecha).toLocaleDateString("es-AR");
};

const formatearHora = (fecha: string) => {
  return new Date(fecha).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const horaCorta = (hora?: string) => {
  return hora?.substring(0, 5) || "--:--";
};

const fechaActualInput = () => {
  const hoy = new Date();
  const offset = hoy.getTimezoneOffset() * 60000;

  return new Date(hoy.getTime() - offset).toISOString().split("T")[0];
};

const labelMetodoIngreso = (value?: string) => {
  const normalized = (value || "").toLowerCase();

  if (normalized.includes("qr")) return "QR";
  if (normalized.includes("credencial")) return "Credencial";
  if (normalized.includes("manual") || normalized.includes("recepcion") || normalized.includes("recepción")) {
    return "Recepción";
  }

  return value || "Sin método";
};

const esMetodoManual = (value?: string) => {
  return (value || "").toLowerCase().includes("manual");
};

export default function AsistenciasPage() {
  const { hasAction } = useAuthSession();
  const canRegisterGymAttendance = hasAction("asistencias_gimnasio.registrar");
  const canCreateInscription = hasAction("inscripciones.crear");
  const canCancelInscription = hasAction("inscripciones.cancelar");
  const canRegisterClassAttendance = hasAction("asistencias_clases.registrar");
  const availableTabs = useMemo(() => {
    return tabs.filter((tab) => {
      if (tab.value === "gimnasio") return canRegisterGymAttendance;
      if (tab.value === "inscripciones") return canCreateInscription || canCancelInscription;
      if (tab.value === "clases") return canRegisterClassAttendance;
      return true;
    });
  }, [canRegisterGymAttendance, canCreateInscription, canCancelInscription, canRegisterClassAttendance]);

  const [activeTab, setActiveTab] = useState<AttendanceTab>(
    canRegisterGymAttendance ? "gimnasio" : "inscripciones",
  );

  const [socios, setSocios] = useState<Socio[]>([]);
  const [metodos, setMetodos] = useState<MetodoIngresoOption[]>([]);
  const [asistencias, setAsistencias] = useState<AsistenciaSocio[]>([]);
  const [asistenciasClases, setAsistenciasClases] = useState<AsistenciaClase[]>(
    [],
  );

  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [entrenadores, setEntrenadores] = useState<Entrenador[]>([]);
  const [inscripciones, setInscripciones] = useState<InscripcionClase[]>([]);

  const [buscar, setBuscar] = useState("");
  const [socioId, setSocioId] = useState("");
  const [metodoIngreso, setMetodoIngreso] = useState("");
  const [horarioId, setHorarioId] = useState("");
  const [horarioAsistenciaId, setHorarioAsistenciaId] = useState("");
  const [sociosSeleccionadosIds, setSociosSeleccionadosIds] = useState<
    number[]
  >([]);
  const [estadosAsistenciaClase, setEstadosAsistenciaClase] = useState<
    Record<number, EstadoAsistenciaClase>
  >({});
  const [fechaClase, setFechaClase] = useState(fechaActualInput());
  const [desde, setDesde] = useState(fechaActualInput());
  const [hasta, setHasta] = useState(fechaActualInput());

  const [loadingGimnasio, setLoadingGimnasio] = useState(false);
  const [loadingClases, setLoadingClases] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [inscribiendoClase, setInscribiendoClase] = useState(false);
  const [registrandoClase, setRegistrandoClase] = useState(false);
  const [eliminandoInscripcionId, setEliminandoInscripcionId] = useState<
    number | null
  >(null);
  const scrollPositionsRef = useRef<Record<AttendanceTab, number>>({
    gimnasio: 0,
    inscripciones: 0,
    clases: 0,
  });

  const socioSeleccionado = useMemo(() => {
    return socios.find((s) => s.id === Number(socioId));
  }, [socios, socioId]);

  const horarioSeleccionado = useMemo(() => {
    return horarios.find((horario) => horario.id === Number(horarioId));
  }, [horarios, horarioId]);

  const horarioAsistenciaSeleccionado = useMemo(() => {
    return horarios.find(
      (horario) => horario.id === Number(horarioAsistenciaId),
    );
  }, [horarios, horarioAsistenciaId]);

  const sociosSeleccionados = useMemo(() => {
    return sociosSeleccionadosIds
      .map((id) => socios.find((socio) => socio.id === id))
      .filter(Boolean) as Socio[];
  }, [socios, sociosSeleccionadosIds]);

  const inscripcionesHorarioAsistencia = useMemo(() => {
    if (!horarioAsistenciaId) return [];

    return inscripciones.filter((inscripcion) => {
      const horarioInscripcionId =
        inscripcion.horario?.id || inscripcion.horarioId;
      return horarioInscripcionId === Number(horarioAsistenciaId);
    });
  }, [inscripciones, horarioAsistenciaId]);

  const resumenEstadosClase = useMemo(() => {
    return inscripcionesHorarioAsistencia.reduce(
      (acc, inscripcion) => {
        const estado = estadosAsistenciaClase[inscripcion.id] || "Ausente";

        if (estado === "Presente") {
          acc.presentes += 1;
        } else {
          acc.ausentes += 1;
        }

        return acc;
      },
      { presentes: 0, ausentes: 0 },
    );
  }, [estadosAsistenciaClase, inscripcionesHorarioAsistencia]);

  const asistenciasHoy = useMemo(() => {
    const hoy = new Date().toLocaleDateString("es-AR");

    return asistencias.filter(
      (asistencia) =>
        new Date(asistencia.fechaHora).toLocaleDateString("es-AR") === hoy,
    ).length;
  }, [asistencias]);

  const clasesDisponibles = useMemo(() => {
    return horarios.filter((horario) => horario.activo).length;
  }, [horarios]);

  const cargarDatos = async () => {
    try {
      setLoadingGimnasio(true);

      const [sociosData, metodosData, asistenciasData] = await Promise.all([
        getSocios(buscar),
        getMetodosIngreso(),
        getAsistenciasSocios(desde, hasta),
      ]);

      setSocios(sociosData);
      setMetodos(metodosData);
      setAsistencias(asistenciasData);

      if (!metodoIngreso && metodosData.length > 0) {
        const metodoManual =
          metodosData.find((metodo) => esMetodoManual(metodo.nombre)) ||
          metodosData[0];

        setMetodoIngreso(metodoManual.nombre);
      }
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar las asistencias.");
    } finally {
      setLoadingGimnasio(false);
    }
  };

  const cargarDatosClases = async () => {
    try {
      setLoadingClases(true);

      const [
        horariosData,
        actividadesData,
        entrenadoresData,
        asistenciasClasesData,
        inscripcionesData,
      ] = await Promise.all([
        getHorarios(),
        getActividades(true),
        getEntrenadores(),
        getAsistenciasClases(desde, hasta),
        getInscripcionesClases(),
      ]);

      setHorarios(horariosData.filter((h) => h.activo));
      setActividades(actividadesData);
      setEntrenadores(entrenadoresData);
      setAsistenciasClases(asistenciasClasesData);
      setInscripciones(inscripcionesData);
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar los datos de clases.");
    } finally {
      setLoadingClases(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    cargarDatosClases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (availableTabs.length === 0) return;

    if (!availableTabs.some((tab) => tab.value === activeTab)) {
      setActiveTab(availableTabs[0].value);
    }
  }, [availableTabs, activeTab]);

  useEffect(() => {
    if (!horarioAsistenciaId) {
      setEstadosAsistenciaClase({});
      return;
    }

    setEstadosAsistenciaClase((prev) => {
      const next: Record<number, EstadoAsistenciaClase> = {};

      inscripcionesHorarioAsistencia.forEach((inscripcion) => {
        next[inscripcion.id] = prev[inscripcion.id] || "Ausente";
      });

      return next;
    });
  }, [horarioAsistenciaId, inscripcionesHorarioAsistencia]);

  const actualizarVistaActual = async () => {
    if (activeTab === "gimnasio") {
      await cargarDatos();
      return;
    }

    await cargarDatosClases();
  };

  const buscarSocios = async () => {
    await Promise.all([cargarDatos(), cargarDatosClases()]);
  };

  const registrarIngreso = async () => {
    if (!canRegisterGymAttendance) {
      toast.error("No tenés permiso para registrar ingresos al gimnasio.");
      return;
    }

    if (!socioId) {
      toast.error("Seleccioná un socio.");
      return;
    }

    if (!metodoIngreso) {
      toast.error("Seleccioná un método de ingreso.");
      return;
    }

    try {
      setRegistrando(true);

      await registrarAsistenciaSocio({
        socioId: Number(socioId),
        metodoIngreso,
      });

      toast.success("Ingreso registrado correctamente.");
      setSocioId("");
      await cargarDatos();
    } catch (error) {
      console.error(error);
      toast.error(
        "No se pudo registrar el ingreso. Verificá que el socio tenga membresía activa.",
      );
    } finally {
      setRegistrando(false);
    }
  };

  const inscribirClase = async () => {
    if (!canCreateInscription) {
      toast.error("No tenés permiso para inscribir socios a clases.");
      return;
    }

    if (!horarioId) {
      toast.error("Seleccioná una clase/horario.");
      return;
    }

    const sociosParaInscribir =
      sociosSeleccionadosIds.length > 0
        ? sociosSeleccionadosIds
        : socioId
          ? [Number(socioId)]
          : [];

    if (sociosParaInscribir.length === 0) {
      toast.error("Seleccioná al menos un socio para inscribir.");
      return;
    }

    const sociosDuplicados = sociosParaInscribir.filter((id) =>
      inscripciones.some(
        (inscripcion) =>
          (inscripcion.socio?.id || inscripcion.socioId) === id &&
          (inscripcion.horario?.id || inscripcion.horarioId) ===
            Number(horarioId),
      ),
    );

    const sociosValidos = sociosParaInscribir.filter(
      (id) => !sociosDuplicados.includes(id),
    );

    if (sociosValidos.length === 0) {
      toast.error(
        "Todos los socios seleccionados ya están inscriptos a esa clase.",
      );
      return;
    }

    try {
      setInscribiendoClase(true);

      await Promise.all(
        sociosValidos.map((id) =>
          inscribirSocioAClase({
            socioId: id,
            horarioId: Number(horarioId),
          }),
        ),
      );

      if (sociosDuplicados.length > 0) {
        toast.success(
          `${sociosValidos.length} inscripción/es creadas. ${sociosDuplicados.length} socio/s ya estaban inscriptos.`,
        );
      } else {
        toast.success(
          sociosValidos.length === 1
            ? "Socio inscripto a la clase correctamente."
            : `${sociosValidos.length} socios inscriptos a la clase correctamente.`,
        );
      }

      setSocioId("");
      setSociosSeleccionadosIds([]);
      await cargarDatosClases();
    } catch (error) {
      console.error(error);
      toast.error(
        "No se pudo completar la inscripción. Verificá membresía activa, cupo y validaciones de la clase.",
      );
    } finally {
      setInscribiendoClase(false);
    }
  };

  const registrarClase = async () => {
    if (!canRegisterClassAttendance) {
      toast.error("No tenés permiso para registrar asistencia a clases.");
      return;
    }

    if (!horarioAsistenciaId) {
      toast.error("Seleccioná una clase/horario.");
      return;
    }

    if (inscripcionesHorarioAsistencia.length === 0) {
      toast.error("La clase seleccionada no tiene alumnos inscriptos.");
      return;
    }

    try {
      setRegistrandoClase(true);

      await guardarRegistroAsistenciaClase({
        horarioId: Number(horarioAsistenciaId),
        fechaClase,
        registros: inscripcionesHorarioAsistencia.map((inscripcion) => ({
          socioId: inscripcion.socio?.id || inscripcion.socioId,
          estado: estadosAsistenciaClase[inscripcion.id] || "Ausente",
        })),
      });

      toast.success("Asistencia de clase guardada correctamente.");
      await cargarDatosClases();
    } catch (error) {
      console.error(error);

      const status = (error as { response?: { status?: number } }).response
        ?.status;

      if (status === 404 || status === 405) {
        toast.error(
          "El endpoint para guardar presentes y ausentes todavía no está disponible.",
        );
        return;
      }

      toast.error("No se pudo guardar la asistencia de la clase.");
    } finally {
      setRegistrandoClase(false);
    }
  };

  const cambiarEstadoAsistencia = (
    inscripcionIdActual: number,
    estado: EstadoAsistenciaClase,
  ) => {
    setEstadosAsistenciaClase((prev) => ({
      ...prev,
      [inscripcionIdActual]: estado,
    }));
  };

  const borrarInscripcion = async (inscripcion: InscripcionClase) => {
    if (!canCancelInscription) {
      toast.error("No tenés permiso para cancelar inscripciones.");
      return;
    }

    try {
      setEliminandoInscripcionId(inscripcion.id);

      await eliminarInscripcionClase(inscripcion.id);

      toast.success("Inscripción cancelada correctamente.");

      await cargarDatosClases();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo cancelar la inscripción.");
    } finally {
      setEliminandoInscripcionId(null);
    }
  };

  const getSocioById = (id: number) => {
    return socios.find((s) => s.id === id);
  };

  const inicialesSocio = (socio?: Socio) => {
    if (!socio) return "S";
    return `${socio.nombre?.[0] || ""}${socio.apellido?.[0] || ""}` || "S";
  };

  const renderSocioAvatar = (socio?: Socio) => (
    <div className="attendance-avatar">
      {socio?.fotoUrl ? (
        <img src={socio.fotoUrl} alt={`${socio.nombre} ${socio.apellido}`} />
      ) : (
        inicialesSocio(socio)
      )}
    </div>
  );

  const renderMiniStatus = (socio?: Socio) => (
    <span
      className={socio?.activo ? "mini-status active" : "mini-status inactive"}
    >
      {socio?.activo ? "Activo" : "Inactivo"}
    </span>
  );

  const renderSocioInfo = (socio?: Socio, fallbackId?: number) => (
    <div className="attendance-person">
      {renderSocioAvatar(socio)}

      <div>
        <div className="attendance-person-title">
          <strong>
            {socio
              ? `${socio.nombre} ${socio.apellido}`
              : fallbackId
                ? `Socio N.º ${fallbackId}`
                : "Sin socio"}
          </strong>

          {socio && renderMiniStatus(socio)}
        </div>

        <span>
          {socio?.dni
            ? `DNI ${socio.dni}${socio.numeroSocio ? ` · Socio N.º ${socio.numeroSocio}` : ""}`
            : fallbackId
              ? `ID N.º ${fallbackId}`
              : "Sin datos"}
        </span>
      </div>
    </div>
  );

  const renderSummarySocio = () => (
    <div className="summary-person">
      {renderSocioAvatar(socioSeleccionado)}
      <div>
        <strong>
          {socioSeleccionado
            ? `${socioSeleccionado.nombre} ${socioSeleccionado.apellido}`
            : "Sin socio seleccionado"}
        </strong>
        <span>
          {socioSeleccionado?.dni
            ? `DNI ${socioSeleccionado.dni}${socioSeleccionado.numeroSocio ? ` · Socio N.º ${socioSeleccionado.numeroSocio}` : ""}`
            : "Seleccioná un socio para continuar"}
        </span>
      </div>
    </div>
  );

  const socioInscripcion = (
    inscripcion: InscripcionClase,
  ): Socio | undefined => {
    if (inscripcion.socio) {
      const socioCompleto = getSocioById(inscripcion.socio.id);

      if (socioCompleto) return socioCompleto;

      return {
        id: inscripcion.socio.id,
        nombre: inscripcion.socio.nombre,
        apellido: inscripcion.socio.apellido,
        dni: inscripcion.socio.dni || "",
        numeroSocio: "",
        telefono: "",
        email: "",
        fechaNacimiento: "",
        activo: true,
        fotoUrl: "",
      } as Socio;
    }

    return getSocioById(inscripcion.socioId);
  };

  const nombreActividad = (id: number) => {
    const actividad = actividades.find((a) => a.id === id);
    return actividad ? actividad.nombre : `Actividad N.º ${id}`;
  };

  const nombreEntrenador = (id: number) => {
    const entrenador = entrenadores.find((e) => e.id === id);
    return entrenador
      ? `${entrenador.nombre} ${entrenador.apellido}`
      : `Entrenador N.º ${id}`;
  };

  const nombreDia = (id: number) => {
    return diasSemana[id] || `Día ${id}`;
  };

  const nombreHorario = (horario: Horario) => {
    return `${nombreActividad(horario.actividadId)} · ${nombreDia(
      horario.diaSemana,
    )} · ${horaCorta(horario.horaInicio)} a ${horaCorta(
      horario.horaFin,
    )} · ${nombreEntrenador(horario.entrenadorId)}`;
  };

  const nombreHorarioInscripcion = (inscripcion: InscripcionClase) => {
    if (inscripcion.horario) {
      return nombreHorario(inscripcion.horario);
    }

    const horario = horarios.find((h) => h.id === inscripcion.horarioId);

    return horario
      ? nombreHorario(horario)
      : `Horario N.º ${inscripcion.horarioId}`;
  };

  const horarioInscripcion = (inscripcion: InscripcionClase) => {
    if (inscripcion.horario) return inscripcion.horario;
    return horarios.find((h) => h.id === inscripcion.horarioId);
  };

  const renderHorarioCompacto = (horario?: Horario) => {
    if (!horario) return "Sin clase seleccionada";

    return `${nombreActividad(horario.actividadId)} · ${nombreDia(horario.diaSemana)} · ${horaCorta(horario.horaInicio)} - ${horaCorta(horario.horaFin)}`;
  };

  const renderHorarioDetalle = (horario?: Horario) => {
    if (!horario) return "Seleccioná una clase programada.";

    return `Entrenador: ${nombreEntrenador(horario.entrenadorId)}`;
  };

  const onChangeSocio = (value: string) => {
    setSocioId(value);
  };

  const limpiarSocioSeleccionado = () => {
    setSocioId("");
    setHorarioId("");
    setSociosSeleccionadosIds([]);
  };

  const quitarSocioDeSeleccion = (id: number) => {
    setSociosSeleccionadosIds((prev) => prev.filter((socio) => socio !== id));
  };

  const handleTabChange = (tab: AttendanceTab) => {
    const currentScroll = window.scrollY;

    scrollPositionsRef.current[activeTab] = currentScroll;

    setActiveTab(tab);

    const targetScroll = scrollPositionsRef.current[tab] || currentScroll;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({
          top: targetScroll,
          behavior: "auto",
        });
      });
    });
  };

  const loadingActual =
    activeTab === "gimnasio" ? loadingGimnasio : loadingClases;

  return (
    <div className="asistencias-page">
      <div className="asistencias-header">
        <div>
          <span className="section-kicker">Control de acceso</span>
          <h2>Asistencias</h2>
          <p>
            Registrá ingresos al gimnasio, gestioná inscripciones y confirmá
            asistencias a clases programadas.
          </p>
        </div>

        <button onClick={actualizarVistaActual} disabled={loadingActual}>
          <RefreshCcw size={16} />
          Actualizar
        </button>
      </div>

      <section className="attendance-overview">
        <div className="attendance-stat">
          <span>Ingresos al gimnasio</span>
          <strong>{asistencias.length}</strong>
          <p>{asistenciasHoy} registrados hoy</p>
        </div>

        <div className="attendance-stat">
          <span>Inscripciones</span>
          <strong>{inscripciones.length}</strong>
          <p>Socios reservados en clases</p>
        </div>

        <div className="attendance-stat">
          <span>Asistencias a clases</span>
          <strong>{asistenciasClases.length}</strong>
          <p>Registros en clases programadas</p>
        </div>

        <div className="attendance-stat featured">
          <span>Clases activas</span>
          <strong>{clasesDisponibles}</strong>
          <p>Horarios disponibles</p>
        </div>
      </section>

      <PageTabs value={activeTab} tabs={tabs} onChange={handleTabChange} />

      {activeTab === "gimnasio" && canRegisterGymAttendance && (
        <div className="asistencias-layout">
          <section className="attendance-card">
            <div className="attendance-title">
              <UserCheck size={23} />
              <div>
                <h3>Registrar ingreso</h3>
                <p>
                  Validá el acceso general del socio. El backend confirma
                  membresía activa y vigencia.
                </p>
              </div>
            </div>

            <div className="attendance-form">
              <label className="full">
                Buscar socios
                <div className="attendance-search">
                  <Search size={18} />
                  <input
                    value={buscar}
                    onChange={(e) => setBuscar(e.target.value)}
                    placeholder="Buscar por nombre, apellido, DNI o número..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") buscarSocios();
                    }}
                  />
                  <button onClick={buscarSocios}>Buscar</button>
                </div>
              </label>

              <label className="full">
                Socio
                <div className="attendance-select-row">
                  <SocioSelect
                    socios={socios}
                    value={socioId}
                    onChange={onChangeSocio}
                    placeholder="Seleccionar socio"
                  />

                  {socioId && (
                    <button
                      type="button"
                      className="attendance-clear-selection"
                      onClick={limpiarSocioSeleccionado}
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </label>

              <label className="full">
                Método de ingreso
                <select
                  value={metodoIngreso}
                  onChange={(e) => setMetodoIngreso(e.target.value)}
                >
                  {metodos.map((metodo) => (
                    <option key={metodo.id} value={metodo.nombre}>
                      {labelMetodoIngreso(metodo.nombre)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="attendance-summary">
                <span>Resumen de ingreso</span>
                {renderSummarySocio()}
                <p>
                  Ingresa desde:{" "}
                  {metodoIngreso
                    ? labelMetodoIngreso(metodoIngreso)
                    : "Sin método seleccionado"}
                </p>
              </div>
            </div>

            <button
              className="attendance-submit"
              onClick={registrarIngreso}
              disabled={registrando || !canRegisterGymAttendance}
            >
              <CheckCircle2 size={17} />
              {registrando ? "Registrando..." : "Registrar ingreso"}
            </button>
          </section>

          <section className="attendance-list-card">
            <div className="attendance-title">
              <Activity size={23} />
              <div>
                <h3>Ingresos registrados</h3>
                <p>Historial de accesos generales al gimnasio.</p>
              </div>
            </div>

            <div className="attendance-filters attendance-date-range-filters">
              <DateRangePicker
                from={desde}
                to={hasta}
                onFromChange={setDesde}
                onToChange={setHasta}
                className="attendance-date-range"
              />

              <button onClick={cargarDatos}>Filtrar</button>
            </div>

            {loadingGimnasio ? (
              <div className="attendance-empty">
                <Activity size={28} />
                <p>Cargando asistencias...</p>
              </div>
            ) : asistencias.length === 0 ? (
              <div className="attendance-empty">
                <UserCheck size={28} />
                <p>No hay ingresos registrados.</p>
                <span>
                  Cuando registres un ingreso, aparecerá en este historial.
                </span>
              </div>
            ) : (
              <div className="attendance-list">
                {asistencias.map((asistencia) => (
                  <div
                    key={asistencia.id}
                    className="attendance-item class-history-row gym-history-row"
                  >
                    <div className="class-history-member">
                      {renderSocioInfo(
                        getSocioById(asistencia.socioId),
                        asistencia.socioId,
                      )}
                    </div>

                    <div className="class-history-class gym-history-class">
                      <strong>Ingreso al gimnasio</strong>
                      <span>
                        Método: {labelMetodoIngreso(asistencia.metodoIngreso)}
                      </span>
                      <small>Registro N.º {asistencia.id}</small>
                    </div>

                    <div className="class-history-state gym-history-state">
                      <span className="class-attendance-badge present">
                        Acceso registrado
                      </span>

                      <div className="attendance-date">
                        <strong>{formatearFecha(asistencia.fechaHora)}</strong>
                        <span>{formatearHora(asistencia.fechaHora)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === "inscripciones" && (canCreateInscription || canCancelInscription) && (
        <div className="clases-layout">
          <section className="attendance-card">
            <div className="attendance-title">
              <CalendarDays size={23} />
              <div>
                <h3>Inscribir socios a clase</h3>
                <p>
                  Seleccioná una clase y agregá uno o varios socios para
                  reservar cupos en simultáneo.
                </p>
              </div>
            </div>

            <div className="attendance-form">
              <label className="full">
                Buscar socios
                <div className="attendance-search">
                  <Search size={18} />
                  <input
                    value={buscar}
                    onChange={(e) => setBuscar(e.target.value)}
                    placeholder="Buscar por nombre, apellido, DNI o número..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") buscarSocios();
                    }}
                  />
                  <button onClick={buscarSocios}>Buscar</button>
                </div>
              </label>

              <label className="full">
                Socios
                <SocioMultiSelect
                  socios={socios}
                  value={sociosSeleccionadosIds}
                  onChange={(ids) => {
                    setSociosSeleccionadosIds(ids);
                    setSocioId("");
                  }}
                  placeholder="Seleccionar uno o varios socios"
                />
              </label>

              <div className="bulk-panel">
                <div className="bulk-panel-head">
                  <span>Alumnos a inscribir</span>
                  <strong>{sociosSeleccionados.length}</strong>
                </div>

                {sociosSeleccionados.length === 0 ? (
                  <p className="bulk-empty">
                    Seleccioná uno o varios socios desde el selector múltiple.
                  </p>
                ) : (
                  <div className="bulk-list">
                    {sociosSeleccionados.map((socio) => (
                      <div key={socio.id} className="bulk-row">
                        {renderSocioInfo(socio, socio.id)}

                        <button
                          type="button"
                          className="bulk-remove"
                          onClick={() => quitarSocioDeSeleccion(socio.id)}
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="full">
                <ClaseHorarioSelect
                  label="Clase / horario"
                  value={horarioId}
                  horarios={horarios}
                  actividades={actividades}
                  entrenadores={entrenadores}
                  onChange={setHorarioId}
                />
              </div>

              <div className="attendance-summary">
                <span>Resumen de inscripción</span>
                {sociosSeleccionados.length > 0 ? (
                  <strong>
                    {sociosSeleccionados.length} alumno/s seleccionados
                  </strong>
                ) : (
                  renderSummarySocio()
                )}
                <p>{renderHorarioCompacto(horarioSeleccionado)}</p>
                <small>{renderHorarioDetalle(horarioSeleccionado)}</small>
              </div>
            </div>

            <button
              className="attendance-submit"
              onClick={inscribirClase}
              disabled={inscribiendoClase || !canCreateInscription}
            >
              <CheckCircle2 size={17} />
              {inscribiendoClase
                ? "Inscribiendo..."
                : "Inscribir selección a clase"}
            </button>
          </section>

          <section className="attendance-list-card inscripciones-card">
            <div className="attendance-title">
              <Users size={23} />
              <div>
                <h3>Inscripciones a clases</h3>
                <p>Socios con cupo reservado en clases programadas.</p>
              </div>
            </div>

            {loadingClases ? (
              <div className="attendance-empty">
                <CalendarDays size={28} />
                <p>Cargando inscripciones...</p>
              </div>
            ) : inscripciones.length === 0 ? (
              <div className="attendance-empty">
                <Users size={28} />
                <p>No hay inscripciones registradas.</p>
                <span>
                  Cuando inscribas un socio a una clase, aparecerá acá.
                </span>
              </div>
            ) : (
              <div className="attendance-list">
                {inscripciones.map((inscripcion) => {
                  const horario = horarioInscripcion(inscripcion);

                  return (
                    <div
                      key={inscripcion.id}
                      className="attendance-item inscription-item inscription-history-row"
                    >
                      <div className="class-history-member">
                        {renderSocioInfo(
                          socioInscripcion(inscripcion),
                          inscripcion.socioId,
                        )}
                      </div>

                      <div className="class-history-class inscription-history-class">
                        <strong>
                          {horario
                            ? nombreActividad(horario.actividadId)
                            : nombreHorarioInscripcion(inscripcion)}
                        </strong>

                        <span>
                          {horario
                            ? `${nombreDia(horario.diaSemana)} · ${horaCorta(
                                horario.horaInicio,
                              )} - ${horaCorta(horario.horaFin)}`
                            : `Horario N.º ${inscripcion.horarioId}`}
                        </span>

                        <small>
                          {horario
                            ? renderHorarioDetalle(horario)
                            : `Inscripción N.º ${inscripcion.id}`}
                        </small>
                      </div>

                      <div className="class-history-state inscription-history-state">
                        <span
                          className={
                            inscripcion.activa === false
                              ? "class-attendance-badge absent"
                              : "class-attendance-badge present"
                          }
                        >
                          {inscripcion.activa === false
                            ? "Inscripción inactiva"
                            : "Inscripción activa"}
                        </span>

                        {inscripcion.fechaInscripcion && (
                          <div className="attendance-date">
                            <strong>{formatearFecha(inscripcion.fechaInscripcion)}</strong>
                            <span>{formatearHora(inscripcion.fechaInscripcion)}</span>
                          </div>
                        )}

                        <button
                          className="inscription-delete"
                          onClick={() => borrarInscripcion(inscripcion)}
                          disabled={!canCancelInscription || eliminandoInscripcionId === inscripcion.id}
                          title="Cancelar inscripción"
                        >
                          <Trash2 size={16} />
                          {eliminandoInscripcionId === inscripcion.id
                            ? "Cancelando..."
                            : "Cancelar"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === "clases" && canRegisterClassAttendance && (
        <div className="clases-layout">
          <section className="attendance-card">
            <div className="attendance-title">
              <CheckCircle2 size={23} />
              <div>
                <h3>Registrar asistencia a clase</h3>
                <p>
                  Seleccioná una clase y marcá a cada alumno como presente o
                  ausente.
                </p>
              </div>
            </div>

            <div className="attendance-form">
              <label className="full">
                Buscar socios
                <div className="attendance-search">
                  <Search size={18} />
                  <input
                    value={buscar}
                    onChange={(e) => setBuscar(e.target.value)}
                    placeholder="Buscar por nombre, apellido, DNI o número..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") buscarSocios();
                    }}
                  />
                  <button onClick={buscarSocios}>Buscar</button>
                </div>
              </label>

              <div className="full">
                <ClaseHorarioSelect
                  label="Clase / horario"
                  value={horarioAsistenciaId}
                  horarios={horarios}
                  actividades={actividades}
                  entrenadores={entrenadores}
                  onChange={setHorarioAsistenciaId}
                />
              </div>

              <div className="full attendance-date-single">
                <DatePicker
                  label="Fecha de clase"
                  value={fechaClase}
                  onChange={setFechaClase}
                />
              </div>

              <div className="bulk-panel attendance-status-panel">
                <div className="bulk-panel-head">
                  <span>Alumnos inscriptos</span>
                  <strong>{inscripcionesHorarioAsistencia.length}</strong>
                </div>

                {!horarioAsistenciaId ? (
                  <p className="bulk-empty">
                    Seleccioná una clase para ver sus alumnos inscriptos.
                  </p>
                ) : inscripcionesHorarioAsistencia.length === 0 ? (
                  <p className="bulk-empty">
                    Esta clase no tiene alumnos inscriptos todavía.
                  </p>
                ) : (
                  <div className="bulk-list">
                    {inscripcionesHorarioAsistencia.map((inscripcion) => {
                      const estado =
                        estadosAsistenciaClase[inscripcion.id] || "Ausente";

                      return (
                        <div
                          key={inscripcion.id}
                          className={`attendance-status-row ${estado.toLowerCase()}`}
                        >
                          {renderSocioInfo(
                            socioInscripcion(inscripcion),
                            inscripcion.socioId,
                          )}

                          <div className="attendance-status-actions">
                            <button
                              type="button"
                              className={
                                estado === "Presente"
                                  ? "active present"
                                  : "present"
                              }
                              onClick={() =>
                                cambiarEstadoAsistencia(
                                  inscripcion.id,
                                  "Presente",
                                )
                              }
                            >
                              <CheckCircle2 size={15} />
                              Presente
                            </button>

                            <button
                              type="button"
                              className={
                                estado === "Ausente"
                                  ? "active absent"
                                  : "absent"
                              }
                              onClick={() =>
                                cambiarEstadoAsistencia(
                                  inscripcion.id,
                                  "Ausente",
                                )
                              }
                            >
                              <XCircle size={15} />
                              Ausente
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="attendance-summary attendance-status-summary">
                <span>Resumen de asistencia</span>
                <strong>
                  Presentes: {resumenEstadosClase.presentes} · Ausentes:{" "}
                  {resumenEstadosClase.ausentes}
                </strong>
                <p>{renderHorarioCompacto(horarioAsistenciaSeleccionado)}</p>
                <small>
                  {renderHorarioDetalle(horarioAsistenciaSeleccionado)}
                </small>
              </div>
            </div>

            <button
              className="attendance-submit"
              onClick={registrarClase}
              disabled={registrandoClase || !canRegisterClassAttendance}
            >
              <CheckCircle2 size={17} />
              {registrandoClase
                ? "Guardando..."
                : "Guardar asistencia de la clase"}
            </button>
          </section>

          <section className="attendance-list-card clases-history-card">
            <div className="attendance-title">
              <CalendarDays size={23} />
              <div>
                <h3>Asistencias a clases</h3>
                <p>Historial de socios registrados en clases programadas.</p>
              </div>
            </div>

            <div className="attendance-filters attendance-date-range-filters">
              <DateRangePicker
                from={desde}
                to={hasta}
                onFromChange={setDesde}
                onToChange={setHasta}
                className="attendance-date-range"
              />

              <button onClick={cargarDatosClases}>Filtrar</button>
            </div>

            {loadingClases ? (
              <div className="attendance-empty">
                <CalendarDays size={28} />
                <p>Cargando asistencias a clases...</p>
              </div>
            ) : asistenciasClases.length === 0 ? (
              <div className="attendance-empty">
                <Dumbbell size={28} />
                <p>No hay asistencias a clases registradas.</p>
                <span>
                  Cuando confirmes una asistencia a clase, aparecerá acá.
                </span>
              </div>
            ) : (
              <div className="attendance-list">
                {asistenciasClases.map((asistencia) => {
                  const horario = horarios.find(
                    (h) => h.id === asistencia.horarioId,
                  );

                  return (
                    <div
                      key={asistencia.id}
                      className="attendance-item class-history-row"
                    >
                      <div className="class-history-member">
                        {renderSocioInfo(
                          getSocioById(asistencia.socioId),
                          asistencia.socioId,
                        )}
                      </div>

                      <div className="class-history-class">
                        <strong>
                          {horario
                            ? nombreActividad(horario.actividadId)
                            : `Horario N.º ${asistencia.horarioId}`}
                        </strong>

                        <span>
                          {horario
                            ? `${nombreDia(horario.diaSemana)} · ${horaCorta(
                                horario.horaInicio,
                              )} - ${horaCorta(horario.horaFin)}`
                            : "Clase no encontrada"}
                        </span>

                        <small>
                          {horario
                            ? nombreEntrenador(horario.entrenadorId)
                            : "Entrenador no disponible"}
                        </small>
                      </div>

                      <div className="class-history-state">
                        {asistencia.estado && (
                          <span
                            className={
                              asistencia.estado === "Presente"
                                ? "class-attendance-badge present"
                                : "class-attendance-badge absent"
                            }
                          >
                            {asistencia.estado}
                          </span>
                        )}

                        <div className="attendance-date">
                          <strong>{formatearFecha(asistencia.fechaHora)}</strong>
                          <span>{formatearHora(asistencia.fechaHora)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}