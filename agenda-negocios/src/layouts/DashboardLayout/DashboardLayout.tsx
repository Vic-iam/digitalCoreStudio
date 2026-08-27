import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar/sidebar";
import { Outlet, useLocation } from "react-router";
import styles from "./Style/DashboardLayout.module.css";

export default function DashboardLayout() {
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setIsNavigating(true);
    const timeoutId = window.setTimeout(() => setIsNavigating(false), 1000);

    return () => window.clearTimeout(timeoutId);
  }, [location.pathname]);

  return (
    <div className={`${styles.shell} app-shell`}>
      <Sidebar />

      <main className="page-content">
        {isNavigating && (
          <div
            className={styles.navigationLoader}
            role="status"
            aria-live="polite"
          >
            <span className={styles.spinner} aria-hidden="true" />
            <span>Cargando...</span>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
