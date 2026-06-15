import { Navigate, Outlet } from "react-router-dom";
import { getDefaultPathForPages, useAuthSession } from "./AuthSessionContext";

interface PermissionRouteProps {
  pageCode: string;
  children?: React.ReactNode;
}

export default function PermissionRoute({ pageCode, children }: PermissionRouteProps) {
  const { session, loading, hasPage } = useAuthSession();

  if (loading) {
    return (
      <div className="route-permission-loader">
        Validando permisos...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPage(pageCode)) {
    return <Navigate to={getDefaultPathForPages(session.paginas)} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
