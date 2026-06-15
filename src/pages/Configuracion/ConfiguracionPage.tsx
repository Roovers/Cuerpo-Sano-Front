import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import {
  Activity,
  CheckCircle2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileDown,
  FileText,
  Filter,
  KeyRound,
  LockKeyhole,
  Printer,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  ShieldQuestion,
  Trash2,
  UserCog,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";
import {
  actualizarUsuario,
  cambiarPassword,
  crearUsuario,
  eliminarUsuario,
  getAuditLogById,
  getAuditLogs,
  getRolesPermisos,
  getRolesUsuarios,
  getSesionActual,
  getUsuarios,
  restablecerPassword,
  type AuditLog,
  type AuditLogFilters,
  type RolPermisos,
  type RolUsuario,
  type SesionActual,
  type Usuario,
} from "../../services/ConfiguracionService";
import { DateRangePicker } from "../../components/ui";
import "./ConfiguracionPage.css";

type ConfigTab = "usuarios" | "roles" | "auditoria" | "seguridad";

type UsuarioForm = {
  id?: number;
  nombreUsuario: string;
  password: string;
  rol: string;
  activo: boolean;
};


type PasswordTemporalModal = {
  usuario: string;
  password: string;
};

type ConfirmAction =
  | { type: "reset-password"; usuario: Usuario }
  | { type: "delete-user"; usuario: Usuario }
  | null;

type PasswordForm = {
  passwordActual: string;
  passwordNueva: string;
  repetirPassword: string;
};

const emptyUserForm: UsuarioForm = {
  nombreUsuario: "",
  password: "",
  rol: "Recepcionista",
  activo: true,
};

const emptyPasswordForm: PasswordForm = {
  passwordActual: "",
  passwordNueva: "",
  repetirPassword: "",
};

const fallbackRoles: RolUsuario[] = [
  { id: 1, nombre: "Administrador" },
  { id: 2, nombre: "Profesor" },
  { id: 3, nombre: "Recepcionista" },
];

const tabs: { key: ConfigTab; label: string; icon: ReactNode }[] = [
  { key: "usuarios", label: "Usuarios", icon: <UsersRound size={17} /> },
  { key: "roles", label: "Roles y permisos", icon: <ShieldCheck size={17} /> },
  { key: "auditoria", label: "Auditoría", icon: <FileText size={17} /> },
  { key: "seguridad", label: "Seguridad", icon: <LockKeyhole size={17} /> },
];

const formatDateTime = (value?: string) => {
  if (!value) return "Sin fecha";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const roleClass = (rol?: string) => {
  const value = (rol || "").toLowerCase();

  if (value.includes("admin")) return "admin";
  if (value.includes("profesor") || value.includes("entrenador")) return "profesor";
  if (value.includes("recep")) return "recepcionista";
  return "default";
};

const resultadoClass = (resultado?: string) => {
  const value = (resultado || "").toLowerCase();
  if (value.includes("error") || value.includes("fall")) return "error";
  return "ok";
};

const escapeHtml = (value?: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const filtrosActivosLabel = (filters: AuditLogFilters) => {
  const values = [
    filters.desde && `Desde ${filters.desde}`,
    filters.hasta && `Hasta ${filters.hasta}`,
    filters.usuario && `Usuario: ${filters.usuario}`,
    filters.modulo && `Módulo: ${filters.modulo}`,
    filters.accion && `Acción: ${filters.accion}`,
    filters.resultado && `Resultado: ${filters.resultado}`,
  ].filter(Boolean);

  return values.length > 0 ? values.join(" · ") : "Sin filtros aplicados";
};

function KpiCard({
  icon,
  label,
  value,
  detail,
  accent = "blue",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  accent?: "blue" | "green" | "violet" | "amber";
}) {
  return (
    <article className={`config-kpi ${accent}`}>
      <div className="config-kpi-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="config-empty">
      <ShieldQuestion size={26} />
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`config-status ${active ? "active" : "inactive"}`}>
      {active ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}

function RoleBadge({ rol }: { rol: string }) {
  return <span className={`config-role ${roleClass(rol)}`}>{rol}</span>;
}

function ResultadoBadge({ resultado }: { resultado: string }) {
  return (
    <span className={`config-result ${resultadoClass(resultado)}`}>
      {resultadoClass(resultado) === "ok" ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
      {resultado || "OK"}
    </span>
  );
}

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<ConfigTab>("usuarios");
  const scrollRestorationRef = useRef<number | null>(null);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [rolesUsuarios, setRolesUsuarios] = useState<RolUsuario[]>(fallbackRoles);
  const [rolesPermisos, setRolesPermisos] = useState<RolPermisos[]>([]);
  const [sesion, setSesion] = useState<SesionActual | null>(null);

  const [auditPage, setAuditPage] = useState(0);
  const [auditSize] = useState(10);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditTotalItems, setAuditTotalItems] = useState(0);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditFilters, setAuditFilters] = useState<AuditLogFilters>({
    page: 0,
    size: 10,
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [passwordTemporalModal, setPasswordTemporalModal] = useState<PasswordTemporalModal | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const [loading, setLoading] = useState(true);
  const [savingUser, setSavingUser] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [exportingAudit, setExportingAudit] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userForm, setUserForm] = useState<UsuarioForm>(emptyUserForm);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(emptyPasswordForm);
  const [passwordResult, setPasswordResult] = useState<string | null>(null);


  const handleTabChange = (tab: ConfigTab) => {
    const currentScroll = window.scrollY;
    scrollRestorationRef.current = currentScroll;

    setActiveTab(tab);

    const restoreScroll = () => {
      const target = scrollRestorationRef.current;
      if (target === null) return;

      window.scrollTo({
        top: target,
        behavior: "auto",
      });
    };

    requestAnimationFrame(restoreScroll);
    window.setTimeout(restoreScroll, 80);
  };

  const isEditing = Boolean(userForm.id);

  const rolesDisponibles = useMemo(() => {
    return rolesUsuarios.length > 0 ? rolesUsuarios : fallbackRoles;
  }, [rolesUsuarios]);

  const usuariosFiltrados = useMemo(() => {
    const query = userSearch.trim().toLowerCase();

    if (!query) return usuarios;

    return usuarios.filter((usuario) => {
      return [
        usuario.nombreUsuario,
        usuario.rol,
        usuario.activo ? "activo" : "inactivo",
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [usuarios, userSearch]);

  const stats = useMemo(() => {
    const activos = usuarios.filter((usuario) => usuario.activo).length;
    const administradores = usuarios.filter((usuario) =>
      usuario.rol?.toLowerCase().includes("admin")
    ).length;

    return {
      usuarios: usuarios.length,
      activos,
      administradores,
      roles: rolesPermisos.length,
    };
  }, [usuarios, rolesPermisos]);

  const cargarBase = async () => {
    try {
      setLoading(true);

      const [usuariosRes, rolesUsuarioRes, rolesPermisosRes, sesionRes] =
        await Promise.all([
          getUsuarios(),
          getRolesUsuarios().catch(() => fallbackRoles),
          getRolesPermisos(),
          getSesionActual(),
        ]);

      setUsuarios(usuariosRes);
      setRolesUsuarios(rolesUsuarioRes.length > 0 ? rolesUsuarioRes : fallbackRoles);
      setRolesPermisos(rolesPermisosRes);
      setSesion(sesionRes);
    } catch (error) {
      toast.error("No se pudo cargar Configuración");
    } finally {
      setLoading(false);
    }
  };

  const cargarAuditoria = async (page = auditPage, customFilters = auditFilters) => {
    try {
      setLoadingAudit(true);

      const response = await getAuditLogs({
        ...customFilters,
        page,
        size: auditSize,
      });

      setAuditLogs(response.items);
      setAuditPage(response.page);
      setAuditTotalPages(Math.max(response.totalPages || 1, 1));
      setAuditTotalItems(response.totalItems || response.items.length);
    } catch (error) {
      toast.error("No se pudo cargar auditoría");
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    cargarBase();
  }, []);

  useEffect(() => {
    if (activeTab === "auditoria") {
      cargarAuditoria(0, auditFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const resetUserForm = () => {
    setUserForm({
      ...emptyUserForm,
      rol: rolesDisponibles[0]?.nombre || "Recepcionista",
    });
  };

  const editarUsuario = (usuario: Usuario) => {
    setUserForm({
      id: usuario.id,
      nombreUsuario: usuario.nombreUsuario,
      password: "",
      rol: usuario.rol || "Recepcionista",
      activo: usuario.activo,
    });
  };

  const guardarUsuario = async () => {
    if (!userForm.nombreUsuario.trim()) {
      toast.error("Ingresá el nombre de usuario");
      return;
    }

    if (!isEditing && !userForm.password.trim()) {
      toast.error("Ingresá una contraseña inicial");
      return;
    }

    try {
      setSavingUser(true);

      if (isEditing && userForm.id) {
        await actualizarUsuario(userForm.id, {
          nombreUsuario: userForm.nombreUsuario.trim(),
          rol: userForm.rol,
          activo: userForm.activo,
        });

        toast.success("Usuario actualizado");
      } else {
        await crearUsuario({
          nombreUsuario: userForm.nombreUsuario.trim(),
          password: userForm.password,
          rol: userForm.rol,
          activo: userForm.activo,
        });

        toast.success("Usuario creado");
      }

      resetUserForm();
      await cargarBase();
    } catch (error) {
      toast.error("No se pudo guardar el usuario");
    } finally {
      setSavingUser(false);
    }
  };

  const borrarUsuario = async (usuario: Usuario) => {
    try {
      await eliminarUsuario(usuario.id);
      toast.success("Usuario dado de baja");
      await cargarBase();
    } catch (error) {
      toast.error("No se pudo dar de baja el usuario");
    } finally {
      setConfirmAction(null);
    }
  };

  const resetearPassword = async (usuario: Usuario) => {
    try {
      const response = await restablecerPassword(usuario.nombreUsuario);
      const temporal =
        response?.passwordTemporal ||
        response?.password ||
        response?.nuevaPassword ||
        null;

      if (temporal) {
        setPasswordTemporalModal({
          usuario: usuario.nombreUsuario,
          password: temporal,
        });
        toast.success("Contraseña temporal generada");
      } else {
        toast.success("Contraseña restablecida");
      }
    } catch (error) {
      toast.error("No se pudo restablecer la contraseña");
    } finally {
      setConfirmAction(null);
    }
  };

  const guardarPassword = async () => {
    if (!passwordForm.passwordActual || !passwordForm.passwordNueva) {
      toast.error("Completá contraseña actual y nueva");
      return;
    }

    if (passwordForm.passwordNueva.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (passwordForm.passwordNueva !== passwordForm.repetirPassword) {
      toast.error("Las contraseñas nuevas no coinciden");
      return;
    }

    try {
      const response = await cambiarPassword(
        passwordForm.passwordActual,
        passwordForm.passwordNueva
      );

      setPasswordForm(emptyPasswordForm);
      setPasswordResult(response?.mensaje || "Contraseña modificada correctamente");
      toast.success("Contraseña modificada");
    } catch (error) {
      toast.error("No se pudo modificar la contraseña");
    }
  };

  const aplicarFiltrosAuditoria = () => {
    cargarAuditoria(0, {
      ...auditFilters,
      page: 0,
      size: auditSize,
    });
  };

  const limpiarFiltrosAuditoria = () => {
    const clean = {
      page: 0,
      size: auditSize,
    };

    setAuditFilters(clean);
    cargarAuditoria(0, clean);
  };

  const abrirDetalleLog = async (id: number) => {
    try {
      const log = await getAuditLogById(id);
      setSelectedLog(log);
    } catch (error) {
      toast.error("No se pudo abrir el detalle");
    }
  };

  const obtenerAuditoriaCompleta = async () => {
    const filters: AuditLogFilters = { ...auditFilters };
    delete filters.page;
    delete filters.size;

    const pageSize = 500;
    const firstPage = await getAuditLogs({
      ...filters,
      page: 0,
      size: pageSize,
    });

    const allLogs = [...firstPage.items];
    const totalPages = Math.max(firstPage.totalPages || 1, 1);

    for (let page = 1; page < totalPages; page += 1) {
      const nextPage = await getAuditLogs({
        ...filters,
        page,
        size: pageSize,
      });

      allLogs.push(...nextPage.items);
    }

    return allLogs;
  };

  const generarHtmlInformeAuditoria = (logs: AuditLog[]) => {
    const totalOk = logs.filter((log) => resultadoClass(log.resultado) === "ok").length;
    const totalError = logs.length - totalOk;
    const modulosUnicos = new Set(logs.map((log) => log.modulo).filter(Boolean)).size;
    const fechaGeneracion = new Date().toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const rows = logs
      .map(
        (log) => `
          <tr>
            <td>${escapeHtml(formatDateTime(log.fechaHora))}<small>#${escapeHtml(log.id)}</small></td>
            <td>${escapeHtml(log.usuarioNombre || "Sistema")}</td>
            <td>${escapeHtml(log.rol || "Sin rol")}</td>
            <td>${escapeHtml(log.modulo || "Sin módulo")}</td>
            <td>${escapeHtml(log.accion || "Sin acción")}</td>
            <td><span class="result ${resultadoClass(log.resultado)}">${escapeHtml(log.resultado || "OK")}</span></td>
            <td>${escapeHtml(log.detalle || "Sin detalle adicional")}</td>
          </tr>
        `,
      )
      .join("");

    return `
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Informe de auditoría - Cuerpo Sano</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              color: #111827;
              font-family: Arial, Helvetica, sans-serif;
              background: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .page { padding: 28px; }
            .cover {
              padding: 24px;
              border-radius: 24px;
              color: white;
              background: linear-gradient(135deg, #0f172a, #1d4ed8 58%, #7c3aed);
              margin-bottom: 18px;
            }
            .eyebrow {
              display: inline-block;
              margin-bottom: 10px;
              color: #bfdbfe;
              font-size: 11px;
              font-weight: 800;
              letter-spacing: .12em;
              text-transform: uppercase;
            }
            h1 { margin: 0 0 8px; font-size: 30px; letter-spacing: -.04em; }
            .cover p { margin: 0; max-width: 780px; color: rgba(255,255,255,.78); font-size: 13px; line-height: 1.5; }
            .meta {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              margin: 18px 0;
            }
            .kpi {
              padding: 14px;
              border-radius: 16px;
              border: 1px solid #e5e7eb;
              background: #f8fafc;
            }
            .kpi span {
              display: block;
              color: #64748b;
              font-size: 10px;
              font-weight: 800;
              letter-spacing: .08em;
              text-transform: uppercase;
              margin-bottom: 6px;
            }
            .kpi strong { display: block; color: #0f172a; font-size: 23px; }
            .filters {
              margin-bottom: 14px;
              padding: 12px 14px;
              border-radius: 14px;
              background: #eff6ff;
              border: 1px solid #bfdbfe;
              color: #1e3a8a;
              font-size: 12px;
              font-weight: 700;
            }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th {
              text-align: left;
              padding: 10px 9px;
              color: #334155;
              background: #e2e8f0;
              border: 1px solid #cbd5e1;
              text-transform: uppercase;
              letter-spacing: .055em;
              font-size: 10px;
            }
            td {
              vertical-align: top;
              padding: 9px;
              border: 1px solid #e5e7eb;
              line-height: 1.35;
            }
            tr:nth-child(even) td { background: #f8fafc; }
            td small { display: block; margin-top: 4px; color: #64748b; font-size: 10px; }
            .result {
              display: inline-block;
              padding: 4px 7px;
              border-radius: 999px;
              font-size: 10px;
              font-weight: 800;
            }
            .result.ok { color: #166534; background: #dcfce7; }
            .result.error { color: #991b1b; background: #fee2e2; }
            .footer {
              margin-top: 16px;
              color: #64748b;
              font-size: 10px;
              text-align: right;
            }
            @media print {
              .cover, .kpi, table { break-inside: avoid; }
              .page { padding: 18mm 14mm; }
            }
          </style>
        </head>
        <body>
          <main class="page">
            <section class="cover">
              <span class="eyebrow">Cuerpo Sano · Auditoría</span>
              <h1>Informe de auditoría del sistema</h1>
              <p>Documento generado con todos los registros encontrados para los filtros activos. Incluye usuario, rol, módulo, acción, resultado y detalle operativo.</p>
            </section>

            <section class="meta">
              <article class="kpi"><span>Total eventos</span><strong>${logs.length}</strong></article>
              <article class="kpi"><span>Eventos OK</span><strong>${totalOk}</strong></article>
              <article class="kpi"><span>Eventos error</span><strong>${totalError}</strong></article>
              <article class="kpi"><span>Módulos auditados</span><strong>${modulosUnicos}</strong></article>
            </section>

            <div class="filters">Filtros: ${escapeHtml(filtrosActivosLabel(auditFilters))}</div>

            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Módulo</th>
                  <th>Acción</th>
                  <th>Resultado</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>

            <div class="footer">Generado el ${escapeHtml(fechaGeneracion)}</div>
          </main>
        </body>
      </html>
    `;
  };

  const abrirInformeAuditoria = async (modo: "pdf" | "print") => {
    try {
      setExportingAudit(true);
      const logs = await obtenerAuditoriaCompleta();

      if (logs.length === 0) {
        toast.error("No hay auditorías para generar el informe");
        return;
      }

      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";

      document.body.appendChild(iframe);

      const iframeWindow = iframe.contentWindow;
      const iframeDocument = iframe.contentDocument || iframeWindow?.document;

      if (!iframeWindow || !iframeDocument) {
        throw new Error("No se pudo crear el documento de auditoría.");
      }

      iframeDocument.open();
      iframeDocument.write(generarHtmlInformeAuditoria(logs));
      iframeDocument.close();

      window.setTimeout(() => {
        iframeWindow.focus();
        iframeWindow.print();

        window.setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 450);

      toast.success(
        modo === "pdf"
          ? "Informe PDF preparado para guardar."
          : "Informe preparado para imprimir.",
      );
    } catch (error) {
      console.error(error);
      toast.error("No se pudo generar el informe de auditoría");
    } finally {
      setExportingAudit(false);
    }
  };


  const copiarPasswordTemporal = async () => {
    if (!passwordTemporalModal?.password) return;

    try {
      await navigator.clipboard.writeText(passwordTemporalModal.password);
      toast.success("Contraseña copiada");
    } catch (error) {
      toast.error("No se pudo copiar automáticamente");
    }
  };

  const ejecutarConfirmacion = () => {
    if (!confirmAction) return;

    if (confirmAction.type === "reset-password") {
      resetearPassword(confirmAction.usuario);
      return;
    }

    if (confirmAction.type === "delete-user") {
      borrarUsuario(confirmAction.usuario);
    }
  };

  return (
    <main className="config-page">
      <header className="config-header">
        <div>
          <span className="config-eyebrow">Administración del sistema</span>
          <h2>Configuración</h2>
          <p>
            Usuarios, permisos, auditoría y seguridad de sesión centralizados en
            un único módulo.
          </p>
        </div>

        <button className="config-refresh" onClick={cargarBase} disabled={loading}>
          <RefreshCcw size={17} />
          Actualizar
        </button>
      </header>

      <section className="config-kpi-grid">
        <KpiCard
          icon={<UsersRound size={22} />}
          label="Usuarios"
          value={String(stats.usuarios)}
          detail={`${stats.activos} activos en el sistema`}
          accent="blue"
        />
        <KpiCard
          icon={<ShieldCheck size={22} />}
          label="Roles"
          value={String(stats.roles || 3)}
          detail="Administrador, Profesor y Recepcionista"
          accent="green"
        />
        <KpiCard
          icon={<UserCog size={22} />}
          label="Administradores"
          value={String(stats.administradores)}
          detail="Usuarios con control total"
          accent="violet"
        />
        <KpiCard
          icon={<Activity size={22} />}
          label="Auditoría"
          value={String(auditTotalItems)}
          detail="Eventos registrados"
          accent="amber"
        />
      </section>

      <nav className="config-tabs" aria-label="Configuración">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? "active" : ""}
            onClick={() => handleTabChange(tab.key)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "usuarios" && (
        <section className="config-tab-content">
          <div className="config-two-columns">
            <section className="config-panel config-form-panel">
              <div className="config-panel-title">
                <div>
                  <h3>{isEditing ? "Editar usuario" : "Nuevo usuario"}</h3>
                  <p>
                    Alta y mantenimiento de accesos administrativos, de recepción
                    y profesores.
                  </p>
                </div>
                {isEditing && (
                  <button className="config-ghost-button" onClick={resetUserForm}>
                    <X size={15} />
                    Cancelar
                  </button>
                )}
              </div>

              <div className="config-form-grid">
                <label>
                  Usuario
                  <input
                    value={userForm.nombreUsuario}
                    onChange={(event) =>
                      setUserForm((prev) => ({
                        ...prev,
                        nombreUsuario: event.target.value,
                      }))
                    }
                    placeholder="ej: recepcion.turno"
                  />
                </label>

                {!isEditing && (
                  <label>
                    Contraseña inicial
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(event) =>
                        setUserForm((prev) => ({
                          ...prev,
                          password: event.target.value,
                        }))
                      }
                      placeholder="Mínimo 6 caracteres"
                    />
                  </label>
                )}

                <label>
                  Rol
                  <select
                    value={userForm.rol}
                    onChange={(event) =>
                      setUserForm((prev) => ({
                        ...prev,
                        rol: event.target.value,
                      }))
                    }
                  >
                    {rolesDisponibles.map((rol) => (
                      <option key={rol.id || rol.nombre} value={rol.nombre}>
                        {rol.nombre}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Estado
                  <select
                    value={userForm.activo ? "activo" : "inactivo"}
                    onChange={(event) =>
                      setUserForm((prev) => ({
                        ...prev,
                        activo: event.target.value === "activo",
                      }))
                    }
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </label>
              </div>

              <button
                className="config-primary-button"
                onClick={guardarUsuario}
                disabled={savingUser}
              >
                <Save size={17} />
                {savingUser ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear usuario"}
              </button>
            </section>

            <section className="config-panel">
              <div className="config-panel-title">
                <div>
                  <h3>Usuarios del sistema</h3>
                  <p>Control de accesos y credenciales operativas.</p>
                </div>
                <div className="config-search">
                  <Search size={16} />
                  <input
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                    placeholder="Buscar usuario, rol o estado"
                  />
                </div>
              </div>

              {loading ? (
                <EmptyState title="Cargando usuarios" text="Consultando información de seguridad." />
              ) : usuariosFiltrados.length === 0 ? (
                <EmptyState title="Sin usuarios" text="No hay usuarios que coincidan con la búsqueda." />
              ) : (
                <div className="config-user-list config-user-list-scroll">
                  {usuariosFiltrados.map((usuario) => (
                    <article key={usuario.id} className="config-user-card">
                      <div className="config-user-avatar">
                        {usuario.nombreUsuario?.slice(0, 2).toUpperCase()}
                      </div>

                      <div className="config-user-main">
                        <strong>{usuario.nombreUsuario}</strong>
                        <div>
                          <RoleBadge rol={usuario.rol} />
                          <StatusBadge active={usuario.activo} />
                        </div>
                      </div>

                      <div className="config-user-actions">
                        <button onClick={() => editarUsuario(usuario)}>
                          <UserCog size={15} />
                          Editar
                        </button>
                        <button onClick={() => setConfirmAction({ type: "reset-password", usuario })}>
                          <KeyRound size={15} />
                          Reset
                        </button>
                        <button
                          className="danger"
                          onClick={() => setConfirmAction({ type: "delete-user", usuario })}
                          disabled={!usuario.activo}
                        >
                          <Trash2 size={15} />
                          Baja
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      )}

      {activeTab === "roles" && (
        <section className="config-tab-content">
          <section className="config-panel">
            <div className="config-panel-title">
              <div>
                <h3>Matriz de roles y permisos</h3>
                <p>
                  Vista funcional de páginas, acciones y cards visibles por rol.
                </p>
              </div>
              <span className="config-readonly-badge">Solo lectura</span>
            </div>

            {rolesPermisos.length === 0 ? (
              <EmptyState title="Sin matriz de permisos" text="No se recibieron permisos desde el backend." />
            ) : (
              <div className="config-role-grid">
                {rolesPermisos.map((rol) => (
                  <article key={rol.rol} className="config-role-card">
                    <div className="config-role-card-head">
                      <RoleBadge rol={rol.rol} />
                      <p>{rol.descripcion}</p>
                    </div>

                    <div className="config-permission-section">
                      <strong>Páginas</strong>
                      <div className="config-chip-list">
                        {rol.paginas.map((permiso) => (
                          <span key={permiso.codigo}>{permiso.nombre}</span>
                        ))}
                      </div>
                    </div>

                    <div className="config-permission-section">
                      <strong>Acciones</strong>
                      <div className="config-chip-list muted">
                        {rol.acciones.map((permiso) => (
                          <span key={permiso.codigo}>{permiso.nombre}</span>
                        ))}
                      </div>
                    </div>

                    <div className="config-permission-section">
                      <strong>Cards</strong>
                      <div className="config-chip-list cards">
                        {rol.cards.map((permiso) => (
                          <span key={permiso.codigo}>{permiso.nombre}</span>
                        ))}
                      </div>
                    </div>

                    {rol.restricciones.length > 0 && (
                      <div className="config-restrictions">
                        <strong>Restricciones</strong>
                        {rol.restricciones.map((item) => (
                          <p key={item}>{item}</p>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      )}

      {activeTab === "auditoria" && (
        <section className="config-tab-content">
          <section className="config-panel">
            <div className="config-panel-title">
              <div>
                <h3>Auditoría del sistema</h3>
                <p>Seguimiento de accesos, acciones críticas y eventos operativos.</p>
              </div>

              <div className="config-panel-actions">
                <button
                  className="config-report-button"
                  onClick={() => abrirInformeAuditoria("pdf")}
                  disabled={loadingAudit || exportingAudit}
                >
                  <FileDown size={15} />
                  PDF
                </button>
                <button
                  className="config-report-button"
                  onClick={() => abrirInformeAuditoria("print")}
                  disabled={loadingAudit || exportingAudit}
                >
                  <Printer size={15} />
                  Imprimir
                </button>
                <button
                  className="config-refresh small"
                  onClick={() => cargarAuditoria(auditPage)}
                  disabled={loadingAudit || exportingAudit}
                >
                  <RefreshCcw size={15} />
                  Actualizar
                </button>
              </div>
            </div>

            <div className="config-audit-filters">
              <DateRangePicker
                from={auditFilters.desde || ""}
                to={auditFilters.hasta || ""}
                onFromChange={(value) =>
                  setAuditFilters((prev) => ({ ...prev, desde: value }))
                }
                onToChange={(value) =>
                  setAuditFilters((prev) => ({ ...prev, hasta: value }))
                }
                fromLabel="Desde"
                toLabel="Hasta"
                minYear={2024}
                maxYear={new Date().getFullYear() + 1}
                className="config-audit-date-range"
              />

              <label>
                Usuario
                <input
                  value={auditFilters.usuario || ""}
                  onChange={(event) =>
                    setAuditFilters((prev) => ({ ...prev, usuario: event.target.value }))
                  }
                  placeholder="admin"
                />
              </label>
              <label>
                Módulo
                <input
                  value={auditFilters.modulo || ""}
                  onChange={(event) =>
                    setAuditFilters((prev) => ({ ...prev, modulo: event.target.value }))
                  }
                  placeholder="Auth, Pagos..."
                />
              </label>
              <label>
                Resultado
                <select
                  value={auditFilters.resultado || ""}
                  onChange={(event) =>
                    setAuditFilters((prev) => ({ ...prev, resultado: event.target.value }))
                  }
                >
                  <option value="">Todos</option>
                  <option value="OK">OK</option>
                  <option value="ERROR">ERROR</option>
                </select>
              </label>

              <div className="config-filter-actions">
                <button onClick={aplicarFiltrosAuditoria} disabled={loadingAudit || exportingAudit}>
                  <Filter size={15} />
                  Filtrar
                </button>
                <button
                  className="secondary"
                  onClick={limpiarFiltrosAuditoria}
                  disabled={loadingAudit || exportingAudit}
                >
                  Limpiar
                </button>
              </div>
            </div>

            {loadingAudit ? (
              <EmptyState title="Cargando auditoría" text="Consultando registros del sistema." />
            ) : auditLogs.length === 0 ? (
              <EmptyState title="Sin eventos" text="No hay logs para los filtros seleccionados." />
            ) : (
              <>
                <div className="config-audit-table-shell">
                  <table className="config-audit-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Usuario</th>
                        <th>Módulo</th>
                        <th>Acción</th>
                        <th>Resultado</th>
                        <th>Detalle</th>
                        <th aria-label="Acciones" />
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id}>
                          <td>
                            <strong>{formatDateTime(log.fechaHora)}</strong>
                            <small>Registro #{log.id}</small>
                          </td>
                          <td>
                            <strong>{log.usuarioNombre || "Sistema"}</strong>
                            <RoleBadge rol={log.rol} />
                          </td>
                          <td>
                            <span className="config-module">{log.modulo}</span>
                          </td>
                          <td>{log.accion}</td>
                          <td>
                            <ResultadoBadge resultado={log.resultado} />
                          </td>
                          <td>{log.detalle || "Sin detalle adicional"}</td>
                          <td>
                            <button
                              className="config-icon-button"
                              onClick={() => abrirDetalleLog(log.id)}
                              title="Ver detalle"
                            >
                              <Eye size={17} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="config-pagination">
                  <span>
                    Página {auditPage + 1} de {auditTotalPages} · {auditTotalItems} eventos · 10 por página
                  </span>
                  <div>
                    <button
                      onClick={() => cargarAuditoria(Math.max(auditPage - 1, 0))}
                      disabled={auditPage <= 0 || loadingAudit || exportingAudit}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() =>
                        cargarAuditoria(Math.min(auditPage + 1, auditTotalPages - 1))
                      }
                      disabled={auditPage >= auditTotalPages - 1 || loadingAudit || exportingAudit}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </section>
      )}


      {activeTab === "seguridad" && (
        <section className="config-tab-content">
          <div className="config-two-columns">
            <section className="config-panel">
              <div className="config-panel-title">
                <div>
                  <h3>Sesión actual</h3>
                  <p>Información tomada desde el JWT activo.</p>
                </div>
                <ShieldCheck size={24} />
              </div>

              {sesion ? (
                <div className="config-session-card">
                  <div className="config-session-avatar">
                    {(sesion.nombreUsuario || sesion.usuario || "US").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <strong>{sesion.nombreUsuario || sesion.usuario}</strong>
                    <RoleBadge rol={sesion.rol} />
                    <StatusBadge active={sesion.activo} />
                  </div>
                  <div className="config-session-permissions">
                    <span>{sesion.paginas?.length || 0} páginas</span>
                    <span>{sesion.acciones?.length || 0} acciones</span>
                    <span>{sesion.cards?.length || 0} cards</span>
                  </div>
                </div>
              ) : (
                <EmptyState title="Sin sesión" text="No se pudo consultar el usuario autenticado." />
              )}
            </section>

            <section className="config-panel config-form-panel">
              <div className="config-panel-title">
                <div>
                  <h3>Cambiar contraseña</h3>
                  <p>Actualización de credenciales de la sesión actual.</p>
                </div>
                <KeyRound size={24} />
              </div>

              <div className="config-form-grid one">
                <label>
                  Contraseña actual
                  <input
                    type="password"
                    value={passwordForm.passwordActual}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        passwordActual: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Nueva contraseña
                  <input
                    type="password"
                    value={passwordForm.passwordNueva}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        passwordNueva: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Repetir nueva contraseña
                  <input
                    type="password"
                    value={passwordForm.repetirPassword}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        repetirPassword: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              {passwordResult && (
                <div className="config-success-message">{passwordResult}</div>
              )}

              <button className="config-primary-button" onClick={guardarPassword}>
                <Save size={17} />
                Actualizar contraseña
              </button>
            </section>
          </div>
        </section>
      )}


      {confirmAction && (
        <div className="config-modal-backdrop" onClick={() => setConfirmAction(null)}>
          <section
            className={`config-confirm-modal ${confirmAction.type === "delete-user" ? "danger" : "warning"}`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="config-modal-close"
              onClick={() => setConfirmAction(null)}
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>

            <div className="config-confirm-icon">
              {confirmAction.type === "delete-user" ? (
                <Trash2 size={34} />
              ) : (
                <KeyRound size={34} />
              )}
            </div>

            <h3>
              {confirmAction.type === "delete-user"
                ? "¿Dar de baja usuario?"
                : "¿Restablecer contraseña?"}
            </h3>

            <p>
              {confirmAction.type === "delete-user"
                ? `Se dará de baja a ${confirmAction.usuario.nombreUsuario}.`
                : `Se generará una nueva contraseña temporal para ${confirmAction.usuario.nombreUsuario}.`}
            </p>

            {confirmAction.type === "reset-password" && (
              <span className="config-confirm-note">
                La contraseña temporal se mostrará una sola vez para copiarla.
              </span>
            )}

            <div className="config-confirm-actions">
              <button
                className={confirmAction.type === "delete-user" ? "danger" : "primary"}
                onClick={ejecutarConfirmacion}
              >
                {confirmAction.type === "delete-user" ? "Sí, dar de baja" : "Sí, restablecer"}
              </button>
              <button className="secondary" onClick={() => setConfirmAction(null)}>
                Cancelar
              </button>
            </div>
          </section>
        </div>
      )}

      {passwordTemporalModal && (
        <div className="config-modal-backdrop" onClick={() => setPasswordTemporalModal(null)}>
          <section
            className="config-password-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="config-modal-close"
              onClick={() => setPasswordTemporalModal(null)}
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>

            <div className="config-password-modal-head">
              <div className="config-password-icon">
                <KeyRound size={24} />
              </div>
              <div>
                <span>Contraseña restablecida</span>
                <h3>{passwordTemporalModal.usuario}</h3>
                <p>
                  Esta contraseña temporal se muestra una sola vez. Copiala antes
                  de cerrar este mensaje.
                </p>
              </div>
            </div>

            <div className="config-temporary-password-box">
              <span>Nueva contraseña temporal</span>
              <strong>{passwordTemporalModal.password}</strong>
            </div>

            <div className="config-password-modal-actions">
              <button className="config-primary-button" onClick={copiarPasswordTemporal}>
                <Copy size={17} />
                Copiar contraseña
              </button>
              <button
                className="config-ghost-button"
                onClick={() => setPasswordTemporalModal(null)}
              >
                Entendido
              </button>
            </div>
          </section>
        </div>
      )}

      {selectedLog && (
        <div className="config-modal-backdrop" onClick={() => setSelectedLog(null)}>
          <section className="config-log-modal" onClick={(event) => event.stopPropagation()}>
            <button className="config-modal-close" onClick={() => setSelectedLog(null)}>
              <X size={18} />
            </button>

            <div className="config-panel-title">
              <div>
                <h3>Detalle de auditoría</h3>
                <p>Evento #{selectedLog.id}</p>
              </div>
              <ResultadoBadge resultado={selectedLog.resultado} />
            </div>

            <div className="config-log-detail">
              <div>
                <span>Fecha</span>
                <strong>{formatDateTime(selectedLog.fechaHora)}</strong>
              </div>
              <div>
                <span>Usuario</span>
                <strong>{selectedLog.usuarioNombre}</strong>
              </div>
              <div>
                <span>Rol</span>
                <RoleBadge rol={selectedLog.rol} />
              </div>
              <div>
                <span>Módulo</span>
                <strong>{selectedLog.modulo}</strong>
              </div>
              <div>
                <span>Acción</span>
                <strong>{selectedLog.accion}</strong>
              </div>
              <div>
                <span>Entidad</span>
                <strong>{selectedLog.entidad || "—"}</strong>
              </div>
              <div className="wide">
                <span>Detalle</span>
                <p>{selectedLog.detalle || "Sin detalle adicional"}</p>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
