import { api } from "./api";

export interface PagoSocio {
  id?: number;
  numeroSocio?: string;
  nombre?: string;
  apellido?: string;
  dni?: string;
  email?: string;
}

export interface Pago {
  id: number;
  socioId: number;
  socioNombre?: string;
  socio?: PagoSocio;
  monto: number;
  fechaPago?: string;
  medioPago: number;
  medioPagoNombre?: string;
  observacion?: string;
  tieneComprobante?: boolean;
  comprobanteId?: number | null;
  comprobanteNumero?: string | null;
}

export interface PagoRequest {
  socioId: number;
  monto: number;
  medioPago: number;
  observacion?: string;
}

export interface MedioPagoOption {
  id: number;
  nombre: string;
}

export interface Comprobante {
  id: number;
  pagoId: number;
  numero: string;
  fechaEmision?: string;
  detalle?: string;
  pago?: Pago;
  socio?: PagoSocio;
  monto?: number;
  fechaPago?: string;
  medioPago?: number;
  medioPagoNombre?: string;
}

export interface ComprobanteRequest {
  pagoId?: number;
  detalle?: string;
}

const normalizarPagos = (data: any): Pago[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.pagos)) return data.pagos;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

export const getPagos = async (socioId?: number) => {
  const response = await api.get("/api/pagos", {
    params: socioId ? { socioId } : {},
  });

  return normalizarPagos(response.data);
};

export const getHistorialPagos = async (
  socioId?: number,
  desde?: string,
  hasta?: string
) => {
  const response = await api.get("/api/pagos/historial", {
    params: {
      ...(socioId ? { socioId } : {}),
      ...(desde ? { desde } : {}),
      ...(hasta ? { hasta } : {}),
    },
  });

  return normalizarPagos(response.data);
};

export const crearPago = async (data: PagoRequest) => {
  const response = await api.post("/api/pagos", data);
  return response.data;
};

export const actualizarPago = async (id: number, data: PagoRequest) => {
  const response = await api.put(`/api/pagos/${id}`, data);
  return response.data;
};

export const eliminarPago = async (id: number) => {
  const response = await api.delete(`/api/pagos/${id}`);
  return response.data;
};

export const getMediosPago = async () => {
  const response = await api.get<MedioPagoOption[]>("/api/opciones/medios-pago");
  return Array.isArray(response.data) ? response.data : [];
};

export const generarComprobante = async (
  pagoId: number,
  data: ComprobanteRequest
) => {
  const response = await api.post(`/api/pagos/${pagoId}/comprobante`, data);
  return response.data;
};

export const getComprobantes = async (pagoId?: number) => {
  const response = await api.get("/api/comprobantes", {
    params: pagoId ? { pagoId } : {},
  });

  if (Array.isArray(response.data)) return response.data as Comprobante[];
  if (Array.isArray(response.data?.comprobantes)) return response.data.comprobantes as Comprobante[];
  if (Array.isArray(response.data?.data)) return response.data.data as Comprobante[];

  return [];
};
