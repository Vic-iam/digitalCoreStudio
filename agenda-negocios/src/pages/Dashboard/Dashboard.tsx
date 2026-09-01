import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  CalendarDays,
  CircleUserRound,
  ClipboardList,
  ArrowUpRight,
  Users,
} from "lucide-react";
import { getMyBusiness } from "../../services/businesses.service";
import { getAppointments } from "../../services/appointments.service";
import { getClients } from "../../services/clients.service";
import { getProfessionals } from "../../services/professionals.service";
import { getServices } from "../../services/services.service";
import type {
  Appointment,
  Business,
  Client,
  Professional,
  Service,
} from "../../types";
import styles from "./Style/Dashboard.module.css";

export default function Dashboard() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const currentBusiness = await getMyBusiness();
        setBusiness(currentBusiness);
        if (!currentBusiness) return;
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        const [today, clientList, professionalList, serviceList] = await Promise.all([
          getAppointments(
            currentBusiness.id,
            start.toISOString(),
            end.toISOString(),
          ),
          getClients(currentBusiness.id),
          getProfessionals(currentBusiness.id),
          getServices(currentBusiness.id),
        ]);
        setAppointments(today);
        setClients(clientList);
        setProfessionals(professionalList);
        setServices(serviceList);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar el dashboard",
        );
      }
    }
    void loadDashboard();
  }, []);

  return (
    <section className={styles.page}>
      <header className="page-header">
        <div>
          <p className="eyebrow">Resumen de actividad</p>
          <h1>Hola, {business?.name ?? "tu negocio"}</h1>
          <p>Todo lo importante de hoy, en un solo lugar.</p>
        </div>
        <Link className="button-primary" to="/turnos">
          Ver agenda
        </Link>
      </header>
      {error && <p className="error-message">{error}</p>}
      <div className="stats-grid">
        <div className="stat-card">
          <CalendarDays size={20} color="#4f8c67" />
          <div className="stat-label">Turnos de hoy</div>
          <div className="stat-value">{appointments.length}</div>
          <div className="stat-note">Agenda del día</div>
        </div>
        <div className="stat-card">
          <CircleUserRound size={20} color="#4f8c67" />
          <div className="stat-label">Clientes</div>
          <div className="stat-value">{clients.length}</div>
          <div className="stat-note">Base de clientes</div>
        </div>
        <div className="stat-card">
          <Users size={20} color="#4f8c67" />
          <div className="stat-label">Equipo</div>
          <div className="stat-value">{professionals.length}</div>
          <div className="stat-note">Profesionales activos</div>
        </div>
        <div className="stat-card">
          <ClipboardList size={20} color="#4f8c67" />
          <div className="stat-label">Servicios activos</div>
          <div className="stat-value">{services.length}</div>
          <div className="stat-note">Oferta publicada</div>
        </div>
        <div className="stat-card">
          <ArrowUpRight size={20} color="#4f8c67" />
          <div className="stat-label">Estado</div>
          <div className="stat-value">Activo</div>
          <div className="stat-note">Cuenta operativa</div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-header">
          <h2>Acciones rápidas</h2>
        </div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link className="button-primary" to="/profesionales">
            Gestionar personal
          </Link>
          <Link className="text-link" to="/turnos">
            Ver agenda
          </Link>
        </div>
      </div>
      <div className="panel">
        <div className="panel-header">
          <h2>Próximos turnos</h2>
          <Link className="text-link" to="/turnos">
            Ver todos
          </Link>
        </div>
        {appointments.length === 0 ? (
          <p className="empty-state">No hay turnos agendados para hoy.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Cliente</th>
                  <th>Servicio</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {appointments.slice(0, 5).map((appointment) => (
                  <tr key={appointment.id}>
                    <td>
                      {new Date(appointment.starts_at).toLocaleTimeString(
                        "es-AR",
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </td>
                    <td>{appointment.client?.name ?? "Cliente"}</td>
                    <td>{appointment.service?.name ?? "Servicio"}</td>
                    <td>
                      <span className="status">{appointment.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
