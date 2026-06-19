import { api } from "./api";

export interface Entrenador {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  especialidadId: number;
  especialidadNombre?: string;
  certificado: boolean;
  telefono?: string;
  email?: string;
  fotoUrl?: string;
  certificadoUrl?: string;
  activo: boolean;
}

export interface EntrenadorRequest {
  nombre: string;
  apellido: string;
  dni: string;
  especialidadId: number;
  certificado: boolean;
  telefono?: string;
  email?: string;
  fotoBase64?: string;
  certificadoBase64?: string;
  activo: boolean;
}

const normalizeEntrenador = (entrenador: Entrenador): Entrenador => ({
  ...entrenador,
  activo: Boolean(entrenador.activo),
  certificado: Boolean(entrenador.certificado),
});

export const getEntrenadores = async (buscar?: string) => {
  const response = await api.get<Entrenador[]>("/api/entrenadores", {
    params: buscar ? { buscar } : {},
  });

  return Array.isArray(response.data)
    ? response.data.map(normalizeEntrenador)
    : [];
};

export const crearEntrenador = async (data: EntrenadorRequest) => {
  const response = await api.post("/api/entrenadores", data);
  return normalizeEntrenador(response.data);
};

export const actualizarEntrenador = async (
  id: number,
  data: EntrenadorRequest
) => {
  const response = await api.put(`/api/entrenadores/${id}`, data);
  return normalizeEntrenador(response.data);
};

export const eliminarEntrenador = async (id: number) => {
  const response = await api.delete(`/api/entrenadores/${id}`);
  return response.data;
};

export interface EntrenadorCertificadoResponse {
  entrenadorId: number;
  nombre: string;
  apellido: string;
  certificado: boolean;
  certificadoUrl?: string;
}

export const consultarCertificadoEntrenador = async (id: number) => {
  const response = await api.get<EntrenadorCertificadoResponse>(
    `/api/entrenadores/${id}/certificado`
  );
  return response.data;
};
