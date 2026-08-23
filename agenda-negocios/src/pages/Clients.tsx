import { useEffect, useState, type FormEvent } from "react";
import { getMyBusiness } from "../services/businesses.service";
import { createClient, getClients } from "../services/clients.service";
import type { Client } from "../types";

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    void (async () => {
      try {
        const business = await getMyBusiness();
        if (business) setClients(await getClients(business.id));
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudieron cargar los clientes",
        );
      }
    })();
  }, []);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const business = await getMyBusiness();
      if (!business) return;
      const client = await createClient({
        business_id: business.id,
        name,
        phone: phone || null,
        email: email || null,
        notes: null,
      });
      setClients((current) =>
        [...current, client].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setName("");
      setPhone("");
      setEmail("");
      setShowForm(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo crear el cliente",
      );
    }
  }
  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">Relaciones</p>
          <h1>Clientes</h1>
          <p>Una vista clara de las personas que confían en tu negocio.</p>
        </div>
        <button
          className="button-primary"
          type="button"
          onClick={() => setShowForm((visible) => !visible)}
        >
          {showForm ? "Cerrar" : "+ Nuevo cliente"}
        </button>
      </header>
      {error && <p className="error-message">{error}</p>}
      {showForm && (
        <form className="panel form-grid client-form" onSubmit={handleSubmit}>
          <label className="field">
            Nombre
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
          <label className="field">
            Teléfono
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </label>
          <label className="field">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <div className="form-actions">
            <button className="button-primary" type="submit">
              Guardar cliente
            </button>
          </div>
        </form>
      )}
      <div className="panel">
        <div className="panel-header">
          <h2>{clients.length} clientes registrados</h2>
        </div>
        {clients.length === 0 ? (
          <p className="empty-state">Todavía no hay clientes cargados.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Alta</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <strong>{client.name}</strong>
                    </td>
                    <td>{client.phone ?? "-"}</td>
                    <td>{client.email ?? "-"}</td>
                    <td>
                      {new Date(client.created_at).toLocaleDateString("es-AR")}
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
