import { useEffect, useState, type FormEvent } from "react";
import { getMyBusiness } from "../../services/businesses.service";
import {
  createProfessional,
  deleteProfessional,
  getProfessionals,
  updateProfessional,
  type ProfessionalPosition,
} from "../../services/professionals.service";
import type { Professional } from "../../types";
import styles from "./Style/Professionals.module.css";

const POSITIONS: Array<{ value: ProfessionalPosition; label: string }> = [
  { value: "owner", label: "Dueño" },
  { value: "manager", label: "Manager" },
  { value: "professional", label: "Profesional" },
  { value: "assistant", label: "Asistente" },
  { value: "receptionist", label: "Recepcionista" },
];

export default function Professionals() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState<ProfessionalPosition>("professional");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const business = await getMyBusiness();
        if (business) {
          const list = await getProfessionals(business.id);
          setProfessionals(list);
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar el equipo",
        );
      }
    })();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const business = await getMyBusiness();
      if (!business) {
        setError("No se encontró tu negocio activo");
        return;
      }

      const professional = await createProfessional({
        business_id: business.id,
        name,
        email: email || null,
        phone: phone || null,
        position,
        active: true,
      });

      setProfessionals((current) =>
        [...current, professional].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setName("");
      setEmail("");
      setPhone("");
      setPosition("professional");
      setShowForm(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo crear el profesional",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteProfessional(id);
      setProfessionals((current) => current.filter((professional) => professional.id !== id));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "No se pudo eliminar el profesional",
      );
    }
  }

  async function handlePositionChange(id: string, nextPosition: ProfessionalPosition) {
    try {
      const updated = await updateProfessional(id, { position: nextPosition });
      setProfessionals((current) =>
        current.map((professional) =>
          professional.id === id ? updated : professional,
        ),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "No se pudo actualizar la posición",
      );
    }
  }

  return (
    <section className={styles.page}>
      <header className="page-header">
        <div>
          <p className="eyebrow">Equipo</p>
          <h1>Profesionales</h1>
          <p>Administrá tu personal y configurá la posición de cada empleado.</p>
        </div>
        <button
          className="button-primary"
          type="button"
          onClick={() => setShowForm((visible) => !visible)}
        >
          {showForm ? "Cerrar" : "+ Nuevo profesional"}
        </button>
      </header>

      {error && <p className="error-message">{error}</p>}

      {showForm && (
        <form className="panel form-grid client-form" onSubmit={handleSubmit}>
          <label className="field">
            Nombre completo
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
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

          <label className="field">
            Teléfono
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </label>

          <label className="field">
            Posición
            <select
              value={position}
              onChange={(event) => setPosition(event.target.value as ProfessionalPosition)}
            >
              {POSITIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="form-actions" style={{ gridColumn: "1 / -1" }}>
            <button className="button-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar profesional"}
            </button>
          </div>
        </form>
      )}

      <div className="panel">
        <div className="panel-header">
          <h2>{professionals.length} profesionales registrados</h2>
        </div>

        {professionals.length === 0 ? (
          <p className="empty-state">Todavía no agregaste empleados a tu equipo.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Posición</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {professionals.map((professional) => (
                  <tr key={professional.id}>
                    <td>
                      <strong>{professional.name}</strong>
                    </td>
                    <td>
                      <select
                        value={professional.position}
                        onChange={(event) =>
                          handlePositionChange(
                            professional.id,
                            event.target.value as ProfessionalPosition,
                          )
                        }
                        aria-label={`Cambiar posición de ${professional.name}`}
                        style={{ minWidth: "140px" }}
                      >
                        {POSITIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{professional.email ?? "-"}</td>
                    <td>{professional.phone ?? "-"}</td>
                    <td>
                      <button
                        className="icon-button"
                        type="button"
                        onClick={() => handleDelete(professional.id)}
                        aria-label={`Eliminar ${professional.name}`}
                        title="Eliminar profesional"
                      >
                        Eliminar
                      </button>
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
