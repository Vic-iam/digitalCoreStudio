import Sidebar from "../../components/Sidebar/sidebar";
import { Outlet } from "react-router";
import styles from "./Style/DashboardLayout.module.css";

export default function DashboardLayout() {
  return (
    <div className={`${styles.shell} app-shell`}>
      <Sidebar />

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
}