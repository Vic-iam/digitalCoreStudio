import { useEffect, useState } from "react";
import { getMyBusiness } from "../services/businesses.service";
import {
  getAppointments,
  updateAppointmentStatus,
} from "../services/appointments.service";
import type { Appointment } from "../types";

function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const business = await getMyBusiness();
        if (!business) return;
        const start = new Date(`${date}T00:00:00`);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        setAppointments(
          await getAppointments(
            business.id,
            start.toISOString(),
            end.toISOString(),
          ),
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar la agenda",
        );
      }
    })();
  }, [date]);
  async function changeStatus(id: string, status: Appointment["status"]) {
    try {
      await updateAppointmentStatus(id, status);
      setAppointments((current) =>
        current.map((item) => (item.id === id ? { ...item, status } : item)),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "No se pudo actualizar el turno",
      );
    }
  }

  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">Organización diaria</p>
          <h1>Turnos</h1>
          <p>Gestioná tu agenda sin perder el ritmo.</p>
        </div>
        <label className="date-picker">
          Fecha
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
      </header>
      {error && <p className="error-message">{error}</p>}
      <div className="panel">
        <div className="panel-header">
          <h2>{appointments.length} turnos para este día</h2>
        </div>
        {appointments.length === 0 ? (
          <p className="empty-state">
            No hay turnos para la fecha seleccionada.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Cliente</th>
                  <th>Servicio</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>
                      {new Date(appointment.starts_at).toLocaleTimeString(
                        "es-AR",
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </td>
                    <td>
                      <strong>{appointment.client?.name ?? "Cliente"}</strong>
                      <br />
                      <small className="muted">
                        {appointment.client?.phone ?? "Sin teléfono"}
                      </small>
                    </td>
                    <td>{appointment.service?.name ?? "Servicio"}</td>
                    <td>
                      <span
                        className={`status ${appointment.status === "cancelled" ? "cancelled" : ""}`}
                      >
                        {appointment.status}
                      </span>
                    </td>
                    <td>
                      <select
                        className="inline-select"
                        value={appointment.status}
                        onChange={(event) =>
                          void changeStatus(
                            appointment.id,
                            event.target.value as Appointment["status"],
                          )
                        }
                      >
                        <option value="pending">Pendiente</option>
                        <option value="confirmed">Confirmado</option>
                        <option value="completed">Completado</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
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

export default Appointments;
