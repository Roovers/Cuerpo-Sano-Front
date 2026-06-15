import { api } from "./api";

export interface Horario {
  id: number;
  diaSemana: number;
  diaSemanaNombre?: string;
  horaInicio: string;
  horaFin: string;
  actividadId: number;
  actividadNombre?: string;
  entrenadorId: number;
  entrenadorNombre?: string;
  entrenadorFotoUrl?: string;
  fechaDesde: string;
  fechaHasta: string;
  activo: boolean;
}

export interface HorarioRequest {
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  actividadId: number;
  entrenadorId: number;
  fechaDesde: string;
  fechaHasta: string;
  activo: boolean;
}

type LocalTimeLike =
  | string
  | {
      hour?: number;
      minute?: number;
      second?: number;
      nano?: number;
    }
  | null
  | undefined;

const pad = (value?: number) => String(value ?? 0).padStart(2, "0");

const normalizeTime = (value: LocalTimeLike) => {
  if (!value) return "00:00:00";

  if (typeof value === "string") {
    if (/^\d{2}:\d{2}$/.test(value)) return `${value}:00`;
    if (/^\d{2}:\d{2}:\d{2}$/.test(value)) return value;
    return value.substring(0, 8);
  }

  return `${pad(value.hour)}:${pad(value.minute)}:${pad(value.second)}`;
};

const normalizeDate = (value?: string) => {
  if (!value) return "";
  return value.includes("T") ? value.split("T")[0] : value;
};

const normalizeHorario = (horario: any): Horario => ({
  ...horario,
  horaInicio: normalizeTime(horario.horaInicio),
  horaFin: normalizeTime(horario.horaFin),
  fechaDesde: normalizeDate(horario.fechaDesde),
  fechaHasta: normalizeDate(horario.fechaHasta),
  actividadId: Number(horario.actividadId ?? horario.actividad?.id ?? 0),
  entrenadorId: Number(horario.entrenadorId ?? horario.entrenador?.id ?? 0),
  activo: Boolean(horario.activo),
});

const normalizeHorarioRequest = (data: HorarioRequest): HorarioRequest => ({
  ...data,
  diaSemana: Number(data.diaSemana),
  actividadId: Number(data.actividadId),
  entrenadorId: Number(data.entrenadorId),
  horaInicio: normalizeTime(data.horaInicio),
  horaFin: normalizeTime(data.horaFin),
  fechaDesde: normalizeDate(data.fechaDesde),
  fechaHasta: normalizeDate(data.fechaHasta),
  activo: Boolean(data.activo),
});

export const getHorarios = async (params?: {
  actividadId?: number;
  entrenadorId?: number;
  dia?: number;
  activo?: boolean;
  fechaDesde?: string;
  fechaHasta?: string;
}) => {
  const response = await api.get<Horario[]>("/api/horarios", {
    params,
  });

  return Array.isArray(response.data)
    ? response.data.map(normalizeHorario)
    : [];
};

export const crearHorario = async (data: HorarioRequest) => {
  const response = await api.post("/api/horarios", normalizeHorarioRequest(data));
  return normalizeHorario(response.data);
};

export const actualizarHorario = async (id: number, data: HorarioRequest) => {
  const response = await api.put(`/api/horarios/${id}`, normalizeHorarioRequest(data));
  return normalizeHorario(response.data);
};

export const eliminarHorario = async (id: number) => {
  const response = await api.delete(`/api/horarios/${id}`);
  return response.data;
};
