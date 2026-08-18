import { BrowserRouter, Routes, Route } from "react-router";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import Services from "./pages/Services";
import Clients from "./pages/Clients";
import Settings from "./pages/Settings.tsx";
import DashboardLayout from "./layouts/DashboardLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/turnos" element={<Appointments />} />
          <Route path="/servicios" element={<Services />} />
          <Route path="/clientes" element={<Clients />} />
          <Route path="/configuracion" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;