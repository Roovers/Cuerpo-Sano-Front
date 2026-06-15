import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Sparkles,
  X,
} from "lucide-react";
import type {
  TipoMembresia,
  TipoMembresiaRequest,
} from "../../../services/membresiasService";
import {
  Button,
  StatusBadge,
  ToggleSwitch,
} from "../../../components/ui";
import "./MembresiaModal.css";

interface Props {
  open: boolean;
  membresia?: TipoMembresia | null;
  onClose: () => void;
  onSubmit: (data: TipoMembresiaRequest) => Promise<void>;
}

const initialForm: TipoMembresiaRequest = {
  nombre: "",
  duracionDias: 30,
  precio: 0,
  descripcion: "",
  activa: true,
};

export default function MembresiaModal({
  open,
  membresia,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<TipoMembresiaRequest>(initialForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (membresia) {
      setForm({
        nombre: membresia.nombre || "",
        duracionDias: membresia.duracionDias || 30,
        precio: membresia.precio || 0,
        descripcion: membresia.descripcion || "",
        activa: membresia.activa,
      });
    } else {
      setForm(initialForm);
    }
  }, [membresia, open]);

  const precioFormateado = useMemo(() => {
    return Number(form.precio || 0).toLocaleString("es-AR");
  }, [form.precio]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!form.nombre.trim()) {
      toast.error("Ingresá el nombre de la membresía.");
      return;
    }

    if (form.duracionDias <= 0) {
      toast.error("La duración debe ser mayor a 0 días.");
      return;
    }

    if (form.precio <= 0) {
      toast.error("El precio debe ser mayor a 0.");
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        ...form,
        nombre: form.nombre.trim(),
        descripcion: form.descripcion?.trim() || "",
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="membresia-modal-backdrop" onClick={onClose}>
      <div
        className="membresia-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="membresia-close-button"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>

        <div className="membresia-modal-header">
          <div className="membresia-modal-icon">
            <ClipboardList size={25} />
          </div>

          <div>
            <span>{membresia ? "Editar plan" : "Nuevo plan"}</span>
            <h3>{membresia ? "Modificar membresía" : "Crear membresía"}</h3>
            <p>
              Definí el nombre comercial, duración, precio y disponibilidad del
              plan para los socios.
            </p>
          </div>
        </div>

        <div className="membresia-modal-body">
          <section className="membresia-form-panel">
            <div className="membresia-modal-grid">
              <label className="full">
                Nombre del plan
                <input
                  value={form.nombre}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, nombre: e.target.value }))
                  }
                  placeholder="Ej: Mensual Premium"
                />
              </label>

              <label>
                Duración
                <div className="modal-input-icon">
                  <CalendarDays size={18} />
                  <input
                    type="number"
                    value={form.duracionDias}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        duracionDias: Number(e.target.value),
                      }))
                    }
                    min={1}
                  />
                </div>
              </label>

              <label>
                Precio
                <div className="modal-input-icon">
                  <CircleDollarSign size={18} />
                  <input
                    type="number"
                    value={form.precio}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        precio: Number(e.target.value),
                      }))
                    }
                    min={0}
                  />
                </div>
              </label>

              <label className="full">
                Estado del plan
                <ToggleSwitch
                  checked={form.activa}
                  checkedLabel="Plan activo"
                  uncheckedLabel="Plan inactivo"
                  onChange={(checked) =>
                    setForm((prev) => ({ ...prev, activa: checked }))
                  }
                />
              </label>

              <label className="full">
                Descripción
                <textarea
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      descripcion: e.target.value,
                    }))
                  }
                  placeholder="Ej: Plan mensual con acceso completo al gimnasio y clases grupales."
                />
              </label>
            </div>
          </section>

          <aside className="membership-preview">
            <div className="membership-preview-top">
              <div className="membership-preview-icon">
                <Sparkles size={24} />
              </div>

              <StatusBadge
                variant={form.activa ? "success" : "danger"}
                label={form.activa ? "Activa" : "Inactiva"}
              />
            </div>

            <h4>{form.nombre.trim() || "Nombre del plan"}</h4>
            <p>
              {form.descripcion?.trim() ||
                "Agregá una descripción para que el equipo identifique el alcance del plan."}
            </p>

            <div className="membership-preview-price">
              <span>Precio</span>
              <strong>${precioFormateado}</strong>
            </div>

            <div className="membership-preview-details">
              <div>
                <CalendarDays size={17} />
                <span>{form.duracionDias || 0} días de duración</span>
              </div>

              <div>
                <CheckCircle2 size={17} />
                <span>
                  {form.activa
                    ? "Disponible para asignar a socios."
                    : "Oculto para nuevas asignaciones."}
                </span>
              </div>
            </div>
          </aside>
        </div>

        <div className="membresia-modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>

          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading
              ? "Guardando..."
              : membresia
              ? "Guardar cambios"
              : "Crear membresía"}
          </Button>
        </div>
      </div>
    </div>
  );
}
