import { useEffect, useState, type FormEvent } from "react";
import { Banknote, Check, CreditCard, Landmark, Plus, Search, Trash2, UserRound } from "lucide-react";
import { getMyBusiness } from "../../services/businesses.service";
import {
  createCashRegisterEntry,
  deleteCashRegisterEntry,
  getCashRegisterEntries,
} from "../../services/cash-register.service";
import type { CashRegisterEntry, PaymentMethod } from "../../types";
import { getServices } from "../../services/services.service";
import type { Service } from "../../types";
import styles from "./Style/CashRegister.module.css";

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

function localDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CashRegister() {
  const [date, setDate] = useState(localDateKey(new Date()));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [entries, setEntries] = useState<CashRegisterEntry[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Service[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const business = await getMyBusiness();
        if (!business) return;
        const [entryList, serviceList] = await Promise.all([
          getCashRegisterEntries(business.id, date),
          getServices(business.id),
        ]);
        setEntries(entryList);
        setServices(serviceList.filter((service) => service.active));
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar la caja",
        );
      }
    })();
  }, [date]);

  const filteredServices = services.filter((service) =>
    service.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );
  const total = cart.reduce((sum, service) => sum + service.price, 0);

  function addToCart(service: Service) {
    setCart((current) => [...current, service]);
    setSearch("");
  }

  function removeFromCart(index: number) {
    setCart((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function addEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (cart.length === 0) {
      setError("Agregá al menos un producto o servicio para registrar la venta.");
      return;
    }
    try {
      setIsSaving(true);
      const business = await getMyBusiness();
      if (!business) return;
      const entry = await createCashRegisterEntry({
        businessId: business.id,
        date,
        description: cart.map((service) => service.name).join(", "),
        amount: total,
        paymentMethod,
        clientName: clientName.trim() || null,
        clientEmail: clientEmail.trim() || null,
        notes: notes.trim() || null,
      });
      setEntries((current) => [entry, ...current]);
      setCart([]);
      setClientName("");
      setClientEmail("");
      setNotes("");
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
    <section className={`${styles.page} checkout-page`}>
      <header className="checkout-header"><div><p className="eyebrow">Terminal de cobro</p><h1>Venta rápida</h1><p>{currentTime.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })} · {currentTime.toLocaleTimeString("es-AR")}</p></div><div className="cashier-identity"><UserRound size={18} /> Administrador</div></header>
      {error && <p className="error-message">{error}</p>}
      <div className="checkout-layout">
        <form className="panel sale-panel" onSubmit={(event) => void addEntry(event)}>
          <div className="panel-header"><div><h2>Venta rápida</h2><p className="panel-subtitle">Buscá y agregá productos o servicios.</p></div><Plus size={20} color="#39714d" /></div>
          <label className="search-field"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Escribí el nombre y seleccioná para agregar..." /></label>
          {search && <div className="service-results">{filteredServices.length === 0 ? <span>No encontramos servicios.</span> : filteredServices.map((service) => <button type="button" key={service.id} onClick={() => addToCart(service)}><span>{service.name}<small>{service.duration_minutes} min</small></span><strong>{formatAmount(service.price)}</strong></button>)}</div>}
          <div className="cart-list">{cart.length === 0 ? <p className="empty-state">Agregá productos para iniciar la venta</p> : cart.map((service, index) => <div className="cart-row" key={`${service.id}-${index}`}><div><strong>{service.name}</strong><small>{service.duration_minutes} min</small></div><strong>{formatAmount(service.price)}</strong><button className="icon-button" type="button" title="Quitar producto" aria-label={`Quitar ${service.name}`} onClick={() => removeFromCart(index)}><Trash2 size={16} /></button></div>)}</div>
          <fieldset className="payment-options"><legend>Medio de pago</legend><div>{(Object.keys(paymentLabels) as PaymentMethod[]).map((method) => { const Icon = paymentIcons[method]; return <button className={paymentMethod === method ? "active" : ""} type="button" key={method} onClick={() => setPaymentMethod(method)}><Icon size={18} />{paymentLabels[method]}</button>; })}</div></fieldset>
          <div className="checkout-total"><span>Total</span><strong>{formatAmount(total)}</strong></div>
          <div className="checkout-fields"><label className="field">Buscar cliente (opcional)<input value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Nombre del cliente..." /></label><label className="field">Email (recibo, opcional)<input type="email" value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} placeholder="email@ejemplo.com" /></label><label className="field field-wide">Notas (opcional)<textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="..." /></label></div>
          <button className="button-primary checkout-submit" type="submit" disabled={isSaving || cart.length === 0}><Check size={18} />{isSaving ? "Registrando..." : "Registrar venta"}</button>
        </form>
        <aside className="panel payment-queue"><div className="panel-header"><div><h2>Cola de cobros</h2><p className="panel-subtitle">Ventas pendientes de registrar</p></div><span className="queue-status"><Check size={15} /> 0</span></div><div className="queue-empty"><Check size={30} /><strong>Sin pendientes</strong><span>No hay ventas pendientes de cobro en este momento.</span></div><div className="today-summary"><span>Ventas registradas hoy</span><strong>{entries.length}</strong></div></aside>
      </div>
      <div className="panel daily-sales"><div className="panel-header"><div><h2>Ventas del día</h2><p className="panel-subtitle">{date === localDateKey(new Date()) ? "Movimientos registrados hoy" : `Movimientos del ${date}`}</p></div><label className="date-picker">Fecha<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label></div>{entries.length === 0 ? <p className="empty-state">Todavía no hay ventas registradas.</p> : <div className="table-wrap"><table><thead><tr><th>Detalle</th><th>Cliente</th><th>Medio</th><th>Total</th><th aria-label="Acciones" /></tr></thead><tbody>{entries.map((entry) => <tr key={entry.id}><td><strong>{entry.description}</strong>{entry.notes && <><br /><small className="muted">{entry.notes}</small></>}</td><td>{entry.client_name ?? "Consumidor final"}</td><td><span className="payment-badge">{paymentLabels[entry.payment_method]}</span></td><td><strong>{formatAmount(entry.amount)}</strong></td><td><button className="icon-button" type="button" title="Eliminar venta" aria-label={`Eliminar ${entry.description}`} onClick={() => void removeEntry(entry.id)}><Trash2 size={16} /></button></td></tr>)}</tbody></table></div>}</div>
    </section>
  );
}
