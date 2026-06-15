import { api } from "./api";

const formatDateTime = (date: string, endOfDay = false) => {
  if (!date) return undefined;
  return `${date}${endOfDay ? "T23:59:59" : "T00:00:00"}`;
};

export interface ReporteAsistenciaSocioItem {
  id: number;
  socioId: number;
  nombre?: string;
  apellido?: string;
  fechaHora?: string;
  metodoIngreso?: string;
  fotoUrl?: string;
  socioFotoUrl?: string;
  [key: string]: unknown;
}

export interface ReporteAsistenciaClaseItem {
  id?: number;
  socioId?: number;
  horarioId?: number;
  nombre?: string;
  apellido?: string;
  socio?: string;
  fotoUrl?: string;
  socioFotoUrl?: string;
  actividad?: string;
  entrenador?: string;
  entrenadorFotoUrl?: string;
  fechaHora?: string;
  dia?: string;
  horaInicio?: string;
  horaFin?: string;
  cantidad?: number;
  [key: string]: unknown;
}

export interface ReporteAsistenciasResponse<T> {
  cantidad: number;
  asistencias: T[];
}

export interface ReportePagoSocio {
  id?: number;
  nombre?: string;
  apellido?: string;
  dni?: string;
  numeroSocio?: string;
  [key: string]: unknown;
}

export interface ReportePagoItem {
  id: number;
  socioId: number;
  socio?: ReportePagoSocio;
  monto: number;
  medioPago?: number | string;
  fecha?: string;
  fechaPago?: string;
  fechaHora?: string;
  observacion?: string;
  numeroComprobante?: string;
  [key: string]: unknown;
}

export interface ReportePagosHistorialResponse {
  cantidad: number;
  filtros?: {
    socioId?: number | null;
    desde?: string;
    hasta?: string;
  };
  pagos: ReportePagoItem[];
}

const normalizeAsistenciasResponse = <T>(data: any): ReporteAsistenciasResponse<T> => {
  const asistencias = Array.isArray(data?.asistencias)
    ? data.asistencias
    : Array.isArray(data)
      ? data
      : [];

  return {
    cantidad: Number(data?.cantidad ?? asistencias.length ?? 0),
    asistencias,
  };
};

export const getReporteAsistenciaSocios = async (
  desde?: string,
  hasta?: string
): Promise<ReporteAsistenciasResponse<ReporteAsistenciaSocioItem>> => {
  const response = await api.get("/api/reportes/asistencia-socios", {
    params: {
      ...(desde ? { desde: formatDateTime(desde) } : {}),
      ...(hasta ? { hasta: formatDateTime(hasta, true) } : {}),
    },
  });

  return normalizeAsistenciasResponse<ReporteAsistenciaSocioItem>(response.data);
};

export const getReporteAsistenciaClases = async (
  desde?: string,
  hasta?: string
): Promise<ReporteAsistenciasResponse<ReporteAsistenciaClaseItem>> => {
  const response = await api.get("/api/reportes/asistencia-clases", {
    params: {
      ...(desde ? { desde: formatDateTime(desde) } : {}),
      ...(hasta ? { hasta: formatDateTime(hasta, true) } : {}),
    },
  });

  return normalizeAsistenciasResponse<ReporteAsistenciaClaseItem>(response.data);
};

export const getReportePagosHistorial = async (
  desde?: string,
  hasta?: string,
  socioId?: number
): Promise<ReportePagosHistorialResponse> => {
  const response = await api.get("/api/pagos/historial", {
    params: {
      ...(socioId ? { socioId } : {}),
      ...(desde ? { desde: formatDateTime(desde) } : {}),
      ...(hasta ? { hasta: formatDateTime(hasta, true) } : {}),
    },
  });

  const data = response.data || {};
  const pagos = Array.isArray(data.pagos) ? data.pagos : Array.isArray(data) ? data : [];

  return {
    cantidad: Number(data.cantidad ?? pagos.length ?? 0),
    filtros: data.filtros,
    pagos,
  };
};
