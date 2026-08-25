import {
  NavLink,
  useNavigate,
} from "react-router";

import { useAuth } from "../../context/useAuth";
import styles from "./Style/Sidebar.module.css";
import { Banknote, BarChart3, CalendarDays, ChartNoAxesCombined, CircleUserRound, ClipboardList, Boxes, LogOut } from "lucide-react";

export default function Sidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  async function handleLogout() {
    try {
      await logout();

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "No se pudo cerrar la sesión:",
        error
      );
    }
  }

  return (
    <aside className={`${styles.sidebar} sidebar`}>
      <div className="brand-mark"><CalendarDays size={20} /></div>
      <div className="brand-copy"><strong>Agenda</strong><span>negocios</span></div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}>
          <ChartNoAxesCombined size={18} /> Dashboard
        </NavLink>

        <NavLink to="/turnos" className={({ isActive }) => isActive ? "active" : ""}>
          <CalendarDays size={18} /> Agenda
        </NavLink>

        <NavLink to="/caja" className={({ isActive }) => isActive ? "active" : ""}>
          <Banknote size={18} /> Caja diaria
        </NavLink>

        <NavLink to="/reportes" className={({ isActive }) => isActive ? "active" : ""}>
          <BarChart3 size={18} /> Métricas y reportes
        </NavLink>

        <NavLink to="/servicios" className={({ isActive }) => isActive ? "active" : ""}>
          <ClipboardList size={18} /> Servicios
        </NavLink>

        <NavLink to="/inventario" className={({ isActive }) => isActive ? "active" : ""}>
          <Boxes size={18} /> Inventario
        </NavLink>

        <NavLink to="/clientes" className={({ isActive }) => isActive ? "active" : ""}>
          <CircleUserRound size={18} /> Clientes
        </NavLink>

      </nav>

      <button className="logout-button" type="button" onClick={handleLogout}>
        <LogOut size={18} /> Cerrar sesión
      </button>
    </aside>
  );
}