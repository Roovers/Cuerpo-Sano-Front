import { api } from "./api";

export interface TipoMembresia {
  id: number;
  nombre: string;
  duracionDias: number;
  precio: number;
  descripcion?: string;
  activa: boolean;
}

export interface TipoMembresiaRequest {
  nombre: string;
  duracionDias: number;
  precio: number;
  descripcion?: string;
  activa: boolean;
}

export const getTiposMembresia = async () => {
  const response = await api.get<TipoMembresia[]>("/api/membresias/tipos");
  return response.data;
};

export const crearTipoMembresia = async (data: TipoMembresiaRequest) => {
  const response = await api.post("/api/membresias/tipos", data);
  return response.data;
};

export const actualizarTipoMembresia = async (
  id: number,
  data: TipoMembresiaRequest
) => {
  const response = await api.put(`/api/membresias/tipos/${id}`, data);
  return response.data;
};

export const eliminarTipoMembresia = async (id: number) => {
  const response = await api.delete(`/api/membresias/tipos/${id}`);
  return response.data;
};

export interface MembresiaSocio {
  id: number;
  socioId: number;
  tipoMembresiaId: number;
  fechaInicio: string;
  fechaFin: string;
  estado: number | string;
  pagoId?: number | null;
}

export interface MembresiaSocioRequest {
  socioId: number;
  tipoMembresiaId: number;
  fechaInicio: string;
}

export const getMembresiasPorSocio = async (socioId: number) => {
  const response = await api.get<MembresiaSocio[]>(
    `/api/membresias/socios/${socioId}`
  );

  return response.data;
};

export const crearMembresiaSocio = async (data: MembresiaSocioRequest) => {
  const response = await api.post("/api/membresias/socios", data);

  return response.data;
};

export const activarMembresiaSocio = async (
  membresiaId: number,
  numeroComprobante: string
) => {
  const response = await api.post(
    `/api/membresias/socios/${membresiaId}/activar`,
    null,
    {
      params: {
        numeroComprobante,
      },
    }
  );

  return response.data;
};