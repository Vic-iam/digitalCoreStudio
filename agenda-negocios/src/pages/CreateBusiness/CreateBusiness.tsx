import {
  useState,
  type FormEvent,
} from "react";

import { useNavigate } from "react-router";

import { createBusiness } from "../../services/businesses.service";
import styles from "./Style/CreateBusiness.module.css";

export default function CreateBusiness() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [businessType, setBusinessType] =
    useState("Veterinaria");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");

    try {
      const business = await createBusiness({
        name,
        business_type: businessType,
        phone,
        address,
      });

      console.log(
        "Negocio creado:",
        business
      );

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo crear el negocio";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={`${styles.page} auth-page`}>
      <section className="auth-card">
        <h1>Configurá tu negocio</h1>

        <p>
          Estos datos podrán modificarse después.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field">
            Nombre del negocio

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Ejemplo: +Kotitas"
              required
            />
          </label>

          <label className="field">
            Tipo de negocio

            <select
              value={businessType}
              onChange={(event) =>
                setBusinessType(
                  event.target.value
                )
              }
            >
              <option value="Veterinaria">
                Veterinaria
              </option>

              <option value="Peluquería">
                Peluquería
              </option>

              <option value="Centro de belleza">
                Centro de belleza
              </option>

              <option value="Consultorio">
                Consultorio
              </option>

              <option value="Taller">
                Taller
              </option>

              <option value="Academia">
                Academia
              </option>
            </select>
          </label>

          <label className="field">
            Teléfono

            <input
              type="tel"
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
            />
          </label>

          <label className="field">
            Dirección

            <input
              type="text"
              value={address}
              onChange={(event) =>
                setAddress(event.target.value)
              }
            />
          </label>

          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Creando negocio..."
              : "Crear negocio"}
          </button>
        </form>
      </section>
    </main>
  );
}