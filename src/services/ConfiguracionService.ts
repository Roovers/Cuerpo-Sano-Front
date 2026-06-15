import { api } from "./api";

export interface RolUsuario {
  id: number;
  nombre: string;
}

export interface Usuario {
  id: number;
  nombreUsuario: string;
  rol: string;
  activo: boolean;
  fechaCreacion?: string;
  ultimoAcceso?: string;
  entrenadorId?: number | null;
  entrenadorNombre?: string | null;
  [key: string]: unknown;
}

export interface UsuarioRequest {
  nombreUsuario: string;
  password: string;
  rol: string;
  activo: boolean;
}

export interface UsuarioUpdateRequest {
  nombreUsuario: string;
  rol: string;
  activo: boolean;
}

export interface Permiso {
  codigo: string;
  nombre: string;
  descripcion?: string;
}

export interface RolPermisos {
  rol: string;
  descripcion: string;
  paginas: Permiso[];
  acciones: Permiso[];
  cards: Permiso[];
  restricciones: string[];
}

export interface SesionActual {
  id: number;
  nombreUsuario?: string;
  usuario?: string;
  rol: string;
  activo: boolean;
  entrenadorId?: number | null;
  entrenadorNombre?: string | null;
  paginas?: string[];
  acciones?: string[];
  cards?: string[];
}

export interface AuditLog {
  id: number;
  fechaHora: string;
  usuarioId?: number | null;
  usuarioNombre: string;
  rol: string;
  modulo: string;
  accion: string;
  entidad?: string | null;
  entidadId?: string | null;
  resultado: string;
  detalle?: string | null;
}

export interface AuditLogPage {
  items: AuditLog[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export interface AuditLogFilters {
  desde?: string;
  hasta?: string;
  usuario?: string;
  modulo?: string;
  accion?: string;
  resultado?: string;
  page?: number;
  size?: number;
}

const normalizarUsuarios = (data: unknown): Usuario[] => {
  if (Array.isArray(data)) return data as Usuario[];

  const value = data as any;

  if (Array.isArray(value?.usuarios)) return value.usuarios;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.content)) return value.content;

  return [];
};

const normalizarRoles = (data: unknown): RolUsuario[] => {
  if (Array.isArray(data)) return data as RolUsuario[];

  const value = data as any;

  if (Array.isArray(value?.roles)) return value.roles;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;

  return [];
};

const normalizarAuditPage = (data: unknown): AuditLogPage => {
  const value = data as any;

  if (Array.isArray(data)) {
    return {
      items: data as AuditLog[],
      page: 0,
      size: data.length,
      totalItems: data.length,
      totalPages: 1,
    };
  }

  const items =
    value?.items ||
    value?.logs ||
    value?.data ||
    value?.content ||
    [];

  return {
    items: Array.isArray(items) ? items : [],
    page: Number(value?.page ?? value?.pagina ?? 0),
    size: Number(value?.size ?? value?.tamanio ?? 20),
    totalItems: Number(value?.totalItems ?? value?.totalElementos ?? value?.total ?? items.length ?? 0),
    totalPages: Number(value?.totalPages ?? value?.totalPaginas ?? 1),
  };
};

export const getSesionActual = async (): Promise<SesionActual> => {
  const response = await api.get("/api/auth/me");
  return response.data;
};

export const getRolesUsuarios = async (): Promise<RolUsuario[]> => {
  const response = await api.get("/api/usuarios/roles");
  return normalizarRoles(response.data);
};

export const getUsuarios = async (): Promise<Usuario[]> => {
  const response = await api.get("/api/usuarios");
  return normalizarUsuarios(response.data);
};

export const getUsuarioById = async (id: number): Promise<Usuario> => {
  const response = await api.get(`/api/usuarios/${id}`);
  return response.data;
};

export const crearUsuario = async (data: UsuarioRequest) => {
  const response = await api.post("/api/usuarios", data);
  return response.data;
};

export const actualizarUsuario = async (
  id: number,
  data: UsuarioUpdateRequest
) => {
  const response = await api.put(`/api/usuarios/${id}`, data);
  return response.data;
};

export const eliminarUsuario = async (id: number) => {
  const response = await api.delete(`/api/usuarios/${id}`);
  return response.data;
};

export const restablecerPassword = async (usuario: string) => {
  const response = await api.post("/api/auth/restablecer-password", {
    usuario,
  });

  return response.data;
};

export const cambiarPassword = async (
  passwordActual: string,
  passwordNueva: string
) => {
  const response = await api.post("/api/auth/cambiar-password", {
    passwordActual,
    passwordNueva,
  });

  return response.data;
};

export const logout = async () => {
  const response = await api.post("/api/auth/logout");
  return response.data;
};

export const getRolesPermisos = async (): Promise<RolPermisos[]> => {
  const response = await api.get("/api/configuracion/roles-permisos");
  return Array.isArray(response.data) ? response.data : [];
};

export const getRolPermisos = async (rol: string): Promise<RolPermisos> => {
  const response = await api.get(`/api/configuracion/roles-permisos/${encodeURIComponent(rol)}`);
  return response.data;
};

export const getAuditLogs = async (
  filters: AuditLogFilters = {}
): Promise<AuditLogPage> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      params.append(key, String(value));
    }
  });

  const response = await api.get(`/api/auditoria/logs?${params.toString()}`);
  return normalizarAuditPage(response.data);
};

export const getAuditLogById = async (id: number): Promise<AuditLog> => {
  const response = await api.get(`/api/auditoria/logs/${id}`);
  return response.data;
};
