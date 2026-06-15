import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import FacturaModal from "./components/FacturaModal";
import SocioSelect from "../../components/ui/SocioSelect";
import {
  CreditCard,
  FileText,
  Plus,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { getSocios, type Socio } from "../../services/sociosService";
import {
  getMembresiasPorSocio,
  getTiposMembresia,
  type MembresiaSocio,
  type TipoMembresia,
} from "../../services/membresiasService";
import {
  crearPago,
  eliminarPago,
  generarComprobante,
  getComprobantes,
  getHistorialPagos,
  getMediosPago,
  getPagos,
  type MedioPagoOption,
  type Pago,
  type PagoRequest,
} from "../../services/pagosService";
import {
  Avatar,
  Button,
  EmptyState,
  IconButton,
  PageHeader,
  SearchField,
  SummaryBox,
} from "../../components/ui";
import { getInitials } from "../../utils/initials";
import "./PagosPage.css";
import { DateRangePicker } from "../../components/ui";

type ConceptoPago = "membresia" | "producto";

const toInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDefaultPaymentDateRange = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  return {
    desde: toInputDate(yesterday),
    hasta: toInputDate(today),
  };
};

const toStartOfDayParam = (date?: string) => {
  return date ? `${date}T00:00:00` : undefined;
};

const toEndOfDayParam = (date?: string) => {
  return date ? `${date}T23:59:59` : undefined;
};

const extractPaymentDate = (fecha?: string) => {
  if (!fecha) return "";

  const isoMatch = fecha.match(/^(\d{4}-\d{2}-\d{2})/);

  if (isoMatch) {
    return isoMatch[1];
  }

  const parsed = new Date(fecha);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return toInputDate(parsed);
};

const filtrarPagosPorRangoLocal = (items: Pago[], desde?: string, hasta?: string) => {
  if (!desde && !hasta) return items;

  return items.filter((pago) => {
    const fechaPago = extractPaymentDate(pago.fechaPago);

    if (!fechaPago) return false;
    if (desde && fechaPago < desde) return false;
    if (hasta && fechaPago > hasta) return false;

    return true;
  });
};

export default function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [mediosPago, setMediosPago] = useState<MedioPagoOption[]>([]);
  const [tiposMembresia, setTiposMembresia] = useState<TipoMembresia[]>([]);
  const [membresiasSocio, setMembresiasSocio] = useState<MembresiaSocio[]>([]);

  const [busquedaFiltroSocio, setBusquedaFiltroSocio] = useState("");
  const [sociosFiltro, setSociosFiltro] = useState<Socio[]>([]);
  const [socioFiltroId, setSocioFiltroId] = useState("");
  const [desdeFiltro, setDesdeFiltro] = useState(() => getDefaultPaymentDateRange().desde);
  const [hastaFiltro, setHastaFiltro] = useState(() => getDefaultPaymentDateRange().hasta);
  const [socioId, setSocioId] = useState("");
  const [conceptoPago, setConceptoPago] = useState<ConceptoPago>("membresia");
  const [membresiaId, setMembresiaId] = useState("");
  const [monto, setMonto] = useState("");
  const [medioPago, setMedioPago] = useState("");
  const [observacion, setObservacion] = useState("");

  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [cargandoMembresias, setCargandoMembresias] = useState(false);
  const [comprobanteActual, setComprobanteActual] = useState<any>(null);

  const socioSeleccionado = useMemo(() => {
    return socios.find((s) => s.id === Number(socioId));
  }, [socios, socioId]);

  const membresiasPendientes = useMemo(() => {
    return membresiasSocio.filter((m) => esPendientePago(m.estado));
  }, [membresiasSocio]);

  const membresiaSeleccionada = useMemo(() => {
    return membresiasPendientes.find((m) => m.id === Number(membresiaId));
  }, [membresiasPendientes, membresiaId]);

  function esPendientePago(estado: number | string) {
    return estado === 1 || estado === "1" || estado === "PendientePago";
  }

  const ordenarPagosPorHorario = (items: Pago[]) => {
    return [...items].sort((a, b) => {
      const fechaA = a.fechaPago ? new Date(a.fechaPago).getTime() : 0;
      const fechaB = b.fechaPago ? new Date(b.fechaPago).getTime() : 0;

      if (fechaA !== fechaB) {
        return fechaB - fechaA;
      }

      return Number(b.id || 0) - Number(a.id || 0);
    });
  };

  const normalizarPagos = (data: any): Pago[] => {
    let items: Pago[] = [];

    if (Array.isArray(data)) {
      items = data;
    } else if (Array.isArray(data?.pagos)) {
      items = data.pagos;
    } else if (Array.isArray(data?.historial)) {
      items = data.historial;
    } else if (Array.isArray(data?.data)) {
      items = data.data;
    } else if (Array.isArray(data?.items)) {
      items = data.items;
    }

    return ordenarPagosPorHorario(items);
  };

  const formatearFechaHoraPago = (fecha?: string) => {
    if (!fecha) return "Sin fecha";

    return new Date(fecha).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const nombreTipoMembresia = (membresia?: MembresiaSocio) => {
    if (!membresia) return "Sin membresía seleccionada";

    const membresiaExtendida = membresia as MembresiaSocio & {
      tipoMembresia?: TipoMembresia;
      nombreTipoMembresia?: string;
      tipoMembresiaNombre?: string;
    };

    if (membresiaExtendida.tipoMembresia?.nombre) {
      return membresiaExtendida.tipoMembresia.nombre;
    }

    if (membresiaExtendida.nombreTipoMembresia) {
      return membresiaExtendida.nombreTipoMembresia;
    }

    if (membresiaExtendida.tipoMembresiaNombre) {
      return membresiaExtendida.tipoMembresiaNombre;
    }

    const tipo = tiposMembresia.find(
      (t) => t.id === Number(membresia.tipoMembresiaId)
    );

    return tipo?.nombre || "Plan no especificado";
  };

  const precioTipoMembresia = (membresia?: MembresiaSocio) => {
    if (!membresia) return 0;

    const membresiaExtendida = membresia as MembresiaSocio & {
      tipoMembresia?: TipoMembresia;
    };

    if (membresiaExtendida.tipoMembresia?.precio) {
      return Number(membresiaExtendida.tipoMembresia.precio);
    }

    const tipo = tiposMembresia.find(
      (t) => t.id === Number(membresia.tipoMembresiaId)
    );

    return Number(tipo?.precio || 0);
  };

  const getSocio = (socioId: number) => {
    return socios.find((s) => s.id === socioId);
  };

  const getFotoSocio = (socioId: number) => {
    return getSocio(socioId)?.fotoUrl || "";
  };

  const inicialesSocio = (socioId: number) => {
    const socio = getSocio(socioId);
    if (!socio) return "S";
    return getInitials(socio.nombre, socio.apellido, "S");
  };

  const cargarPagosConFiltros = async (
    socioIdFiltro = socioFiltroId,
    desde = desdeFiltro,
    hasta = hastaFiltro
  ) => {
    const data = await getHistorialPagos(
      socioIdFiltro ? Number(socioIdFiltro) : undefined,
      toStartOfDayParam(desde),
      toEndOfDayParam(hasta)
    );

    return filtrarPagosPorRangoLocal(normalizarPagos(data), desde, hasta);
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [pagosFiltrados, sociosData, mediosData, tiposData] = await Promise.all([
        cargarPagosConFiltros(),
        getSocios(),
        getMediosPago(),
        getTiposMembresia(),
      ]);

      setPagos(pagosFiltrados);
      setSocios(sociosData);
      setMediosPago(mediosData);
      setTiposMembresia(tiposData);
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar los pagos.");
    } finally {
      setLoading(false);
    }
  };

  const cargarMembresiasPendientes = async (id: number) => {
    try {
      setCargandoMembresias(true);

      const data = await getMembresiasPorSocio(id);
      const pendientes = data.filter((m) => esPendientePago(m.estado));

      setMembresiasSocio(data);

      if (pendientes.length === 1) {
        setMembresiaId(String(pendientes[0].id));
      } else {
        setMembresiaId("");
        setMonto("");
        setObservacion("");
      }
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar las membresías pendientes del socio.");
    } finally {
      setCargandoMembresias(false);
    }
  };

  const seleccionarSocioFiltro = async (socio: Socio) => {
    setSocioFiltroId(String(socio.id));
    setBusquedaFiltroSocio(`${socio.nombre} ${socio.apellido} - DNI ${socio.dni}`);
    setSociosFiltro([]);

    try {
      setLoading(true);

      const data = await getHistorialPagos(
        socio.id,
        toStartOfDayParam(desdeFiltro),
        toEndOfDayParam(hastaFiltro)
      );

      setPagos(filtrarPagosPorRangoLocal(normalizarPagos(data), desdeFiltro, hastaFiltro));
      toast.success(`Pagos filtrados para ${socio.nombre} ${socio.apellido}.`);
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron filtrar los pagos del socio.");
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltrosPagos = async () => {
    try {
      setLoading(true);

      if (socioFiltroId || desdeFiltro || hastaFiltro) {
        const data = await getHistorialPagos(
          socioFiltroId ? Number(socioFiltroId) : undefined,
          toStartOfDayParam(desdeFiltro),
          toEndOfDayParam(hastaFiltro)
        );

        setPagos(filtrarPagosPorRangoLocal(normalizarPagos(data), desdeFiltro, hastaFiltro));
      } else {
        const data = await getPagos();
        setPagos(normalizarPagos(data));
      }

      toast.success("Filtros aplicados.");
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron aplicar los filtros.");
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltrosPagos = async () => {
    const defaultRange = getDefaultPaymentDateRange();

    setBusquedaFiltroSocio("");
    setSociosFiltro([]);
    setSocioFiltroId("");
    setDesdeFiltro(defaultRange.desde);
    setHastaFiltro(defaultRange.hasta);

    try {
      setLoading(true);
      const data = await getHistorialPagos(
        undefined,
        toStartOfDayParam(defaultRange.desde),
        toEndOfDayParam(defaultRange.hasta)
      );
      setPagos(filtrarPagosPorRangoLocal(normalizarPagos(data), defaultRange.desde, defaultRange.hasta));
      toast.success("Filtros limpiados.");
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron limpiar los filtros.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!busquedaFiltroSocio.trim()) {
        setSociosFiltro([]);
        return;
      }

      try {
        const data = await getSocios(busquedaFiltroSocio);
        setSociosFiltro(data);
      } catch (error) {
        console.error(error);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [busquedaFiltroSocio]);

  useEffect(() => {
    setMembresiaId("");
    setMembresiasSocio([]);
    setMonto("");
    setObservacion("");

    if (conceptoPago === "membresia" && socioId) {
      cargarMembresiasPendientes(Number(socioId));
    }
  }, [socioId, conceptoPago]);

  useEffect(() => {
    if (conceptoPago !== "membresia") return;

    if (!membresiaSeleccionada) {
      setMonto("");
      setObservacion("");
      return;
    }

    const precio = precioTipoMembresia(membresiaSeleccionada);
    const nombre = nombreTipoMembresia(membresiaSeleccionada);

    setMonto(precio > 0 ? String(precio) : "");
    setObservacion(`Abona por "${nombre}"`);
  }, [conceptoPago, membresiaSeleccionada, tiposMembresia]);

  const limpiarFormulario = () => {
    setSocioId("");
    setConceptoPago("membresia");
    setMembresiaId("");
    setMembresiasSocio([]);
    setMonto("");
    setMedioPago("");
    setObservacion("");
  };

  const registrarPago = async () => {
    if (!socioId) {
      toast.error("Seleccioná un socio.");
      return;
    }

    if (conceptoPago === "membresia" && !membresiaId) {
      toast.error("Seleccioná una membresía pendiente de pago.");
      return;
    }

    if (!monto || Number(monto) <= 0) {
      toast.error("Ingresá un monto válido.");
      return;
    }

    if (!medioPago) {
      toast.error("Seleccioná un medio de pago.");
      return;
    }

    if (!observacion.trim()) {
      toast.error(
        conceptoPago === "membresia"
          ? "No se pudo generar la observación de la membresía."
          : "Ingresá una observación para identificar el producto."
      );
      return;
    }

    const data: PagoRequest = {
      socioId: Number(socioId),
      monto: Number(monto),
      medioPago: Number(medioPago),
      observacion: observacion.trim(),
    };

    try {
      setGuardando(true);
      await crearPago(data);

      toast.success(
        conceptoPago === "membresia"
          ? "Pago registrado. Ahora generá el comprobante para activar la membresía."
          : "Pago registrado correctamente."
      );

      limpiarFormulario();
      await cargarDatos();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo registrar el pago.");
    } finally {
      setGuardando(false);
    }
  };

  const borrarPago = async (pago: Pago) => {
    const resultado = await Swal.fire({
      title: "¿Eliminar pago?",
      text: `Se eliminará el registro N.º ${pago.id}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      background: "rgba(15, 23, 42, 0.96)",
      color: "#fff",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#334155",
      customClass: {
        popup: "glass-alert",
        confirmButton: "glass-alert-confirm",
        cancelButton: "glass-alert-cancel",
      },
    });

    if (!resultado.isConfirmed) return;

    try {
      await eliminarPago(pago.id);
      toast.success("Pago eliminado correctamente.");
      await cargarDatos();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo eliminar el pago.");
    }
  };

  const crearComprobante = async (pago: Pago) => {
    try {
      const comprobantesExistentes = await getComprobantes(pago.id);

      if (comprobantesExistentes.length > 0) {
        toast.success("Comprobante encontrado.");

        setComprobanteActual({
          ...comprobantesExistentes[0],
          pago,
        });

        return;
      }

      const response = await generarComprobante(pago.id, {
        pagoId: pago.id,
        detalle: `Comprobante del registro N.º ${pago.id}`,
      });

      const comprobante = response.comprobante || response;

      toast.success("Comprobante generado correctamente.");
      setComprobanteActual(comprobante);

      await cargarDatos();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo obtener o generar el comprobante.");
    }
  };

  const nombreSocio = (socioId: number) => {
    const socio = getSocio(socioId);
    return socio ? `${socio.nombre} ${socio.apellido}` : `Socio #${socioId}`;
  };

  const nombreMedioPago = (id: number) => {
    const medio = mediosPago.find((m) => m.id === id);
    return medio ? medio.nombre : `Medio ${id}`;
  };

  const pagoMembresiaSinPendientes =
    conceptoPago === "membresia" && !!socioId && membresiasPendientes.length === 0;

  return (
    <div className="pagos-page">
      <PageHeader
        kicker="Gestión de cobros"
        title="Pagos"
        description="Registrá pagos de socios, consultá cobros y generá comprobantes."
        actions={
          <Button variant="primary" icon={<RefreshCcw size={16} />} onClick={cargarDatos}>
            Actualizar
          </Button>
        }
      />

      <div className="pagos-layout">
        <section className="payment-card">
          <div className="payment-title">
            <CreditCard size={22} />
            <div>
              <h3>Registrar pago</h3>
              <p>El pago se usará luego para generar comprobante y activar membresía.</p>
            </div>
          </div>

          <div className="payment-form">
            <label className="full">
              Socio
              <SocioSelect
                socios={socios}
                value={socioId}
                onChange={setSocioId}
                placeholder="Seleccionar socio"
              />
            </label>

            <label>
              Concepto del pago
              <select
                value={conceptoPago}
                onChange={(e) => setConceptoPago(e.target.value as ConceptoPago)}
              >
                <option value="membresia">Membresía</option>
                <option value="producto">Otro producto</option>
              </select>
            </label>

            {conceptoPago === "membresia" && (
              <label>
                Membresía a abonar
                <select
                  value={membresiaId}
                  onChange={(e) => setMembresiaId(e.target.value)}
                  disabled={!socioId || cargandoMembresias}
                >
                  <option value="">
                    {cargandoMembresias
                      ? "Cargando membresías..."
                      : "Seleccionar membresía pendiente"}
                  </option>

                  {membresiasPendientes.map((membresia) => (
                    <option key={membresia.id} value={membresia.id}>
                      {nombreTipoMembresia(membresia)} -{" "}
                      {new Date(membresia.fechaInicio).toLocaleDateString("es-AR")} a{" "}
                      {new Date(membresia.fechaFin).toLocaleDateString("es-AR")}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {conceptoPago === "membresia" &&
              socioId &&
              !cargandoMembresias &&
              membresiasPendientes.length === 0 && (
                <div className="payment-helper full">
                  Este socio no tiene membresías pendientes de pago.
                </div>
              )}

            <label>
              Monto
              <input
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="Ej: 15000"
                readOnly={conceptoPago === "membresia"}
              />
            </label>

            <label>
              Medio de pago
              <select
                value={medioPago}
                onChange={(e) => setMedioPago(e.target.value)}
              >
                <option value="">Seleccionar medio</option>
                {mediosPago.map((medio) => (
                  <option key={medio.id} value={medio.id}>
                    {medio.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="full">
              Observación
              <input
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder={
                  conceptoPago === "membresia"
                    ? 'Ej: Abona por "Mensual"'
                    : "Ej: Compra de botella de agua"
                }
                readOnly={conceptoPago === "membresia"}
              />
            </label>

            <SummaryBox
              className="payment-summary"
              label="Resumen"
              title={
                socioSeleccionado
                  ? `${socioSeleccionado.nombre} ${socioSeleccionado.apellido}`
                  : "Sin socio seleccionado"
              }
              description={
                <>
                  Concepto:{" "}
                  {conceptoPago === "membresia"
                    ? `Membresía${membresiaSeleccionada ? ` · ${nombreTipoMembresia(membresiaSeleccionada)}` : ""}`
                    : "Otro producto"}
                </>
              }
            >
              <p>
                {monto
                  ? `$${Number(monto).toLocaleString("es-AR")}`
                  : "Sin monto cargado"}
              </p>
              {observacion && <p>{observacion}</p>}
            </SummaryBox>
          </div>

          <Button
            className="payment-submit"
            variant="primary"
            icon={<Plus size={17} />}
            onClick={registrarPago}
            disabled={guardando || pagoMembresiaSinPendientes}
            fullWidth
          >
            {guardando ? "Registrando..." : "Registrar pago"}
          </Button>
        </section>

        <section className="payments-list-card">
          <div className="payment-title">
            <FileText size={22} />
            <div>
              <h3>Pagos registrados</h3>
              <p>Listado de cobros cargados en el sistema.</p>
            </div>
          </div>

          <div className="payments-filter advanced">
            <div className="filter-search full">
              <SearchField
                value={busquedaFiltroSocio}
                onChange={(value) => {
                  setBusquedaFiltroSocio(value);
                  setSocioFiltroId("");
                }}
                placeholder="Buscar socio por nombre, apellido, DNI o número..."
              />

              {busquedaFiltroSocio && (
                <Button variant="secondary" onClick={limpiarFiltrosPagos}>
                  Limpiar
                </Button>
              )}

              {sociosFiltro.length > 0 && (
                <div className="filter-results">
                  {sociosFiltro.map((socio) => (
                    <button
                      key={socio.id}
                      type="button"
                      onClick={() => seleccionarSocioFiltro(socio)}
                    >
                      <Avatar
                        size="md"
                        src={socio.fotoUrl}
                        alt={`${socio.nombre} ${socio.apellido}`}
                        initials={getInitials(socio.nombre, socio.apellido, "S")}
                      />

                      <div>
                        <strong>
                          {socio.nombre} {socio.apellido}
                        </strong>
                        <span>DNI {socio.dni}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <DateRangePicker
              className="payments-date-range"
              from={desdeFiltro}
              to={hastaFiltro}
              onFromChange={setDesdeFiltro}
              onToChange={setHastaFiltro}
              fromLabel="Desde"
              toLabel="Hasta"
              minYear={2024}
              maxYear={new Date().getFullYear() + 1}
            />

            <Button
              className="payments-filter-date-button"
              variant="primary"
              onClick={aplicarFiltrosPagos}
            >
              Filtrar fechas
            </Button>
          </div>

          {loading ? (
            <EmptyState
              icon={<FileText size={30} />}
              description="Cargando pagos..."
            />
          ) : pagos.length === 0 ? (
            <EmptyState
              icon={<FileText size={30} />}
              title="No hay pagos registrados"
              description="Cuando se registren pagos, aparecerán en este listado."
            />
          ) : (
            <div className="payments-list">
              {pagos.map((pago) => (
                <div key={pago.id} className="payment-item">
                  <div className="payment-person">
                    <Avatar
                      size="md"
                      src={getFotoSocio(pago.socioId)}
                      alt={nombreSocio(pago.socioId)}
                      initials={inicialesSocio(pago.socioId)}
                    />

                    <div>
                      <strong>{nombreSocio(pago.socioId)}</strong>
                      <span>Pago en {nombreMedioPago(pago.medioPago)}</span>
                      <small className="payment-record-id">
                        Registro N.º {pago.id}
                      </small>
                      {pago.observacion && <p>{pago.observacion}</p>}
                    </div>
                  </div>

                  <div className="payment-right">
                    <strong>${pago.monto.toLocaleString("es-AR")}</strong>
                    <span>{formatearFechaHoraPago(pago.fechaPago)}</span>

                    <div className="payment-actions">
                      <IconButton
                        icon={<FileText size={15} />}
                        label="Generar / Ver comprobante"
                        onClick={() => crearComprobante(pago)}
                      />

                      <IconButton
                        icon={<Trash2 size={15} />}
                        label="Eliminar"
                        variant="danger"
                        onClick={() => borrarPago(pago)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <FacturaModal
        open={!!comprobanteActual}
        comprobante={comprobanteActual}
        onClose={() => setComprobanteActual(null)}
      />
    </div>
  );
}
