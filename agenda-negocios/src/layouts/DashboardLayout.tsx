import { Outlet } from "react-router";
import Sidebar from "../components/Sidebar/sidebar";

export default function DashboardLayout() {
  return (
    <div className="dashboardLayout">
      <Sidebar />

      <main>
        <Outlet />
      </main>
    </div>
  );
}