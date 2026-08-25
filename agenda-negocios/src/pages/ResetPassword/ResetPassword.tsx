import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import styles from "./Style/ResetPassword.module.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")
        setReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 8)
      return setError("La contraseña debe tener al menos 8 caracteres");
    if (password !== confirmation)
      return setError("Las contraseñas no coinciden");
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) setError(updateError.message);
    else {
      setMessage("Contraseña actualizada correctamente.");
      setTimeout(() => navigate("/login", { replace: true }), 1500);
    }
  }

  return (
    <main className={`${styles.page} auth-page`}>
      <section className="auth-card">
        <p className="eyebrow">Seguridad</p>
        <h1>Nueva contraseña</h1>
        <p>
          {ready
            ? "Elegí una contraseña nueva para tu cuenta."
            : "Abrí el enlace recibido por email para continuar."}
        </p>
        {ready ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <label className="field">
              Nueva contraseña
              <input
                type="password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <label className="field">
              Repetir contraseña
              <input
                type="password"
                minLength={8}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                required
              />
            </label>
            {error && <p className="error-message">{error}</p>}
            {message && <p className="success-message">{message}</p>}
            <button className="button-primary" type="submit">
              Guardar contraseña
            </button>
          </form>
        ) : (
          <Link
            className="button-primary auth-button-link"
            to="/recuperar-contrasena"
          >
            Solicitar nuevo enlace
          </Link>
        )}
        <Link className="text-link auth-back" to="/login">
          Volver al inicio de sesión
        </Link>
      </section>
    </main>
  );
}
