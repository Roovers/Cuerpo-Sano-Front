import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  CalendarDays,
  CreditCard,
  Dumbbell,
  Home,
  PowerOff,
  ShieldCheck,
  UserRoundCheck,
  Users,
  Star,
  Settings,
} from "lucide-react";
import "./AppLayout.css";
import logo from "../assets/logo.png";
import { useAuthSession } from "../auth/AuthSessionContext";

const menu = [
  { label: "Dashboard", path: "/dashboard", pageCode: "dashboard", icon: Home },
  { label: "Socios", path: "/socios", pageCode: "socios", icon: Users },
  { label: "Entrenadores", path: "/entrenadores", pageCode: "entrenadores", icon: UserRoundCheck },
  { label: "Membresías", path: "/membresias", pageCode: "membresias", icon: Star },
  { label: "Pagos", path: "/pagos", pageCode: "pagos", icon: CreditCard },
  { label: "Actividades", path: "/actividades", pageCode: "actividades", icon: Dumbbell },
  { label: "Horarios", path: "/horarios", pageCode: "clases", icon: CalendarDays },
  { label: "Asistencias", path: "/asistencias", pageCode: "asistencias", icon: Activity },
  { label: "Reportes", path: "/reportes", pageCode: "reportes", icon: BarChart3 },
  { label: "Configuración", path: "/configuracion", pageCode: "configuracion", icon: Settings },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const { session, loading, hasPage } = useAuthSession();

  const usuario =
    session?.nombreUsuario ||
    session?.usuario ||
    localStorage.getItem("usuario") ||
    "Usuario";

  const rol = session?.rol || localStorage.getItem("rol") || "Sin rol";

  const visibleMenu = menu.filter((item) => hasPage(item.pageCode));

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="app-layout">
        <main className="workspace">
          <section className="content-card">
            <div className="layout-permission-loader">
              Validando sesión y permisos...
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (visibleMenu.length === 0) {
    return (
      <div className="app-layout">
        <main className="workspace">
          <section className="content-card">
            <div className="layout-permission-denied">
              No tenés permisos asignados para navegar el sistema.
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />
      <div className="aurora aurora-three" />

      <main className="workspace">
        <header className="topbar">
          <div className="topbar-brand">
            <div className="brand-logo">
              <img src={logo} alt="Cuerpo Sano" />
            </div>

            <div className="brand-text">
              <strong>Cuerpo Sano</strong>
              <span>Panel administrativo</span>
            </div>

            <div className="status-pill">
              <span className="status-dot" />
              Sistema operativo
            </div>
          </div>

          <nav className="topbar-dock">
            {visibleMenu.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    isActive ? "topbar-dock-item active" : "topbar-dock-item"
                  }
                  title={item.label}
                >
                  <Icon size={21} strokeWidth={2.2} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="topbar-actions">
            <div className="role-card">
              <ShieldCheck size={18} />
              <div>
                <span>{rol}</span>
                <small>Rol activo</small>
              </div>
            </div>

            <div className="user-card">
              <div className="avatar">{usuario.charAt(0).toUpperCase()}</div>
              <div>
                <span>{usuario}</span>
                <small>Sesión iniciada</small>
              </div>
            </div>

            <button className="logout-button" onClick={logout} title="Cerrar sesión">
              <PowerOff size={20} />
            </button>
          </div>
        </header>

        <section className="content-card">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

export { menu as appMenu };
