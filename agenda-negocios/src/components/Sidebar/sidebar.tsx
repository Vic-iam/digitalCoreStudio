import {
  NavLink,
  useNavigate,
} from "react-router";

import { useAuth } from "../../context/AuthContext";

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
    <aside>
      <h2>Agenda Negocios</h2>

      <nav>
        <NavLink to="/dashboard">
          Dashboard
        </NavLink>

        <NavLink to="/turnos">
          Turnos
        </NavLink>

        <NavLink to="/servicios">
          Servicios
        </NavLink>

        <NavLink to="/clientes">
          Clientes
        </NavLink>

        <NavLink to="/configuracion">
          Configuración
        </NavLink>
      </nav>

      <button
        type="button"
        onClick={handleLogout}
      >
        Cerrar sesión
      </button>
    </aside>
  );
}