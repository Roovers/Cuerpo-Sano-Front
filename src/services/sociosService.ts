import { api } from "./api";

export interface Socio {
  id: number;
  numeroSocio?: string;
  codigoBarra?: string;
  nombre: string;
  apellido: string;
  dni: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  fechaNacimiento?: string;
  fotoUrl?: string;
  fotoBase64?: string;
  activo?: boolean;
  estadoMembresia?: string;
}

export interface SocioRequest {
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string;
  direccion: string;
  telefono: string;
  email: string;
  fotoBase64?: string;
}

const formatEstadoMembresia = (estado?: string) => {
  if (!estado || estado.trim() === "") return "Sin Membresía";

  const normalized = estado
    .trim()
    .replace(/\s+/g, "")
    .replace(/_/g, "")
    .toUpperCase();

  const labels: Record<string, string> = {
    SINMEMBRESIA: "Sin Membresía",
    PENDIENTEPAGO: "Pago pendiente",
    ACTIVA: "Activa",
    VENCIDA: "Vencida",
    CANCELADA: "Cancelada",
  };

  if (labels[normalized]) {
    return labels[normalized];
  }

  return estado
    .trim()
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/^./, (letter) => letter.toUpperCase());
};

const normalizeSocio = (socio: Socio): Socio => ({
  ...socio,
  estadoMembresia: formatEstadoMembresia(socio.estadoMembresia),
});

export const getSocios = async (buscar?: string) => {
  const response = await api.get<Socio[]>("/api/socios", {
    params: buscar ? { buscar } : {},
  });

  return Array.isArray(response.data)
    ? response.data.map(normalizeSocio)
    : [];
};

export const getSocioById = async (id: number) => {
  const response = await api.get<Socio>(`/api/socios/${id}`);
  return normalizeSocio(response.data);
};

export const crearSocio = async (data: SocioRequest) => {
  const response = await api.post("/api/socios", data);
  return normalizeSocio(response.data);
};

export const actualizarSocio = async (id: number, data: SocioRequest) => {
  const response = await api.put(`/api/socios/${id}`, data);
  return normalizeSocio(response.data);
};

export const eliminarSocio = async (id: number) => {
  const response = await api.delete(`/api/socios/${id}`);
  return response.data;
};
