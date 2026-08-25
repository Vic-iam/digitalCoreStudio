import { useEffect, useMemo, useState } from "react";
import { Banknote, CreditCard, Landmark, Plus, Trash2 } from "lucide-react";
import { getMyBusiness } from "../services/businesses.service";
import {
  createCashRegisterEntry,
  deleteCashRegisterEntry,
  getCashRegisterEntries,
} from "../services/cash-register.service";
import type { CashRegisterEntry, PaymentMethod } from "../types";

const paymentLabels: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
};

const paymentIcons: Record<PaymentMethod, typeof Banknote> = {
  cash: Banknote,
  transfer: Landmark,
  card: CreditCard,
};

function formatAmount(amount: number) {
  return amount.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

export default function CashRegister() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [entries, setEntries] = useState<CashRegisterEntry[]>([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const business = await getMyBusiness();
        if (!business) return;
        setEntries(await getCashRegisterEntries(business.id, date));
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar la caja",
        );
      }
    })();
  }, [date]);

  const totals = useMemo(
    () =>
      entries.reduce(
        (result, entry) => {
          result.total += entry.amount;
          result[entry.payment_method] += entry.amount;
          return result;
        },
        { total: 0, cash: 0, transfer: 0, card: 0 },
      ),
    [entries],
  );

  async function addEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const parsedAmount = Number(amount);
    if (
      !description.trim() ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0
    ) {
      setError("Completá una descripción y un importe válido.");
      return;
    }
    try {
      setIsSaving(true);
      const business = await getMyBusiness();
      if (!business) return;
      const entry = await createCashRegisterEntry({
        businessId: business.id,
        date,
        description: description.trim(),
        amount: parsedAmount,
        paymentMethod,
      });
      setEntries((current) => [entry, ...current]);
      setDescription("");
      setAmount("");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar el movimiento",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function removeEntry(id: string) {
    try {
      await deleteCashRegisterEntry(id);
      setEntries((current) => current.filter((entry) => entry.id !== id));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "No se pudo eliminar el movimiento",
      );
    }
  }

  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">Control de ingresos</p>
          <h1>Caja diaria</h1>
          <p>Registrá lo que hiciste y cómo te lo pagaron.</p>
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
      <div className="stats-grid cash-stats">
        <div className="stat-card cash-total">
          <div className="stat-label">Total del día</div>
          <div className="stat-value">{formatAmount(totals.total)}</div>
          <div className="stat-note">{entries.length} movimientos</div>
        </div>
        {(Object.keys(paymentLabels) as PaymentMethod[]).map((method) => {
          const Icon = paymentIcons[method];
          return (
            <div className="stat-card" key={method}>
              <Icon size={20} color="#4f8c67" />
              <div className="stat-label">{paymentLabels[method]}</div>
              <div className="stat-value">{formatAmount(totals[method])}</div>
            </div>
          );
        })}
      </div>
      <div className="cash-layout">
        <form
          className="panel cash-form"
          onSubmit={(event) => void addEntry(event)}
        >
          <div className="panel-header">
            <h2>Nuevo ingreso</h2>
            <Plus size={20} color="#39714d" />
          </div>
          <label className="field">
            Qué se hizo
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ej. Corte y brushing"
            />
          </label>
          <label className="field">
            Importe
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0,00"
            />
          </label>
          <label className="field">
            Medio de pago
            <select
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(event.target.value as PaymentMethod)
              }
            >
              {(Object.keys(paymentLabels) as PaymentMethod[]).map((method) => (
                <option key={method} value={method}>
                  {paymentLabels[method]}
                </option>
              ))}
            </select>
          </label>
          <div className="form-actions">
            <button
              className="button-primary"
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? "Guardando..." : "Registrar ingreso"}
            </button>
          </div>
        </form>
        <div className="panel">
          <div className="panel-header">
            <h2>Movimientos del día</h2>
          </div>
          {entries.length === 0 ? (
            <p className="empty-state">Todavía no hay ingresos registrados.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Trabajo</th>
                    <th>Medio</th>
                    <th>Importe</th>
                    <th aria-label="Acciones" />
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        <strong>{entry.description}</strong>
                      </td>
                      <td>
                        <span className="payment-badge">
                          {paymentLabels[entry.payment_method]}
                        </span>
                      </td>
                      <td>
                        <strong>{formatAmount(entry.amount)}</strong>
                      </td>
                      <td>
                        <button
                          className="icon-button"
                          type="button"
                          title="Eliminar ingreso"
                          aria-label={`Eliminar ${entry.description}`}
                          onClick={() => void removeEntry(entry.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
