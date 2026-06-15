import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, Dumbbell, Users, X } from "lucide-react";
import type {
  Actividad,
  ActividadRequest,
} from "../../../services/actividadesService";
import {
  Button,
  StatusBadge,
  ToggleSwitch,
} from "../../../components/ui";
import "./ActividadModal.css";

interface Props {
  open: boolean;
  actividad?: Actividad | null;
  onClose: () => void;
  onSubmit: (data: ActividadRequest) => Promise<void>;
}

const initialForm: ActividadRequest = {
  nombre: "",
  descripcion: "",
  cupoMaximo: 10,
  activa: true,
};

export default function ActividadModal({
  open,
  actividad,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<ActividadRequest>(initialForm);
  const [loading, setLoading] = useState(false);

  const descripcionPreview = useMemo(() => {
    return (
      form.descripcion?.trim() ||
      "Agregá una descripción clara para que el equipo identifique la actividad."
    );
  }, [form.descripcion]);

  useEffect(() => {
    if (actividad) {
      setForm({
        nombre: actividad.nombre || "",
        descripcion: actividad.descripcion || "",
        cupoMaximo: actividad.cupoMaximo || 10,
        activa: actividad.activa,
      });
    } else {
      setForm(initialForm);
    }
  }, [actividad, open]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!form.nombre.trim()) {
      toast.error("Ingresá el nombre de la actividad.");
      return;
    }

    if (Number(form.cupoMaximo) <= 0) {
      toast.error("El cupo máximo debe ser mayor a 0.");
      return;
    }

    try {
      setLoading(true);

      await onSubmit({
        ...form,
        nombre: form.nombre.trim(),
        descripcion: form.descripcion?.trim() || "",
        cupoMaximo: Number(form.cupoMaximo),
      });

      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="actividad-modal">
        <button
          type="button"
          onClick={onClose}
          className="actividad-modal-close"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>

        <div className="modal-header actividad-modal-header">
          <div>
            <span>{actividad ? "Editar actividad" : "Nueva actividad"}</span>
            <h3>{actividad ? "Modificar datos" : "Crear actividad"}</h3>
            <p>
              Definí el nombre, cupo y disponibilidad para usarla luego en
              horarios y clases.
            </p>
          </div>
        </div>

        <div className="activity-modal-layout">
          <div className="modal-grid activity-form-grid">
            <label className="full">
              Nombre
              <input
                value={form.nombre}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nombre: e.target.value }))
                }
                placeholder="Ej: Spinning"
              />
            </label>

            <div className="activity-compact-row">
              <label>
                Cupo máximo
                <input
                  type="number"
                  min={1}
                  value={form.cupoMaximo}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      cupoMaximo: Number(e.target.value),
                    }))
                  }
                />
              </label>

              <div className="activity-toggle-field">
                <span>Estado</span>

                <ToggleSwitch
                  checked={form.activa}
                  checkedLabel="Disponible"
                  uncheckedLabel="No disponible"
                  onChange={(checked) =>
                    setForm((prev) => ({ ...prev, activa: checked }))
                  }
                />
              </div>
            </div>

            <label className="full">
              Descripción
              <textarea
                value={form.descripcion || ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    descripcion: e.target.value,
                  }))
                }
                placeholder="Ej: Clase de entrenamiento cardiovascular en bicicleta fija"
              />
            </label>
          </div>

          <aside className="activity-preview">
            <div className="activity-preview-top">
              <div className="activity-preview-icon">
                <Dumbbell size={26} />
              </div>

              <StatusBadge
                variant={form.activa ? "success" : "danger"}
                label={form.activa ? "Disponible" : "No disponible"}
              />
            </div>

            <h4>{form.nombre.trim() || "Nombre de la actividad"}</h4>
            <p>{descripcionPreview}</p>

            <div className="preview-capacity">
              <div>
                <Users size={17} />
                <span>Cupo máximo</span>
              </div>

              <strong>{form.cupoMaximo || 0}</strong>
            </div>

            <div className={form.activa ? "preview-note" : "preview-note inactive"}>
              <CheckCircle2 size={16} />
              <span>
                {form.activa
                  ? "Lista para asociarse a horarios y clases."
                  : "No disponible para nuevos horarios."}
              </span>
            </div>
          </aside>
        </div>

        <div className="modal-actions actividad-modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>

          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading
              ? "Guardando..."
              : actividad
              ? "Guardar cambios"
              : "Crear actividad"}
          </Button>
        </div>
      </div>
    </div>
  );
}
