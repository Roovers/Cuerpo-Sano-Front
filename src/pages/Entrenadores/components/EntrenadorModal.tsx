import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Award,
  BadgeCheck,
  Camera,
  IdCard,
  Mail,
  Phone,
  ShieldCheck,
  X,
} from "lucide-react";
import type { Actividad } from "../../../services/actividadesService";
import type {
  Entrenador,
  EntrenadorRequest,
} from "../../../services/entrenadoresService";
import {
  Avatar,
  Button,
  StatusBadge,
  ToggleSwitch,
} from "../../../components/ui";
import { getInitials } from "../../../utils/initials";
import "./EntrenadorModal.css";

interface Props {
  open: boolean;
  entrenador?: Entrenador | null;
  actividades: Actividad[];
  onClose: () => void;
  onSubmit: (data: EntrenadorRequest) => Promise<void>;
}

const initialForm: EntrenadorRequest = {
  nombre: "",
  apellido: "",
  dni: "",
  especialidadId: 0,
  certificado: true,
  telefono: "",
  email: "",
  fotoBase64: "",
  activo: true,
};

export default function EntrenadorModal({
  open,
  entrenador,
  actividades,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<EntrenadorRequest>(initialForm);
  const [previewFoto, setPreviewFoto] = useState("");
  const [loading, setLoading] = useState(false);

  const nombreCompleto = useMemo(() => {
    const nombre = `${form.nombre || ""} ${form.apellido || ""}`.trim();
    return nombre || "Nombre del entrenador";
  }, [form.nombre, form.apellido]);

  const iniciales = useMemo(() => {
    return getInitials(form.nombre, form.apellido, "EN");
  }, [form.nombre, form.apellido]);

  const especialidadNombre = useMemo(() => {
    const actividad = actividades.find(
      (item) => item.id === Number(form.especialidadId)
    );

    return actividad?.nombre || "Especialidad no seleccionada";
  }, [actividades, form.especialidadId]);

  useEffect(() => {
    if (entrenador) {
      setForm({
        nombre: entrenador.nombre || "",
        apellido: entrenador.apellido || "",
        dni: entrenador.dni || "",
        especialidadId: entrenador.especialidadId || 0,
        certificado: entrenador.certificado,
        telefono: entrenador.telefono || "",
        email: entrenador.email || "",
        fotoBase64: "",
        activo: entrenador.activo,
      });

      setPreviewFoto(entrenador.fotoUrl || "");
    } else {
      setForm(initialForm);
      setPreviewFoto("");
    }
  }, [entrenador, open]);

  if (!open) return null;

  const handleFotoChange = (file?: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Seleccioná un archivo de imagen válido.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no debería superar los 2 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      const result = reader.result as string;
      setPreviewFoto(result);
      setForm((prev) => ({
        ...prev,
        fotoBase64: result.split(",")[1],
      }));
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!form.nombre.trim() || !form.apellido.trim()) {
      toast.error("Ingresá nombre y apellido del entrenador.");
      return;
    }

    if (!form.dni.trim()) {
      toast.error("Ingresá el DNI del entrenador.");
      return;
    }

    if (!/^\d+$/.test(form.dni.trim())) {
      toast.error("El DNI debe contener solo números.");
      return;
    }

    if (!form.especialidadId) {
      toast.error("Seleccioná una especialidad.");
      return;
    }

    if (
      form.telefono?.trim() &&
      !/^[0-9+\-\s()]+$/.test(form.telefono.trim())
    ) {
      toast.error("Ingresá un teléfono válido.");
      return;
    }

    if (
      form.email?.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      toast.error("Ingresá un email válido.");
      return;
    }

    try {
      setLoading(true);

      await onSubmit({
        ...form,
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        dni: form.dni.trim(),
        telefono: form.telefono?.trim() || "",
        email: form.email?.trim() || "",
        especialidadId: Number(form.especialidadId),
        fotoBase64: form.fotoBase64 || "",
      });

      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="entrenador-modal">
        <button
          type="button"
          onClick={onClose}
          className="entrenador-modal-close"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>

        <div className="modal-header entrenador-modal-header">
          <div>
            <span>{entrenador ? "Editar entrenador" : "Nuevo entrenador"}</span>
            <h3>{entrenador ? "Modificar datos" : "Registrar entrenador"}</h3>
            <p>
              Cargá los datos profesionales, contacto, foto de perfil y disponibilidad del
              entrenador.
            </p>
          </div>
        </div>

        <div className="trainer-modal-layout">
          <div className="modal-grid trainer-form-grid">
            <label>
              Nombre
              <input
                value={form.nombre}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nombre: e.target.value }))
                }
                placeholder="Ej: Carlos"
              />
            </label>

            <label>
              Apellido
              <input
                value={form.apellido}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, apellido: e.target.value }))
                }
                placeholder="Ej: López"
              />
            </label>

            <label>
              DNI
              <input
                value={form.dni}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, dni: e.target.value }))
                }
                placeholder="Ej: 28123456"
              />
            </label>

            <label>
              Especialidad
              <select
                value={form.especialidadId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    especialidadId: Number(e.target.value),
                  }))
                }
              >
                <option value={0}>Seleccionar especialidad</option>
                {actividades.map((actividad) => (
                  <option key={actividad.id} value={actividad.id}>
                    {actividad.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Teléfono
              <input
                value={form.telefono || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, telefono: e.target.value }))
                }
                placeholder="Ej: 1122334455"
              />
            </label>

            <label>
              Email
              <input
                value={form.email || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="Ej: entrenador@email.com"
              />
            </label>

            <div className="trainer-toggle-row">
              <div className="trainer-toggle-field">
                <span>Certificación</span>

                <ToggleSwitch
                  checked={form.certificado}
                  checkedLabel="Vigente"
                  uncheckedLabel="Pendiente"
                  variantWhenUnchecked="warning"
                  onChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      certificado: checked,
                    }))
                  }
                />
              </div>

              <div className="trainer-toggle-field">
                <span>Estado laboral</span>

                <ToggleSwitch
                  checked={form.activo}
                  checkedLabel="Activo"
                  uncheckedLabel="Inactivo"
                  onChange={(checked) =>
                    setForm((prev) => ({ ...prev, activo: checked }))
                  }
                />
              </div>
            </div>

            <div className="trainer-photo-field">
              <span>Foto / avatar</span>

              <label className="trainer-photo-upload">
                <Camera size={17} />
                <strong>{previewFoto ? "Cambiar foto" : "Subir foto"}</strong>
                <small>JPG, PNG o WebP hasta 2 MB</small>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFotoChange(e.target.files?.[0])}
                />
              </label>
            </div>
          </div>

          <aside className="trainer-preview">
            <div className="trainer-preview-top">
              <div className="trainer-preview-avatar">
                <Avatar
                  size="lg"
                  src={previewFoto}
                  initials={iniciales}
                  alt={nombreCompleto}
                />

                <label className="trainer-preview-avatar-action">
                  <Camera size={15} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFotoChange(e.target.files?.[0])}
                  />
                </label>
              </div>

              <StatusBadge
                variant={form.activo ? "success" : "danger"}
                label={form.activo ? "Activo" : "Inactivo"}
              />
            </div>

            <h4>{nombreCompleto}</h4>

            <div className="trainer-preview-specialty">
              <Award size={17} />
              <span>{especialidadNombre}</span>
            </div>

            <div className="trainer-preview-info">
              <div>
                <IdCard size={16} />
                <span>{form.dni || "DNI no cargado"}</span>
              </div>

              <div>
                <Phone size={16} />
                <span>{form.telefono || "Sin teléfono"}</span>
              </div>

              <div>
                <Mail size={16} />
                <span>{form.email || "Sin email"}</span>
              </div>

              <div>
                <ShieldCheck size={16} />
                <span>
                  {form.certificado
                    ? "Certificación vigente"
                    : "Certificación pendiente"}
                </span>
              </div>
            </div>

            <div
              className={
                form.certificado
                  ? "trainer-preview-note"
                  : "trainer-preview-note warning"
              }
            >
              <BadgeCheck size={16} />
              <span>
                {form.certificado
                  ? "Entrenador habilitado para ser asignado a clases."
                  : "No debería asignarse a clases hasta regularizar la certificación."}
              </span>
            </div>
          </aside>
        </div>

        <div className="modal-actions entrenador-modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>

          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading
              ? "Guardando..."
              : entrenador
              ? "Guardar cambios"
              : "Crear entrenador"}
          </Button>
        </div>
      </div>
    </div>
  );
}
