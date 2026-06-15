import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Activity,
  ArrowRight,
  BellRing,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Dumbbell,
  Mail,
  MessageCircle,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserPlus,
  UsersRound,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  emptyDashboardResumen,
  getDashboardActividadReciente,
  getDashboardGraficos,
  getDashboardMembresiasPorVencer,
  getDashboardResumen,
  type DashboardActividadReciente,
  type DashboardGraficoItem,
  type DashboardGraficos,
  type DashboardMembresiaPorVencer,
  type DashboardResumen,
  type DashboardVencimientosResponse,
} from "../../services/dashboardService";
import { DateRangePicker } from "../../components/ui";
import "./DashboardPage.css";
import { useAuthSession } from "../../auth/AuthSessionContext";

type DashboardTab = "general" | "finanzas" | "asistencias" | "membresias";

type ChartData = {
  label: string;
  value: number;
  raw?: DashboardGraficoItem;
};

const todayInput = () => new Date().toISOString().split("T")[0];

const daysAgoInput = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
};

const money = (value?: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value || 0);

const number = (value?: number) => new Intl.NumberFormat("es-AR").format(value || 0);

const formatDate = (date?: string) => {
  if (!date) return "Sin fecha";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Sin fecha";

  return parsed.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (date?: string) => {
  if (!date) return "Sin fecha";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Sin fecha";

  return parsed.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getChartValue = (item: DashboardGraficoItem) =>
  Number(item.total ?? item.cantidad ?? item.monto ?? item.valor ?? 0);

const getChartLabel = (item: DashboardGraficoItem) => {
  const raw = item.fecha || item.dia || item.actividad || item.estado || item.nombre || "Dato";

  if (typeof raw === "string" && raw.includes("T")) {
    return new Date(raw).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
    });
  }

  if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return new Date(`${raw}T00:00:00`).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
    });
  }

  return String(raw);
};

const toChartData = (data: DashboardGraficoItem[]): ChartData[] =>
  data.map((item) => ({
    label: getChartLabel(item),
    value: getChartValue(item),
    raw: item,
  }));

const pieColors = ["#22c55e", "#60a5fa", "#a78bfa", "#f59e0b", "#ef4444"];


function KpiCard({
  icon,
  label,
  value,
  detail,
  accent = "blue",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  accent?: "blue" | "green" | "violet" | "amber" | "cyan";
}) {
  return (
    <article className={`dash-kpi ${accent}`}>
      <div className="dash-kpi-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function ChartPanel({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`dash-panel chart-panel ${className}`}>
      <div className="dash-panel-title">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function EmptyChart({ text = "Sin datos para mostrar." }: { text?: string }) {
  return <div className="dash-empty-chart">{text}</div>;
}

function ActivityList({
  actividad,
  showFinancial,
  showMemberships,
  showSocios,
}: {
  actividad: DashboardActividadReciente | null;
  showFinancial: boolean;
  showMemberships: boolean;
  showSocios: boolean;
}) {
  const items = useMemo(() => {
    if (!actividad) return [];

    return [
      showFinancial && actividad.ultimoPago && {
        icon: <CreditCard size={17} />,
        title: "Último pago",
        detail: `${actividad.ultimoPago.socio || "Socio"} · ${money(actividad.ultimoPago.monto)}`,
        meta: formatDateTime(actividad.ultimoPago.fecha),
      },
      actividad.ultimaAsistencia && {
        icon: <Activity size={17} />,
        title: "Última asistencia",
        detail: `${actividad.ultimaAsistencia.socio || "Socio"} · ${
          actividad.ultimaAsistencia.descripcion || "Ingreso registrado"
        }`,
        meta: formatDateTime(actividad.ultimaAsistencia.fecha),
      },
      showMemberships && actividad.ultimaMembresiaActivada && {
        icon: <ShieldCheck size={17} />,
        title: "Membresía activada",
        detail: `${actividad.ultimaMembresiaActivada.socio || "Socio"} · ${formatDate(
          actividad.ultimaMembresiaActivada.fechaInicio
        )} al ${formatDate(actividad.ultimaMembresiaActivada.fechaFin)}`,
        meta: "Vigencia actualizada",
      },
      showSocios && actividad.ultimoSocio && {
        icon: <UserPlus size={17} />,
        title: "Último socio",
        detail: `${actividad.ultimoSocio.socio || "Socio"} · ${
          actividad.ultimoSocio.numeroSocio || "Sin número"
        }`,
        meta: actividad.ultimoSocio.descripcion || "Alta registrada",
      },
    ].filter(Boolean) as Array<{
      icon: ReactNode;
      title: string;
      detail: string;
      meta: string;
    }>;
  }, [actividad, showFinancial, showMemberships, showSocios]);

  if (items.length === 0) {
    return <p className="dash-empty">No hay actividad reciente.</p>;
  }

  return (
    <div className="dash-feed">
      {items.map((item, index) => (
        <div className="dash-feed-item" key={`${item.title}-${index}`}>
          <div className="dash-feed-icon">{item.icon}</div>
          <div>
            <strong>{item.title}</strong>
            <span>{item.detail}</span>
            <small>{item.meta}</small>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { hasPage, hasCard } = useAuthSession();

  const canSeeFinancialCards =
    hasCard("dashboard.finanzas") ||
    hasCard("dashboard.recaudacion");

  const canSeeSociosCards = hasCard("dashboard.socios");
  const canSeeVencimientosCards =
    hasCard("dashboard.vencimientos") ||
    hasCard("dashboard.vencimientos_operativos");
  const canSeeGymAttendanceCards =
    hasCard("dashboard.asistencias") ||
    hasCard("dashboard.ingresos_gimnasio");
  const canSeeClassCards =
    hasCard("dashboard.clases") ||
    hasCard("dashboard.horarios") ||
    hasCard("dashboard.clases_hoy");
  const canSeeClassAttendanceCards = hasCard("dashboard.asistencia_clases");


  const [activeTab, setActiveTab] = useState<DashboardTab>("general");
  const [resumen, setResumen] = useState<DashboardResumen>(emptyDashboardResumen);
  const [actividad, setActividad] = useState<DashboardActividadReciente | null>(null);
  const [graficos, setGraficos] = useState<DashboardGraficos>({
    recaudacionPorDia: [],
    asistenciasPorDia: [],
    asistenciasPorActividad: [],
    membresiasPorEstado: [],
  });
  const [vencimientos, setVencimientos] = useState<DashboardVencimientosResponse>({
    dias: 7,
    cantidad: 0,
    membresias: [],
  });
  const [desde, setDesde] = useState(daysAgoInput(7));
  const [hasta, setHasta] = useState(todayInput());
  const [loading, setLoading] = useState(false);
  const [notificacion, setNotificacion] = useState<DashboardMembresiaPorVencer | null>(null);

  const cargarDashboard = async () => {
    try {
      setLoading(true);

      const [resumenData, actividadData, graficosData, vencimientosData] = await Promise.all([
        getDashboardResumen(),
        getDashboardActividadReciente(),
        getDashboardGraficos(desde, hasta),
        getDashboardMembresiasPorVencer(7),
      ]);

      setResumen(resumenData);
      setActividad(actividadData);
      setGraficos(graficosData);
      setVencimientos(vencimientosData);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo cargar el dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const revenueData = useMemo(() => toChartData(graficos.recaudacionPorDia), [graficos]);
  const attendanceData = useMemo(() => toChartData(graficos.asistenciasPorDia), [graficos]);
  const activityData = useMemo(() => toChartData(graficos.asistenciasPorActividad), [graficos]);
  const membershipData = useMemo(() => toChartData(graficos.membresiasPorEstado), [graficos]);

  const quickActions = [
    hasPage("socios") && { label: "Nuevo socio", icon: <UserPlus size={16} />, path: "/socios" },
    hasPage("pagos") && { label: "Registrar pago", icon: <CreditCard size={16} />, path: "/pagos" },
    hasPage("membresias") && { label: "Membresías", icon: <WalletCards size={16} />, path: "/membresias" },
    hasPage("asistencias") && { label: "Asistencias", icon: <Activity size={16} />, path: "/asistencias" },
  ].filter(Boolean) as Array<{ label: string; icon: ReactNode; path: string }>;

  const enviarNotificacion = (medio: "WhatsApp" | "Correo" | "Ambos") => {
    if (!notificacion) return;

    const socio =
      notificacion.socio ||
      `${notificacion.nombre || "Socio"} ${notificacion.apellido || ""}`.trim();

    toast.success(`Notificación enviada por ${medio} a ${socio}.`);
    setNotificacion(null);
  };

  useEffect(() => {
    if (activeTab === "finanzas" && !canSeeFinancialCards) {
      setActiveTab("general");
    }

    if (activeTab === "membresias" && !canSeeVencimientosCards) {
      setActiveTab("general");
    }

    if (
      activeTab === "asistencias" &&
      !canSeeGymAttendanceCards &&
      !canSeeClassAttendanceCards
    ) {
      setActiveTab("general");
    }
  }, [
    activeTab,
    canSeeFinancialCards,
    canSeeVencimientosCards,
    canSeeGymAttendanceCards,
    canSeeClassAttendanceCards,
  ]);

  const socioActivoPct = resumen.totalSocios
    ? Math.round((resumen.sociosActivos / resumen.totalSocios) * 100)
    : 0;

  return (
    <div className="dash-page">
      <header className="dash-header">
        <div>
          <span className="section-kicker">Panel principal</span>
          <h2>Dashboard</h2>
          <p>Vista ejecutiva del gimnasio con métricas, gráficos y alertas.</p>
        </div>

              <nav className="dash-tabs">
        <button className={activeTab === "general" ? "active" : ""} onClick={() => setActiveTab("general")}>
          <Sparkles size={16} /> General
        </button>
        {canSeeFinancialCards && (
          <button className={activeTab === "finanzas" ? "active" : ""} onClick={() => setActiveTab("finanzas")}>
            <TrendingUp size={16} /> Finanzas
          </button>
        )}
        {(canSeeGymAttendanceCards || canSeeClassAttendanceCards) && (
          <button className={activeTab === "asistencias" ? "active" : ""} onClick={() => setActiveTab("asistencias")}>
            <Activity size={16} /> Asistencias
          </button>
        )}
        {canSeeVencimientosCards && (
          <button className={activeTab === "membresias" ? "active" : ""} onClick={() => setActiveTab("membresias")}>
            <WalletCards size={16} /> Membresías
          </button>
        )}
      </nav>

        <div className="dash-actions">
          <DateRangePicker
            from={desde}
            to={hasta}
            onFromChange={setDesde}
            onToChange={setHasta}
            fromLabel="Desde"
            toLabel="Hasta"
            minYear={2024}
            maxYear={new Date().getFullYear() + 1}
          />
          <button onClick={cargarDashboard} disabled={loading}>
            <RefreshCcw size={15} />
            {loading ? "Actualizando" : "Actualizar"}
          </button>
        </div>
      </header>



      {activeTab === "general" && (
        <div className="dash-tab-content">
          <section className="dash-kpi-grid compact">
            {canSeeSociosCards && (
              <KpiCard
                icon={<UsersRound size={21} />}
                label="Socios activos"
                value={`${number(resumen.sociosActivos)} / ${number(resumen.totalSocios)}`}
                detail={`${socioActivoPct}% de la base activa`}
                accent="blue"
              />
            )}
            {canSeeFinancialCards && (
              <KpiCard
                icon={<TrendingUp size={21} />}
                label="Recaudación mensual"
                value={money(resumen.recaudacionDelMes)}
                detail={`${number(resumen.pagosDelDia)} pagos hoy`}
                accent="green"
              />
            )}
            {canSeeGymAttendanceCards && (
              <KpiCard
                icon={<Activity size={21} />}
                label="Ingresos hoy"
                value={number(resumen.asistenciasSociosHoy)}
                detail="Accesos generales"
                accent="cyan"
              />
            )}
            {canSeeClassCards && (
              <KpiCard
                icon={<Dumbbell size={21} />}
                label="Clases hoy"
              value={number(resumen.asistenciasClasesHoy)}
              detail={`${number(resumen.clasesProgramadasHoy)} programadas`}
              accent="violet"
              />
            )}
          </section>

          <section className="dash-general-grid refined-general-grid">
            <section className="dash-panel recent-panel">
              <div className="dash-panel-title">
                <div>
                  <h3>Actividad reciente</h3>
                  <p>Últimos movimientos importantes.</p>
                </div>
              </div>
              <ActivityList
                actividad={actividad}
                showFinancial={canSeeFinancialCards}
                showMemberships={canSeeVencimientosCards}
                showSocios={canSeeSociosCards}
              />
            </section>

            <ChartPanel
              className="general-revenue-panel"
              title="Recaudación por día"
              subtitle={`Período ${formatDate(desde)} - ${formatDate(hasta)}`}
            >
              <div className="general-chart-area">
                {revenueData.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.48} />
                          <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,.55)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "rgba(255,255,255,.45)", fontSize: 11 }} axisLine={false} tickLine={false} width={42} />
                      <Tooltip formatter={(value) => money(Number(value))} contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,.12)", borderRadius: 14 }} />
                      <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={3} fill="url(#revenueGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="quick-inline">
                <div className="quick-inline-title">
                  <strong>Accesos rápidos</strong>
                  <span>Tareas frecuentes</span>
                </div>

                <div className="quick-grid quick-grid-inline">
                  {quickActions.map((action) => (
                    <button key={action.label} onClick={() => navigate(action.path)}>
                      <span>{action.icon}</span>
                      {action.label}
                      <ArrowRight size={14} />
                    </button>
                  ))}
                </div>
              </div>
            </ChartPanel>

            <section className="dash-panel operation-panel">
              <div className="dash-panel-title">
                <div>
                  <h3>Estado operativo</h3>
                  <p>Resumen rápido del funcionamiento actual.</p>
                </div>
              </div>

              <div className="operation-feed">
                <div className="dash-feed-item">
                  <div className="dash-feed-icon"><Dumbbell size={17} /></div>
                  <div>
                    <strong>{number(resumen.actividadesActivas)} actividades activas</strong>
                    <span>Plan de clases y propuestas disponibles</span>
                    <small>Estado actualizado</small>
                  </div>
                </div>
                <div className="dash-feed-item">
                  <div className="dash-feed-icon"><UsersRound size={17} /></div>
                  <div>
                    <strong>{number(resumen.entrenadoresActivos)} entrenadores activos</strong>
                    <span>Equipo disponible para clases y asistencia</span>
                    <small>Operación normal</small>
                  </div>
                </div>
                <div className="dash-feed-item">
                  <div className="dash-feed-icon"><WalletCards size={17} /></div>
                  <div>
                    <strong>{number(resumen.membresiasPendientesPago)} pendientes de pago</strong>
                    <span>{number(resumen.membresiasPorVencer)} membresías por vencer</span>
                    <small>Control administrativo</small>
                  </div>
                </div>
              </div>
            </section>
          </section>
        </div>
      )}

      {activeTab === "finanzas" && canSeeFinancialCards && (
        <div className="dash-tab-content">
          <section className="dash-kpi-grid finance-kpis">
            <KpiCard icon={<TrendingUp size={21} />} label="Recaudación mensual" value={money(resumen.recaudacionDelMes)} detail="Total acumulado del mes" accent="green" />
            <KpiCard icon={<CreditCard size={21} />} label="Pagos del día" value={number(resumen.pagosDelDia)} detail="Pagos registrados hoy" accent="blue" />
            <KpiCard icon={<ShieldCheck size={21} />} label="Membresías activas" value={number(resumen.membresiasActivas)} detail="Membresías vigentes" accent="violet" />
          </section>

          <section className="dash-two-grid">
            <ChartPanel className="finance-chart-panel" title="Recaudación por día" subtitle="Evolución de cobros en el período">
              {revenueData.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="financeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,.55)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,.45)", fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
                    <Tooltip formatter={(value) => money(Number(value))} contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,.12)", borderRadius: 14 }} />
                    <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={3} fill="url(#financeGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ChartPanel>

            <section className="dash-panel last-payment-panel">
              <div className="dash-panel-title">
                <div>
                  <h3>Último pago</h3>
                  <p>Movimiento financiero más reciente.</p>
                </div>
              </div>
              {actividad?.ultimoPago ? (
                <div className="highlight-card">
                  <CreditCard size={22} />
                  <div>
                    <strong>{actividad.ultimoPago.socio || "Socio"}</strong>
                    <span>{money(actividad.ultimoPago.monto)} · {formatDateTime(actividad.ultimoPago.fecha)}</span>
                  </div>
                </div>
              ) : <p className="dash-empty">No hay pagos recientes.</p>}
            </section>
          </section>
        </div>
      )}

      {activeTab === "asistencias" && (canSeeGymAttendanceCards || canSeeClassAttendanceCards) && (
        <div className="dash-tab-content">
          <section className="dash-kpi-grid finance-kpis">
            <KpiCard icon={<Activity size={21} />} label="Ingresos hoy" value={number(resumen.asistenciasSociosHoy)} detail="Accesos generales" accent="cyan" />
            <KpiCard icon={<Dumbbell size={21} />} label="Asistencias a clases" value={number(resumen.asistenciasClasesHoy)} detail="Registros del día" accent="violet" />
            <KpiCard icon={<CalendarClock size={21} />} label="Clases programadas" value={number(resumen.clasesProgramadasHoy)} detail="Planificación de hoy" accent="amber" />
          </section>

                    <section className="dash-panel">
            <div className="dash-panel-title">
              <div>
                <h3>Registro de clases</h3>
                <p>Clases en curso y próxima clase.</p>
              </div>
            </div>
            <div className="class-cards">
              <div className="class-card"><Zap size={18} /><strong>En este momento</strong><span>{actividad?.clasesEnEsteMomento?.length ? `${actividad.clasesEnEsteMomento.length} clase(s) activas` : "Sin clases activas"}</span></div>
              <div className="class-card"><CalendarClock size={18} /><strong>Próxima clase</strong><span>{actividad?.proximaClase?.descripcion || "No hay próximas clases programadas"}</span></div>
            </div>
          </section>

          <section className="dash-two-grid">
            <ChartPanel className="attendance-chart-panel" title="Asistencias por día" subtitle="Ingresos registrados en el período">
              {attendanceData.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={attendanceData}>
                    <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,.55)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,.45)", fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip cursor={false} contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,.12)", borderRadius: 14 }} />
                    <Bar dataKey="value" barSize={24} radius={[10, 10, 4, 4]} fill="#60a5fa" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartPanel>

            <ChartPanel className="attendance-chart-panel" title="Asistencias por actividad" subtitle="Distribución por clases">
              {activityData.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={activityData} layout="vertical">
                    <CartesianGrid stroke="rgba(255,255,255,.08)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "rgba(255,255,255,.45)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="label" tick={{ fill: "rgba(255,255,255,.55)", fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip cursor={false} contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,.12)", borderRadius: 14 }} />
                    <Bar dataKey="value" barSize={20} radius={[0, 10, 10, 0]} fill="#a78bfa" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartPanel>
          </section>
        </div>
      )}

      {activeTab === "membresias" && canSeeVencimientosCards && (
        <div className="dash-tab-content">
          <section className="dash-kpi-grid finance-kpis">
            <KpiCard icon={<ShieldCheck size={21} />} label="Membresías activas" value={number(resumen.membresiasActivas)} detail="Vigentes actualmente" accent="green" />
            <KpiCard icon={<WalletCards size={21} />} label="Pendientes de pago" value={number(resumen.membresiasPendientesPago)} detail="Requieren regularización" accent="amber" />
            <KpiCard icon={<BellRing size={21} />} label="Por vencer" value={number(resumen.membresiasPorVencer)} detail={`Próximos ${vencimientos.dias} días`} accent="violet" />
          </section>

          <section className="dash-two-grid">
            <ChartPanel className="membership-state-panel" title="Membresías por estado" subtitle="Distribución general">
              {membershipData.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={membershipData} dataKey="value" nameKey="label" innerRadius={48} outerRadius={78} paddingAngle={5}>
                      {membershipData.map((_, index) => <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,.12)", borderRadius: 14 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartPanel>

            <section className="dash-panel vencimientos-panel-compact">
              <div className="dash-panel-title">
                <div>
                  <h3>Vencimientos</h3>
                  <p>Membresías por vencer en los próximos {vencimientos.dias} días.</p>
                </div>
                <span className="dash-counter">{vencimientos.cantidad}</span>
              </div>

              {vencimientos.membresias.length === 0 ? (
                <div className="vencimientos-empty">
                  <CheckCircle2 size={24} />
                  <strong>Sin vencimientos próximos</strong>
                  <span>No hay alertas para este período.</span>
                  <button
                    type="button"
                    className="notification-demo-button"
                    onClick={() =>
                      setNotificacion({
                        socio: "Socio de prueba",
                        tipoMembresia: "Membresía mensual",
                        fechaVencimiento: todayInput(),
                      })
                    }
                  >
                    <BellRing size={14} />
                    Enviar notificación
                  </button>
                </div>
              ) : (
                <div className="vencimientos-list">
                  {vencimientos.membresias.map((item, index) => {
                    const socio = item.socio || `${item.nombre || "Socio"} ${item.apellido || ""}`.trim();
                    return (
                      <div className="vencimiento-row" key={`${socio}-${index}`}>
                        <div>
                          <strong>{socio}</strong>
                          <span>{item.tipoMembresia || "Membresía"} · vence el {formatDate(item.fechaVencimiento || item.fechaFin)}</span>
                        </div>
                        <button onClick={() => setNotificacion(item)}><BellRing size={14} /> Enviar notificación</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </section>
        </div>
      )}

{notificacion && (
  <div className="dash-modal-backdrop" onClick={() => setNotificacion(null)}>
    <div className="dash-modal notification-modal" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="modal-close"
        onClick={() => setNotificacion(null)}
        aria-label="Cerrar"
      >
        <X size={18} />
      </button>

      <div className="notification-modal-header">
        <div className="modal-icon">
          <BellRing size={23} />
        </div>

        <div>
          <span className="notification-kicker">Aviso de vencimiento</span>
          <h3>Enviar notificación</h3>
          <p>
            Elegí el medio para avisar a{" "}
            <strong>
              {notificacion.socio ||
                `${notificacion.nombre || "Socio"} ${
                  notificacion.apellido || ""
                }`.trim()}
            </strong>{" "}
            sobre el vencimiento de su membresía.
          </p>
        </div>
      </div>

      <div className="notification-options">
        <button
          type="button"
          className="notification-option"
          onClick={() => enviarNotificacion("WhatsApp")}
        >
          <div className="notification-option-icon whatsapp">
            <MessageCircle size={19} />
          </div>

          <div>
            <strong>WhatsApp</strong>
            <span>Enviar recordatorio al teléfono registrado.</span>
          </div>

          <ArrowRight size={17} />
        </button>

        <button
          type="button"
          className="notification-option"
          onClick={() => enviarNotificacion("Correo")}
        >
          <div className="notification-option-icon mail">
            <Mail size={19} />
          </div>

          <div>
            <strong>Correo electrónico</strong>
            <span>Enviar aviso al email del socio.</span>
          </div>

          <ArrowRight size={17} />
        </button>

        <button
          type="button"
          className="notification-option"
          onClick={() => enviarNotificacion("Ambos")}
        >
          <div className="notification-option-icon both">
            <Sparkles size={19} />
          </div>

          <div>
            <strong>WhatsApp y correo</strong>
            <span>Enviar la notificación por ambos medios.</span>
          </div>

          <ArrowRight size={17} />
        </button>
      </div>

      <div className="notification-footer">
        <button type="button" onClick={() => setNotificacion(null)}>
          Cancelar
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}