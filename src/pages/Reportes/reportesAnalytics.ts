import type {
  ReporteAsistenciaClaseItem,
  ReporteAsistenciaSocioItem,
  ReportePagoItem,
} from "../../services/reportesService";
import type {
  DashboardGraficoItem,
  DashboardMembresiaPorVencer,
  DashboardResumen,
} from "../../services/dashboardService";

export type Severity = "success" | "info" | "warning" | "danger";

export type ChartRow = {
  name: string;
  value: number;
  previous?: number;
  amount?: number;
  movement?: number;
  label?: string;
};

export type AuditFinding = {
  id: string;
  title: string;
  value: string;
  description: string;
  recommendation: string;
  severity: Severity;
  area: "Finanzas" | "Operación" | "Datos" | "Comercial" | "Sistema";
};

export type DecisionInsight = {
  id: string;
  question: string;
  answer: string;
  evidence: string;
  severity: Severity;
  action: string;
};

export type ReportDataset = {
  pagos: ReportePagoItem[];
  asistenciasSocios: ReporteAsistenciaSocioItem[];
  asistenciasClases: ReporteAsistenciaClaseItem[];
};

export const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value || 0);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("es-AR").format(value || 0);

export const formatPercent = (value: number) => `${Math.round(value || 0)}%`;

export const normalize = (value?: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const htmlEscape = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const csvEscape = (value: unknown) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

export const readString = (source: unknown, keys: string[], fallback = "") => {
  const record = (source || {}) as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }

  return fallback;
};

export const readNumber = (source: unknown, keys: string[], fallback = 0) => {
  const record = (source || {}) as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) return value;

    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }

  return fallback;
};

export const dateKey = (value?: string) => {
  if (!value) return "Sin fecha";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.substring(0, 10) || "Sin fecha";
  }

  return date.toISOString().substring(0, 10);
};

export const formatDate = (value?: string) => {
  if (!value) return "Sin fecha";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.substring(0, 10) || "Sin fecha";
  }

  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatDateShort = (value?: string) => {
  if (!value || value === "Sin fecha") return "Sin fecha";

  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value.substring(0, 10);

  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  });
};

export const formatTime = (value?: string) => {
  if (!value) return "--:--";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value.substring(11, 16) || "--:--";

  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const startOfMonthInput = () => {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const offset = start.getTimezoneOffset() * 60000;

  return new Date(start.getTime() - offset).toISOString().substring(0, 10);
};

export const todayInput = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60000;

  return new Date(today.getTime() - offset).toISOString().substring(0, 10);
};

export const daysAgoInput = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset).toISOString().substring(0, 10);
};

export const daysBetweenInclusive = (from: string, to: string) => {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;

  return Math.max(Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1, 1);
};

export const getPreviousRange = (from: string, to: string) => {
  const days = daysBetweenInclusive(from, to);
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${from}T00:00:00`);

  start.setDate(start.getDate() - days);
  end.setDate(end.getDate() - 1);

  return {
    desde: start.toISOString().substring(0, 10),
    hasta: end.toISOString().substring(0, 10),
  };
};

export const labelMetodoIngreso = (value?: string) => {
  const normalized = normalize(value);

  if (normalized.includes("qr")) return "QR";
  if (normalized.includes("credencial")) return "Credencial";
  if (normalized.includes("manual") || normalized.includes("recepcion")) return "Recepción";

  return value || "Sin método";
};

export const getSocioNombre = (
  item: ReporteAsistenciaSocioItem | ReporteAsistenciaClaseItem,
) => {
  const direct = readString(item, ["socioNombre", "socio", "nombreCompleto"]);
  if (direct) return direct;

  const nombre = readString(item, ["nombre"]);
  const apellido = readString(item, ["apellido"]);
  const fullName = `${nombre} ${apellido}`.trim();

  if (fullName) return fullName;

  const id = readNumber(item, ["socioId"]);

  return id ? `Socio N.º ${id}` : "Socio no identificado";
};

export const getDni = (item: ReporteAsistenciaSocioItem | ReporteAsistenciaClaseItem) =>
  readString(item, ["dni"], "DNI no disponible");

export const getMetodoIngreso = (item: ReporteAsistenciaSocioItem) =>
  labelMetodoIngreso(readString(item, ["metodoIngreso"]));

export const getActividad = (item: ReporteAsistenciaClaseItem) =>
  readString(
    item,
    ["actividadNombre", "actividad", "nombreActividad"],
    item.actividadId ? `Actividad N.º ${item.actividadId}` : "Clase no identificada",
  );

export const getEntrenador = (item: ReporteAsistenciaClaseItem) =>
  readString(
    item,
    ["entrenadorNombre", "entrenador", "nombreEntrenador"],
    item.entrenadorId ? `Entrenador N.º ${item.entrenadorId}` : "Entrenador no disponible",
  );

export const getEstadoClase = (item: ReporteAsistenciaClaseItem) =>
  readString(item, ["estado"], "Presente");

export const getFechaClase = (item: ReporteAsistenciaClaseItem) =>
  readString(item, ["fechaHora", "fechaClase"]);

export const isPresente = (item: ReporteAsistenciaClaseItem) =>
  normalize(getEstadoClase(item)).includes("presente");

export const isAusente = (item: ReporteAsistenciaClaseItem) =>
  normalize(getEstadoClase(item)).includes("ausente");

export const getPagoSocio = (item: ReportePagoItem) => {
  const direct = readString(item, ["socioNombre", "nombreCompleto"]);
  if (direct) return direct;

  const socio = item.socio || {};
  const nombre = readString(socio, ["nombre"]);
  const apellido = readString(socio, ["apellido"]);
  const fullName = `${nombre} ${apellido}`.trim();

  if (fullName) return fullName;

  const id = readNumber(item, ["socioId"]);

  return id ? `Socio N.º ${id}` : "Socio no identificado";
};

export const getPagoDni = (item: ReportePagoItem) =>
  readString(item.socio || item, ["dni"], "DNI no disponible");

export const getPagoNumeroSocio = (item: ReportePagoItem) =>
  readString(item.socio || item, ["numeroSocio"]);

export const getPagoFecha = (item: ReportePagoItem) =>
  readString(item, ["fechaPago", "fechaHora", "fecha"]);

export const getPagoMedio = (item: ReportePagoItem) =>
  readString(item, ["medioPagoNombre", "medioPago"], "Sin medio");

export const getPagoComprobante = (item: ReportePagoItem) =>
  readString(item, ["numeroComprobante", "comprobante"]);

export const groupCount = <T,>(items: T[], getLabel: (item: T) => string): ChartRow[] => {
  const map = new Map<string, number>();

  items.forEach((item) => {
    const label = getLabel(item) || "Sin dato";
    map.set(label, (map.get(label) || 0) + 1);
  });

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

export const groupMoney = <T,>(
  items: T[],
  getLabel: (item: T) => string,
  getValue: (item: T) => number,
): ChartRow[] => {
  const map = new Map<string, number>();

  items.forEach((item) => {
    const label = getLabel(item) || "Sin dato";
    map.set(label, (map.get(label) || 0) + getValue(item));
  });

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value, amount: value }))
    .sort((a, b) => b.value - a.value);
};

export const rowsFromDashboard = (items?: DashboardGraficoItem[]): ChartRow[] => {
  return (items || [])
    .map((item) => ({
      name:
        item.fecha ||
        item.dia ||
        item.actividad ||
        item.estado ||
        item.nombre ||
        "Sin dato",
      value: Number(item.total ?? item.cantidad ?? item.monto ?? item.valor ?? 0),
    }))
    .filter((item) => item.name && Number.isFinite(item.value));
};

export const comparePercent = (current: number, previous: number) => {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100;

  return ((current - previous) / previous) * 100;
};

export const comparisonLabel = (value: number) => {
  if (value > 0) return `+${Math.round(value)}%`;
  return `${Math.round(value)}%`;
};

export const comparisonSeverity = (
  value: number,
  positiveIsGood = true,
): Severity => {
  if (Math.abs(value) < 3) return "info";

  if (positiveIsGood) return value > 0 ? "success" : "warning";

  return value > 0 ? "warning" : "success";
};

export const datasetRevenue = (dataset: ReportDataset) =>
  dataset.pagos.reduce((acc, pago) => acc + Number(pago.monto || 0), 0);

export const datasetMovement = (dataset: ReportDataset) =>
  dataset.asistenciasSocios.length + dataset.asistenciasClases.length;

export const datasetTicket = (dataset: ReportDataset) => {
  const revenue = datasetRevenue(dataset);
  return dataset.pagos.length ? revenue / dataset.pagos.length : 0;
};

export const datasetPresentism = (dataset: ReportDataset) => {
  const presentes = dataset.asistenciasClases.filter(isPresente).length;
  const ausentes = dataset.asistenciasClases.filter(isAusente).length;
  const total = presentes + ausentes;

  return total ? (presentes / total) * 100 : 0;
};

export const datasetAuditScore = (dataset: ReportDataset) => {
  const paymentsWithoutReceipt = dataset.pagos.filter((pago) => !getPagoComprobante(pago)).length;
  const invalidAmounts = dataset.pagos.filter((pago) => Number(pago.monto || 0) <= 0).length;
  const classesWithoutStatus = dataset.asistenciasClases.filter((item) => !readString(item, ["estado"])).length;
  const entriesWithoutMethod = dataset.asistenciasSocios.filter((item) => !readString(item, ["metodoIngreso"])).length;
  const missingDni =
    dataset.asistenciasSocios.filter((item) => !readString(item, ["dni"])).length +
    dataset.asistenciasClases.filter((item) => !readString(item, ["dni"])).length;

  const total = Math.max(
    dataset.pagos.length + dataset.asistenciasSocios.length + dataset.asistenciasClases.length,
    1,
  );

  const penalty =
    paymentsWithoutReceipt * 1.2 +
    invalidAmounts * 3 +
    classesWithoutStatus * 1.5 +
    entriesWithoutMethod * 1.2 +
    missingDni * 0.6;

  return Math.max(Math.round(100 - Math.min((penalty / total) * 100, 100)), 0);
};

export const buildDailyRevenue = (dataset: ReportDataset, dashboardRows?: DashboardGraficoItem[]) => {
  const fromDashboard = rowsFromDashboard(dashboardRows);

  if (fromDashboard.length) {
    return fromDashboard.sort((a, b) => a.name.localeCompare(b.name));
  }

  return groupMoney(
    dataset.pagos,
    (pago) => dateKey(getPagoFecha(pago)),
    (pago) => Number(pago.monto || 0),
  ).sort((a, b) => a.name.localeCompare(b.name));
};

export const buildDailyMovement = (dataset: ReportDataset, dashboardRows?: DashboardGraficoItem[]) => {
  const fromDashboard = rowsFromDashboard(dashboardRows);

  if (fromDashboard.length) {
    return fromDashboard.sort((a, b) => a.name.localeCompare(b.name));
  }

  const map = new Map<string, number>();

  dataset.asistenciasSocios.forEach((item) => {
    const key = dateKey(item.fechaHora);
    map.set(key, (map.get(key) || 0) + 1);
  });

  dataset.asistenciasClases.forEach((item) => {
    const key = dateKey(getFechaClase(item));
    map.set(key, (map.get(key) || 0) + 1);
  });

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const buildIndexedComparison = (
  current: ChartRow[],
  previous: ChartRow[],
  label: "Ingresos" | "Movimiento",
) => {
  const maxLength = Math.max(current.length, previous.length);

  return Array.from({ length: maxLength }).map((_, index) => ({
    name: `Día ${index + 1}`,
    actual: current[index]?.value || 0,
    anterior: previous[index]?.value || 0,
    label,
  }));
};

export const getVencimientoSocio = (item: DashboardMembresiaPorVencer) => {
  const direct = readString(item, ["socio", "socioNombre"]);
  if (direct) return direct;

  const fullName = `${readString(item, ["nombre"])} ${readString(item, ["apellido"])}`.trim();

  return fullName || "Socio no identificado";
};

export const buildAuditFindings = (
  dataset: ReportDataset,
  dashboard: DashboardResumen,
  vencimientos: DashboardMembresiaPorVencer[],
): AuditFinding[] => {
  const paymentsWithoutReceipt = dataset.pagos.filter((pago) => !getPagoComprobante(pago)).length;
  const invalidAmounts = dataset.pagos.filter((pago) => Number(pago.monto || 0) <= 0).length;
  const classesWithoutStatus = dataset.asistenciasClases.filter((item) => !readString(item, ["estado"])).length;
  const entriesWithoutMethod = dataset.asistenciasSocios.filter((item) => !readString(item, ["metodoIngreso"])).length;
  const missingDni =
    dataset.asistenciasSocios.filter((item) => !readString(item, ["dni"])).length +
    dataset.asistenciasClases.filter((item) => !readString(item, ["dni"])).length;
  const commercialRisk = dashboard.membresiasPendientesPago + vencimientos.length;
  const total = dataset.pagos.length + dataset.asistenciasSocios.length + dataset.asistenciasClases.length;

  return [
    {
      id: "receipt",
      area: "Finanzas",
      title: "Pagos sin comprobante",
      value: String(paymentsWithoutReceipt),
      description: "Operaciones financieras donde no se visualiza comprobante asociado.",
      recommendation:
        paymentsWithoutReceipt > 0
          ? "Auditar emisión de comprobantes y cerrar brechas de trazabilidad."
          : "Mantener control de emisión de comprobantes.",
      severity: paymentsWithoutReceipt > 0 ? "warning" : "success",
    },
    {
      id: "amount",
      area: "Finanzas",
      title: "Montos inválidos",
      value: String(invalidAmounts),
      description: "Pagos con monto cero o negativo en el corte seleccionado.",
      recommendation:
        invalidAmounts > 0
          ? "Revisar origen de carga y corregir registros antes de cierre administrativo."
          : "No hay anomalías críticas de monto.",
      severity: invalidAmounts > 0 ? "danger" : "success",
    },
    {
      id: "status",
      area: "Operación",
      title: "Clases sin estado",
      value: String(classesWithoutStatus),
      description: "Asistencias a clases sin estado Presente/Ausente visible.",
      recommendation:
        classesWithoutStatus > 0
          ? "Completar estados para sostener indicadores de presentismo."
          : "La operación de clases mantiene estados auditables.",
      severity: classesWithoutStatus > 0 ? "warning" : "success",
    },
    {
      id: "method",
      area: "Operación",
      title: "Ingresos sin método",
      value: String(entriesWithoutMethod),
      description: "Accesos generales sin canal QR, Credencial o Recepción.",
      recommendation:
        entriesWithoutMethod > 0
          ? "Normalizar método de ingreso para trazabilidad de accesos."
          : "Los ingresos tienen método operativo identificado.",
      severity: entriesWithoutMethod > 0 ? "warning" : "success",
    },
    {
      id: "identity",
      area: "Datos",
      title: "Registros sin DNI visible",
      value: String(missingDni),
      description: "Registros operativos donde el reporte no muestra identificación documental.",
      recommendation:
        missingDni > 0
          ? "Mejorar calidad de datos para auditoría documental."
          : "La identificación documental se mantiene consistente.",
      severity: missingDni > 0 ? "info" : "success",
    },
    {
      id: "commercial",
      area: "Comercial",
      title: "Riesgo comercial",
      value: String(commercialRisk),
      description: "Membresías pendientes de pago o próximas a vencer.",
      recommendation:
        commercialRisk > 0
          ? "Activar seguimiento comercial antes de pérdida de continuidad."
          : "Sin riesgo comercial inmediato detectado.",
      severity: commercialRisk > 0 ? "warning" : "success",
    },
    {
      id: "volume",
      area: "Sistema",
      title: "Volumen auditado",
      value: formatNumber(total),
      description: "Cantidad de movimientos considerados por el informe.",
      recommendation:
        total > 0
          ? "El corte tiene base transaccional para análisis."
          : "Seleccionar otro período para obtener evidencia.",
      severity: total > 0 ? "info" : "warning",
    },
  ];
};

export const buildRiskRadar = (
  dataset: ReportDataset,
  dashboard: DashboardResumen,
  vencimientos: DashboardMembresiaPorVencer[],
) => {
  const audit = datasetAuditScore(dataset);
  const totalMovements = Math.max(datasetMovement(dataset), 1);
  const paymentsWithReceipt =
    dataset.pagos.length === 0
      ? 100
      : ((dataset.pagos.length - dataset.pagos.filter((pago) => !getPagoComprobante(pago)).length) /
          dataset.pagos.length) *
        100;
  const stateQuality =
    dataset.asistenciasClases.length === 0
      ? 100
      : ((dataset.asistenciasClases.length -
          dataset.asistenciasClases.filter((item) => !readString(item, ["estado"])).length) /
          dataset.asistenciasClases.length) *
        100;
  const commercialRisk = dashboard.membresiasPendientesPago + vencimientos.length;
  const commercialHealth = Math.max(100 - commercialRisk * 8, 0);
  const engagement =
    dashboard.sociosActivos > 0
      ? Math.min((new Set(dataset.asistenciasSocios.map((item) => item.socioId)).size / dashboard.sociosActivos) * 100, 100)
      : Math.min(totalMovements * 10, 100);

  return [
    { subject: "Auditoría", value: audit },
    { subject: "Comprobantes", value: Math.round(paymentsWithReceipt) },
    { subject: "Clases", value: Math.round(stateQuality) },
    { subject: "Comercial", value: Math.round(commercialHealth) },
    { subject: "Engagement", value: Math.round(engagement) },
  ];
};

export const buildAnomalyRows = (
  revenueRows: ChartRow[],
  movementRows: ChartRow[],
  findings: AuditFinding[],
): AuditFinding[] => {
  const revenueValues = revenueRows.map((item) => item.value);
  const movementValues = movementRows.map((item) => item.value);
  const revenueAverage =
    revenueValues.length > 0 ? revenueValues.reduce((acc, value) => acc + value, 0) / revenueValues.length : 0;
  const movementAverage =
    movementValues.length > 0 ? movementValues.reduce((acc, value) => acc + value, 0) / movementValues.length : 0;
  const revenuePeak = [...revenueRows].sort((a, b) => b.value - a.value)[0];
  const movementPeak = [...movementRows].sort((a, b) => b.value - a.value)[0];

  const anomalies: AuditFinding[] = [];

  if (revenuePeak && revenueAverage > 0 && revenuePeak.value > revenueAverage * 1.8) {
    anomalies.push({
      id: "revenue-peak",
      area: "Finanzas",
      title: "Pico de ingresos",
      value: formatMoney(revenuePeak.value),
      description: `${formatDate(revenuePeak.name)} supera ampliamente el promedio del período.`,
      recommendation: "Verificar si corresponde a campaña, renovación masiva o carga acumulada.",
      severity: "info",
    });
  }

  if (movementPeak && movementAverage > 0 && movementPeak.value > movementAverage * 1.8) {
    anomalies.push({
      id: "movement-peak",
      area: "Operación",
      title: "Pico operativo",
      value: formatNumber(movementPeak.value),
      description: `${formatDate(movementPeak.name)} concentra movimiento fuera del promedio.`,
      recommendation: "Analizar causa operacional para planificar recursos y recepción.",
      severity: "info",
    });
  }

  return [...anomalies, ...findings.filter((finding) => finding.severity !== "success")];
};

export const buildPdfHtml = ({
  from,
  to,
  current,
  previous,
  dashboard,
  findings,
  insights,
  revenueRows,
  classRows,
  methodRows,
}: {
  from: string;
  to: string;
  current: ReportDataset;
  previous: ReportDataset;
  dashboard: DashboardResumen;
  findings: AuditFinding[];
  insights: DecisionInsight[];
  revenueRows: ChartRow[];
  classRows: ChartRow[];
  methodRows: ChartRow[];
}) => {
  const revenue = datasetRevenue(current);
  const prevRevenue = datasetRevenue(previous);
  const movement = datasetMovement(current);
  const prevMovement = datasetMovement(previous);
  const presentism = datasetPresentism(current);
  const audit = datasetAuditScore(current);

  const kpis = [
    ["Ingresos del período", formatMoney(revenue)],
    ["Variación ingresos", comparisonLabel(comparePercent(revenue, prevRevenue))],
    ["Movimiento operativo", formatNumber(movement)],
    ["Variación movimiento", comparisonLabel(comparePercent(movement, prevMovement))],
    ["Ticket promedio", formatMoney(datasetTicket(current))],
    ["Presentismo", formatPercent(presentism)],
    ["Índice auditoría", `${audit}/100`],
    ["Socios activos", formatNumber(dashboard.sociosActivos)],
  ];

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Reporte ejecutivo Cuerpo Sano</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #111827; font-family: Arial, Helvetica, sans-serif; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .cover { padding: 28px; border-radius: 22px; color: white; background: linear-gradient(135deg,#0f172a,#1e3a8a 55%,#4c1d95); margin-bottom: 22px; }
    .cover small { display: inline-block; padding: 6px 10px; border-radius: 999px; background: rgba(255,255,255,.14); font-size: 10px; letter-spacing: .08em; text-transform: uppercase; font-weight: 800; }
    .cover h1 { margin: 14px 0 8px; font-size: 34px; letter-spacing: -1.2px; }
    .cover p { margin: 0; color: rgba(255,255,255,.78); line-height: 1.5; }
    .meta { margin-top: 18px; display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
    .meta div { padding: 12px; border-radius: 14px; background: rgba(255,255,255,.12); }
    .meta span { display: block; color: rgba(255,255,255,.62); font-size: 10px; text-transform: uppercase; font-weight: 800; }
    .meta strong { display: block; margin-top: 5px; font-size: 13px; }
    h2 { margin: 24px 0 10px; color: #0f172a; font-size: 18px; letter-spacing: -.3px; }
    .grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 18px; }
    .kpi { padding: 14px; border-radius: 16px; border: 1px solid #e5e7eb; background: #f8fafc; break-inside: avoid; }
    .kpi span { display: block; color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 900; letter-spacing: .04em; }
    .kpi strong { display: block; margin-top: 8px; color: #0f172a; font-size: 17px; line-height: 1.1; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0 18px; overflow: hidden; border-radius: 14px; font-size: 11px; page-break-inside: avoid; }
    th { color: #0f172a; background: #e2e8f0; text-align: left; padding: 9px; font-size: 10px; text-transform: uppercase; letter-spacing: .04em; }
    td { padding: 9px; border-bottom: 1px solid #e5e7eb; color: #334155; vertical-align: top; }
    tr:nth-child(even) td { background: #f8fafc; }
    .severity { display: inline-block; border-radius: 999px; padding: 4px 8px; font-size: 10px; font-weight: 800; background: #dbeafe; color: #1d4ed8; }
    .severity.warning { background: #fef3c7; color: #b45309; }
    .severity.danger { background: #fee2e2; color: #b91c1c; }
    .severity.success { background: #dcfce7; color: #15803d; }
    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; color: #64748b; font-size: 10px; line-height: 1.5; }
    .page-break { page-break-before: always; }
    @media print { .cover,.kpi,table { break-inside: avoid; } }
  </style>
</head>
<body>
  <section class="cover">
    <small>Cuerpo Sano · Reporte ejecutivo</small>
    <h1>Informe de análisis, auditoría y toma de decisiones</h1>
    <p>Documento orientado a dirección. Resume tendencias, comparativas contra período anterior, riesgos, anomalías y recomendaciones.</p>
    <div class="meta">
      <div><span>Período</span><strong>${htmlEscape(formatDate(from))} al ${htmlEscape(formatDate(to))}</strong></div>
      <div><span>Generado</span><strong>${htmlEscape(formatDate(new Date().toISOString()))}</strong></div>
      <div><span>Base auditada</span><strong>${htmlEscape(formatNumber(datasetMovement(current) + current.pagos.length))} registros</strong></div>
    </div>
  </section>

  <h2>Indicadores ejecutivos</h2>
  <section class="grid">
    ${kpis.map(([label, value]) => `<article class="kpi"><span>${htmlEscape(label)}</span><strong>${htmlEscape(value)}</strong></article>`).join("")}
  </section>

  <h2>Decisiones recomendadas</h2>
  <table>
    <thead><tr><th>Pregunta</th><th>Respuesta</th><th>Evidencia</th><th>Acción</th></tr></thead>
    <tbody>
      ${insights.map((item) => `<tr><td>${htmlEscape(item.question)}</td><td><strong>${htmlEscape(item.answer)}</strong></td><td>${htmlEscape(item.evidence)}</td><td>${htmlEscape(item.action)}</td></tr>`).join("")}
    </tbody>
  </table>

  <h2>Evolución financiera</h2>
  <table>
    <thead><tr><th>Fecha</th><th>Total cobrado</th></tr></thead>
    <tbody>
      ${revenueRows.slice(-10).map((row) => `<tr><td>${htmlEscape(formatDate(row.name))}</td><td>${htmlEscape(formatMoney(row.value))}</td></tr>`).join("") || `<tr><td colspan="2">Sin ingresos registrados.</td></tr>`}
    </tbody>
  </table>

  <h2>Ranking de clases</h2>
  <table>
    <thead><tr><th>Clase</th><th>Registros</th></tr></thead>
    <tbody>
      ${classRows.slice(0, 8).map((row) => `<tr><td>${htmlEscape(row.name)}</td><td>${htmlEscape(formatNumber(row.value))}</td></tr>`).join("") || `<tr><td colspan="2">Sin registros de clases.</td></tr>`}
    </tbody>
  </table>

  <section class="page-break">
    <h2>Canales de ingreso</h2>
    <table>
      <thead><tr><th>Método</th><th>Ingresos</th></tr></thead>
      <tbody>
        ${methodRows.slice(0, 8).map((row) => `<tr><td>${htmlEscape(row.name)}</td><td>${htmlEscape(formatNumber(row.value))}</td></tr>`).join("") || `<tr><td colspan="2">Sin ingresos generales.</td></tr>`}
      </tbody>
    </table>

    <h2>Controles de auditoría</h2>
    <table>
      <thead><tr><th>Área</th><th>Control</th><th>Resultado</th><th>Severidad</th><th>Recomendación</th></tr></thead>
      <tbody>
        ${findings.map((item) => `<tr><td>${htmlEscape(item.area)}</td><td>${htmlEscape(item.title)}<br/><small>${htmlEscape(item.description)}</small></td><td><strong>${htmlEscape(item.value)}</strong></td><td><span class="severity ${htmlEscape(item.severity)}">${htmlEscape(item.severity.toUpperCase())}</span></td><td>${htmlEscape(item.recommendation)}</td></tr>`).join("")}
      </tbody>
    </table>

    <div class="footer">
      Documento generado desde Cuerpo Sano. Los resultados dependen del período seleccionado, la calidad de carga y los datos disponibles en backend.
      Para auditoría formal, contrastar contra comprobantes y base transaccional.
    </div>
  </section>
</body>
</html>`;
};
