import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import {
  BadgeCheck,
  BadgeDollarSign,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  IdCard,
  UserPlus,
  Edit,
  Plus,
  RefreshCcw,
  Star,
  Trash2,
} from "lucide-react";
import {
  actualizarTipoMembresia,
  crearTipoMembresia,
  eliminarTipoMembresia,
  getTiposMembresia,
  type TipoMembresia,
  type TipoMembresiaRequest,
} from "../../services/membresiasService";
import {
  Button,
  EmptyState,
  PageHeader,
  PageTabs,
  StatusBadge,
  type PageTabItem,
} from "../../components/ui";
import AsignarMembresiaPage from "../AsignarMembresia/AsignarMembresiaPage";
import ActivarMembresiaPage from "../ActivarMembresia/ActivarMembresiaPage";
import MembresiaModal from "./components/MembresiaModal";
import "./MembresiasPage.css";

type MembresiaTab = "tipos" | "asignar" | "activar";

const MEMBRESIAS_POR_PAGINA = 5;

const dividirEnPaginas = (membresias: TipoMembresia[]) => {
  const paginas: TipoMembresia[][] = [];

  for (let i = 0; i < membresias.length; i += MEMBRESIAS_POR_PAGINA) {
    paginas.push(membresias.slice(i, i + MEMBRESIAS_POR_PAGINA));
  }

  return paginas;
};

const tabs: PageTabItem<MembresiaTab>[] = [
  {
    value: "tipos",
    label: "Tipos de membresía",
    icon: <IdCard size={17} />,
  },
  {
    value: "asignar",
    label: "Asignar a socio",
    icon: <UserPlus size={17} />,
  },
  {
    value: "activar",
    label: "Activar membresía",
    icon: <BadgeCheck size={17} />,
  },
];

export default function MembresiasPage() {
  const [activeTab, setActiveTab] = useState<MembresiaTab>("tipos");
  const [membresias, setMembresias] = useState<TipoMembresia[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMembresia, setSelectedMembresia] =
    useState<TipoMembresia | null>(null);
  const [paginaActual, setPaginaActual] = useState(0);
  const scrollPorTab = useRef<Partial<Record<MembresiaTab, number>>>({});

  const membresiasActivas = useMemo(
    () => membresias.filter((membresia) => membresia.activa).length,
    [membresias],
  );

  const paginasMembresias = useMemo(
    () => dividirEnPaginas(membresias),
    [membresias],
  );

  const totalPaginas = Math.max(1, paginasMembresias.length);
  const puedeRetroceder = paginaActual > 0;
  const puedeAvanzar = paginaActual < totalPaginas - 1;
  const registroDesde = membresias.length
    ? paginaActual * MEMBRESIAS_POR_PAGINA + 1
    : 0;
  const registroHasta = Math.min(
    (paginaActual + 1) * MEMBRESIAS_POR_PAGINA,
    membresias.length,
  );

  const cargar = async () => {
    try {
      setLoading(true);
      const data = await getTiposMembresia();
      setMembresias(data);
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar las membresías.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

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
    setSelectedMembresia(null);
    setModalOpen(true);
  };

  const abrirEditar = (membresia: TipoMembresia) => {
    setSelectedMembresia(membresia);
    setModalOpen(true);
  };

  const guardarMembresia = async (data: TipoMembresiaRequest) => {
    try {
      if (selectedMembresia) {
        await actualizarTipoMembresia(selectedMembresia.id, data);
        toast.success("Membresía actualizada correctamente.");
      } else {
        await crearTipoMembresia(data);
        toast.success("Membresía creada correctamente.");
      }

      await cargar();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo guardar la membresía.");
    }
  };

  const borrarMembresia = async (membresia: TipoMembresia) => {
    const resultado = await Swal.fire({
      title: "¿Eliminar membresía?",
      text: `Se eliminará el plan ${membresia.nombre}.`,
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
      await eliminarTipoMembresia(membresia.id);
      toast.success("Membresía eliminada correctamente.");
      await cargar();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo eliminar la membresía.");
    }
  };

  const handleTabChange = (tab: MembresiaTab) => {
    const currentScroll = window.scrollY;
    scrollPorTab.current[activeTab] = currentScroll;
    setActiveTab(tab);

    requestAnimationFrame(() => {
      window.scrollTo({
        top: scrollPorTab.current[tab] ?? currentScroll,
        behavior: "auto",
      });
    });
  };

  return (
    <div className="membresias-page">
      <PageHeader
        kicker="Gestión de planes"
        title="Membresías"
        description="Administrá planes, asignaciones a socios y activaciones pendientes desde un único flujo operativo."
      />

      <PageTabs value={activeTab} tabs={tabs} onChange={handleTabChange} />

      {activeTab === "tipos" ? (
        <>
          <div className="membresias-actions-row">
            <div className="membresias-resume-pill">
              <Star size={16} />
              <span>
                {membresiasActivas} de {membresias.length} planes activos
              </span>
            </div>

            <div className="membresias-actions">
              <Button variant="secondary" icon={<RefreshCcw size={16} />} onClick={cargar}>
                Actualizar
              </Button>

              <Button variant="primary" icon={<Plus size={16} />} onClick={abrirNueva}>
                Nueva membresía
              </Button>
            </div>
          </div>

          {loading ? (
            <section className="membresias-carousel" aria-label="Cargando tipos de membresía">
              <div className="membresias-carousel-page static">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="membresia-card skeleton-card" />
                ))}
              </div>
            </section>
          ) : membresias.length === 0 ? (
            <EmptyState
              icon={<Star size={34} />}
              title="No hay planes cargados"
              description="Creá la primera membresía disponible para los socios."
              actionLabel="Nueva membresía"
              actionIcon={<Plus size={16} />}
              onAction={abrirNueva}
            />
          ) : (
            <section className="membresias-carousel" aria-label="Carrusel de tipos de membresía">
              <div className="membresias-carousel-toolbar">
                <div>
                  <span>Tipos de membresía registrados</span>
                  <strong>
                    {registroDesde}-{registroHasta} de {membresias.length}
                  </strong>
                </div>

                <div className="membresias-carousel-controls">
                  <button
                    type="button"
                    onClick={irPaginaAnterior}
                    disabled={!puedeRetroceder}
                    aria-label="Ver membresías anteriores"
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
                    aria-label="Ver membresías siguientes"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              <div className="membresias-carousel-viewport">
                <div
                  className="membresias-carousel-track"
                  style={{ transform: `translateX(-${paginaActual * 100}%)` }}
                >
                  {paginasMembresias.map((pagina, pageIndex) => (
                    <div className="membresias-carousel-page" key={pageIndex}>
                      {pagina.map((m) => (
                        <article
                          key={m.id}
                          className={m.activa ? "membresia-card" : "membresia-card inactive"}
                        >
                          <div className="membership-top">
                            <div className="membership-avatar">
                              <Star size={23} />
                            </div>

                            <StatusBadge
                              variant={m.activa ? "success" : "danger"}
                              label={m.activa ? "Activa" : "Inactiva"}
                            />
                          </div>

                          <h3>{m.nombre}</h3>

                          <p className="membership-description">
                            {m.descripcion || "Sin descripción cargada para este plan."}
                          </p>

                          <div className="membership-info">
                            <div>
                              <CalendarDays size={16} />
                              <span>{m.duracionDias} días</span>
                            </div>

                            <div>
                              <BadgeDollarSign size={16} />
                              <span>${m.precio.toLocaleString("es-AR")}</span>
                            </div>
                          </div>

                          <div className="card-actions">
                            <Button
                              variant="primary"
                              icon={<Edit size={16} />}
                              onClick={() => abrirEditar(m)}
                              fullWidth
                            >
                              Editar
                            </Button>

                            <Button
                              variant="danger"
                              icon={<Trash2 size={16} />}
                              onClick={() => borrarMembresia(m)}
                              fullWidth
                            >
                              Eliminar
                            </Button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {totalPaginas > 1 && (
                <div className="membresias-carousel-dots" aria-label="Páginas de membresías">
                  {Array.from({ length: totalPaginas }, (_, index) => (
                    <button
                      key={index}
                      type="button"
                      className={index === paginaActual ? "active" : ""}
                      onClick={() => setPaginaActual(index)}
                      aria-label={`Ir a página ${index + 1} de membresías`}
                      aria-current={index === paginaActual ? "page" : undefined}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          <MembresiaModal
            open={modalOpen}
            membresia={selectedMembresia}
            onClose={() => setModalOpen(false)}
            onSubmit={guardarMembresia}
          />
        </>
      ) : activeTab === "asignar" ? (
        <AsignarMembresiaPage />
      ) : (
        <ActivarMembresiaPage />
      )}
    </div>
  );
}
