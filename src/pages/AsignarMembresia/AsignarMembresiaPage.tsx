import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import {
  CalendarDays,
  ClipboardList,
  RefreshCcw,
  Search,
  WalletCards,
  X,
} from "lucide-react";
import { getSocios, type Socio } from "../../services/sociosService";
import {
  activarMembresiaSocio,
  crearMembresiaSocio,
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
import "./AsignarMembresiaPage.css";
import { DatePicker } from "../../components/ui";

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

export default function AsignarMembresiaPage() {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [tipos, setTipos] = useState<TipoMembresia[]>([]);
  const [membresiasSocio, setMembresiasSocio] = useState<MembresiaSocio[]>([]);

  const [buscar, setBuscar] = useState("");
  const [socioId, setSocioId] = useState("");
  const [tipoMembresiaId, setTipoMembresiaId] = useState("");
  const [fechaInicio, setFechaInicio] = useState(() =>
    new Date().toISOString().substring(0, 10)
  );

  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const socioSeleccionado = useMemo(() => {
    return socios.find((s) => s.id === Number(socioId));
  }, [socios, socioId]);

  const tipoSeleccionado = useMemo(() => {
    return tipos.find((t) => t.id === Number(tipoMembresiaId));
  }, [tipos, tipoMembresiaId]);

  const limpiarSocioSeleccionado = () => {
    setSocioId("");
    setTipoMembresiaId("");
    setMembresiasSocio([]);
  };

  const renderResumenSocio = () => {
    if (!socioSeleccionado) {
      return (
        <div className="summary-member">
          <Avatar size="md" initials="S" className="summary-avatar-empty" />

          <div>
            <strong>Sin socio seleccionado</strong>
            <p>Seleccioná un socio para continuar</p>
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

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);

      const [sociosData, tiposData] = await Promise.all([
        getSocios(buscar),
        getTiposMembresia(),
      ]);

      setSocios(sociosData);
      setTipos(tiposData.filter((t) => t.activa));
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar los datos.");
    } finally {
      setLoading(false);
    }
  };

  const cargarHistorial = async (id: number) => {
    try {
      const data = await getMembresiasPorSocio(id);
      setMembresiasSocio(ordenarMembresiasDeActualAAnterior(data));
    } catch (error) {
      console.error(error);
      toast.error("No se pudo cargar el historial de membresías.");
    }
  };

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (socioId) {
      cargarHistorial(Number(socioId));
    } else {
      setMembresiasSocio([]);
    }
  }, [socioId]);

  const asignarMembresia = async () => {
    if (!socioId) {
      toast.error("Seleccioná un socio.");
      return;
    }

    if (!tipoMembresiaId) {
      toast.error("Seleccioná un tipo de membresía.");
      return;
    }

    if (!fechaInicio) {
      toast.error("Seleccioná una fecha de inicio.");
      return;
    }

    try {
      setGuardando(true);

      await crearMembresiaSocio({
        socioId: Number(socioId),
        tipoMembresiaId: Number(tipoMembresiaId),
        fechaInicio: `${fechaInicio}T00:00:00`,
      });

      toast.success("Membresía asignada correctamente. Queda pendiente de pago.");

      setTipoMembresiaId("");
      await cargarHistorial(Number(socioId));
    } catch (error) {
      console.error(error);
      toast.error("No se pudo asignar la membresía.");
    } finally {
      setGuardando(false);
    }
  };

  const mostrarEstado = (estado: number | string) => {
    if (estado === 1 || estado === "1" || estado === "PendientePago") return "Pendiente pago";
    if (estado === 2 || estado === "2" || estado === "Activa") return "Activa";
    if (estado === 3 || estado === "3" || estado === "Vencida") return "Vencida";
    if (estado === 4 || estado === "4" || estado === "Anulada") return "Anulada";
    return String(estado);
  };

  const esPendientePago = (estado: number | string) => {
    return estado === 1 || estado === "1" || estado === "PendientePago";
  };

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

  const activarMembresia = async (membresia: MembresiaSocio) => {
    const resultado = await Swal.fire({
      title: "Activar membresía",
      text: `Ingresá el número de comprobante para activar la membresía #${membresia.id}.`,
      input: "text",
      inputPlaceholder: "Ej: C-20260601184756",
      showCancelButton: true,
      confirmButtonText: "Activar",
      cancelButtonText: "Cancelar",
      background: "rgba(15, 23, 42, 0.96)",
      color: "#fff",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#334155",
      customClass: {
        popup: "glass-alert",
        confirmButton: "glass-alert-confirm",
        cancelButton: "glass-alert-cancel",
      },
      inputValidator: (value) => {
        if (!value) {
          return "Ingresá el número de comprobante.";
        }

        return null;
      },
    });

    if (!resultado.isConfirmed) return;

    try {
      await activarMembresiaSocio(membresia.id, resultado.value);
      toast.success("Membresía activada correctamente.");

      if (socioId) {
        await cargarHistorial(Number(socioId));
      }
    } catch (error) {
      console.error(error);
      toast.error("No se pudo activar la membresía.");
    }
  };

  return (
    <div className="asignar-page">
      <PageHeader
        kicker="Flujo de membresías"
        title="Asignar membresía"
        description="Seleccioná un socio, elegí un plan y generá una membresía pendiente de pago."
        actions={
          <Button
            variant="primary"
            icon={<RefreshCcw size={16} />}
            onClick={cargarDatosIniciales}
          >
            Actualizar
          </Button>
        }
      />

      <div className="asignar-layout">
        <section className="assign-card">
          <div className="assign-title">
            <WalletCards size={22} />
            <div>
              <h3>Nueva membresía de socio</h3>
              <p>Este paso no activa el acceso hasta registrar pago y comprobante.</p>
            </div>
          </div>

          <div className="assign-form">
            <label>
              Buscar socios
              <div className="assign-search">
                <SearchField
                  value={buscar}
                  onChange={setBuscar}
                  icon={<Search size={18} />}
                  placeholder="Buscar por nombre, apellido, DNI o número..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") cargarDatosIniciales();
                  }}
                />

                <Button variant="primary" onClick={cargarDatosIniciales}>
                  Buscar
                </Button>
              </div>
            </label>

            <label>
              Socio
              <div className="assign-socio-field">
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
              Tipo de membresía
              <select
                value={tipoMembresiaId}
                onChange={(e) => setTipoMembresiaId(e.target.value)}
              >
                <option value="">Seleccionar plan</option>
                {tipos.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre} - ${tipo.precio.toLocaleString("es-AR")}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Fecha de inicio
              <DatePicker
                value={fechaInicio}
                onChange={setFechaInicio}
                placeholder="Seleccionar fecha de inicio"
                minYear={new Date().getFullYear() - 1}
                maxYear={new Date().getFullYear() + 2}
              />
            </label>

            <SummaryBox className="membership-summary" label="Resumen">
              {renderResumenSocio()}

              <div className="summary-plan">
                <span>Plan seleccionado</span>
                <p>
                  {tipoSeleccionado
                    ? `${tipoSeleccionado.nombre} · ${tipoSeleccionado.duracionDias} días · $${tipoSeleccionado.precio.toLocaleString("es-AR")}`
                    : "Sin plan seleccionado"}
                </p>
              </div>
            </SummaryBox>
          </div>

          <Button
            className="assign-button"
            variant="primary"
            onClick={asignarMembresia}
            disabled={guardando || loading}
            fullWidth
          >
            {guardando ? "Asignando..." : "Asignar membresía"}
          </Button>
        </section>

        <section className="history-card">
          <div className="assign-title">
            <ClipboardList size={22} />
            <div>
              <h3>Historial del socio</h3>
              <p>Membresías activas, vencidas o pendientes.</p>
            </div>
          </div>

          {!socioId ? (
            <EmptyState
              icon={<CalendarDays size={28} />}
              description="Seleccioná un socio para ver su historial."
            />
          ) : membresiasSocio.length === 0 ? (
            <EmptyState
              icon={<CalendarDays size={28} />}
              description="Este socio todavía no tiene membresías registradas."
            />
          ) : (
            <div className="history-list">
              {membresiasSocio.map((m) => (
                <div key={m.id} className="membership-history-item">
                  <div className="membership-history-content">
                    <strong>{getNombrePlan(m)}</strong>

                    <span>
                      Desde {formatearFecha(m.fechaInicio)} hasta {formatearFecha(m.fechaFin)}
                    </span>

                    <small>Membresía N.º {m.id}</small>
                  </div>

                  <div className="history-actions">
                    <StatusBadge
                      variant={getEstadoVariant(m.estado)}
                      label={mostrarEstado(m.estado)}
                    />

                    {esPendientePago(m.estado) && (
                      <Button variant="primary" onClick={() => activarMembresia(m)}>
                        Activar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
