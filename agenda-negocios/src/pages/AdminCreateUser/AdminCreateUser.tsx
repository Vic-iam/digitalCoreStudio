import { useState, type FormEvent } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../../context/useAuth";
import { createBusinessAccount } from "../../services/admin.service";
import styles from "./Style/AdminCreateUser.module.css";

export default function AdminCreateUser() {
  const { user } = useAuth();
  const isAdmin = user?.id === import.meta.env.VITE_ADMIN_USER_ID;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("Veterinaria");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={`${styles.page} auth-page`}>
      <section className="auth-card admin-create-page">
        <p className="eyebrow">Gestión interna</p>
        <h1>Crear usuario y negocio</h1>
        <p>Esta zona está disponible únicamente para el administrador.</p>
        <form
          className="auth-form"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <label className="field">
            Nombre completo
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
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
          {message && <p className="form-message">{message}</p>}
          <button className="button-primary" type="submit" disabled={loading}>
            {loading ? "Creando cuenta..." : "Crear cuenta completa"}
          </button>
        </form>
      </section>
    </main>
  );
}
