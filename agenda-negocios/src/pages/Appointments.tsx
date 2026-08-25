import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight, Clock3, Plus, Sparkles } from "lucide-react";
import { getMyBusiness } from "../services/businesses.service";
import { createAppointment, getAppointments, updateAppointmentStatus } from "../services/appointments.service";
import { getClients } from "../services/clients.service";
import { getServices } from "../services/services.service";
import type { Appointment, Client, Service } from "../types";

type ViewMode = "week" | "list" | "slots";
const statusLabels: Record<Appointment["status"], string> = { pending: "Pendiente", confirmed: "Confirmado", completed: "Completado", cancelled: "Cancelado" };
const dateKey = (date: Date) => date.toISOString().slice(0, 10);
const startOfWeek = (value: string) => { const date = new Date(`${value}T12:00:00`); const day = date.getDay(); date.setDate(date.getDate() - (day === 0 ? 6 : day - 1)); return date; };
const formatTime = (value: string) => new Date(value).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
const formatDay = (value: Date) => value.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });

function Appointments() {
  const [view, setView] = useState<ViewMode>("week");
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState(selectedDate);
  const [formTime, setFormTime] = useState("09:00");
  const [clientId, setClientId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [notes, setNotes] = useState("");
  const [fromHour, setFromHour] = useState("09:00");
  const [toHour, setToHour] = useState("18:00");
  const [interval, setInterval] = useState("30");
  const [error, setError] = useState("");
  const weekStart = useMemo(() => startOfWeek(selectedDate), [selectedDate]);
  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 7);
    return end;
  }, [weekStart]);

  useEffect(() => {
    void (async () => {
      try {
        const business = await getMyBusiness();
        if (!business) return;
        const [appointmentList, clientList, serviceList] = await Promise.all([
          getAppointments(business.id, weekStart.toISOString(), weekEnd.toISOString()),
          getClients(business.id),
          getServices(business.id),
        ]);
        setAppointments(appointmentList);
        setClients(clientList);
        setServices(serviceList.filter((service) => service.active));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "No se pudo cargar la agenda");
      }
    })();
  }, [selectedDate, weekEnd, weekStart]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => { const day = new Date(weekStart); day.setDate(day.getDate() + index); return day; }), [weekStart]);
  const selectedService = services.find((service) => service.id === serviceId);
  const slots = useMemo(() => {
    const [fromHours, fromMinutes] = fromHour.split(":").map(Number);
    const [toHours, toMinutes] = toHour.split(":").map(Number);
    const start = fromHours * 60 + fromMinutes;
    const end = toHours * 60 + toMinutes;
    const duration = selectedService?.duration_minutes ?? Number(interval);
    const result: string[] = [];
    for (let minutes = start; minutes + duration <= end; minutes += Number(interval)) {
      const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
      const minute = String(minutes % 60).padStart(2, "0");
      const slotStart = new Date(`${selectedDate}T${hour}:${minute}:00`);
      const slotEnd = slotStart.getTime() + duration * 60 * 1000;
      const occupied = appointments.some((appointment) => appointment.status !== "cancelled" && slotStart.getTime() < new Date(appointment.ends_at).getTime() && slotEnd > new Date(appointment.starts_at).getTime());
      if (!occupied) result.push(`${hour}:${minute}`);
    }
    return result;
  }, [appointments, fromHour, interval, selectedDate, selectedService, toHour]);

  function openNewAppointment(date = selectedDate, time = "09:00") { setFormDate(date); setFormTime(time); setShowForm(true); }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const business = await getMyBusiness();
      const service = services.find((item) => item.id === serviceId);
      if (!business || !service || !clientId) return;
      const start = new Date(`${formDate}T${formTime}:00`);
      const end = new Date(start.getTime() + service.duration_minutes * 60 * 1000);
      const appointment = await createAppointment({ business_id: business.id, client_id: clientId, service_id: service.id, starts_at: start.toISOString(), ends_at: end.toISOString(), price: service.price, notes: notes || null });
      setAppointments((current) => [...current, appointment].sort((a, b) => a.starts_at.localeCompare(b.starts_at)));
      setShowForm(false); setNotes("");
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "No se pudo crear el turno"); }
  }
  async function changeStatus(id: string, status: Appointment["status"]) {
    try { await updateAppointmentStatus(id, status); setAppointments((current) => current.map((item) => item.id === id ? { ...item, status } : item)); }
    catch (updateError) { setError(updateError instanceof Error ? updateError.message : "No se pudo actualizar el turno"); }
  }
  function shiftWeek(amount: number) { const next = new Date(weekStart); next.setDate(next.getDate() + amount * 7); setSelectedDate(dateKey(next)); }

  return (
    <section>
      <header className="page-header appointments-header"><div><p className="eyebrow">Organización diaria</p><h1>Agenda de turnos</h1><p>Gestioná tus turnos y horarios disponibles desde un solo lugar.</p></div><button className="button-primary" type="button" onClick={() => openNewAppointment()}><CalendarPlus size={17} /> Nuevo turno</button></header>
      {error && <p className="error-message">{error}</p>}
      <div className="appointment-toolbar"><div className="segmented-control" role="tablist" aria-label="Vista de agenda"><button className={view === "week" ? "selected" : ""} type="button" onClick={() => setView("week")}>Semana</button><button className={view === "list" ? "selected" : ""} type="button" onClick={() => setView("list")}>Lista</button><button className={view === "slots" ? "selected" : ""} type="button" onClick={() => setView("slots")}>Horarios disponibles</button></div><div className="week-controls"><button className="icon-button" type="button" title="Semana anterior" aria-label="Semana anterior" onClick={() => shiftWeek(-1)}><ChevronLeft size={18} /></button><input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /><button className="icon-button" type="button" title="Semana siguiente" aria-label="Semana siguiente" onClick={() => shiftWeek(1)}><ChevronRight size={18} /></button></div></div>
      {showForm && <form className="panel appointment-form" onSubmit={(event) => void handleSubmit(event)}><div className="panel-header"><div><h2>Nuevo turno</h2><p className="panel-subtitle">Reservá un horario para tu cliente.</p></div><button className="icon-button" type="button" title="Cerrar" aria-label="Cerrar formulario" onClick={() => setShowForm(false)}>×</button></div><div className="form-grid"><label className="field">Cliente<select value={clientId} onChange={(event) => setClientId(event.target.value)} required><option value="">Seleccioná un cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label><label className="field">Servicio<select value={serviceId} onChange={(event) => setServiceId(event.target.value)} required><option value="">Seleccioná un servicio</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name} · {service.duration_minutes} min</option>)}</select></label><label className="field">Fecha<input type="date" value={formDate} onChange={(event) => setFormDate(event.target.value)} required /></label><label className="field">Hora<input type="time" value={formTime} onChange={(event) => setFormTime(event.target.value)} required /></label><label className="field field-wide">Notas<textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Información útil para el turno" /></label></div><div className="form-actions"><button className="button-primary" type="submit">Guardar turno</button></div></form>}
      {view === "week" && <div className="panel week-panel"><div className="week-grid">{days.map((day) => { const key = dateKey(day); const dayAppointments = appointments.filter((appointment) => dateKey(new Date(appointment.starts_at)) === key); return <div className={`day-column ${key === dateKey(new Date()) ? "today" : ""}`} key={key}><button className="day-heading" type="button" onClick={() => setSelectedDate(key)}><span>{formatDay(day)}</span><strong>{dayAppointments.length}</strong></button><div className="day-appointments">{dayAppointments.length === 0 ? <button className="slot-empty" type="button" onClick={() => openNewAppointment(key)}>+ Agregar</button> : dayAppointments.map((appointment) => <button className={`appointment-card ${appointment.status}`} key={appointment.id} type="button" onClick={() => openNewAppointment(key, formatTime(appointment.starts_at))}><strong>{formatTime(appointment.starts_at)}</strong><span>{appointment.client?.name ?? "Cliente"}</span><small>{appointment.service?.name ?? "Servicio"}</small></button>)}</div></div>; })}</div></div>}
      {view === "list" && <div className="panel"><div className="panel-header"><h2>{appointments.length} turnos de la semana</h2><button className="text-link button-reset" type="button" onClick={() => openNewAppointment()}>+ Agregar turno</button></div>{appointments.length === 0 ? <p className="empty-state">No hay turnos para esta semana.</p> : <div className="table-wrap"><table><thead><tr><th>Fecha y hora</th><th>Cliente</th><th>Servicio</th><th>Precio</th><th>Estado</th></tr></thead><tbody>{appointments.map((appointment) => <tr key={appointment.id}><td><strong>{new Date(appointment.starts_at).toLocaleDateString("es-AR", { weekday: "short", day: "numeric" })}</strong><br /><small className="muted">{formatTime(appointment.starts_at)}</small></td><td>{appointment.client?.name ?? "Cliente"}</td><td>{appointment.service?.name ?? "Servicio"}</td><td>${appointment.price.toLocaleString("es-AR")}</td><td><select className="inline-select" value={appointment.status} onChange={(event) => void changeStatus(appointment.id, event.target.value as Appointment["status"])}>{Object.entries(statusLabels).map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select></td></tr>)}</tbody></table></div>}</div>}
      {view === "slots" && <div className="slots-layout"><div className="panel slot-settings"><div className="panel-header"><div><h2>Generar horarios</h2><p className="panel-subtitle">Definí el rango y la frecuencia de atención.</p></div><Sparkles size={20} color="#39714d" /></div><div className="form-grid"><label className="field">Desde<input type="time" value={fromHour} onChange={(event) => setFromHour(event.target.value)} /></label><label className="field">Hasta<input type="time" value={toHour} onChange={(event) => setToHour(event.target.value)} /></label><label className="field field-wide">Intervalo<select value={interval} onChange={(event) => setInterval(event.target.value)}><option value="15">Cada 15 minutos</option><option value="30">Cada 30 minutos</option><option value="60">Cada 60 minutos</option></select></label></div></div><div className="panel"><div className="panel-header"><div><h2>Horarios libres</h2><p className="panel-subtitle">{formatDay(new Date(`${selectedDate}T12:00:00`))} · {slots.length} disponibles</p></div><Clock3 size={20} color="#39714d" /></div>{slots.length === 0 ? <p className="empty-state">No hay horarios libres con esta configuración.</p> : <div className="slots-grid">{slots.map((slot) => <button className="available-slot" type="button" key={slot} onClick={() => openNewAppointment(selectedDate, slot)}><Plus size={15} />{slot}</button>)}</div>}</div></div>}
    </section>
  );
}

export default Appointments;
