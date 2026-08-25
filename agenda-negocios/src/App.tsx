import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Services from "./pages/Services";
import Clients from "./pages/Clients";
import DashboardLayout from "./layouts/DashboardLayout";
import CreateBusiness from "./pages/CreateBusiness";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import CashRegister from "./pages/CashRegister";
import Reports from "./pages/Reports";
import AdminCreateUser from "./pages/AdminCreateUser.tsx";
import Inventory from "./pages/Inventory";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/login" element={<Login />} />
          <Route path="/recuperar-contrasena" element={<ForgotPassword />} />
          <Route path="/restablecer-contrasena" element={<ResetPassword />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/crear-negocio" element={<CreateBusiness />} />
            <Route
              path="/gestion-interna-usuarios"
              element={<AdminCreateUser />}
            />

            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />

              <Route path="/caja" element={<CashRegister />} />

              <Route path="/reportes" element={<Reports />} />

              <Route path="/servicios" element={<Services />} />

              <Route path="/inventario" element={<Inventory />} />

              <Route path="/clientes" element={<Clients />} />

            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
