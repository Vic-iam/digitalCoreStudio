import Sidebar from "../components/Sidebar/sidebar";
import { Outlet } from "react-router";

export default function DashboardLayout() {
  return (
    <div className="app-shell">
      <Sidebar />

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
}