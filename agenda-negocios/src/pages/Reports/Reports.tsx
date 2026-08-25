import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CalendarCheck,
  CircleDollarSign,
  Clock3,
  UsersRound,
} from "lucide-react";
import { getMyBusiness } from "../../services/businesses.service";
import { getAppointments } from "../../services/appointments.service";
import { getCashRegisterEntriesBetween } from "../../services/cash-register.service";
import type {
  Appointment,
  CashRegisterEntry,
  PaymentMethod,
} from "../../types";
import styles from "./Style/Reports.module.css";

const paymentLabels: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
};

const today = new Date();
const initialTo = today.toISOString().slice(0, 10);
const initialFrom = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10);

function formatAmount(amount: number) {
  return amount.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
  });
}

export default function Reports() {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [entries, setEntries] = useState<CashRegisterEntry[]>([]);
  const [error, setError] = useState("");
  const invalidDateRange = from > to;

  useEffect(() => {
    if (invalidDateRange) return;
    void (async () => {
      try {
        setError("");
        const business = await getMyBusiness();
        if (!business) return;
        const start = new Date(`${from}T00:00:00`);
        const end = new Date(`${to}T00:00:00`);
        end.setDate(end.getDate() + 1);
        const [appointmentList, cashEntries] = await Promise.all([
          getAppointments(business.id, start.toISOString(), end.toISOString()),
          getCashRegisterEntriesBetween(business.id, from, to),
        ]);
        setAppointments(appointmentList);
        setEntries(cashEntries);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar el reporte",
        );
      }
    })();
  }, [from, to, invalidDateRange]);

  const metrics = useMemo(() => {
    const completed = appointments.filter(
      (appointment) => appointment.status === "completed",
    );
    const cancelled = appointments.filter(
      (appointment) => appointment.status === "cancelled",
    );
    const totalIncome = entries.reduce((sum, entry) => sum + entry.amount, 0);
    const paymentTotals = entries.reduce<Record<PaymentMethod, number>>(
      (result, entry) => {
        result[entry.payment_method] += entry.amount;
        return result;
      },
      { cash: 0, transfer: 0, card: 0 },
    );
    const clientNames = new Set(
      appointments
        .map((appointment) => appointment.client?.name)
        .filter(Boolean),
    );
    return {
      completed,
      cancelled,
      totalIncome,
      paymentTotals,
      clientCount: clientNames.size,
    };
  }, [appointments, entries]);

  const topServices = useMemo(() => {
    const services = new Map<string, { count: number; income: number }>();
    metrics.completed.forEach((appointment) => {
      const name = appointment.service?.name ?? "Servicio sin nombre";
      const current = services.get(name) ?? { count: 0, income: 0 };
      current.count += 1;
      current.income += appointment.price;
      services.set(name, current);
    });
    return [...services.entries()]
      .sort((first, second) => second[1].count - first[1].count)
      .slice(0, 5);
  }, [metrics.completed]);

  const dailyIncome = useMemo(() => {
    const incomeByDate = new Map<string, number>();
    entries.forEach((entry) =>
      incomeByDate.set(
        entry.entry_date,
        (incomeByDate.get(entry.entry_date) ?? 0) + entry.amount,
      ),
    );
    return [...incomeByDate.entries()]
      .sort((first, second) => first[0].localeCompare(second[0]))
      .slice(-7);
  }, [entries]);
  const maxDailyIncome = Math.max(
    ...dailyIncome.map(([, amount]) => amount),
    1,
  );

  return (
    <section className={styles.page}>
      <header className="page-header reports-header">
        <div>
          <p className="eyebrow">Análisis de actividad</p>
          <h1>Métricas y reportes</h1>
          <p>
            Entendé el rendimiento de tu negocio con datos del período elegido.
          </p>
        </div>
        <div className="date-range">
          <label className="date-picker">
            Desde
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </label>
          <span> a </span>
          <label className="date-picker">
            Hasta
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </label>
        </div>
      </header>
      {(invalidDateRange || error) && (
        <p className="error-message">
          {invalidDateRange
            ? "La fecha de inicio debe ser anterior a la fecha final."
            : error}
        </p>
      )}
      <div className="stats-grid report-stats">
        <div className="stat-card">
          <CircleDollarSign size={20} color="#4f8c67" />
          <div className="stat-label">Ingresos registrados</div>
          <div className="stat-value">{formatAmount(metrics.totalIncome)}</div>
          <div className="stat-note">Según caja diaria</div>
        </div>
        <div className="stat-card">
          <CalendarCheck size={20} color="#4f8c67" />
          <div className="stat-label">Turnos completados</div>
          <div className="stat-value">{metrics.completed.length}</div>
          <div className="stat-note">De {appointments.length} turnos</div>
        </div>
        <div className="stat-card">
          <UsersRound size={20} color="#4f8c67" />
          <div className="stat-label">Clientes atendidos</div>
          <div className="stat-value">{metrics.clientCount}</div>
          <div className="stat-note">Clientes únicos</div>
        </div>
        <div className="stat-card">
          <Clock3 size={20} color="#4f8c67" />
          <div className="stat-label">Cancelaciones</div>
          <div className="stat-value">{metrics.cancelled.length}</div>
          <div className="stat-note">En el período</div>
        </div>
      </div>
      <div className="report-grid">
        <div className="panel report-chart-panel">
          <div className="panel-header">
            <div>
              <h2>Ingresos por día</h2>
              <p className="panel-subtitle">Movimientos registrados en caja</p>
            </div>
            <Banknote size={20} color="#39714d" />
          </div>
          {dailyIncome.length === 0 ? (
            <p className="empty-state">
              No hay ingresos registrados en este período.
            </p>
          ) : (
            <div className="bar-chart">
              {dailyIncome.map(([date, amount]) => (
                <div className="bar-column" key={date}>
                  <span className="bar-value">{formatAmount(amount)}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        height: `${Math.max((amount / maxDailyIncome) * 100, 5)}%`,
                      }}
                    />
                  </div>
                  <span className="bar-label">{formatDate(date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Medios de pago</h2>
              <p className="panel-subtitle">Distribución de ingresos</p>
            </div>
          </div>
          <div className="payment-report-list">
            {(Object.keys(paymentLabels) as PaymentMethod[]).map((method) => (
              <div className="payment-report-row" key={method}>
                <span>{paymentLabels[method]}</span>
                <strong>{formatAmount(metrics.paymentTotals[method])}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="panel report-services-panel">
        <div className="panel-header">
          <div>
            <h2>Servicios con mejor rendimiento</h2>
            <p className="panel-subtitle">Turnos completados por servicio</p>
          </div>
        </div>
        {topServices.length === 0 ? (
          <p className="empty-state">
            No hay turnos completados en este período.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Turnos</th>
                  <th>Ingresos asociados</th>
                </tr>
              </thead>
              <tbody>
                {topServices.map(([name, result]) => (
                  <tr key={name}>
                    <td>
                      <strong>{name}</strong>
                    </td>
                    <td>{result.count}</td>
                    <td>
                      <strong>{formatAmount(result.income)}</strong>
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
