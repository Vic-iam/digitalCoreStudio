import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Link } from "react-router";
import { supabase } from "../../lib/supabase";
import { getMyBusiness } from "../../services/businesses.service";
import { Eye, EyeOff } from "lucide-react";
import styles from "./Style/Login.module.css";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setLoading(true);

    try {
      // Si el usuario escribe solamente "admin123",
      // lo convertimos en el correo interno de Supabase.
      const internalEmail = username.includes("@")
        ? username
        : `${username}@cuentas.tudominio.com`;

      const { error } = await supabase.auth.signInWithPassword({
        email: internalEmail,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      const business = await getMyBusiness();

      if (business) {
        navigate("/dashboard", {
          replace: true,
        });
      } else {
        // Por ahora no permitimos crear negocios desde el login.
        navigate("/", {
          replace: true,
        });
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Ocurrió un error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={`${styles.page} auth-page`}>
      <section className="auth-card">
        <h1>Iniciar sesión</h1>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field">
            Usuario

            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="example@dominio.com"
              required
            />
          </label>

          <label className="field">
            Contraseña

            <span className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>

          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
          <Link className="text-link auth-back" to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>
        </form>

        <p>El acceso es proporcionado por el administrador.</p>
      </section>
    </main>
  );
}