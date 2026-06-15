import { api } from "./api";

export interface AsistenciaSocio {
  id: number;
  socioId: number;
  socioNombre?: string;
  socio?: string;
  nombre?: string;
  apellido?: string;
  dni?: string;
  fechaHora: string;
  metodoIngreso: string;
}

export interface AsistenciaSocioRequest {
  socioId: number;
  metodoIngreso: string;
}

export interface MetodoIngresoOption {
  id: number;
  nombre: string;
}

const normalizeArrayResponse = <T>(data: any, key: string): T[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;

  return [];
};

const toDateTimeParams = (desde?: string, hasta?: string) => ({
  ...(desde ? { desde: `${desde}T00:00:00` } : {}),
  ...(hasta ? { hasta: `${hasta}T23:59:59` } : {}),
});

export const getMetodosIngreso = async () => {
  const response = await api.get<MetodoIngresoOption[]>(
    "/api/opciones/metodos-ingreso",
  );

  return Array.isArray(response.data) ? response.data : [];
};

export const registrarAsistenciaSocio = async (
  data: AsistenciaSocioRequest,
) => {
  const response = await api.post("/api/asistencias/socios", data);

  return response.data;
};

export const getAsistenciasSocios = async (desde?: string, hasta?: string) => {
  const response = await api.get("/api/reportes/asistencia-socios", {
    params: toDateTimeParams(desde, hasta),
  });

  return normalizeArrayResponse<AsistenciaSocio>(response.data, "asistencias");
};

export type EstadoAsistenciaClase = "Presente" | "Ausente";

export interface AsistenciaClase {
  id: number;
  socioId: number;
  socioNombre?: string;
  horarioId: number;
  actividadId?: number;
  actividadNombre?: string;
  entrenadorId?: number;
  entrenadorNombre?: string;
  fechaClase?: string;
  fechaHora: string;
  estado?: EstadoAsistenciaClase;
}

export interface AsistenciaClaseRequest {
  socioId: number;
  horarioId: number;
}

export interface RegistroAsistenciaClaseItem {
  socioId: number;
  estado: EstadoAsistenciaClase;
}

export interface RegistroAsistenciaClaseRequest {
  horarioId: number;
  fechaClase: string;
  registros: RegistroAsistenciaClaseItem[];
}

export const registrarAsistenciaClase = async (
  data: AsistenciaClaseRequest,
) => {
  const response = await api.post("/api/asistencias/clases", data);

  return response.data;
};

export const guardarRegistroAsistenciaClase = async (
  data: RegistroAsistenciaClaseRequest,
) => {
  const response = await api.put("/api/asistencias/clases/registro", data);

  return response.data;
};

export const getAsistenciasClases = async (desde?: string, hasta?: string) => {
  const response = await api.get("/api/asistencias/clases", {
    params: toDateTimeParams(desde, hasta),
  });

  return normalizeArrayResponse<AsistenciaClase>(response.data, "asistencias");
};
