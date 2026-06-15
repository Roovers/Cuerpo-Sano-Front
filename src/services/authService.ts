import { api } from "./api";

export interface LoginRequest {
  usuario: string;
  password: string;
}

export const login = async (data: LoginRequest) => {
  const response = await api.post("/api/auth/login", data);

  return response.data;
};

export interface SesionActualResponse {
  id: number;
  nombreUsuario: string;
  rol: string;
  activo: boolean;
  entrenadorId?: number | null;
  entrenadorNombre?: string | null;
  paginas: string[];
  acciones: string[];
  cards: string[];
}

export const getSesionActual = async () => {
  const response = await api.get<SesionActualResponse>("/api/auth/me");
  return response.data;
};
