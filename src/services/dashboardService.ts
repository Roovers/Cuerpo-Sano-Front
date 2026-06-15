import { api } from "./api";

const formatDateTime = (date: string, endOfDay = false) => {
  if (!date) return undefined;
  return `${date}${endOfDay ? "T23:59:59" : "T00:00:00"}`;
};

export interface DashboardResumen {
  totalSocios: number;
  sociosActivos: number;
  membresiasActivas: number;
  membresiasPendientesPago: number;
  membresiasPorVencer: number;
  pagosDelDia: number;
  recaudacionDelMes: number;
  asistenciasSociosHoy: number;
  asistenciasClasesHoy: number;
  clasesProgramadasHoy: number;
  actividadesActivas: number;
  entrenadoresActivos: number;
}

export interface DashboardActividadItem {
  tipo?: string;
  descripcion?: string;
  socio?: string;
  fecha?: string;
  monto?: number;
  numeroSocio?: string;
  fechaInicio?: string;
  fechaFin?: string;
  actividad?: string;
  entrenador?: string;
  horario?: string;
  [key: string]: unknown;
}

export interface DashboardActividadReciente {
  ultimoPago?: DashboardActividadItem | null;
  ultimaAsistencia?: DashboardActividadItem | null;
  ultimaMembresiaActivada?: DashboardActividadItem | null;
  ultimoSocio?: DashboardActividadItem | null;
  proximaClase?: DashboardActividadItem | null;
  clasesEnEsteMomento?: DashboardActividadItem[];
}

export interface DashboardGraficoItem {
  fecha?: string;
  dia?: string;
  actividad?: string;
  estado?: string;
  nombre?: string;
  total?: number;
  cantidad?: number;
  monto?: number;
  valor?: number;
  [key: string]: unknown;
}

export interface DashboardGraficos {
  filtros?: {
    desde?: string;
    hasta?: string;
  };
  recaudacionPorDia: DashboardGraficoItem[];
  asistenciasPorDia: DashboardGraficoItem[];
  asistenciasPorActividad: DashboardGraficoItem[];
  membresiasPorEstado: DashboardGraficoItem[];
}

export interface DashboardMembresiaPorVencer {
  socioId?: number;
  membresiaId?: number;
  socio?: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  numeroSocio?: string;
  tipoMembresia?: string;
  fechaVencimiento?: string;
  fechaFin?: string;
  diasRestantes?: number;
  [key: string]: unknown;
}

export interface DashboardVencimientosResponse {
  dias: number;
  cantidad: number;
  membresias: DashboardMembresiaPorVencer[];
}

const emptyResumen: DashboardResumen = {
  totalSocios: 0,
  sociosActivos: 0,
  membresiasActivas: 0,
  membresiasPendientesPago: 0,
  membresiasPorVencer: 0,
  pagosDelDia: 0,
  recaudacionDelMes: 0,
  asistenciasSociosHoy: 0,
  asistenciasClasesHoy: 0,
  clasesProgramadasHoy: 0,
  actividadesActivas: 0,
  entrenadoresActivos: 0,
};

export const emptyDashboardResumen = emptyResumen;

const normalizeArray = <T>(value: unknown): T[] => {
  return Array.isArray(value) ? (value as T[]) : [];
};

export const getDashboardResumen = async (): Promise<DashboardResumen> => {
  const response = await api.get("/api/dashboard/resumen");
  return { ...emptyResumen, ...(response.data || {}) };
};

export const getDashboardActividadReciente = async (): Promise<DashboardActividadReciente> => {
  const response = await api.get("/api/dashboard/actividad-reciente");
  return response.data || {};
};

export const getDashboardGraficos = async (
  desde?: string,
  hasta?: string
): Promise<DashboardGraficos> => {
  const response = await api.get("/api/dashboard/graficos", {
    params: {
      ...(desde ? { desde: formatDateTime(desde) } : {}),
      ...(hasta ? { hasta: formatDateTime(hasta, true) } : {}),
    },
  });

  const data = response.data || {};

  return {
    filtros: data.filtros,
    recaudacionPorDia: normalizeArray<DashboardGraficoItem>(data.recaudacionPorDia),
    asistenciasPorDia: normalizeArray<DashboardGraficoItem>(data.asistenciasPorDia),
    asistenciasPorActividad: normalizeArray<DashboardGraficoItem>(data.asistenciasPorActividad),
    membresiasPorEstado: normalizeArray<DashboardGraficoItem>(data.membresiasPorEstado),
  };
};

export const getDashboardMembresiasPorVencer = async (
  dias = 7
): Promise<DashboardVencimientosResponse> => {
  const response = await api.get("/api/dashboard/membresias-por-vencer", {
    params: { dias },
  });

  const data = response.data || {};

  return {
    dias: Number(data.dias ?? dias),
    cantidad: Number(data.cantidad ?? data.membresias?.length ?? 0),
    membresias: normalizeArray<DashboardMembresiaPorVencer>(data.membresias),
  };
};
