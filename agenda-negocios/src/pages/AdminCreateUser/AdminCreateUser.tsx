import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { useAuth } from "../../context/useAuth";
import { createBusinessAccount } from "../../services/admin.service";
import styles from "./Style/AdminCreateUser.module.css";

export default function AdminCreateUser() {
  const navigate = useNavigate();
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

    if (!fullName.trim() || !email.trim() || !password || !businessName.trim()) {
      setMessage("Completá nombre, email, contraseña y los datos del negocio para continuar.");
      return;
    }

    if (password.length < 8) {
      setMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

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
      window.alert(`Usuario creado correctamente para ${created.business.name}.`);
      navigate("/login", { replace: true });
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
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Ejemplo: Ana García"
              required
            />
          </label>
          <label className="field">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ana@ejemplo.com"
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
              placeholder="Mínimo 8 caracteres"
              required
            />
          </label>
          <label className="field">
            Nombre del negocio
            <input
              type="text"
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              placeholder="Ejemplo: Estudio García"
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
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Ejemplo: 11 5555 5555"
              required
            />
          </label>
          <label className="field">
            Dirección
            <input
              type="text"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Ejemplo: Av. Corrientes 1234"
              required
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
