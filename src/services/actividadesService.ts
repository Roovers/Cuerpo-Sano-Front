import { api } from "./api";

export interface Actividad {
  id: number;
  nombre: string;
  descripcion?: string;
  cupoMaximo: number;
  activa: boolean;
}

export interface ActividadRequest {
  nombre: string;
  descripcion?: string;
  cupoMaximo: number;
  activa: boolean;
}

export const getActividades = async (activa?: boolean) => {
  const response = await api.get<Actividad[]>("/api/actividades", {
    params: typeof activa === "boolean" ? { activa } : {},
  });

  return response.data;
};

export const crearActividad = async (data: ActividadRequest) => {
  const response = await api.post("/api/actividades", data);
  return response.data;
};

export const actualizarActividad = async (
  id: number,
  data: ActividadRequest
) => {
  const response = await api.put(`/api/actividades/${id}`, data);
  return response.data;
};

export const eliminarActividad = async (id: number) => {
  const response = await api.delete(`/api/actividades/${id}`);
  return response.data;
};