import { api } from "./api";

export interface InscripcionClase {
  id: number;
  socioId: number;
  socioNombre?: string;
  horarioId: number;
  actividadId?: number;
  actividadNombre?: string;
  entrenadorId?: number;
  entrenadorNombre?: string;
  diaSemana?: number;
  diaSemanaNombre?: string;
  horaInicio?: string;
  horaFin?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  fechaInscripcion?: string;
  activa?: boolean;

  socio?: {
    id: number;
    nombre: string;
    apellido: string;
    dni?: string;
  };

  /*
   * Importante:
   * AsistenciasPage pasa inscripcion.horario a funciones que esperan Horario.
   * Por eso fechaDesde y fechaHasta deben ser string obligatorios en este objeto.
   */
  horario?: {
    id: number;
    diaSemana: number;
    horaInicio: string;
    horaFin: string;
    actividadId: number;
    entrenadorId: number;
    fechaDesde: string;
    fechaHasta: string;
    activo: boolean;
  };
}

export interface InscripcionClaseRequest {
  socioId: number;
  horarioId: number;
}

const normalizarInscripciones = (data: any): InscripcionClase[] => {
  const items: any[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.resultados)
          ? data.resultados
          : Array.isArray(data?.inscripciones)
            ? data.inscripciones
            : [];

  return items.map((item) => ({
    ...item,
    horario: item.horario
      ? {
          ...item.horario,
          fechaDesde: item.horario.fechaDesde ?? item.fechaDesde ?? "",
          fechaHasta: item.horario.fechaHasta ?? item.fechaHasta ?? "",
        }
      : undefined,
  }));
};

export const getInscripcionesClases = async (
  socioId?: number,
  extraParams?: {
    horarioId?: number;
    activa?: boolean;
  }
) => {
  const response = await api.get("/api/inscripciones-clases", {
    params: {
      ...(socioId ? { socioId } : {}),
      ...(extraParams?.horarioId ? { horarioId: extraParams.horarioId } : {}),
      ...(typeof extraParams?.activa === "boolean" ? { activa: extraParams.activa } : {}),
    },
  });

  return normalizarInscripciones(response.data);
};

export const inscribirSocioAClase = async (
  data: InscripcionClaseRequest
) => {
  const response = await api.post("/api/inscripciones-clases", data);

  return response.data;
};

export const eliminarInscripcionClase = async (id: number) => {
  const response = await api.delete(`/api/inscripciones-clases/${id}`);

  return response.data;
};
