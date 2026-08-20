import {
  useState,
  type FormEvent,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router";

import { supabase } from "../lib/supabase";

export default function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    const { data, error } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (data.session) {
      navigate("/dashboard", {
        replace: true,
      });

      return;
    }

    setSuccessMessage(
      "Cuenta creada. Revisá tu correo para confirmar el registro."
    );
  }

  return (
    <main>
      <section>
        <h1>Crear cuenta</h1>

        <form onSubmit={handleSubmit}>
          <label>
            Nombre completo

            <input
              type="text"
              value={fullName}
              onChange={(event) =>
                setFullName(event.target.value)
              }
              required
            />
          </label>

          <label>
            Correo electrónico

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
            />
          </label>

          <label>
            Contraseña

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              minLength={6}
              required
            />
          </label>

          {errorMessage && (
            <p>{errorMessage}</p>
          )}

          {successMessage && (
            <p>{successMessage}</p>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Creando cuenta..."
              : "Registrarse"}
          </button>
        </form>

        <p>
          ¿Ya tenés una cuenta?{" "}
          <Link to="/login">
            Iniciar sesión
          </Link>
        </p>
      </section>
    </main>
  );
}