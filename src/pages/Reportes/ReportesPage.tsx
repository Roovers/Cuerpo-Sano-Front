import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  BarChart3,
  CalendarDays,
  Download,
  Dumbbell,
  FileDown,
  FileText,
  Eye,
  Printer,
  RefreshCcw,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Avatar,
  Button,
  DateRangePicker,
  EmptyState,
  FilterToolbar,
  PageHeader,
  PageTabs,
  SearchField,
  StatCard,
  StatsGrid,
  StatusBadge,
  type PageTabItem,
} from "../../components/ui";
import {
  getReporteAsistenciaClases,
  getReporteAsistenciaSocios,
  type ReporteAsistenciaClaseItem,
  type ReporteAsistenciaSocioItem,
} from "../../services/reportesService";
import { getInitials } from "../../utils/initials";
import { ChartFrame, ReportCard } from "./components/ReportBlocks";
import {
  buildClaseSesiones,
  buildLowAttendance,
  buildPdfHtml,
  buildSocioFrecuencias,
  comparePercent,
  comparisonLabel,
  csvEscape,
  daysAgoInput,
  daysBetweenInclusive,
  formatDate,
  formatNumber,
  formatPercent,
  formatTime,
  getActividad,
  getDni,
  getEntrenador,
  getEstadoClase,
  getFechaClase,
  getMetodoIngreso,
  getFotoUrl,
  getSocioNombre,
  type ClaseSesion,
  groupCount,
  groupDaily,
  isAusente,
  isPresente,
  normalize,
  previousRange,
  startOfMonthInput,
  todayInput,
  type ReportTab,
} from "./reportesDocumentacionUtils";
import "./ReportesPage.css";

const tabs: PageTabItem<ReportTab>[] = [
  {
    value: "gimnasio",
    label: "Asistencia al gimnasio",
    icon: <Users size={16} />,
  },
  {
    value: "clases",
    label: "Asistencia a clases",
    icon: <Dumbbell size={16} />,
  },
];

const presentColor = "#34d399";
const absentColor = "#f59e0b";

export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("gimnasio");
  const [desde, setDesde] = useState(startOfMonthInput());
  const [hasta, setHasta] = useState(todayInput());
  const [buscar, setBuscar] = useState("");
  const [actividadFiltro, setActividadFiltro] = useState("");
  const [entrenadorFiltro, setEntrenadorFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedSesion, setSelectedSesion] = useState<ClaseSesion | null>(null);
  const scrollRestoreRef = useRef<number | null>(null);

  const [asistenciasSocios, setAsistenciasSocios] = useState<ReporteAsistenciaSocioItem[]>([]);
  const [asistenciasClases, setAsistenciasClases] = useState<ReporteAsistenciaClaseItem[]>([]);
  const [prevSocios, setPrevSocios] = useState<ReporteAsistenciaSocioItem[]>([]);
  const [prevClases, setPrevClases] = useState<ReporteAsistenciaClaseItem[]>([]);

  const cargarReportes = async () => {
    try {
      setLoading(true);

      const previous = previousRange(desde, hasta);

      const [
        sociosData,
        clasesData,
        prevSociosData,
        prevClasesData,
      ] = await Promise.all([
        getReporteAsistenciaSocios(desde, hasta),
        getReporteAsistenciaClases(desde, hasta),
        getReporteAsistenciaSocios(previous.desde, previous.hasta),
        getReporteAsistenciaClases(previous.desde, previous.hasta),
      ]);

      setAsistenciasSocios(sociosData.asistencias || []);
      setAsistenciasClases(clasesData.asistencias || []);
      setPrevSocios(prevSociosData.asistencias || []);
      setPrevClases(prevClasesData.asistencias || []);
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron generar los reportes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarReportes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scrollRestoreRef.current === null) return;

    const targetScroll = scrollRestoreRef.current;

    requestAnimationFrame(() => {
      window.scrollTo({ top: targetScroll, behavior: "auto" });

      setTimeout(() => {
        window.scrollTo({ top: targetScroll, behavior: "auto" });
        scrollRestoreRef.current = null;
      }, 0);
    });
  }, [activeTab]);

  const search = normalize(buscar);
  const previous = useMemo(() => previousRange(desde, hasta), [desde, hasta]);
  const diasPeriodo = useMemo(() => daysBetweenInclusive(desde, hasta), [desde, hasta]);


  const actividadOptions = useMemo(() => {
    return Array.from(new Set(asistenciasClases.map(getActividad))).sort((a, b) => a.localeCompare(b));
  }, [asistenciasClases]);

  const entrenadorOptions = useMemo(() => {
    return Array.from(new Set(asistenciasClases.map(getEntrenador))).sort((a, b) => a.localeCompare(b));
  }, [asistenciasClases]);

  const filteredSocios = useMemo(() => {
    return asistenciasSocios.filter((item) => {
      return (
        !search ||
        normalize([
          getSocioNombre(item),
          getDni(item),
          getMetodoIngreso(item),
          item.fechaHora,
        ].join(" ")).includes(search)
      );
    });
  }, [asistenciasSocios, search]);

  const filteredClases = useMemo(() => {
    return asistenciasClases.filter((item) => {
      const byActividad = !actividadFiltro || getActividad(item) === actividadFiltro;
      const byEntrenador = !entrenadorFiltro || getEntrenador(item) === entrenadorFiltro;
      const bySearch =
        !search ||
        normalize([
          getSocioNombre(item),
          getDni(item),
          getActividad(item),
          getEntrenador(item),
          getEstadoClase(item),
          getFechaClase(item),
        ].join(" ")).includes(search);

      return byActividad && byEntrenador && bySearch;
    });
  }, [asistenciasClases, actividadFiltro, entrenadorFiltro, search]);

  const frecuencias = useMemo(() => buildSocioFrecuencias(filteredSocios), [filteredSocios]);
  const lowAttendance = useMemo(() => buildLowAttendance(frecuencias, 1), [frecuencias]);
  const ingresosPorDia = useMemo(() => groupDaily(filteredSocios, (item) => item.fechaHora || ""), [filteredSocios]);
  const prevIngresosPorDia = useMemo(() => groupDaily(prevSocios, (item) => item.fechaHora || ""), [prevSocios]);

  const sesiones = useMemo(() => buildClaseSesiones(filteredClases), [filteredClases]);
  const clasesPopulares = useMemo(() => groupCount(filteredClases, getActividad), [filteredClases]);
  const entrenadoresRanking = useMemo(() => groupCount(filteredClases, getEntrenador), [filteredClases]);

  const presentes = useMemo(() => filteredClases.filter(isPresente).length, [filteredClases]);
  const ausentes = useMemo(() => filteredClases.filter(isAusente).length, [filteredClases]);
  const presentismo = useMemo(() => {
    const total = presentes + ausentes;
    return total ? (presentes / total) * 100 : 0;
  }, [presentes, ausentes]);

  const presentismoPieData = useMemo(() => {
    return [
      { name: "Presentes", value: presentes, color: presentColor },
      { name: "Ausentes", value: ausentes, color: absentColor },
    ].filter((item) => item.value > 0);
  }, [presentes, ausentes]);

  const ocupaciones = useMemo(() => {
    return sesiones
      .map((sesion) => sesion.ocupacion)
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  }, [sesiones]);

  const ocupacionPromedio = useMemo(() => {
    if (ocupaciones.length === 0) return null;
    return ocupaciones.reduce((acc, value) => acc + value, 0) / ocupaciones.length;
  }, [ocupaciones]);

  const prevGymCount = prevSocios.length;
  const gymVariation = comparePercent(filteredSocios.length, prevGymCount);

  const prevClassCount = prevClases.length;
  const classVariation = comparePercent(filteredClases.length, prevClassCount);

  const gymComparisonRows = useMemo(() => {
    const max = Math.max(ingresosPorDia.length, prevIngresosPorDia.length);

    return Array.from({ length: max }).map((_, index) => ({
      name: `Día ${index + 1}`,
      actual: ingresosPorDia[index]?.value || 0,
      anterior: prevIngresosPorDia[index]?.value || 0,
    }));
  }, [ingresosPorDia, prevIngresosPorDia]);

  const limpiarFiltros = () => {
    setBuscar("");
    setActividadFiltro("");
    setEntrenadorFiltro("");
    setDesde(startOfMonthInput());
    setHasta(todayInput());
  };

  const handleTabChange = (tab: ReportTab) => {
    scrollRestoreRef.current = window.scrollY;
    setActiveTab(tab);
  };

  const setPeriodoRapido = (tipo: "hoy" | "7" | "30" | "mes") => {
    if (tipo === "hoy") {
      const today = todayInput();
      setDesde(today);
      setHasta(today);
      return;
    }

    if (tipo === "mes") {
      setDesde(startOfMonthInput());
      setHasta(todayInput());
      return;
    }

    setDesde(daysAgoInput(tipo === "7" ? 6 : 29));
    setHasta(todayInput());
  };

  const activePreset = useMemo(() => {
    const today = todayInput();

    if (desde === today && hasta === today) return "hoy";
    if (desde === daysAgoInput(6) && hasta === today) return "7";
    if (desde === daysAgoInput(29) && hasta === today) return "30";
    if (desde === startOfMonthInput() && hasta === today) return "mes";

    return "";
  }, [desde, hasta]);

  const presetClass = (value: "hoy" | "7" | "30" | "mes") =>
    activePreset === value ? "active" : "";

  const renderReportAvatar = (
    nombre: string,
    fotoUrl?: string,
    size: "sm" | "md" = "md",
  ) => (
    <Avatar
      size={size}
      src={fotoUrl || undefined}
      initials={getInitials(nombre, "", "S")}
      alt={nombre}
    />
  );

  const exportarCsv = () => {
    const rows =
      activeTab === "gimnasio"
        ? frecuencias.map((item) => [
            item.socio,
            item.dni,
            item.visitas,
            formatDate(item.primeraVisita),
            formatDate(item.ultimaVisita),
            item.metodoPrincipal,
            item.fechas.map((fecha) => `${formatDate(fecha)} ${formatTime(fecha)}`).join(" | "),
          ])
        : sesiones.map((sesion) => [
            formatDate(sesion.fecha),
            sesion.actividad,
            sesion.entrenador,
            sesion.horario,
            sesion.presentes,
            sesion.ausentes,
            sesion.ocupacion === null ? "Sin dato" : formatPercent(sesion.ocupacion || 0),
            sesion.miembrosPresentes.map((socio) => socio.nombre).join(" | "),
            sesion.miembrosAusentes.map((socio) => socio.nombre).join(" | "),
          ]);

    const headers =
      activeTab === "gimnasio"
        ? ["Socio", "DNI", "Frecuencia", "Primera visita", "Última visita", "Método principal", "Fechas de ingreso"]
        : ["Fecha", "Clase", "Entrenador", "Horario", "Presentes", "Ausentes", "Ocupación", "Miembros presentes", "Miembros ausentes"];

    const csv = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(";"))
      .join("\n");

    const blob = new Blob([`\ufeff${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `reporte-${activeTab}-${desde}-a-${hasta}.csv`;
    link.click();

    URL.revokeObjectURL(url);
    toast.success("CSV exportado correctamente.");
  };

  const exportarPdf = () => {
    const html = buildPdfHtml({
      desde,
      hasta,
      tab: activeTab,
      frecuencias,
      lowAttendance,
      ingresosPorDia,
      sesiones,
      clasesPopulares,
    });

    try {
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";

      document.body.appendChild(iframe);

      const iframeWindow = iframe.contentWindow;
      const iframeDocument = iframe.contentDocument || iframeWindow?.document;

      if (!iframeWindow || !iframeDocument) {
        throw new Error("No se pudo crear el documento de exportación.");
      }

      iframeDocument.open();
      iframeDocument.write(html);
      iframeDocument.close();

      setTimeout(() => {
        iframeWindow.focus();
        iframeWindow.print();

        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 450);

      toast.success("PDF preparado para imprimir o guardar.");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo preparar el PDF.");
    }
  };

  const renderSesionesConMiembrosCard = (compact = false) => (
    <ReportCard
      kicker="Listado documentado"
      title="Sesiones con miembros presentes y ausentes"
      description="Clase, profesor asignado, fecha, presentes, ausentes y acceso al detalle de la sesión."
      className={compact ? "doc-report-card--sessions-compact" : ""}
    >
      <div className="doc-session-list">
        {sesiones.length === 0 ? (
          <EmptyState
            icon={<Dumbbell size={28} />}
            title="Sin sesiones"
            description="No se encontraron registros de clases para los filtros seleccionados."
          />
        ) : (
          sesiones.slice(0, 12).map((sesion) => (
            <article key={sesion.key} className="doc-session-row">
              {/* Info: fecha, clase, entrenador */}
              <div className="doc-session-row__info">
                <span className="doc-session-row__date">{formatDate(sesion.fecha)} · {sesion.horario}</span>
                <strong className="doc-session-row__title">{sesion.actividad}</strong>
                <span className="doc-session-row__trainer">{sesion.entrenador}</span>
              </div>

              {/* Centro: badges de conteo + avatares apilados */}
              <div className="doc-session-row__avatars">
                <div className="doc-avatar-stack doc-avatar-stack--present">
                  <StatusBadge variant="success" label={`${sesion.presentes} presentes`} />
                  <div className="doc-avatar-row">
                    {sesion.miembrosPresentes.slice(0, 4).map((socio, index) => (
                      <div
                        key={`presente-${socio.socioId}-${socio.nombre}-${index}`}
                        className="doc-avatar-bubble doc-avatar-bubble--present"
                        title={socio.nombre}
                      >
                        {renderReportAvatar(socio.nombre, socio.fotoUrl, "sm")}
                      </div>
                    ))}
                    {sesion.miembrosPresentes.length > 4 && (
                      <div className="doc-avatar-overflow doc-avatar-overflow--present">
                        +{sesion.miembrosPresentes.length - 4}
                      </div>
                    )}
                  </div>
                </div>

                {sesion.miembrosAusentes.length > 0 && (
                  <div className="doc-avatar-stack doc-avatar-stack--absent">
                    <StatusBadge variant="warning" label={`${sesion.ausentes} ausentes`} />
                    <div className="doc-avatar-row">
                      {sesion.miembrosAusentes.slice(0, 4).map((socio, index) => (
                        <div
                          key={`ausente-${socio.socioId}-${socio.nombre}-${index}`}
                          className="doc-avatar-bubble doc-avatar-bubble--absent"
                          title={socio.nombre}
                        >
                          {renderReportAvatar(socio.nombre, socio.fotoUrl, "sm")}
                        </div>
                      ))}
                      {sesion.miembrosAusentes.length > 4 && (
                        <div className="doc-avatar-overflow doc-avatar-overflow--absent">
                          +{sesion.miembrosAusentes.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Acción: Ver detalles */}
              <div className="doc-session-row__action">
                <Button
                  variant="secondary"
                  icon={<Eye size={15} />}
                  onClick={() => setSelectedSesion(sesion)}
                >
                  Ver detalles
                </Button>
              </div>
            </article>
          ))
        )}
      </div>
    </ReportCard>
  );

  return (
    <div className="reportes-documentacion-page">
      <PageHeader
        kicker="Módulo 9 · Generación de reportes"
        title="Reportes"
        description="Generá informes de asistencia al gimnasio y asistencia a clases según la documentación funcional del sistema."
        actions={
          <>
            <Button variant="secondary" icon={<Printer size={16} />} onClick={() => window.print()}>
              Imprimir
            </Button>

            <Button variant="secondary" icon={<FileDown size={16} />} onClick={exportarPdf} disabled={loading}>
              PDF
            </Button>

            <Button variant="secondary" icon={<Download size={16} />} onClick={exportarCsv} disabled={loading}>
              CSV
            </Button>

            <Button variant="primary" icon={<RefreshCcw size={16} />} onClick={cargarReportes} disabled={loading}>
              {loading ? "Generando" : "Generar reporte"}
            </Button>
          </>
        }
      />

      <FilterToolbar
        columns={
          activeTab === "clases"
            ? "minmax(300px, 390px) minmax(240px, 1fr) minmax(170px, 210px) minmax(170px, 210px) auto"
            : "minmax(300px, 390px) minmax(260px, 1fr) auto"
        }
      >
        <DateRangePicker
          from={desde}
          to={hasta}
          onFromChange={setDesde}
          onToChange={setHasta}
          fromLabel="Desde"
          toLabel="Hasta"
          className="report-date-range"
        />

        <SearchField
          value={buscar}
          onChange={setBuscar}
          placeholder={
            activeTab === "clases"
              ? "Buscar socio, DNI, clase o entrenador..."
              : "Buscar socio, DNI o método de ingreso..."
          }
        />

        {activeTab === "clases" && (
          <label className="doc-report-select">
            <span>Actividad</span>
            <select value={actividadFiltro} onChange={(event) => setActividadFiltro(event.target.value)}>
              <option value="">Todas</option>
              {actividadOptions.map((actividad) => (
                <option key={actividad} value={actividad}>
                  {actividad}
                </option>
              ))}
            </select>
          </label>
        )}

        {activeTab === "clases" && (
          <label className="doc-report-select">
            <span>Entrenador</span>
            <select value={entrenadorFiltro} onChange={(event) => setEntrenadorFiltro(event.target.value)}>
              <option value="">Todos</option>
              {entrenadorOptions.map((entrenador) => (
                <option key={entrenador} value={entrenador}>
                  {entrenador}
                </option>
              ))}
            </select>
          </label>
        )}

        <Button variant="secondary" icon={<RefreshCcw size={16} />} onClick={limpiarFiltros}>
          Limpiar
        </Button>
      </FilterToolbar>

      <section className="doc-report-period">
        <div>
          <span className="cs-section-kicker">Período del informe</span>
          <strong>
            {formatDate(desde)} al {formatDate(hasta)}
          </strong>
          <p>
            Comparativa referencial contra {formatDate(previous.desde)} al {formatDate(previous.hasta)}.
          </p>
        </div>

        <div className="doc-report-period__actions">
          <button className={presetClass("hoy")} type="button" onClick={() => setPeriodoRapido("hoy")}>Hoy</button>
          <button className={presetClass("7")} type="button" onClick={() => setPeriodoRapido("7")}>7 días</button>
          <button className={presetClass("30")} type="button" onClick={() => setPeriodoRapido("30")}>30 días</button>
          <button className={presetClass("mes")} type="button" onClick={() => setPeriodoRapido("mes")}>Mes actual</button>
        </div>
      </section>

      <PageTabs value={activeTab} tabs={tabs} onChange={handleTabChange} />

      {activeTab === "gimnasio" && (
        <div className="doc-report-content">
          <StatsGrid columns={4}>
            <StatCard
              featured
              label="Ingresos registrados"
              value={formatNumber(filteredSocios.length)}
              helper={`${comparisonLabel(gymVariation)} vs período anterior`}
              icon={<Users size={20} />}
            />
            <StatCard
              label="Socios con ingreso"
              value={formatNumber(frecuencias.length)}
              helper={`Promedio ${(filteredSocios.length / Math.max(frecuencias.length, 1)).toFixed(1)} visitas por socio`}
              icon={<UserCheck size={20} />}
            />
            <StatCard
              label="Baja presencialidad"
              value={formatNumber(lowAttendance.length)}
              helper="Socios con 1 ingreso o menos en el corte"
              icon={<TrendingUp size={20} />}
            />
            <StatCard
              label="Días evaluados"
              value={formatNumber(diasPeriodo)}
              helper={`${formatNumber(ingresosPorDia.length)} días con movimiento`}
              icon={<CalendarDays size={20} />}
            />
          </StatsGrid>

          <div className="doc-report-grid doc-report-grid--two">
            <ReportCard
              kicker="RF-45"
              title="Evolución de concurrencia"
              description="Permite visualizar el patrón de ingreso al gimnasio dentro del período."
            >
              <ChartFrame empty={gymComparisonRows.length === 0} height={285}>
                <LineChart data={gymComparisonRows}>
                  <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,.55)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,.45)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "rgba(15,23,42,.96)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, color: "white" }}
                    formatter={(value: any) => [formatNumber(Number(value)), "Ingresos"]}
                  />
                  <Line type="monotone" dataKey="actual" name="Actual" stroke="#60a5fa" strokeWidth={2.6} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="anterior" name="Anterior" stroke="#64748b" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartFrame>
            </ReportCard>

            <ReportCard
              kicker="Frecuencia"
              title="Ranking de visitas por socio"
              description="Muestra la frecuencia individual de ingreso al gimnasio."
            >
              <ChartFrame empty={frecuencias.length === 0} height={285}>
                <BarChart data={frecuencias.slice(0, 8)} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid stroke="rgba(255,255,255,.08)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "rgba(255,255,255,.45)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="socio" type="category" width={110} tick={{ fill: "rgba(255,255,255,.62)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "rgba(15,23,42,.96)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, color: "white" }}
                    formatter={(value: any) => [formatNumber(Number(value)), "Visitas"]}
                  />
                  <Bar dataKey="visitas" radius={[0, 10, 10, 0]} fill="#60a5fa" barSize={18} />
                </BarChart>
              </ChartFrame>
            </ReportCard>
          </div>

          <div className="doc-report-grid doc-report-grid--two">
            <ReportCard
              kicker="Seguimiento"
              title="Socios con baja presencialidad"
              description="Detecta socios con baja concurrencia dentro del corte seleccionado."
            >
              <div className="doc-report-list">
                {lowAttendance.length === 0 ? (
                  <EmptyState
                    icon={<UserCheck size={28} />}
                    title="Sin baja presencialidad"
                    description="No se detectaron socios con 1 ingreso o menos en este período."
                  />
                ) : (
                  lowAttendance.slice(0, 8).map((item) => (
                    <article key={item.socioId} className="doc-report-row">
                      <div className="doc-report-member">
                        {renderReportAvatar(item.socio, item.fotoUrl)}
                        <div>
                          <strong>{item.socio}</strong>
                          <span>{item.dni}</span>
                        </div>
                      </div>

                      <div>
                        <strong>{item.visitas} ingreso{item.visitas === 1 ? "" : "s"}</strong>
                        <span>Último: {formatDate(item.ultimaVisita)}</span>
                      </div>

                      <StatusBadge variant="warning" label="Seguimiento" />
                    </article>
                  ))
                )}
              </div>
            </ReportCard>

            <ReportCard
              kicker="Fechas"
              title="Ingresos registrados"
              description="Vista previa de fechas y método de ingreso por socio."
            >
              <div className="doc-report-list">
                {filteredSocios.length === 0 ? (
                  <EmptyState
                    icon={<FileText size={28} />}
                    title="Sin ingresos"
                    description="No se encontraron ingresos para los filtros seleccionados."
                  />
                ) : (
                  filteredSocios.slice(0, 8).map((item) => (
                    <article key={`${item.id}-${item.fechaHora}`} className="doc-report-row">
                      <div className="doc-report-member">
                        {renderReportAvatar(getSocioNombre(item), getFotoUrl(item))}
                        <div>
                          <strong>{getSocioNombre(item)}</strong>
                          <span>{getDni(item)}</span>
                        </div>
                      </div>

                      <div>
                        <strong>{getMetodoIngreso(item)}</strong>
                        <span>{formatDate(item.fechaHora)} · {formatTime(item.fechaHora)}</span>
                      </div>

                      <StatusBadge variant="info" label="Ingreso" />
                    </article>
                  ))
                )}
              </div>
            </ReportCard>
          </div>
        </div>
      )}

      {activeTab === "clases" && (
        <div className="doc-report-content">
          <StatsGrid columns={4}>
            <StatCard
              featured
              label="Registros de clase"
              value={formatNumber(filteredClases.length)}
              helper={`${comparisonLabel(classVariation)} vs período anterior`}
              icon={<Dumbbell size={20} />}
            />
            <StatCard
              label="Presentes"
              value={formatNumber(presentes)}
              helper={`${formatPercent(presentismo)} de presentismo`}
              icon={<UserCheck size={20} />}
            />
            <StatCard
              label="Ausentes"
              value={formatNumber(ausentes)}
              helper="Registros marcados como ausentes"
              icon={<FileText size={20} />}
            />
            {ocupacionPromedio !== null ? (
              <StatCard
                label="Ocupación promedio"
                value={formatPercent(ocupacionPromedio)}
                helper="Asistentes sobre capacidad informada"
                icon={<BarChart3 size={20} />}
              />
            ) : (
              <StatCard
                label="Sesiones reportadas"
                value={formatNumber(sesiones.length)}
                helper="El backend no informa cupo/capacidad"
                icon={<BarChart3 size={20} />}
              />
            )}
          </StatsGrid>

          <div className="doc-report-grid doc-report-grid--two">
            <ReportCard
              kicker="RF-46"
              title="Popularidad por actividad"
              description="Permite evaluar qué clases concentran mayor asistencia."
            >
              <ChartFrame empty={clasesPopulares.length === 0} height={285}>
                <BarChart data={clasesPopulares.slice(0, 8)} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid stroke="rgba(255,255,255,.08)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "rgba(255,255,255,.45)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={110} tick={{ fill: "rgba(255,255,255,.62)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "rgba(15,23,42,.96)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, color: "white" }}
                    formatter={(value: any) => [formatNumber(Number(value)), "Registros"]}
                  />
                  <Bar dataKey="value" radius={[0, 10, 10, 0]} fill="#a78bfa" barSize={18} />
                </BarChart>
              </ChartFrame>
            </ReportCard>

            <ReportCard
              kicker="Presentismo"
              title="Presentes vs ausentes"
              description="Permite revisar cumplimiento de asistencia a clases."
            >
              <ChartFrame empty={filteredClases.length === 0} height={285}>
                <PieChart>
                  <Pie
                    data={presentismoPieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={54}
                    outerRadius={84}
                    paddingAngle={4}
                  >
                    {presentismoPieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "rgba(15,23,42,.96)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, color: "white" }}
                    formatter={(value: any, name: any) => [formatNumber(Number(value)), String(name)]}
                  />
                </PieChart>
              </ChartFrame>

              <div className="doc-chart-legend" aria-label="Referencias del gráfico de presentismo">
                <span className="doc-chart-legend__item doc-chart-legend__item--present">
                  <i /> Presentes · {formatNumber(presentes)}
                </span>
                <span className="doc-chart-legend__item doc-chart-legend__item--absent">
                  <i /> Ausentes · {formatNumber(ausentes)}
                </span>
              </div>
            </ReportCard>
          </div>

          <div className="doc-report-grid doc-report-grid--two">
            <ReportCard
              kicker="Entrenadores"
              title="Asistencia por entrenador"
              description="Muestra la actividad registrada según entrenador asignado."
            >
              <ChartFrame empty={entrenadoresRanking.length === 0} height={285}>
                <BarChart data={entrenadoresRanking.slice(0, 8)}>
                  <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,.55)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,.45)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "rgba(15,23,42,.96)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, color: "white" }}
                    formatter={(value: any) => [formatNumber(Number(value)), "Registros"]}
                  />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#60a5fa" barSize={16} />
                </BarChart>
              </ChartFrame>
            </ReportCard>

            {ocupaciones.length > 0 ? (
              <ReportCard
                kicker="Ocupación"
                title="Ocupación por sesión"
                description="Asistentes sobre capacidad máxima informada."
              >
                <ChartFrame height={270}>
                  <BarChart data={sesiones.filter((item) => item.ocupacion !== null).slice(0, 8)} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid stroke="rgba(255,255,255,.08)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "rgba(255,255,255,.45)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="actividad" type="category" width={110} tick={{ fill: "rgba(255,255,255,.62)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "rgba(15,23,42,.96)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, color: "white" }}
                      formatter={(value: any) => [formatPercent(Number(value)), "Ocupación"]}
                    />
                    <Bar dataKey="ocupacion" radius={[0, 10, 10, 0]} fill="#34d399" barSize={16} />
                  </BarChart>
                </ChartFrame>
              </ReportCard>
            ) : (
              renderSesionesConMiembrosCard(true)
            )}
          </div>

          {ocupaciones.length > 0 && renderSesionesConMiembrosCard()}
        </div>
      )}

      {selectedSesion && (
        <div className="doc-session-modal-backdrop" onClick={() => setSelectedSesion(null)}>
          <section className="doc-session-modal" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="doc-session-modal__close"
              onClick={() => setSelectedSesion(null)}
              aria-label="Cerrar detalle de sesión"
            >
              <X size={18} />
            </button>

            <div className="doc-session-modal__head">
              <span className="cs-section-kicker">Detalle de clase</span>
              <h3>{selectedSesion.actividad}</h3>
              <p>{formatDate(selectedSesion.fecha)} · {selectedSesion.horario}</p>
            </div>

            <div className="doc-session-modal__summary">
              <article>
                <span>Profesor</span>
                <strong>{selectedSesion.entrenador}</strong>
              </article>
              <article className="present">
                <span>Presentes</span>
                <strong>{formatNumber(selectedSesion.presentes)}</strong>
              </article>
              <article className="absent">
                <span>Ausentes</span>
                <strong>{formatNumber(selectedSesion.ausentes)}</strong>
              </article>
            </div>

            <div className="doc-session-modal__table-wrap">
              <table className="doc-session-detail-table">
                <thead>
                  <tr>
                    <th>Socio</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ...selectedSesion.miembrosPresentes.map((socio) => ({ ...socio, estado: "Presente" as const })),
                    ...selectedSesion.miembrosAusentes.map((socio) => ({ ...socio, estado: "Ausente" as const })),
                  ].map((socio, index) => (
                    <tr key={`${socio.estado}-${socio.socioId}-${socio.nombre}-${index}`}>
                      <td>
                        <div className="doc-session-detail-member">
                          {renderReportAvatar(socio.nombre, socio.fotoUrl, "sm")}
                          <span>{socio.nombre}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`doc-session-state doc-session-state--${
                            socio.estado === "Presente" ? "present" : "absent"
                          }`}
                        >
                          <i /> {socio.estado}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {selectedSesion.total === 0 && (
                    <tr>
                      <td colSpan={2}>Sin miembros registrados para esta clase.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}