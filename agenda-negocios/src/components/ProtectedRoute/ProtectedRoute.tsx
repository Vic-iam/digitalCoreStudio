import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../context/useAuth";
import styles from "./Style/ProtectedRoute.module.css";

export default function ProtectedRoute() {
  const { user, loading, sessionError, retrySession } = useAuth();

  if (loading) {
    return <main className={`${styles.page} auth-page`}><p className="loading-message">Cargando sesión...</p></main>;
  }

  if (sessionError) {
    return (
      <main className={`${styles.page} auth-page`}>
        <section className="auth-card session-error-card">
          <h1>No se pudo validar la sesión</h1>
          <p>{sessionError}</p>
          <button className="button-primary" type="button" onClick={() => void retrySession()}>
            Reintentar
          </button>
        </section>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}