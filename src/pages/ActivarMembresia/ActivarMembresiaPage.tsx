import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  FileText,
  RefreshCcw,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { getSocios, type Socio } from "../../services/sociosService";
import {
  activarMembresiaSocio,
  getMembresiasPorSocio,
  getTiposMembresia,
  type MembresiaSocio,
  type TipoMembresia,
} from "../../services/membresiasService";
import {
  Avatar,
  Button,
  EmptyState,
  IconButton,
  PageHeader,
  SearchField,
  StatusBadge,
  SummaryBox,
} from "../../components/ui";
import SocioSelect from "../../components/ui/SocioSelect";
import { getInitials } from "../../utils/initials";
import "./ActivarMembresiaPage.css";

type BadgeVariant = "success" | "danger" | "warning" | "info" | "neutral";

const obtenerValorFecha = (fecha?: string) => {
  if (!fecha) return 0;

  const valor = new Date(fecha).getTime();
  return Number.isNaN(valor) ? 0 : valor;
};

const ordenarMembresiasDeActualAAnterior = (membresias: MembresiaSocio[]) => {
  return [...membresias].sort((a, b) => {
    const fechaInicioB = obtenerValorFecha(b.fechaInicio);
    const fechaInicioA = obtenerValorFecha(a.fechaInicio);

    if (fechaInicioB !== fechaInicioA) {
      return fechaInicioB - fechaInicioA;
    }

    const fechaFinB = obtenerValorFecha(b.fechaFin);
    const fechaFinA = obtenerValorFecha(a.fechaFin);

    if (fechaFinB !== fechaFinA) {
      return fechaFinB - fechaFinA;
    }

    return b.id - a.id;
  });
};

export default function ActivarMembresiaPage() {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [membresias, setMembresias] = useState<MembresiaSocio[]>([]);
  const [tipos, setTipos] = useState<TipoMembresia[]>([]);

  const [buscar, setBuscar] = useState("");
  const [socioId, setSocioId] = useState("");
  const [membresiaId, setMembresiaId] = useState("");
  const [numeroComprobante, setNumeroComprobante] = useState("");

  const [loading, setLoading] = useState(false);
  const [activando, setActivando] = useState(false);

  const socioSeleccionado = useMemo(() => {
    return socios.find((s) => s.id === Number(socioId));
  }, [socios, socioId]);

  const membresiasPendientes = useMemo(() => {
    return membresias.filter((m) => esPendientePago(m.estado));
  }, [membresias]);

  const membresiaSeleccionada = useMemo(() => {
    return membresias.find((m) => m.id === Number(membresiaId));
  }, [membresias, membresiaId]);

  const renderResumenSocio = () => {
    if (!socioSeleccionado) {
      return (
        <div className="summary-member">
          <Avatar size="md" initials="S" className="summary-avatar-empty" />

          <div>
            <strong>Sin socio seleccionado</strong>
            <p>Seleccioná un socio para validar membresías pendientes</p>
          </div>
        </div>
      );
    }

    return (
      <div className="summary-member">
        <Avatar
          size="md"
          src={socioSeleccionado.fotoUrl}
          alt={`${socioSeleccionado.nombre} ${socioSeleccionado.apellido}`}
          initials={getInitials(socioSeleccionado.nombre, socioSeleccionado.apellido, "S")}
        />

        <div>
          <strong>
            {socioSeleccionado.nombre} {socioSeleccionado.apellido}
          </strong>
          <p>
            DNI {socioSeleccionado.dni}
            {socioSeleccionado.numeroSocio
              ? ` · ${socioSeleccionado.numeroSocio}`
              : ""}
          </p>
        </div>
      </div>
    );
  };

  const cargarSocios = async () => {
    try {
      setLoading(true);

      const [sociosData, tiposData] = await Promise.all([
        getSocios(buscar),
        getTiposMembresia(),
      ]);

      setSocios(sociosData);
      setTipos(tiposData);
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar los socios.");
    } finally {
      setLoading(false);
    }
  };

  const cargarMembresiasSocio = async (id: number) => {
    try {
      setLoading(true);
      const data = await getMembresiasPorSocio(id);
      setMembresias(ordenarMembresiasDeActualAAnterior(data));
      setMembresiaId("");
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar las membresías del socio.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSocios();
  }, []);

  useEffect(() => {
    if (socioId) {
      cargarMembresiasSocio(Number(socioId));
    } else {
      setMembresias([]);
      setMembresiaId("");
    }
  }, [socioId]);

  function esPendientePago(estado: number | string) {
    return estado === 1 || estado === "1" || estado === "PendientePago";
  }

  const getEstadoVariant = (estado: number | string): BadgeVariant => {
    if (estado === 1 || estado === "1" || estado === "PendientePago") return "warning";
    if (estado === 2 || estado === "2" || estado === "Activa") return "success";
    if (estado === 3 || estado === "3" || estado === "Vencida") return "danger";
    return "neutral";
  };

  const getNombrePlan = (membresia: MembresiaSocio) => {
    const membresiaConTipo = membresia as MembresiaSocio & {
      tipoMembresiaId?: number;
      tipoMembresia?: { nombre?: string };
      nombreTipoMembresia?: string;
      tipoMembresiaNombre?: string;
    };

    if (membresiaConTipo.tipoMembresia?.nombre) {
      return membresiaConTipo.tipoMembresia.nombre;
    }

    if (membresiaConTipo.nombreTipoMembresia) {
      return membresiaConTipo.nombreTipoMembresia;
    }

    if (membresiaConTipo.tipoMembresiaNombre) {
      return membresiaConTipo.tipoMembresiaNombre;
    }

    const tipo = tipos.find(
      (t) => t.id === Number(membresiaConTipo.tipoMembresiaId)
    );

    return tipo?.nombre || "Plan no especificado";
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-AR");
  };

  const mostrarEstado = (estado: number | string) => {
    if (estado === 1 || estado === "1" || estado === "PendientePago") return "Pendiente pago";
    if (estado === 2 || estado === "2" || estado === "Activa") return "Activa";
    if (estado === 3 || estado === "3" || estado === "Vencida") return "Vencida";
    if (estado === 4 || estado === "4" || estado === "Anulada") return "Anulada";
    return String(estado);
  };

  const activar = async () => {
    if (!socioId) {
      toast.error("Seleccioná un socio.");
      return;
    }

    if (!membresiaId) {
      toast.error("Seleccioná una membresía pendiente.");
      return;
    }

    if (!numeroComprobante.trim()) {
      toast.error("Ingresá el número de comprobante.");
      return;
    }

    try {
      setActivando(true);

      await activarMembresiaSocio(
        Number(membresiaId),
        numeroComprobante.trim()
      );

      toast.success("Membresía activada correctamente.");

      setNumeroComprobante("");
      await cargarMembresiasSocio(Number(socioId));
    } catch (error) {
      console.error(error);
      toast.error(
        "No se pudo activar la membresía. Verificá que el comprobante pertenezca al mismo socio."
      );
    } finally {
      setActivando(false);
    }
  };

  const limpiarSocioSeleccionado = () => {
    setSocioId("");
    setMembresiaId("");
    setNumeroComprobante("");
    setMembresias([]);
  };

  return (
    <div className="activar-page">
      <PageHeader
        kicker="Validación de acceso"
        title="Activar membresía"
        description="Activá una membresía pendiente usando el número de comprobante generado desde el módulo de pagos."
        actions={
          <Button variant="primary" icon={<RefreshCcw size={16} />} onClick={cargarSocios}>
            Actualizar
          </Button>
        }
      />

      <div className="activar-layout">
        <section className="activate-card">
          <div className="activate-title">
            <BadgeCheck size={23} />
            <div>
              <h3>Activación de membresía</h3>
              <p>
                El sistema valida que el comprobante exista y corresponda al socio
                seleccionado.
              </p>
            </div>
          </div>

          <div className="activate-form">
            <label>
              Buscar socios
              <div className="activate-search">
                <SearchField
                  value={buscar}
                  onChange={setBuscar}
                  icon={<Search size={18} />}
                  placeholder="Buscar por nombre, apellido, DNI o número..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") cargarSocios();
                  }}
                />

                <Button variant="primary" onClick={cargarSocios}>
                  Buscar
                </Button>
              </div>
            </label>

            <label>
              Socio
              <div className="activate-socio-field">
                <SocioSelect
                  socios={socios}
                  value={socioId}
                  onChange={setSocioId}
                  placeholder="Seleccionar socio"
                />

                {socioId && (
                  <IconButton
                    icon={<X size={16} />}
                    label="Quitar socio seleccionado"
                    variant="danger"
                    onClick={limpiarSocioSeleccionado}
                    className="clear-socio-button"
                  />
                )}
              </div>
            </label>

            <label>
              Membresía pendiente
              <select
                value={membresiaId}
                onChange={(e) => setMembresiaId(e.target.value)}
                disabled={!socioId}
              >
                <option value="">Seleccionar membresía pendiente</option>
                {membresiasPendientes.map((m) => (
                  <option key={m.id} value={m.id}>
                    Membresía #{m.id} -{" "}
                    {new Date(m.fechaInicio).toLocaleDateString("es-AR")} a{" "}
                    {new Date(m.fechaFin).toLocaleDateString("es-AR")}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Número de comprobante
              <div className="receipt-input">
                <FileText size={18} />
                <input
                  value={numeroComprobante}
                  onChange={(e) => setNumeroComprobante(e.target.value)}
                  placeholder="Ej: C-20260607041307"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") activar();
                  }}
                />
              </div>
            </label>

            <SummaryBox className="activation-summary" label="Resumen de activación">
              {renderResumenSocio()}

              <div className="summary-plan">
                <span>Membresía seleccionada</span>

                <p>
                  {membresiaSeleccionada
                    ? `Membresía #${membresiaSeleccionada.id} · ${mostrarEstado(
                        membresiaSeleccionada.estado
                      )}`
                    : "Sin membresía seleccionada"}
                </p>
              </div>

              <small>
                {numeroComprobante
                  ? `Comprobante: ${numeroComprobante}`
                  : "Sin comprobante cargado"}
              </small>
            </SummaryBox>
          </div>

          <Button
            className="activate-button"
            variant="primary"
            icon={<CheckCircle2 size={17} />}
            onClick={activar}
            disabled={activando || loading}
            fullWidth
          >
            {activando ? "Activando..." : "Activar membresía"}
          </Button>
        </section>

        <section className="pending-card">
          <div className="activate-title">
            <CalendarDays size={23} />
            <div>
              <h3>Membresías del socio</h3>
              <p>Visualizá el estado actual antes de activar.</p>
            </div>
          </div>

          {!socioId ? (
            <EmptyState
              icon={<UserRound size={30} />}
              description="Seleccioná un socio para ver sus membresías."
            />
          ) : membresias.length === 0 ? (
            <EmptyState
              icon={<CalendarDays size={30} />}
              description="Este socio no tiene membresías registradas."
            />
          ) : (
            <div className="pending-list">
              {membresias.map((m) => (
                <div
                  key={m.id}
                  className={
                    esPendientePago(m.estado)
                      ? "membership-history-item highlighted"
                      : "membership-history-item"
                  }
                >
                  <div className="membership-history-content">
                    <strong>{getNombrePlan(m)}</strong>

                    <span>
                      Desde {formatearFecha(m.fechaInicio)} hasta {formatearFecha(m.fechaFin)}
                    </span>

                    <small>Membresía N.º {m.id}</small>
                  </div>

                  <StatusBadge
                    variant={getEstadoVariant(m.estado)}
                    label={mostrarEstado(m.estado)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
