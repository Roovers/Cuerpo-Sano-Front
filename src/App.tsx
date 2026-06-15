import { Navigate, Route, Routes } from "react-router-dom";
import "./styles/cuerpoSanoTypography.css";
import LoginPage from "./pages/Login/LoginPage";
import AppLayout from "./layout/AppLayout";

import DashboardPage from "./pages/Dashboard/DashboardPage";
import SociosPage from "./pages/Socios/SociosPage";
import MembresiasPage from "./pages/Membresias/MembresiasPage";
import PagosPage from "./pages/Pagos/PagosPage";
import ActividadesPage from "./pages/Actividades/ActividadesPage";
import EntrenadoresPage from "./pages/Entrenadores/EntrenadoresPage";
import HorariosPage from "./pages/Horarios/HorariosPage";
import AsistenciasPage from "./pages/Asistencias/AsistenciasPage";
import ReportesPage from "./pages/Reportes/ReportesPage";
import AsignarMembresiaPage from "./pages/AsignarMembresia/AsignarMembresiaPage";
import ConfiguracionPage from "./pages/Configuracion/ConfiguracionPage";
import { AuthSessionProvider, getDefaultPathForPages } from "./auth/AuthSessionContext";
import PermissionRoute from "./auth/PermissionRoute";

function ProtectedRoute() {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AuthSessionProvider>
      <AppLayout />
    </AuthSessionProvider>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route index element={<Navigate to={getDefaultPathForPages(["dashboard"])} replace />} />

        <Route
          path="/dashboard"
          element={
            <PermissionRoute pageCode="dashboard">
              <DashboardPage />
            </PermissionRoute>
          }
        />

        <Route
          path="/socios"
          element={
            <PermissionRoute pageCode="socios">
              <SociosPage />
            </PermissionRoute>
          }
        />

        <Route
          path="/membresias"
          element={
            <PermissionRoute pageCode="membresias">
              <MembresiasPage />
            </PermissionRoute>
          }
        />

        <Route
          path="/pagos"
          element={
            <PermissionRoute pageCode="pagos">
              <PagosPage />
            </PermissionRoute>
          }
        />

        <Route
          path="/actividades"
          element={
            <PermissionRoute pageCode="actividades">
              <ActividadesPage />
            </PermissionRoute>
          }
        />

        <Route
          path="/entrenadores"
          element={
            <PermissionRoute pageCode="entrenadores">
              <EntrenadoresPage />
            </PermissionRoute>
          }
        />

        <Route
          path="/horarios"
          element={
            <PermissionRoute pageCode="clases">
              <HorariosPage />
            </PermissionRoute>
          }
        />

        <Route
          path="/asistencias"
          element={
            <PermissionRoute pageCode="asistencias">
              <AsistenciasPage />
            </PermissionRoute>
          }
        />

        <Route
          path="/reportes"
          element={
            <PermissionRoute pageCode="reportes">
              <ReportesPage />
            </PermissionRoute>
          }
        />

        <Route
          path="/asignar-membresia"
          element={
            <PermissionRoute pageCode="membresias">
              <AsignarMembresiaPage />
            </PermissionRoute>
          }
        />

        <Route
          path="/configuracion"
          element={
            <PermissionRoute pageCode="configuracion">
              <ConfiguracionPage />
            </PermissionRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
