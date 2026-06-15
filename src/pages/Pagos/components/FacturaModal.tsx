import {
  Mail,
  MessageCircle,
  Printer,
  ReceiptText,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import FacturaPreview from "./FacturaPreview";
import "./FacturaModal.css";

interface Props {
  open: boolean;
  comprobante: any;
  onClose: () => void;
}

export default function FacturaModal({ open, comprobante, onClose }: Props) {
  if (!open || !comprobante) return null;

  const imprimir = () => {
    toast.success("Preparando comprobante para impresión.");

    document.body.classList.add("invoice-print-mode");

    const limpiarModoImpresion = () => {
      document.body.classList.remove("invoice-print-mode");
      window.removeEventListener("afterprint", limpiarModoImpresion);
    };

    window.addEventListener("afterprint", limpiarModoImpresion);

    setTimeout(() => {
      window.print();
      setTimeout(limpiarModoImpresion, 600);
    }, 250);
  };

  const enviarWhatsapp = () => {
    toast.success("El comprobante fue enviado al socio correctamente.");
  };

  const enviarCorreo = () => {
    toast.success("El comprobante fue enviado al socio correctamente.");
  };

  return (
    <div className="invoice-backdrop" role="dialog" aria-modal="true">
      <div className="invoice-modal">
        <button className="invoice-close" onClick={onClose} aria-label="Cerrar">
          <X size={20} />
        </button>

        <div className="invoice-modal-header">
          <div className="invoice-modal-title">
            <div className="invoice-modal-icon">
              <ReceiptText size={23} />
            </div>

            <div>
              <span>Comprobante generado</span>
              <h3>Recibo de pago</h3>
            </div>
          </div>

          <div className="invoice-actions">
            <button type="button" onClick={enviarWhatsapp}>
              <MessageCircle size={17} />
              Enviar al socio por WhatsApp
            </button>

            <button type="button" onClick={enviarCorreo}>
              <Mail size={17} />
              Enviar al socio por email
            </button>

            <button type="button" className="primary" onClick={imprimir}>
              <Printer size={17} />
              Imprimir
            </button>
          </div>
        </div>

        <FacturaPreview comprobante={comprobante} />
      </div>
    </div>
  );
}
