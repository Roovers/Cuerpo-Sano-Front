import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import {
  Award,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Edit,
  IdCard,
  Mail,
  Phone,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  UserRoundCheck,
} from "lucide-react";
import { getActividades, type Actividad } from "../../services/actividadesService";
import {
  actualizarEntrenador,
  crearEntrenador,
  eliminarEntrenador,
  getEntrenadores,
  type Entrenador,
  type EntrenadorRequest,
} from "../../services/entrenadoresService";
import {
  Avatar,
  Button,
  EmptyState,
  FilterToolbar,
  PageHeader,
  SearchField,
  StatCard,
  StatsGrid,
  StatusBadge,
} from "../../components/ui";
import { getInitials } from "../../utils/initials";
import EntrenadorModal from "./components/EntrenadorModal";
import "./EntrenadoresPage.css";

const ENTRENADORES_POR_PAGINA = 5;

const dividirEnPaginas = (entrenadores: Entrenador[]) => {
  const paginas: Entrenador[][] = [];

  for (let i = 0; i < entrenadores.length; i += ENTRENADORES_POR_PAGINA) {
    paginas.push(entrenadores.slice(i, i + ENTRENADORES_POR_PAGINA));
  }

  return paginas;
};

export default function EntrenadoresPage() {
  const [entrenadores, setEntrenadores] = useState<Entrenador[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [buscar, setBuscar] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEntrenador, setSelectedEntrenador] =
    useState<Entrenador | null>(null);
  const [paginaActual, setPaginaActual] = useState(0);

  const nombreEspecialidad = (id: number, fallback?: string) => {
    if (fallback) return fallback;

    const actividad = actividades.find((a) => a.id === id);
    return actividad ? actividad.nombre : `Especialidad N.º ${id}`;
  };

  const entrenadoresFiltrados = useMemo(() => {
    const texto = buscar.trim().toLowerCase();

    if (!texto) return entrenadores;

    return entrenadores.filter((entrenador) => {
      const especialidad = nombreEspecialidad(
        entrenador.especialidadId,
        entrenador.especialidadNombre
      );

      return `${entrenador.nombre} ${entrenador.apellido} ${entrenador.dni} ${especialidad} ${entrenador.telefono || ""} ${entrenador.email || ""}`
        .toLowerCase()
        .includes(texto);
    });
  }, [entrenadores, buscar, actividades]);

  const totalActivos = useMemo(
    () => entrenadores.filter((entrenador) => entrenador.activo).length,
    [entrenadores]
  );

  const totalCertificados = useMemo(
    () => entrenadores.filter((entrenador) => entrenador.certificado).length,
    [entrenadores]
  );

  const paginasEntrenadores = useMemo(
    () => dividirEnPaginas(entrenadoresFiltrados),
    [entrenadoresFiltrados]
  );

  const totalPaginas = Math.max(1, paginasEntrenadores.length);
  const puedeRetroceder = paginaActual > 0;
  const puedeAvanzar = paginaActual < totalPaginas - 1;
  const registroDesde = entrenadoresFiltrados.length
    ? paginaActual * ENTRENADORES_POR_PAGINA + 1
    : 0;
  const registroHasta = Math.min(
    (paginaActual + 1) * ENTRENADORES_POR_PAGINA,
    entrenadoresFiltrados.length
  );

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [entrenadoresData, actividadesData] = await Promise.all([
        getEntrenadores(),
        getActividades(true),
      ]);

      setEntrenadores(entrenadoresData);
      setActividades(actividadesData);
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar los entrenadores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    setPaginaActual(0);
  }, [buscar]);

  useEffect(() => {
    setPaginaActual((prev) => Math.min(prev, totalPaginas - 1));
  }, [totalPaginas]);

  const irPaginaAnterior = () => {
    setPaginaActual((prev) => Math.max(prev - 1, 0));
  };

  const irPaginaSiguiente = () => {
    setPaginaActual((prev) => Math.min(prev + 1, totalPaginas - 1));
  };

  const abrirNuevo = () => {
    setSelectedEntrenador(null);
    setModalOpen(true);
  };

  const abrirEditar = (entrenador: Entrenador) => {
    setSelectedEntrenador(entrenador);
    setModalOpen(true);
  };

  const guardarEntrenador = async (data: EntrenadorRequest) => {
    try {
      if (selectedEntrenador) {
        await actualizarEntrenador(selectedEntrenador.id, data);
        toast.success("Entrenador actualizado correctamente.");
      } else {
        await crearEntrenador(data);
        toast.success("Entrenador creado correctamente.");
      }

      await cargarDatos();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo guardar el entrenador.");
    }
  };

  const borrarEntrenador = async (entrenador: Entrenador) => {
    const resultado = await Swal.fire({
      title: "¿Dar de baja entrenador?",
      text: `Se dará de baja a ${entrenador.nombre} ${entrenador.apellido}.`,
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
      await eliminarEntrenador(entrenador.id);
      toast.success("Entrenador dado de baja correctamente.");
      await cargarDatos();
    } catch (error) {
      console.error(error);
      toast.error(
        "No se pudo dar de baja el entrenador. Verificá si tiene horarios asociados."
      );
    }
  };

  return (
    <div className="entrenadores-page">
      <PageHeader
        kicker="Equipo profesional"
        title="Entrenadores"
        description="Administrá el equipo técnico, sus especialidades, certificaciones y disponibilidad laboral."
        actionLabel="Nuevo entrenador"
        actionIcon={<Plus size={16} />}
        onAction={abrirNuevo}
      />

      <StatsGrid columns={3}>
        <StatCard
          label="Equipo registrado"
          value={entrenadores.length}
          helper="Entrenadores cargados"
          icon={<UserRoundCheck size={18} />}
        />

        <StatCard
          label="Activos"
          value={totalActivos}
          helper="Disponibles para horarios"
          icon={<BriefcaseBusiness size={18} />}
        />

        <StatCard
          label="Certificados"
          value={totalCertificados}
          helper="Con certificación vigente"
          icon={<ShieldCheck size={18} />}
        />
      </StatsGrid>

      <FilterToolbar columns="1fr auto">
        <SearchField
          value={buscar}
          onChange={setBuscar}
          placeholder="Buscar por nombre, apellido, DNI, contacto o especialidad..."
        />

        <Button variant="primary" icon={<RefreshCcw size={16} />} onClick={cargarDatos}>
          Actualizar
        </Button>
      </FilterToolbar>

      {loading ? (
        <EmptyState
          icon={<BriefcaseBusiness size={30} />}
          description="Cargando entrenadores..."
        />
      ) : entrenadoresFiltrados.length === 0 ? (
        <EmptyState
          icon={<UserRoundCheck size={30} />}
          title="Sin resultados"
          description="No se encontraron entrenadores con ese criterio."
        />
      ) : (
        <section className="entrenadores-carousel" aria-label="Carrusel de entrenadores">
          <div className="entrenadores-carousel-toolbar">
            <div>
              <span>Entrenadores registrados</span>
              <strong>
                {registroDesde}-{registroHasta} de {entrenadoresFiltrados.length}
              </strong>
            </div>

            <div className="entrenadores-carousel-controls">
              <button
                type="button"
                onClick={irPaginaAnterior}
                disabled={!puedeRetroceder}
                aria-label="Ver entrenadores anteriores"
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
                aria-label="Ver entrenadores siguientes"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="entrenadores-carousel-viewport">
            <div
              className="entrenadores-carousel-track"
              style={{ transform: `translateX(-${paginaActual * 100}%)` }}
            >
              {paginasEntrenadores.map((pagina, pageIndex) => (
                <div className="entrenadores-carousel-page" key={pageIndex}>
                  {pagina.map((entrenador) => (
                    <article
                      key={entrenador.id}
                      className={
                        entrenador.activo
                          ? "entrenador-card"
                          : "entrenador-card inactive"
                      }
                    >
                      <div className="trainer-top">
                        <Avatar
                          size="lg"
                          src={entrenador.fotoUrl}
                          initials={getInitials(entrenador.nombre, entrenador.apellido, "EN")}
                          alt={`${entrenador.nombre} ${entrenador.apellido}`}
                        />

                        <StatusBadge
                          variant={entrenador.activo ? "success" : "danger"}
                          label={entrenador.activo ? "Activo" : "Inactivo"}
                        />
                      </div>

                      <h3>
                        {entrenador.nombre} {entrenador.apellido}
                      </h3>

                      <div className="trainer-specialty">
                        <Award size={17} />
                        <span>
                          {nombreEspecialidad(
                            entrenador.especialidadId,
                            entrenador.especialidadNombre
                          )}
                        </span>
                      </div>

                      <div className="trainer-info">
                        <div>
                          <IdCard size={16} />
                          <span>DNI {entrenador.dni}</span>
                        </div>

                        <div>
                          <Phone size={16} />
                          <span>{entrenador.telefono || "Sin teléfono"}</span>
                        </div>

                        <div>
                          <Mail size={16} />
                          <span>{entrenador.email || "Sin email"}</span>
                        </div>

                        <div>
                          <ShieldCheck size={16} />
                          <span>
                            {entrenador.certificado
                              ? "Certificación vigente"
                              : "Certificación pendiente"}
                          </span>
                        </div>
                      </div>

                      <div className="trainer-actions">
                        <Button
                          variant="primary"
                          icon={<Edit size={16} />}
                          onClick={() => abrirEditar(entrenador)}
                          fullWidth
                        >
                          Editar
                        </Button>

                        <Button
                          variant="danger"
                          icon={<Trash2 size={16} />}
                          onClick={() => borrarEntrenador(entrenador)}
                          fullWidth
                        >
                          Dar de baja
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {totalPaginas > 1 && (
            <div className="entrenadores-carousel-dots" aria-label="Páginas de entrenadores">
              {Array.from({ length: totalPaginas }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  className={index === paginaActual ? "active" : ""}
                  onClick={() => setPaginaActual(index)}
                  aria-label={`Ir a página ${index + 1} de entrenadores`}
                  aria-current={index === paginaActual ? "page" : undefined}
                />
              ))}
            </div>
          )}
        </section>      )}

      <EntrenadorModal
        open={modalOpen}
        entrenador={selectedEntrenador}
        actividades={actividades}
        onClose={() => setModalOpen(false)}
        onSubmit={guardarEntrenador}
      />
    </div>
  );
}
