import { useEffect, useState, type FormEvent } from "react";
import { getMyBusiness } from "../../services/businesses.service";
import { createService, getServices } from "../../services/services.service";
import type { Service } from "../../types";
import styles from "./Style/Services.module.css";

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("30");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    void (async () => {
      try {
        const business = await getMyBusiness();
        if (business) setServices(await getServices(business.id));
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudieron cargar los servicios",
        );
      }
    })();
  }, []);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const business = await getMyBusiness();
      if (!business) return;
      const service = await createService({
        business_id: business.id,
        name,
        description: description || null,
        duration_minutes: Number(duration),
        price: Number(price),
        active: true,
      });
      setServices((current) =>
        [...current, service].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setName("");
      setDescription("");
      setDuration("30");
      setPrice("");
      setShowForm(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo crear el servicio",
      );
    }
  }
  return (
    <section className={styles.page}>
      <header className="page-header">
        <div>
          <p className="eyebrow">Catálogo</p>
          <h1>Servicios</h1>
          <p>Definí qué ofrecés y cuánto vale tu tiempo.</p>
        </div>
        <button
          className="button-primary"
          type="button"
          onClick={() => setShowForm((visible) => !visible)}
        >
          {showForm ? "Cerrar" : "+ Nuevo servicio"}
        </button>
      </header>
      {error && <p className="error-message">{error}</p>}
      {showForm && (
        <form className="panel form-grid client-form" onSubmit={handleSubmit}>
          <label className="field">
            Nombre del servicio
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
          <label className="field">
            Descripción
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <label className="field">
            Duración (minutos)
            <input
              type="number"
              min="5"
              step="5"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              required
            />
          </label>
          <label className="field">
            Precio
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              required
            />
          </label>
          <div className="form-actions">
            <button className="button-primary" type="submit">
              Guardar servicio
            </button>
          </div>
        </form>
      )}
      <div className="panel">
        <div className="panel-header">
          <h2>{services.length} servicios configurados</h2>
        </div>
        {services.length === 0 ? (
          <p className="empty-state">Agregá tu primer servicio para empezar.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Duración</th>
                  <th>Precio</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id}>
                    <td>
                      <strong>{service.name}</strong>
                    </td>
                    <td>{service.duration_minutes} min</td>
                    <td>${service.price.toLocaleString("es-AR")}</td>
                    <td>
                      <span className="status">
                        {service.active ? "Activo" : "Inactivo"}
                      </span>
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
