import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import Services from "./pages/Services";
import Clients from "./pages/Clients";
import Settings from "./pages/Settings";
import DashboardLayout from "./layouts/DashboardLayout";
import CreateBusiness from "./pages/CreateBusiness";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/crear-negocio" element={<CreateBusiness />} />

            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />

              <Route path="/turnos" element={<Appointments />} />

              <Route path="/servicios" element={<Services />} />

              <Route path="/clientes" element={<Clients />} />

              <Route path="/configuracion" element={<Settings />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
