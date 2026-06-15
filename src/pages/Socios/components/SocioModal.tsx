import { useEffect, useState } from "react";
import { Camera, MapPin, Phone, ShieldCheck, UserRound, X } from "lucide-react";
import Barcode from "react-barcode";
import type { Socio, SocioRequest } from "../../../services/sociosService";
import "./SocioModal.css";
import toast from "react-hot-toast";
import logo from "../../../assets/logo.png";
import { DatePicker } from "../../../components/ui";

interface Props {
  open: boolean;
  socio?: Socio | null;
  onClose: () => void;
  onSubmit: (data: SocioRequest) => Promise<void>;
}

const initialForm: SocioRequest = {
  nombre: "",
  apellido: "",
  dni: "",
  fechaNacimiento: "",
  direccion: "",
  telefono: "",
  email: "",
  fotoBase64: "",
};

export default function SocioModal({ open, socio, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<SocioRequest>(initialForm);
  const [previewFoto, setPreviewFoto] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (socio) {
      setForm({
        nombre: socio.nombre || "",
        apellido: socio.apellido || "",
        dni: socio.dni || "",
        fechaNacimiento: socio.fechaNacimiento
          ? socio.fechaNacimiento.substring(0, 10)
          : "",
        direccion: socio.direccion || "",
        telefono: socio.telefono || "",
        email: socio.email || "",
        fotoBase64: "",
      });

      setPreviewFoto(socio.fotoUrl || "");
    } else {
      setForm(initialForm);
      setPreviewFoto("");
    }
  }, [socio, open]);

  if (!open) return null;

  const handleChange = (field: keyof SocioRequest, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFotoChange = (file?: File) => {
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no debería superar los 2 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      const result = reader.result as string;
      setPreviewFoto(result);
      setForm((prev) => ({ ...prev, fotoBase64: result.split(",")[1] }));
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!form.nombre || !form.apellido || !form.dni || !form.fechaNacimiento) {
      toast.error("Completá nombre, apellido, DNI y fecha de nacimiento.");
      return;
    }

    if (form.email && !form.email.includes("@")) {
      toast.error("Ingresá un email válido.");
      return;
    }

    try {
      setLoading(true);
      await onSubmit(form);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const nombreCompleto =
    `${form.nombre || "Nombre"} ${form.apellido || "Apellido"}`.trim();

  const iniciales = `${form.nombre?.[0] || ""}${form.apellido?.[0] || ""}` || "CS";

  const numeroSocio = socio?.numeroSocio || "Se genera al guardar";
  const estadoMembresia = socio?.estadoMembresia || "Sin membresía";
  const barcodeValue = socio?.numeroSocio || form.dni || "CUERPO-SANO";

  const fechaNacimientoTexto = form.fechaNacimiento
    ? new Date(`${form.fechaNacimiento}T00:00:00`).toLocaleDateString("es-AR")
    : "Sin fecha";

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="socio-modal membership-modal"
        role="dialog"
        aria-modal="true"
        aria-label={socio ? "Editar socio" : "Nuevo socio"}
      >
        <div className="modal-header membership-header">
          <div className="modal-header-text">
            <span>{socio ? "Editar credencial" : "Nueva credencial"}</span>
            <h3>{socio ? "Modificar socio" : "Registrar socio"}</h3>
          </div>

          <button className="icon-button" onClick={onClose} aria-label="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        <div className="membership-layout">
          <section className="membership-preview-panel">
            <div className="membership-card">
              <div className="membership-card-glow" />

              <div className="membership-card-top">
                <div className="membership-brand">
                  <img src={logo} alt="Cuerpo Sano" />
                  <div>
                    <strong>CUERPO SANO</strong>
                    <span>CREDENCIALES DE SOCIO</span>
                  </div>
                </div>

                <span className="membership-chip">ACTIVO</span>
              </div>

              <div className="membership-main">
                <div className="membership-photo">
                  {previewFoto ? (
                    <img src={previewFoto} alt="Foto del socio" />
                  ) : (
                    <div className="membership-initials">
                      {iniciales}
                    </div>
                  )}

                  <label className="membership-photo-action">
                    <Camera size={15} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFotoChange(e.target.files?.[0])}
                    />
                  </label>
                </div>

                <div className="membership-identity">
                  <span>Socio titular</span>
                  <h4>{nombreCompleto}</h4>
                  <strong>{form.email || "socio@email.com"}</strong>
                </div>
              </div>

              <div className="membership-data-grid">
                <div>
                  <strong>DNI</strong>
                  <strong>{form.dni || "00.000.000"}</strong>
                </div>

                <div>
                  <strong>N° Socio</strong>
                  <strong>{numeroSocio}</strong>
                </div>

                <div>
                  <strong>Nacimiento</strong>
                  <strong>{fechaNacimientoTexto}</strong>
                </div>

                <div>
                  <strong>Membresía</strong>
                  <strong>{estadoMembresia}</strong>
                </div>
              </div>

              <div className="membership-contact-strip">
                <span>
                  <Phone size={13} />
                  {form.telefono || "Sin teléfono"}
                </span>

                <span>
                  <MapPin size={13} />
                  {form.direccion || "Sin dirección"}
                </span>
              </div>

              <div className="membership-card-bottom">
                <div className="membership-security">
                  <ShieldCheck size={15} />
                  Credencial validada
                </div>

                <div className="barcode-card-inline">
                  <Barcode
                    value={barcodeValue}
                    format="CODE128"
                    width={1.2}
                    height={34}
                    displayValue={false}
                    margin={0}
                    background="transparent"
                    lineColor="#020617"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="membership-form-panel">
            <div className="form-section-title">
              <UserRound size={18} />
              <div>
                <strong>Datos personales</strong>
                <span>Información principal del socio</span>
              </div>
            </div>

            <div className="modal-grid membership-grid">
              <label>
                Nombre
                <input
                  value={form.nombre}
                  onChange={(e) => handleChange("nombre", e.target.value)}
                  placeholder="Ej: Juan"
                  autoComplete="given-name"
                />
              </label>

              <label>
                Apellido
                <input
                  value={form.apellido}
                  onChange={(e) => handleChange("apellido", e.target.value)}
                  placeholder="Ej: Pérez"
                  autoComplete="family-name"
                />
              </label>

              <label>
                DNI
                <input
                  value={form.dni}
                  onChange={(e) => handleChange("dni", e.target.value)}
                  placeholder="Ej: 30111222"
                  inputMode="numeric"
                />
              </label>

              <label>
                Fecha de nacimiento
                <DatePicker
                  value={form.fechaNacimiento}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      fechaNacimiento: value,
                    }))
                  }
                  placeholder="Seleccionar fecha de nacimiento"
                  minYear={1930}
                  maxYear={new Date().getFullYear()}
                />
              </label>

              <label>
                Teléfono
                <input
                  value={form.telefono}
                  onChange={(e) => handleChange("telefono", e.target.value)}
                  placeholder="Ej: 1122334455"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </label>

              <label>
                Email
                <input
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="Ej: socio@email.com"
                  inputMode="email"
                  autoComplete="email"
                />
              </label>

              <label className="full">
                Dirección
                <input
                  value={form.direccion}
                  onChange={(e) => handleChange("direccion", e.target.value)}
                  placeholder="Ej: Av. Siempre Viva 123"
                  autoComplete="street-address"
                />
              </label>
            </div>

            <div className="membership-upload-inline">
              <div>
                <Camera size={18} />
                <div>
                  <strong>Foto del carnet</strong>
                  <span>JPG o PNG recomendado. Máx. 2 MB.</span>
                </div>
              </div>

              <label>
                Cargar foto
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFotoChange(e.target.files?.[0])}
                />
              </label>
            </div>

            <div className="modal-actions membership-actions">
              <button className="secondary-button" onClick={onClose} disabled={loading}>
                Cancelar
              </button>

              <button className="primary-button" onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <span className="sm-spinner" aria-hidden />
                    Guardando…
                  </>
                ) : socio ? (
                  "Guardar cambios"
                ) : (
                  "Crear socio"
                )}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}