import type {
  ReporteAsistenciaClaseItem,
  ReporteAsistenciaSocioItem,
} from "../../services/reportesService";

export type ReportTab = "gimnasio" | "clases";

export type ChartRow = {
  name: string;
  value: number;
  previous?: number;
};

export type SocioFrecuencia = {
  socioId: string;
  socio: string;
  dni: string;
  fotoUrl?: string;
  visitas: number;
  primeraVisita: string;
  ultimaVisita: string;
  metodoPrincipal: string;
  fechas: string[];
};

export type ReportMember = {
  socioId: string;
  nombre: string;
  fotoUrl?: string;
};

export type ClaseSesion = {
  key: string;
  actividad: string;
  entrenador: string;
  fecha: string;
  horario: string;
  horarioId: string;
  presentes: number;
  ausentes: number;
  total: number;
  capacidad?: number;
  ocupacion?: number | null;
  miembrosPresentes: ReportMember[];
  miembrosAusentes: ReportMember[];
};

export const todayInput = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60000;

  return new Date(today.getTime() - offset).toISOString().substring(0, 10);
};

export const startOfMonthInput = () => {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const offset = start.getTimezoneOffset() * 60000;

  return new Date(start.getTime() - offset).toISOString().substring(0, 10);
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

export const previousRange = (from: string, to: string) => {
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

export const normalize = (value?: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

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

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("es-AR").format(value || 0);

export const formatPercent = (value: number) => `${Math.round(value || 0)}%`;

export const formatDate = (value?: string) => {
  if (!value) return "Sin fecha";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value.substring(0, 10) || "Sin fecha";

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

export const dateKey = (value?: string) => {
  if (!value) return "Sin fecha";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value.substring(0, 10) || "Sin fecha";

  return date.toISOString().substring(0, 10);
};

export const htmlEscape = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const csvEscape = (value: unknown) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

export const comparePercent = (current: number, previous: number) => {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100;

  return ((current - previous) / previous) * 100;
};

export const comparisonLabel = (value: number) => {
  if (Math.abs(value) < 1) return "0%";
  return value > 0 ? `+${Math.round(value)}%` : `${Math.round(value)}%`;
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

  const socioId = readString(item, ["socioId"]);

  return socioId ? `Socio N.º ${socioId}` : "Socio no identificado";
};

export const getSocioId = (
  item: ReporteAsistenciaSocioItem | ReporteAsistenciaClaseItem,
) => readString(item, ["socioId", "id"], getSocioNombre(item));

export const getDni = (item: ReporteAsistenciaSocioItem | ReporteAsistenciaClaseItem) =>
  readString(item, ["dni"], "DNI no disponible");

export const getFotoUrl = (item: ReporteAsistenciaSocioItem | ReporteAsistenciaClaseItem) =>
  readString(item, ["fotoUrl", "socioFotoUrl", "avatarUrl", "foto"], "");

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

export const isPresente = (item: ReporteAsistenciaClaseItem) =>
  normalize(getEstadoClase(item)).includes("presente");

export const isAusente = (item: ReporteAsistenciaClaseItem) =>
  normalize(getEstadoClase(item)).includes("ausente");

export const getFechaClase = (item: ReporteAsistenciaClaseItem) =>
  readString(item, ["fechaHora", "fechaClase"]);

export const getHorarioTexto = (item: ReporteAsistenciaClaseItem) => {
  const dia = readString(item, ["dia", "diaSemana"], "");
  const inicio = readString(item, ["horaInicio"], "");
  const fin = readString(item, ["horaFin"], "");

  if (dia && inicio && fin) return `${dia} · ${inicio.substring(0, 5)} - ${fin.substring(0, 5)}`;
  if (inicio && fin) return `${inicio.substring(0, 5)} - ${fin.substring(0, 5)}`;

  return formatTime(getFechaClase(item));
};

export const getCapacidadClase = (item: ReporteAsistenciaClaseItem) => {
  const value = readNumber(
    item,
    ["capacidadMaxima", "cupoMaximo", "capacidad", "cupo", "cupos", "limite"],
    0,
  );

  return value > 0 ? value : undefined;
};

export const groupDaily = <T,>(items: T[], getDate: (item: T) => string): ChartRow[] => {
  const map = new Map<string, number>();

  items.forEach((item) => {
    const key = dateKey(getDate(item));
    map.set(key, (map.get(key) || 0) + 1);
  });

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

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

export const buildSocioFrecuencias = (
  asistencias: ReporteAsistenciaSocioItem[],
): SocioFrecuencia[] => {
  const map = new Map<string, SocioFrecuencia & { metodos: Map<string, number> }>();

  asistencias.forEach((item) => {
    const socioId = getSocioId(item);
    const current = map.get(socioId) || {
      socioId,
      socio: getSocioNombre(item),
      dni: getDni(item),
      fotoUrl: getFotoUrl(item),
      visitas: 0,
      primeraVisita: item.fechaHora || "",
      ultimaVisita: item.fechaHora || "",
      metodoPrincipal: getMetodoIngreso(item),
      fechas: [],
      metodos: new Map<string, number>(),
    };

    const metodo = getMetodoIngreso(item);
    if (!current.fotoUrl) current.fotoUrl = getFotoUrl(item);
    current.visitas += 1;
    current.fechas.push(item.fechaHora || "");

    if (item.fechaHora && (!current.primeraVisita || item.fechaHora < current.primeraVisita)) {
      current.primeraVisita = item.fechaHora;
    }

    if (item.fechaHora && (!current.ultimaVisita || item.fechaHora > current.ultimaVisita)) {
      current.ultimaVisita = item.fechaHora;
    }

    current.metodos.set(metodo, (current.metodos.get(metodo) || 0) + 1);
    current.metodoPrincipal =
      Array.from(current.metodos.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || metodo;

    map.set(socioId, current);
  });

  return Array.from(map.values())
    .map(({ metodos, ...item }) => item)
    .sort((a, b) => b.visitas - a.visitas);
};

export const buildClaseSesiones = (
  asistencias: ReporteAsistenciaClaseItem[],
): ClaseSesion[] => {
  const map = new Map<string, ClaseSesion>();

  asistencias.forEach((item) => {
    const actividad = getActividad(item);
    const entrenador = getEntrenador(item);
    const fecha = dateKey(getFechaClase(item));
    const horario = getHorarioTexto(item);
    const horarioId = readString(item, ["horarioId"], `${actividad}-${entrenador}-${horario}`);
    const key = `${fecha}-${horarioId}-${actividad}-${entrenador}`;
    const capacidad = getCapacidadClase(item);
    const current = map.get(key) || {
      key,
      actividad,
      entrenador,
      fecha,
      horario,
      horarioId,
      presentes: 0,
      ausentes: 0,
      total: 0,
      capacidad,
      ocupacion: null,
      miembrosPresentes: [],
      miembrosAusentes: [],
    };

    current.total += 1;

    const miembro = {
      socioId: getSocioId(item),
      nombre: getSocioNombre(item),
      fotoUrl: getFotoUrl(item),
    };

    if (isAusente(item)) {
      current.ausentes += 1;
      current.miembrosAusentes.push(miembro);
    } else {
      current.presentes += 1;
      current.miembrosPresentes.push(miembro);
    }

    if (!current.capacidad && capacidad) current.capacidad = capacidad;
    current.ocupacion = current.capacidad ? (current.presentes / current.capacidad) * 100 : null;

    map.set(key, current);
  });

  return Array.from(map.values()).sort((a, b) => {
    const byDate = b.fecha.localeCompare(a.fecha);
    if (byDate !== 0) return byDate;

    return b.presentes - a.presentes;
  });
};

export const buildLowAttendance = (frecuencias: SocioFrecuencia[], threshold = 1) =>
  frecuencias
    .filter((item) => item.visitas <= threshold)
    .sort((a, b) => a.visitas - b.visitas || a.socio.localeCompare(b.socio));

export const buildPdfHtml = ({
  desde,
  hasta,
  tab,
  frecuencias,
  lowAttendance,
  ingresosPorDia,
  sesiones,
  clasesPopulares,
}: {
  desde: string;
  hasta: string;
  tab: ReportTab;
  frecuencias: SocioFrecuencia[];
  lowAttendance: SocioFrecuencia[];
  ingresosPorDia: ChartRow[];
  sesiones: ClaseSesion[];
  clasesPopulares: ChartRow[];
}) => {
  const title = tab === "gimnasio" ? "Reporte de asistencia al gimnasio" : "Reporte de asistencia a clases";
  const totalIngresos = frecuencias.reduce((acc, item) => acc + item.visitas, 0);
  const totalPresentes = sesiones.reduce((acc, item) => acc + item.presentes, 0);
  const totalAusentes = sesiones.reduce((acc, item) => acc + item.ausentes, 0);
  const ocupaciones = sesiones
    .map((item) => item.ocupacion)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const ocupacionPromedio = ocupaciones.length
    ? ocupaciones.reduce((acc, value) => acc + value, 0) / ocupaciones.length
    : null;

  const kpis =
    tab === "gimnasio"
      ? [
          ["Ingresos registrados", formatNumber(totalIngresos)],
          ["Socios con ingreso", formatNumber(frecuencias.length)],
          ["Baja presencialidad", formatNumber(lowAttendance.length)],
          ["Días con movimiento", formatNumber(ingresosPorDia.length)],
        ]
      : [
          ["Sesiones reportadas", formatNumber(sesiones.length)],
          ["Presentes", formatNumber(totalPresentes)],
          ["Ausentes", formatNumber(totalAusentes)],
          ["Ocupación promedio", ocupacionPromedio === null ? "Sin dato" : formatPercent(ocupacionPromedio)],
        ];

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${htmlEscape(title)}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #111827; font-family: Arial, Helvetica, sans-serif; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .cover { padding: 28px; border-radius: 22px; color: white; background: linear-gradient(135deg,#0f172a,#1e3a8a 55%,#4c1d95); margin-bottom: 22px; }
    .cover small { display: inline-block; padding: 6px 10px; border-radius: 999px; background: rgba(255,255,255,.14); font-size: 10px; letter-spacing: .08em; text-transform: uppercase; font-weight: 800; }
    .cover h1 { margin: 14px 0 8px; font-size: 31px; letter-spacing: -1px; }
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
    table { width: 100%; border-collapse: collapse; margin: 8px 0 18px; font-size: 11px; page-break-inside: avoid; }
    th { color: #0f172a; background: #e2e8f0; text-align: left; padding: 9px; font-size: 10px; text-transform: uppercase; letter-spacing: .04em; }
    td { padding: 9px; border-bottom: 1px solid #e5e7eb; color: #334155; vertical-align: top; }
    tr:nth-child(even) td { background: #f8fafc; }
    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; color: #64748b; font-size: 10px; line-height: 1.5; }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>
  <section class="cover">
    <small>Cuerpo Sano · Módulo Reportes</small>
    <h1>${htmlEscape(title)}</h1>
    <p>Informe generado según documentación funcional: frecuencia, fechas, clase, entrenador y miembros presentes.</p>
    <div class="meta">
      <div><span>Período</span><strong>${htmlEscape(formatDate(desde))} al ${htmlEscape(formatDate(hasta))}</strong></div>
      <div><span>Generado</span><strong>${htmlEscape(formatDate(new Date().toISOString()))}</strong></div>
      <div><span>Tipo</span><strong>${tab === "gimnasio" ? "RF-45" : "RF-46"}</strong></div>
    </div>
  </section>

  <h2>Resumen del período</h2>
  <section class="grid">
    ${kpis.map(([label, value]) => `<article class="kpi"><span>${htmlEscape(label)}</span><strong>${htmlEscape(value)}</strong></article>`).join("")}
  </section>

  ${
    tab === "gimnasio"
      ? `
        <h2>Frecuencia por socio</h2>
        <table>
          <thead><tr><th>Socio</th><th>DNI</th><th>Visitas</th><th>Primera visita</th><th>Última visita</th><th>Método principal</th></tr></thead>
          <tbody>
            ${frecuencias.slice(0, 40).map((item) => `<tr><td>${htmlEscape(item.socio)}</td><td>${htmlEscape(item.dni)}</td><td>${htmlEscape(item.visitas)}</td><td>${htmlEscape(formatDate(item.primeraVisita))}</td><td>${htmlEscape(formatDate(item.ultimaVisita))}</td><td>${htmlEscape(item.metodoPrincipal)}</td></tr>`).join("") || `<tr><td colspan="6">Sin ingresos registrados.</td></tr>`}
          </tbody>
        </table>

        <h2>Socios con baja presencialidad</h2>
        <table>
          <thead><tr><th>Socio</th><th>DNI</th><th>Visitas</th><th>Último ingreso</th></tr></thead>
          <tbody>
            ${lowAttendance.slice(0, 30).map((item) => `<tr><td>${htmlEscape(item.socio)}</td><td>${htmlEscape(item.dni)}</td><td>${htmlEscape(item.visitas)}</td><td>${htmlEscape(formatDate(item.ultimaVisita))}</td></tr>`).join("") || `<tr><td colspan="4">No se detectaron socios con baja presencialidad dentro del corte.</td></tr>`}
          </tbody>
        </table>
      `
      : `
        <h2>Popularidad de actividades</h2>
        <table>
          <thead><tr><th>Actividad</th><th>Registros</th></tr></thead>
          <tbody>
            ${clasesPopulares.slice(0, 30).map((item) => `<tr><td>${htmlEscape(item.name)}</td><td>${htmlEscape(item.value)}</td></tr>`).join("") || `<tr><td colspan="2">Sin registros de clases.</td></tr>`}
          </tbody>
        </table>

        <h2>Sesiones con miembros presentes y ausentes</h2>
        <table>
          <thead><tr><th>Fecha</th><th>Clase</th><th>Entrenador</th><th>Presentes</th><th>Ausentes</th><th>Ocupación</th><th>Miembros presentes</th><th>Miembros ausentes</th></tr></thead>
          <tbody>
            ${sesiones.slice(0, 40).map((item) => `<tr><td>${htmlEscape(formatDate(item.fecha))}</td><td>${htmlEscape(item.actividad)}<br/><small>${htmlEscape(item.horario)}</small></td><td>${htmlEscape(item.entrenador)}</td><td>${htmlEscape(item.presentes)}</td><td>${htmlEscape(item.ausentes)}</td><td>${item.ocupacion === null ? "Sin dato" : htmlEscape(formatPercent(item.ocupacion || 0))}</td><td>${htmlEscape(item.miembrosPresentes.slice(0, 8).map((socio) => socio.nombre).join(", "))}${item.miembrosPresentes.length > 8 ? "..." : ""}</td><td>${htmlEscape(item.miembrosAusentes.slice(0, 8).map((socio) => socio.nombre).join(", "))}${item.miembrosAusentes.length > 8 ? "..." : ""}</td></tr>`).join("") || `<tr><td colspan="8">Sin sesiones registradas.</td></tr>`}
          </tbody>
        </table>
      `
  }

  <div class="footer">
    Documento generado desde Cuerpo Sano. El reporte se construye con los registros disponibles para el período seleccionado.
    La tasa de ocupación se informa únicamente cuando la respuesta del backend incluye capacidad/cupo.
  </div>
</body>
</html>`;
};
