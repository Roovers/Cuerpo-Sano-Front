import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Edit,
  Plus,
  RefreshCcw,
  Trash2,
  Users,
} from "lucide-react";
import {
  actualizarActividad,
  crearActividad,
  eliminarActividad,
  getActividades,
  type Actividad,
  type ActividadRequest,
} from "../../services/actividadesService";
import {
  Button,
  EmptyState,
  FilterToolbar,
  PageHeader,
  SearchField,
  StatCard,
  StatsGrid,
  StatusBadge,
} from "../../components/ui";
import ActividadModal from "./components/ActividadModal";
import "./ActividadesPage.css";
import { useAuthSession } from "../../auth/AuthSessionContext";

const ACTIVIDADES_POR_PAGINA = 5;

const dividirEnPaginas = (actividades: Actividad[]) => {
  const paginas: Actividad[][] = [];

  for (let i = 0; i < actividades.length; i += ACTIVIDADES_POR_PAGINA) {
    paginas.push(actividades.slice(i, i + ACTIVIDADES_POR_PAGINA));
  }

  return paginas;
};

export default function ActividadesPage() {
  const { hasAction } = useAuthSession();
  const canCreateActividades = hasAction("actividades.crear");
  const canEditActividades = hasAction("actividades.editar");
  const canDeactivateActividades = hasAction("actividades.desactivar");
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<
    "todas" | "activas" | "inactivas"
  >("todas");
  const [buscar, setBuscar] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedActividad, setSelectedActividad] =
    useState<Actividad | null>(null);
  const [paginaActual, setPaginaActual] = useState(0);

  const actividadesFiltradas = useMemo(() => {
    const texto = buscar.trim().toLowerCase();

    return actividades.filter((actividad) => {
      const coincideEstado =
        filtroEstado === "todas" ||
        (filtroEstado === "activas" && actividad.activa) ||
        (filtroEstado === "inactivas" && !actividad.activa);

      const coincideTexto =
        !texto ||
        `${actividad.nombre} ${actividad.descripcion || ""}`
          .toLowerCase()
          .includes(texto);

      return coincideEstado && coincideTexto;
    });
  }, [actividades, buscar, filtroEstado]);

  const totalActivas = useMemo(
    () => actividades.filter((actividad) => actividad.activa).length,
    [actividades]
  );

  const totalInactivas = useMemo(
    () => actividades.filter((actividad) => !actividad.activa).length,
    [actividades]
  );

  const paginasActividades = useMemo(
    () => dividirEnPaginas(actividadesFiltradas),
    [actividadesFiltradas]
  );

  const totalPaginas = Math.max(1, paginasActividades.length);
  const puedeRetroceder = paginaActual > 0;
  const puedeAvanzar = paginaActual < totalPaginas - 1;
  const registroDesde = actividadesFiltradas.length
    ? paginaActual * ACTIVIDADES_POR_PAGINA + 1
    : 0;
  const registroHasta = Math.min(
    (paginaActual + 1) * ACTIVIDADES_POR_PAGINA,
    actividadesFiltradas.length
  );

  const cargarActividades = async () => {
    try {
      setLoading(true);

      const data = await getActividades();

      setActividades(data);
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar las actividades.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarActividades();
  }, []);

  useEffect(() => {
    setPaginaActual(0);
  }, [buscar, filtroEstado]);

  useEffect(() => {
    setPaginaActual((prev) => Math.min(prev, totalPaginas - 1));
  }, [totalPaginas]);

  const irPaginaAnterior = () => {
    setPaginaActual((prev) => Math.max(prev - 1, 0));
  };

  const irPaginaSiguiente = () => {
    setPaginaActual((prev) => Math.min(prev + 1, totalPaginas - 1));
  };

  const abrirNueva = () => {
    if (!canCreateActividades) {
      toast.error("No tenés permiso para crear actividades.");
      return;
    }

    setSelectedActividad(null);
    setModalOpen(true);
  };

  const abrirEditar = (actividad: Actividad) => {
    if (!canEditActividades) {
      toast.error("No tenés permiso para editar actividades.");
      return;
    }

    setSelectedActividad(actividad);
    setModalOpen(true);
  };

  const guardarActividad = async (data: ActividadRequest) => {
    if (selectedActividad && !canEditActividades) {
      toast.error("No tenés permiso para editar actividades.");
      return;
    }

    if (!selectedActividad && !canCreateActividades) {
      toast.error("No tenés permiso para crear actividades.");
      return;
    }

    try {
      if (selectedActividad) {
        await actualizarActividad(selectedActividad.id, data);
        toast.success("Actividad actualizada correctamente.");
      } else {
        await crearActividad(data);
        toast.success("Actividad creada correctamente.");
      }

      await cargarActividades();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo guardar la actividad.");
    }
  };

  const borrarActividad = async (actividad: Actividad) => {
    if (!canDeactivateActividades) {
      toast.error("No tenés permiso para dar de baja actividades.");
      return;
    }

    const resultado = await Swal.fire({
      title: "¿Dar de baja actividad?",
      text: `Se dará de baja la actividad "${actividad.nombre}".`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, dar de baja",
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
      await eliminarActividad(actividad.id);
      toast.success("Actividad dada de baja correctamente.");
      await cargarActividades();
    } catch (error) {
      console.error(error);
      toast.error(
        "No se pudo dar de baja la actividad. Verificá si tiene horarios asociados."
      );
    }
  };

  return (
    <div className="actividades-page">
      <PageHeader
        kicker="Catálogo deportivo"
        title="Actividades"
        description="Administrá las actividades físicas disponibles para clases, entrenamientos y horarios del gimnasio."
        {...(canCreateActividades
          ? {
              actionLabel: "Nueva actividad",
              actionIcon: <Plus size={16} />,
              onAction: abrirNueva,
            }
          : {})}
      />

      <StatsGrid columns={3}>
        <StatCard
          label="Total de actividades"
          value={actividades.length}
          helper="Catálogo registrado"
        />

        <StatCard
          label="Disponibles"
          value={totalActivas}
          helper="Listas para usar en horarios"
        />

        <StatCard
          label="No disponibles"
          value={totalInactivas}
          helper="Ocultas o dadas de baja"
        />
      </StatsGrid>

      <FilterToolbar columns="1fr 190px auto">
        <SearchField
          value={buscar}
          onChange={setBuscar}
          placeholder="Buscar actividad por nombre o descripción..."
        />

        <select
          value={filtroEstado}
          onChange={(e) =>
            setFiltroEstado(e.target.value as "todas" | "activas" | "inactivas")
          }
        >
          <option value="todas">Todas</option>
          <option value="activas">Disponibles</option>
          <option value="inactivas">No disponibles</option>
        </select>

        <Button variant="primary" icon={<RefreshCcw size={16} />} onClick={cargarActividades}>
          Actualizar
        </Button>
      </FilterToolbar>

      {loading ? (
        <EmptyState
          icon={<Activity size={30} />}
          description="Cargando actividades..."
        />
      ) : actividadesFiltradas.length === 0 ? (
        <EmptyState
          icon={<Dumbbell size={30} />}
          title="Sin resultados"
          description="No se encontraron actividades con ese criterio."
        />
      ) : (
        <section className="actividades-carousel" aria-label="Carrusel de actividades">
          <div className="actividades-carousel-toolbar">
            <div>
              <span>Actividades registradas</span>
              <strong>
                {registroDesde}-{registroHasta} de {actividadesFiltradas.length}
              </strong>
            </div>

            <div className="actividades-carousel-controls">
              <button
                type="button"
                onClick={irPaginaAnterior}
                disabled={!puedeRetroceder}
                aria-label="Ver actividades anteriores"
              >
                <ChevronLeft size={20} />
              </button>

              <span>
                {paginaActual + 1} / {totalPaginas}
              </span>

              <button
                type="button"
                onClick={irPaginaSiguiente}
                disabled={!puedeAvanzar}
                aria-label="Ver actividades siguientes"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="actividades-carousel-viewport">
            <div
              className="actividades-carousel-track"
              style={{ transform: `translateX(-${paginaActual * 100}%)` }}
            >
              {paginasActividades.map((pagina, pageIndex) => (
                <div className="actividades-carousel-page" key={pageIndex}>
                  {pagina.map((actividad) => (
                    <article
                      key={actividad.id}
                      className={
                        actividad.activa
                          ? "actividad-card"
                          : "actividad-card inactive"
                      }
                    >
                      <div className="actividad-card-top">
                        <div className="actividad-icon">
                          <Dumbbell size={24} />
                        </div>

                        <StatusBadge
                          variant={actividad.activa ? "success" : "neutral"}
                          label={actividad.activa ? "Disponible" : "No disponible"}
                        />
                      </div>

                      <h3>{actividad.nombre}</h3>

                      <p>{actividad.descripcion || "Sin descripción cargada."}</p>

                      <div className="actividad-meta">
                        <div>
                          <Users size={17} />
                          <span>Cupo máximo de alumnos</span>
                        </div>

                        <strong>{actividad.cupoMaximo}</strong>
                      </div>

                      <div className="actividad-actions">
                        {canEditActividades && (
                          <Button
                            variant="primary"
                            icon={<Edit size={16} />}
                            onClick={() => abrirEditar(actividad)}
                            fullWidth
                          >
                            Editar
                          </Button>
                        )}

                        {canDeactivateActividades && (
                          <Button
                            variant="danger"
                            icon={<Trash2 size={16} />}
                            onClick={() => borrarActividad(actividad)}
                            fullWidth
                          >
                            Dar de baja
                          </Button>
                        )}

                        {!canEditActividades && !canDeactivateActividades && (
                          <span className="muted-action">Solo consulta</span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {totalPaginas > 1 && (
            <div className="actividades-carousel-dots" aria-label="Páginas de actividades">
              {Array.from({ length: totalPaginas }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  className={index === paginaActual ? "active" : ""}
                  onClick={() => setPaginaActual(index)}
                  aria-label={`Ir a página ${index + 1} de actividades`}
                  aria-current={index === paginaActual ? "page" : undefined}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <ActividadModal
        open={modalOpen}
        actividad={selectedActividad}
        onClose={() => setModalOpen(false)}
        onSubmit={guardarActividad}
      />
    </div>
  );
}
