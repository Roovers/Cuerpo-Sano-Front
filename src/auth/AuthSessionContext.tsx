import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getSesionActual, type SesionActual } from "../services/ConfiguracionService";

interface AuthSessionContextValue {
  session: SesionActual | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
  hasPage: (pageCode: string) => boolean;
  hasAction: (actionCode: string) => boolean;
  hasCard: (cardCode: string) => boolean;
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

const normalize = (value?: string | null) =>
  String(value || "")
    .trim()
    .toLowerCase();

const includesPermission = (items: string[] | undefined, code: string) => {
  if (!code) return true;
  if (!items || items.length === 0) return false;

  const expected = normalize(code);
  return items.some((item) => normalize(item) === expected);
};

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SesionActual | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setSession(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getSesionActual();

      setSession(data);

      localStorage.setItem("usuario", data.nombreUsuario || data.usuario || "Usuario");
      localStorage.setItem("rol", data.rol || "Sin rol");
    } catch (error) {
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      session,
      loading,
      refreshSession,
      hasPage: (pageCode: string) => includesPermission(session?.paginas, pageCode),
      hasAction: (actionCode: string) => includesPermission(session?.acciones, actionCode),
      hasCard: (cardCode: string) => includesPermission(session?.cards, cardCode),
    }),
    [session, loading]
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error("useAuthSession debe usarse dentro de AuthSessionProvider");
  }

  return context;
}

export function getDefaultPathForPages(pages?: string[]) {
  const order = [
    "dashboard",
    "socios",
    "clases",
    "asistencias",
    "membresias",
    "pagos",
    "actividades",
    "entrenadores",
    "reportes",
    "configuracion",
  ];

  const page = order.find((item) => includesPermission(pages, item)) || "dashboard";

  const pageToPath: Record<string, string> = {
    dashboard: "/dashboard",
    socios: "/socios",
    clases: "/horarios",
    asistencias: "/asistencias",
    membresias: "/membresias",
    pagos: "/pagos",
    actividades: "/actividades",
    entrenadores: "/entrenadores",
    reportes: "/reportes",
    configuracion: "/configuracion",
  };

  return pageToPath[page] || "/dashboard";
}
