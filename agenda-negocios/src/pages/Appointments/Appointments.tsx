import { Fragment, useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { Link } from "react-router";
import { getMyBusiness } from "../../services/businesses.service";
import {
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
} from "../../services/appointments.service";
import { getClients } from "../../services/clients.service";
import { getServices } from "../../services/services.service";
import type { Appointment, Client, Service } from "../../types";
import styles from "./Style/Appointments.module.css";

type ViewMode = "week" | "list" | "slots";

const statusLabels: Record<Appointment["status"], string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  completed: "Completado",
  cancelled: "Cancelado",
};

const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function startOfWeek(value: string) {
  const date = new Date(`${value}T12:00:00`);
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  return date;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(value: Date) {
  return value.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()));
  const [view, setView] = useState<ViewMode>("week");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState(dateKey(new Date()));
  const [formTime, setFormTime] = useState("10:00");
  const [clientId, setClientId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const weekStart = useMemo(() => startOfWeek(selectedDate), [selectedDate]);
  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 7);
    return end;
  }, [weekStart]);
  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const day = new Date(weekStart);
        day.setDate(day.getDate() + index);
        return day;
      }),
    [weekStart],
  );
  const timeSlots = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const minutes = 10 * 60 + index * 30;
        return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
      }),
    [],
  );

  useEffect(() => {
    void (async () => {
      try {
        const business = await getMyBusiness();
        if (!business) return;
        const [appointmentList, clientList, serviceList] = await Promise.all([
          getAppointments(
            business.id,
            weekStart.toISOString(),
            weekEnd.toISOString(),
          ),
          getClients(business.id),
          getServices(business.id),
        ]);
        setAppointments(appointmentList);
        setClients(clientList);
        setServices(serviceList.filter((service) => service.active));
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar la agenda",
        );
      }
    })();
  }, [weekEnd, weekStart]);

  useEffect(() => {
    if (!showForm) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setShowForm(false);
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showForm]);

  function appointmentsForDay(day: Date) {
    return appointments.filter(
      (appointment) =>
        dateKey(new Date(appointment.starts_at)) === dateKey(day),
    );
  }

  function appointmentAt(day: Date, slot: string) {
    const slotDate = new Date(`${dateKey(day)}T${slot}:00`);
    return appointmentsForDay(day).find((appointment) => {
      const start = new Date(appointment.starts_at).getTime();
      const end = new Date(appointment.ends_at).getTime();
      return slotDate.getTime() >= start && slotDate.getTime() < end;
    });
  }

  function shiftWeek(amount: number) {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + amount * 7);
    setSelectedDate(dateKey(next));
  }

  function openBooking(date = selectedDate, time = "10:00") {
    setFormDate(date);
    setFormTime(time);
    setShowForm(true);
  }

  async function handleBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const service = services.find((item) => item.id === serviceId);
    if (!service || !clientId) return;
    try {
      setIsSaving(true);
      const business = await getMyBusiness();
      if (!business) return;
      const start = new Date(`${formDate}T${formTime}:00`);
      const end = new Date(
        start.getTime() + service.duration_minutes * 60 * 1000,
      );
      const appointment = await createAppointment({
        business_id: business.id,
        client_id: clientId,
        service_id: service.id,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        price: service.price,
        notes: notes || null,
      });
      setAppointments((current) =>
        [...current, appointment].sort((a, b) =>
          a.starts_at.localeCompare(b.starts_at),
        ),
      );
      setNotes("");
      setShowForm(false);
    } catch (bookingError) {
      setError(
        bookingError instanceof Error
          ? bookingError.message
          : "No se pudo reservar el turno",
      );
    } finally {
      setIsSaving(false);
    }
  }

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
    <section className={styles.page}>
      <header className="page-header appointments-header">
        <div>
          <p className="eyebrow">Organización diaria</p>
          <h1>Agenda de turnos</h1>
          <p>Gestioná los turnos y horarios disponibles.</p>
        </div>
        <div className="appointment-header-actions">
          <button
            className="button-primary"
            type="button"
            onClick={() => openBooking()}
          >
            <CalendarPlus size={17} /> Agregar agenda
          </button>
          <div className="appointment-navigation">
            <button
              className="icon-button"
              type="button"
              title="Semana anterior"
              aria-label="Semana anterior"
              onClick={() => shiftWeek(-1)}
            >
              <ChevronLeft size={19} />
            </button>
            <strong>
              {formatDay(weekStart)} -{" "}
              {formatDay(new Date(weekEnd.getTime() - 86400000))}
            </strong>
            <button
              className="icon-button"
              type="button"
              title="Semana siguiente"
              aria-label="Semana siguiente"
              onClick={() => shiftWeek(1)}
            >
              <ChevronRight size={19} />
            </button>
          </div>
        </div>
      </header>
      {error && <p className="error-message">{error}</p>}
      {showForm && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowForm(false);
          }}
        >
          <form
            className="panel booking-form booking-modal"
            onSubmit={(event) => void handleBooking(event)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-title"
          >
            <div className="panel-header">
              <div>
                <p className="eyebrow">Nueva agenda</p>
                <h2 id="booking-title">Reservar turno</h2>
                <p className="panel-subtitle">
                  Elegí cliente, motivo, fecha y horario.
                </p>
              </div>
              <button
                className="icon-button modal-close"
                type="button"
                title="Cerrar"
                aria-label="Cerrar formulario"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>
            <div className="booking-date-preview">
              <strong>
                {new Date(`${formDate}T${formTime}:00`).toLocaleDateString(
                  "es-AR",
                )}{" "}
                a las {formTime}hs
              </strong>
              <span>
                (
                {services.find((service) => service.id === serviceId)
                  ?.duration_minutes ?? 30}{" "}
                min)
              </span>
            </div>
            <div className="form-grid">
              <label className="field">
                Cliente
                {clients.length === 0 ? (
                  <span className="field-empty-message">
                    No hay clientes cargados.
                    <Link
                      className="text-link"
                      to="/clientes"
                      onClick={() => setShowForm(false)}
                    >
                      Agregar un cliente
                    </Link>
                  </span>
                ) : (
                  <>
                    <select
                      value={clientId}
                      onChange={(event) => setClientId(event.target.value)}
                      required
                    >
                      <option value="">Seleccioná un cliente</option>
                      {clients.map((client) => (
                        <option value={client.id} key={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                    <Link
                      className="text-link client-create-link"
                      to="/clientes"
                      onClick={() => setShowForm(false)}
                    >
                      El cliente no existe, agregar nuevo
                    </Link>
                  </>
                )}
              </label>
              <label className="field">
                Motivo
                {services.length === 0 ? (
                  <span className="field-empty-message">
                    No hay servicios cargados.
                    <Link
                      className="text-link"
                      to="/servicios"
                      onClick={() => setShowForm(false)}
                    >
                      Agregar un servicio
                    </Link>
                  </span>
                ) : (
                  <select
                    value={serviceId}
                    onChange={(event) => setServiceId(event.target.value)}
                    required
                  >
                    <option value="">Seleccioná un servicio</option>
                    {services.map((service) => (
                      <option value={service.id} key={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                )}
              </label>
              <label className="field">
                Fecha
                <input
                  type="date"
                  value={formDate}
                  onChange={(event) => setFormDate(event.target.value)}
                  required
                />
              </label>
              <label className="field">
                Hora
                <input
                  type="time"
                  value={formTime}
                  onChange={(event) => setFormTime(event.target.value)}
                  required
                />
              </label>
              <label className="field field-wide">
                Notas
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Información adicional del turno"
                />
              </label>
            </div>
            <div className="form-actions">
              <button
                className="button-primary"
                type="submit"
                disabled={
                  isSaving || services.length === 0 || clients.length === 0
                }
              >
                {isSaving ? "Reservando..." : "Reservar turno"}
              </button>
            </div>
          </form>
        </div>
      )}
      <div className="appointment-tabs">
        <button
          className={view === "week" ? "active" : ""}
          type="button"
          onClick={() => setView("week")}
        >
          Semana
        </button>
        <button
          className={view === "list" ? "active" : ""}
          type="button"
          onClick={() => setView("list")}
        >
          Lista
        </button>
        <button
          className={view === "slots" ? "active" : ""}
          type="button"
          onClick={() => setView("slots")}
        >
          Horarios disponibles
        </button>
      </div>
      {view === "week" && (
        <div className="panel schedule-panel">
          <div className="schedule-summary">
            <h2>
              Semana del {formatDay(weekStart)} al{" "}
              {formatDay(new Date(weekEnd.getTime() - 86400000))}
            </h2>
            <span>
              <Clock3 size={16} /> Horarios de 10:00 a 16:00
            </span>
          </div>
          <div className="schedule-scroll">
            <div className="schedule-grid">
              <div className="schedule-time-column" />
              {days.map((day) => {
                const dayAppointments = appointmentsForDay(day);
                const freeCount = timeSlots.filter(
                  (slot) => !appointmentAt(day, slot),
                ).length;
                return (
                  <div
                    className={`schedule-day-heading ${dateKey(day) === dateKey(new Date()) ? "today" : ""}`}
                    key={dateKey(day)}
                  >
                    <span>
                      {day.toLocaleDateString("es-AR", { weekday: "short" })}
                    </span>
                    <strong>{day.getDate()}</strong>
                    <small>
                      {dayAppointments.length} turnos · {freeCount} libres
                    </small>
                  </div>
                );
              })}
              {timeSlots.map((slot) => (
                <Fragment key={`slot-${slot}`}>
                  <div className="schedule-time">{slot}</div>

                  {days.map((day) => {
                    const appointment = appointmentAt(day, slot);

                    return appointment ? (
                      <button
                        className={`schedule-appointment ${appointment.status}`}
                        type="button"
                        key={`${dateKey(day)}-${slot}`}
                      >
                        <strong>{formatTime(appointment.starts_at)}</strong>
                        <span>{appointment.client?.name ?? "Cliente"}</span>
                        <small>{appointment.service?.name ?? "Servicio"}</small>
                      </button>
                    ) : (
                      <button
                        className="free-slot"
                        type="button"
                        key={`${dateKey(day)}-${slot}`}
                        onClick={() => openBooking(dateKey(day), slot)}
                      >
                        {slot} libre
                      </button>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      )}
      {view === "list" && (
        <div className="panel">
          <div className="panel-header">
            <h2>{appointments.length} turnos de la semana</h2>
          </div>
          {appointments.length === 0 ? (
            <p className="empty-state">
              No hay turnos registrados. Los horarios libres se muestran en la
              vista Semana.
            </p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Fecha y hora</th>
                    <th>Cliente</th>
                    <th>Servicio</th>
                    <th>Precio</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>
                        <strong>
                          {new Date(appointment.starts_at).toLocaleDateString(
                            "es-AR",
                            { weekday: "short", day: "numeric" },
                          )}
                        </strong>
                        <br />
                        <small className="muted">
                          {formatTime(appointment.starts_at)}
                        </small>
                      </td>
                      <td>{appointment.client?.name ?? "Cliente"}</td>
                      <td>{appointment.service?.name ?? "Servicio"}</td>
                      <td>${appointment.price.toLocaleString("es-AR")}</td>
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
                          {Object.entries(statusLabels).map(
                            ([status, label]) => (
                              <option value={status} key={status}>
                                {label}
                              </option>
                            ),
                          )}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {view === "slots" && (
        <div className="panel slots-preview">
          <div className="panel-header">
            <div>
              <h2>Horarios disponibles</h2>
              <p className="panel-subtitle">
                Seleccioná una fecha para consultar sus horarios.
              </p>
            </div>
          </div>
          <div className="slot-date-picker">
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
            <div className="available-slots-list">
              {timeSlots
                .filter(
                  (slot) =>
                    !appointmentAt(new Date(`${selectedDate}T12:00:00`), slot),
                )
                .map((slot) => (
                  <button className="free-slot" type="button" key={slot}>
                    {slot} libre
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
