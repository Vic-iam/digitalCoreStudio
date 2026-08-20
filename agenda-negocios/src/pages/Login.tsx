import { useState, type FormEvent } from "react";

import { Link, useNavigate } from "react-router";

import { supabase } from "../lib/supabase";

import { getMyBusiness } from "../services/businesses.service";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    const business = await getMyBusiness();

    navigate(business ? "/dashboard" : "/crear-negocio", {
      replace: true,
    });
  }

  return (
    <main>
      <section>
        <h1>Iniciar sesión</h1>

        <form onSubmit={handleSubmit}>
          <label>
            Correo electrónico
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {errorMessage && <p>{errorMessage}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p>
          ¿No tenés una cuenta? <Link to="/register">Registrate</Link>
        </p>
      </section>
    </main>
  );
}
