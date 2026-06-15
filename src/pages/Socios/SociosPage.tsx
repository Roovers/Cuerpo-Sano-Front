import { useEffect, useState } from "react";
import { Edit, RefreshCcw, Search, Trash2, UserPlus, Users } from "lucide-react";
import {
  actualizarSocio,
  crearSocio,
  eliminarSocio,
  getSocios,
  type Socio,
  type SocioRequest,
} from "../../services/sociosService";
import {
  Avatar,
  Button,
  EmptyState,
  FilterToolbar,
  IconButton,
  PageHeader,
  SearchField,
  StatusBadge,
} from "../../components/ui";
import { getInitials } from "../../utils/initials";
import SocioModal from "./components/SocioModal";
import "./SociosPage.css";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { useAuthSession } from "../../auth/AuthSessionContext";

function SkeletonRow() {
  return (
    <tr className="skeleton-row">
      <td>
        <div className="skeleton-member">
          <div className="skeleton-cell avatar" />
          <div className="skeleton-lines">
            <div className="skeleton-cell" style={{ width: "120px" }} />
            <div className="skeleton-cell" />
          </div>
        </div>
      </td>

      {[90, 110, 70, 100, 80, 60].map((width, index) => (
        <td key={index}>
          <div className="skeleton-cell" style={{ width: `${width}px` }} />
        </td>
      ))}
    </tr>
  );
}

export default function SociosPage() {
  const { hasAction } = useAuthSession();
  const canCreateSocios = hasAction("socios.crear");
  const canEditSocios = hasAction("socios.editar");
  const canDeleteSocios = hasAction("socios.eliminar");
  const [socios, setSocios] = useState<Socio[]>([]);
  const [buscar, setBuscar] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSocio, setSelectedSocio] = useState<Socio | null>(null);

  const cargarSocios = async (terminoBusqueda = buscar) => {
    try {
      setLoading(true);
      const data = await getSocios(terminoBusqueda);
      setSocios(data);
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar los socios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSocios("");
  }, []);

  const abrirNuevo = () => {
    if (!canCreateSocios) {
      toast.error("No tenés permiso para crear socios.");
      return;
    }

    setSelectedSocio(null);
    setModalOpen(true);
  };

  const abrirEditar = (socio: Socio) => {
    if (!canEditSocios) {
      toast.error("No tenés permiso para editar socios.");
      return;
    }

    setSelectedSocio(socio);
    setModalOpen(true);
  };

  const guardarSocio = async (data: SocioRequest) => {
    if (selectedSocio && !canEditSocios) {
      toast.error("No tenés permiso para editar socios.");
      return;
    }

    if (!selectedSocio && !canCreateSocios) {
      toast.error("No tenés permiso para crear socios.");
      return;
    }

    try {
      if (selectedSocio) {
        await actualizarSocio(selectedSocio.id, data);
        toast.success("Socio actualizado correctamente.");
      } else {
        await crearSocio(data);
        toast.success("Socio creado correctamente.");
      }

      await cargarSocios();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo guardar el socio.");
    }
  };

  const borrarSocio = async (socio: Socio) => {
    if (!canDeleteSocios) {
      toast.error("No tenés permiso para dar de baja socios.");
      return;
    }

    const resultado = await Swal.fire({
      title: "¿Eliminar socio?",
      text: `Se dará de baja a ${socio.nombre} ${socio.apellido}.`,
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
      await eliminarSocio(socio.id);
      toast.success("Socio eliminado correctamente.");
      await cargarSocios();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo eliminar el socio.");
    }
  };

  const limpiarBusqueda = async () => {
    setBuscar("");
    await cargarSocios("");
  };

  return (
    <div className="socios-page">
      <PageHeader
        kicker="Gestión de miembros"
        title="Socios"
        description="Administrá socios, estados de membresía y datos personales."
        {...(canCreateSocios
          ? {
              actionLabel: "Nuevo socio",
              actionIcon: <UserPlus size={17} />,
              onAction: abrirNuevo,
            }
          : {})}
      />

      <FilterToolbar columns="1fr auto auto">
        <SearchField
          value={buscar}
          onChange={setBuscar}
          placeholder="Buscar por nombre, apellido, DNI o número..."
          onKeyDown={(event) => {
            if (event.key === "Enter") cargarSocios();
          }}
        />

        <Button variant="primary" icon={<Search size={16} />} onClick={() => cargarSocios()}>
          Buscar
        </Button>

        <Button variant="secondary" icon={<RefreshCcw size={16} />} onClick={limpiarBusqueda}>
          Refrescar
        </Button>
      </FilterToolbar>

      <div className="socios-table-card">
        {loading ? (
          <table>
            <thead>
              <tr>
                <th>Socio</th>
                <th>DNI</th>
                <th>Contacto</th>
                <th>N° Socio</th>
                <th>Membresía</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonRow key={index} />
              ))}
            </tbody>
          </table>
        ) : socios.length === 0 ? (
          <EmptyState
            icon={<Users size={34} />}
            title="No se encontraron socios"
            description="Probá con otro criterio de búsqueda o registrá un nuevo socio."
            actionLabel="Nuevo socio"
            actionIcon={<UserPlus size={16} />}
            onAction={abrirNuevo}
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Socio</th>
                <th>DNI</th>
                <th>Contacto</th>
                <th>N° Socio</th>
                <th>Membresía</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {socios.map((socio) => (
                <tr key={socio.id}>
                  <td>
                    <div className="member-cell">
                      <Avatar
                        size="md"
                        src={socio.fotoUrl}
                        alt={`${socio.nombre} ${socio.apellido}`}
                        initials={getInitials(socio.nombre, socio.apellido, "CS")}
                      />

                      <div>
                        <strong>
                          {socio.nombre} {socio.apellido}
                        </strong>
                        <span>{socio.email || "Sin email"}</span>
                      </div>
                    </div>
                  </td>

                  <td>{socio.dni}</td>
                  <td>{socio.telefono || "Sin teléfono"}</td>
                  <td>{socio.numeroSocio || "—"}</td>
                  <td>{socio.estadoMembresia || "Sin membresía"}</td>

                  <td>
                    <StatusBadge
                      variant={socio.activo ? "success" : "danger"}
                      label={socio.activo ? "Activo" : "Inactivo"}
                    />
                  </td>

                  <td>
                    <div className="action-buttons">
                      {canEditSocios && (
                        <IconButton
                          icon={<Edit size={15} />}
                          label="Editar"
                          onClick={() => abrirEditar(socio)}
                        />
                      )}

                      {canDeleteSocios && (
                        <IconButton
                          icon={<Trash2 size={15} />}
                          label="Dar de baja"
                          variant="danger"
                          onClick={() => borrarSocio(socio)}
                        />
                      )}

                      {!canEditSocios && !canDeleteSocios && (
                        <span className="muted-action">Solo consulta</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <SocioModal
        open={modalOpen}
        socio={selectedSocio}
        onClose={() => setModalOpen(false)}
        onSubmit={guardarSocio}
      />
    </div>
  );
}
