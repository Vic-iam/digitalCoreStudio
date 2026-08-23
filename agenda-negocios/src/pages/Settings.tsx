import { useEffect, useState } from "react";
import { getMyBusiness } from "../services/businesses.service";
import { createBusinessAccount } from "../services/admin.service";
import { useAuth } from "../context/AuthContext";
import type { Business } from "../types";

export default function Settings() {
  const [business, setBusiness] = useState<Business | null>(null);
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("Veterinaria");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const isAdmin = user?.id === import.meta.env.VITE_ADMIN_USER_ID;
  useEffect(() => {
    void getMyBusiness().then(setBusiness);
  }, []);
  async function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    try {
      const created = await createBusinessAccount({
        email,
        password,
        fullName,
        businessName,
        businessType,
        phone,
        address,
      });
      setMessage(`Cuenta creada para ${created.business.name}`);
      setEmail("");
      setPassword("");
      setFullName("");
      setBusinessName("");
      setPhone("");
      setAddress("");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se pudo crear el usuario",
      );
    }
  }
  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">Preferencias</p>
          <h1>Configuración</h1>
          <p>La identidad y los datos públicos de tu negocio.</p>
        </div>
      </header>
      <div className="panel settings-panel">
        <div className="settings-avatar">
          {business?.name?.slice(0, 1).toUpperCase() ?? "A"}
        </div>
        <div>
          <h2>{business?.name ?? "Tu negocio"}</h2>
          <p className="muted">
            {business?.business_type ?? "Sin tipo definido"}
          </p>
          <dl>
            <dt>Teléfono</dt>
            <dd>{business?.phone ?? "No configurado"}</dd>
            <dt>Dirección</dt>
            <dd>{business?.address ?? "No configurada"}</dd>
          </dl>
        </div>
      </div>
      {isAdmin && (
        <form className="panel admin-form" onSubmit={handleCreateUser}>
          <div className="panel-header">
            <div>
              <h2>Crear negocio y usuario</h2>
              <p className="muted">
                La nueva persona quedará como propietaria de su negocio.
              </p>
            </div>
          </div>
          <div className="form-grid">
            <label className="field">
              Nombre completo
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </label>
            <label className="field">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="field">
              Contraseña
              <input
                type="password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <label className="field">
              Nombre del negocio
              <input
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                required
              />
            </label>
            <label className="field">
              Tipo de negocio
              <select
                value={businessType}
                onChange={(event) => setBusinessType(event.target.value)}
              >
                <option>Veterinaria</option>
                <option>Peluquería</option>
                <option>Centro de belleza</option>
                <option>Consultorio</option>
                <option>Taller</option>
                <option>Academia</option>
              </select>
            </label>
            <label className="field">
              Teléfono
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </label>
            <label className="field">
              Dirección
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
            </label>
          </div>
          {message && <p className="form-message">{message}</p>}
          <div className="form-actions">
            <button className="button-primary" type="submit">
              Crear cuenta completa
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
