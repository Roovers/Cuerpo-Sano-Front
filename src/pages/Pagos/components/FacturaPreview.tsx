import {
  BadgeCheck,
  CalendarDays,
  CreditCard,
  FileText,
  Hash,
  Landmark,
  ReceiptText,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import logo from "../../../assets/logo.png";
import "./FacturaPreview.css";

interface FacturaPreviewProps {
  comprobante: any;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  });
};

const formatDate = (value?: string) => {
  if (!value) {
    return new Date().toLocaleDateString("es-AR");
  }

  return new Date(value).toLocaleDateString("es-AR");
};

const medioPagoLabel = (medio?: number | string) => {
  const map: Record<number, string> = {
    1: "Efectivo",
    2: "Transferencia",
    3: "Tarjeta",
    4: "Débito",
    5: "Otro",
  };

  if (typeof medio === "number") return map[medio] || `Medio ${medio}`;
  return medio || "No especificado";
};

const getMedioPago = (pago: any) => {
  return (
    pago.medioPagoNombre ||
    pago.medioPagoDescripcion ||
    pago.medioPagoTexto ||
    medioPagoLabel(pago.medioPago)
  );
};

const getSocioNombre = (socio: any, pago: any) => {
  const nombre = `${socio?.nombre || ""} ${socio?.apellido || ""}`.trim();

  if (nombre) return nombre;

  if (pago?.socioNombre) return pago.socioNombre;

  return "Socio no informado";
};

const getDetalleAbonado = (comprobante: any, pago: any) => {
  const observacion = pago?.observacion?.trim?.();
  const detalle = comprobante?.detalle?.trim?.();

  if (observacion) return observacion;
  if (detalle && !detalle.toLowerCase().includes("comprobante de pago")) return detalle;

  return "Pago de producto o plan no especificado";
};

export default function FacturaPreview({ comprobante }: FacturaPreviewProps) {
  const pago = comprobante?.pago || {};
  const socio = pago?.socio || comprobante?.socio || {};
  const numero = comprobante?.numero || comprobante?.numeroComprobante || "Sin número";
  const fechaEmision = formatDate(comprobante?.fechaEmision || comprobante?.fecha);
  const fechaPago = formatDate(pago?.fechaPago || comprobante?.fechaPago);
  const monto = Number(pago?.monto || comprobante?.monto || 0);
  const detalleAbonado = getDetalleAbonado(comprobante, pago);

  return (
    <article className="invoice-premium-sheet">
      <div className="invoice-watermark" aria-hidden="true">
        <img src={logo} alt="" />
      </div>

      <header className="invoice-premium-hero">
        <div className="invoice-brand-block">
          <div className="invoice-logo-frame">
            <img src={logo} alt="Cuerpo Sano" />
          </div>

          <div>
            <span>Gimnasio</span>
            <h1>Cuerpo Sano</h1>
            <p>Sistema de gestión integral para socios, membresías y pagos.</p>
          </div>
        </div>

        <div className="invoice-status-card">
          <div className="invoice-status-top">
            <span>Comprobante</span>
            <BadgeCheck size={19} />
          </div>

          <strong>{numero}</strong>
          <p>Emitido el {fechaEmision}</p>
        </div>
      </header>

      <section className="invoice-premium-summary">
        <div className="invoice-summary-card featured">
          <span>Total abonado</span>
          <strong>{formatCurrency(monto)}</strong>
          <p>Importe final registrado en el sistema.</p>
        </div>

        <div className="invoice-summary-card">
          <CalendarDays size={19} />
          <span>Fecha de pago</span>
          <strong>{fechaPago}</strong>
        </div>

        <div className="invoice-summary-card">
          <CreditCard size={19} />
          <span>Medio de pago</span>
          <strong>{getMedioPago(pago)}</strong>
        </div>
      </section>

      <section className="invoice-premium-grid">
        <div className="invoice-info-panel">
          <div className="invoice-panel-title">
            <Landmark size={19} />
            <h2>Datos del emisor</h2>
          </div>

          <dl>
            <div>
              <dt>Razón social</dt>
              <dd>Gimnasio Cuerpo Sano</dd>
            </div>

            <div>
              <dt>Dirección</dt>
              <dd>Fray Cayetano 2205</dd>
            </div>

            <div>
              <dt>Teléfono</dt>
              <dd>1145678900</dd>
            </div>

            <div>
              <dt>Email</dt>
              <dd>administracion@cuerposano.com</dd>
            </div>
          </dl>
        </div>

        <div className="invoice-info-panel">
          <div className="invoice-panel-title">
            <UserRound size={19} />
            <h2>Datos del socio</h2>
          </div>

          <dl>
            <div>
              <dt>Cliente</dt>
              <dd>{getSocioNombre(socio, pago)}</dd>
            </div>

            <div>
              <dt>DNI</dt>
              <dd>{socio?.dni || pago?.socioDni || "Sin DNI"}</dd>
            </div>

            <div>
              <dt>Email</dt>
              <dd>{socio?.email || pago?.socioEmail || "Sin email"}</dd>
            </div>

            <div>
              <dt>N° socio</dt>
              <dd>{socio?.numeroSocio || pago?.numeroSocio || "-"}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="invoice-detail-panel">
        <div className="invoice-panel-title">
          <ReceiptText size={19} />
          <h2>Detalle del comprobante</h2>
        </div>

        <div className="invoice-detail-table">
          <div className="invoice-detail-head">
            <span>Cant.</span>
            <span>Descripción</span>
            <span>Subtotal</span>
            <span>Total</span>
          </div>

          <div className="invoice-detail-row">
            <span>1</span>
            <strong>{detalleAbonado}</strong>
            <span>{formatCurrency(monto)}</span>
            <span>{formatCurrency(monto)}</span>
          </div>
        </div>
      </section>

      <section className="invoice-premium-bottom">
        <div className="invoice-validation">
          <div>
            <ShieldCheck size={20} />
            <strong>Registro validado</strong>
          </div>

          <p>
            Este comprobante fue generado desde el sistema de gestión de Cuerpo Sano.
            Conservá este número para futuras consultas.
          </p>

          <div className="invoice-code-row">
            <Hash size={15} />
            <span>{numero}</span>
          </div>
        </div>

        <div className="invoice-totals">
          <div>
            <span>Subtotal</span>
            <strong>{formatCurrency(monto)}</strong>
          </div>

          <div>
            <span>Descuentos</span>
            <strong>{formatCurrency(0)}</strong>
          </div>

          <div className="total">
            <span>Total</span>
            <strong>{formatCurrency(monto)}</strong>
          </div>
        </div>
      </section>

      <footer className="invoice-premium-footer">
        <div>
          <FileText size={16} />
          <span>Comprobante interno no fiscal</span>
        </div>

        <p>Gracias por formar parte de Cuerpo Sano.</p>
      </footer>
    </article>
  );
}
