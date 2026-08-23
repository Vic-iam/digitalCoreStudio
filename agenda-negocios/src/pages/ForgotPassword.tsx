import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { supabase } from "../lib/supabase";

export default function ForgotPassword() {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    const email = username.includes("@") ? username.trim() : `${username.trim()}@cuentas.tudominio.com`;
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/restablecer-contrasena`,
      });
      if (resetError) throw resetError;
      setMessage("Si existe una cuenta con ese usuario, recibirás un enlace para cambiar la contraseña.");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "No se pudo enviar el enlace");
    } finally {
      setLoading(false);
    }
  }

  return <main className="auth-page"><section className="auth-card"><p className="eyebrow">Acceso</p><h1>Recuperar contraseña</h1><p>Te enviaremos un enlace para crear una nueva.</p><form onSubmit={handleSubmit} className="auth-form"><label className="field">Usuario o email<input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="admin123" required /></label>{error && <p className="error-message">{error}</p>}{message && <p className="success-message">{message}</p>}<button className="button-primary" type="submit" disabled={loading}>{loading ? "Enviando..." : "Enviar enlace"}</button></form><Link className="text-link auth-back" to="/login">Volver al inicio de sesión</Link></section></main>;
}
